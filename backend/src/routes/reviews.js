import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// ── Public ──────────────────────────────────────────────────

// GET /api/products/:id/reviews — list reviews for a product
router.get('/product/:productId', async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const from  = (page - 1) * limit;

  const { data, error, count } = await supabaseAdmin
    .from('reviews')
    .select('*, profiles(full_name)', { count: 'exact' })
    .eq('product_id', req.params.productId)
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, total: count, page, totalPages: Math.ceil(count / limit) });
});

// GET /api/reviews/stats/:productId — average rating & count
router.get('/stats/:productId', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .select('rating')
    .eq('product_id', req.params.productId);

  if (error) return res.status(500).json({ error: error.message });

  const count = data.length;
  const average = count
    ? Math.round((data.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
    : 0;

  // Breakdown per star
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  data.forEach(r => { breakdown[r.rating] = (breakdown[r.rating] || 0) + 1; });

  res.json({ product_id: req.params.productId, average, count, breakdown });
});

// ── Auth ─────────────────────────────────────────────────────

// POST /api/reviews — submit a review (auth)
router.post('/', requireAuth, async (req, res) => {
  const { product_id, rating, title, body } = req.body;

  if (!product_id) return res.status(400).json({ error: 'product_id is required' });
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5' });

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .insert({
      product_id,
      user_id: req.user.id,
      rating: parseInt(rating),
      title: title?.trim(),
      body: body?.trim(),
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  // Update denormalized rating + review count on product
  await refreshProductRating(product_id);

  res.status(201).json(data);
});

// PATCH /api/reviews/:id — update own review
router.patch('/:id', requireAuth, async (req, res) => {
  const { rating, title, body } = req.body;

  // Verify ownership
  const { data: existing } = await supabaseAdmin
    .from('reviews')
    .select('user_id, product_id')
    .eq('id', req.params.id)
    .single();

  if (!existing) return res.status(404).json({ error: 'Review not found' });
  if (existing.user_id !== req.user.id) return res.status(403).json({ error: 'Not your review' });

  const updates = { updated_at: new Date().toISOString() };
  if (rating !== undefined) updates.rating = parseInt(rating);
  if (title  !== undefined) updates.title  = title?.trim();
  if (body   !== undefined) updates.body   = body?.trim();

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  await refreshProductRating(existing.product_id);
  res.json(data);
});

// DELETE /api/reviews/:id — delete own review
router.delete('/:id', requireAuth, async (req, res) => {
  const { data: existing } = await supabaseAdmin
    .from('reviews')
    .select('user_id, product_id')
    .eq('id', req.params.id)
    .single();

  if (!existing) return res.status(404).json({ error: 'Review not found' });

  // Admin can delete any; user can only delete own
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', req.user.id)
    .single();

  if (existing.user_id !== req.user.id && profile?.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized to delete this review' });
  }

  const { error } = await supabaseAdmin
    .from('reviews')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  await refreshProductRating(existing.product_id);
  res.status(204).end();
});

// ── Helper ───────────────────────────────────────────────────

async function refreshProductRating(productId) {
  const { data } = await supabaseAdmin
    .from('reviews')
    .select('rating')
    .eq('product_id', productId);

  if (!data) return;
  const count   = data.length;
  const average = count
    ? Math.round((data.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
    : 0;

  await supabaseAdmin
    .from('products')
    .update({ rating: average, reviews: count, updated_at: new Date().toISOString() })
    .eq('id', productId);
}

export default router;
