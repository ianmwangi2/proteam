import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ── Auth ─────────────────────────────────────────────────────

// GET /api/wishlist — user's wishlist
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('wishlist')
    .select('*, products(*)')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/wishlist — add product to wishlist
router.post('/', requireAuth, async (req, res) => {
  const { product_id } = req.body;

  if (!product_id) return res.status(400).json({ error: 'product_id is required' });

  // Verify product exists
  const { data: prod } = await supabaseAdmin
    .from('products')
    .select('id')
    .eq('id', product_id)
    .single();

  if (!prod) return res.status(404).json({ error: 'Product not found' });

  const { data, error } = await supabaseAdmin
    .from('wishlist')
    .insert({ user_id: req.user.id, product_id })
    .select('*, products(*)')
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Product already in wishlist' });
    }
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json(data);
});

// DELETE /api/wishlist/:productId — remove from wishlist
router.delete('/:productId', requireAuth, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('wishlist')
    .delete()
    .eq('user_id', req.user.id)
    .eq('product_id', req.params.productId);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

// POST /api/wishlist/share — generate shareable wishlist token
router.post('/share', requireAuth, async (req, res) => {
  // Simple share link using base64-encoded user_id (no sensitive data exposed)
  const token = Buffer.from(req.user.id).toString('base64url');
  const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/wishlist/${token}`;
  res.json({ share_url: shareUrl, token });
});

// GET /api/wishlist/shared/:token — public view of a shared wishlist
router.get('/shared/:token', async (req, res) => {
  let userId;
  try {
    userId = Buffer.from(req.params.token, 'base64url').toString('utf8');
  } catch {
    return res.status(400).json({ error: 'Invalid share token' });
  }

  const { data, error } = await supabaseAdmin
    .from('wishlist')
    .select('*, products(id, name, price_ksh, category, emoji, badge, rating, reviews, stock)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
