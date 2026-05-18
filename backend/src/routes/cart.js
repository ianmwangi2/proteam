import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/cart — get user's cart
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('cart_items')
    .select('*, products(name, emoji, sku, price_ksh, stock)')
    .eq('user_id', req.user.id)
    .order('created_at');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/cart — add item to cart (or increment qty)
router.post('/', requireAuth, async (req, res) => {
  const { product_id, qty = 1 } = req.body;

  if (!product_id) return res.status(400).json({ error: 'product_id is required' });

  // Check if item already in cart
  const { data: existing } = await supabaseAdmin
    .from('cart_items')
    .select('id, qty')
    .eq('user_id', req.user.id)
    .eq('product_id', product_id)
    .single();

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from('cart_items')
      .update({ qty: existing.qty + qty })
      .eq('id', existing.id)
      .select('*, products(name, emoji, sku, price_ksh)')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  }

  const { data, error } = await supabaseAdmin
    .from('cart_items')
    .insert({ user_id: req.user.id, product_id, qty })
    .select('*, products(name, emoji, sku, price_ksh)')
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH /api/cart/:id — update quantity
router.patch('/:id', requireAuth, async (req, res) => {
  const { qty } = req.body;

  if (qty <= 0) {
    const { error } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) return res.status(400).json({ error: error.message });
    return res.status(204).end();
  }

  const { data, error } = await supabaseAdmin
    .from('cart_items')
    .update({ qty })
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// DELETE /api/cart/:id — remove item
router.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('cart_items')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

// DELETE /api/cart — clear entire cart
router.delete('/', requireAuth, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('cart_items')
    .delete()
    .eq('user_id', req.user.id);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

export default router;
