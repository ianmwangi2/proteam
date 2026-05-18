import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { logAudit } from './audit.js';

const router = Router();

// ── Customer routes ─────────────────────────────────────────

// POST /api/orders — place a new order
router.post('/', requireAuth, async (req, res) => {
  const { items, shipping_address } = req.body;

  if (!items?.length) {
    return res.status(400).json({ error: 'Order must contain at least one item' });
  }

  const productIds = items.map(i => i.product_id);
  const { data: products, error: prodErr } = await supabaseAdmin
    .from('products')
    .select('id, price_ksh, stock')
    .in('id', productIds);

  if (prodErr) return res.status(500).json({ error: prodErr.message });

  const productMap = Object.fromEntries(products.map(p => [p.id, p]));
  const orderItems = [];
  let subtotal = 0;

  for (const item of items) {
    const product = productMap[item.product_id];
    if (!product) return res.status(400).json({ error: `Product ${item.product_id} not found` });
    if (product.stock < item.qty) return res.status(400).json({ error: `Insufficient stock for product ${item.product_id}` });

    const lineTotal = product.price_ksh * item.qty;
    subtotal += lineTotal;
    orderItems.push({ product_id: item.product_id, qty: item.qty, unit_price: product.price_ksh, line_total: lineTotal });
  }

  const { data: settings } = await supabaseAdmin
    .from('settings')
    .select('key, value')
    .in('key', ['tax_rate', 'shipping_flat', 'free_shipping_min']);

  const sMap          = Object.fromEntries((settings || []).map(s => [s.key, parseFloat(s.value)]));
  const taxRate       = (sMap.tax_rate || 16) / 100;
  const shippingFlat  = sMap.shipping_flat || 500;
  const freeShipMin   = sMap.free_shipping_min || 10000;

  const tax      = Math.round(subtotal * taxRate);
  const shipping = subtotal >= freeShipMin ? 0 : shippingFlat;
  const total    = subtotal + tax + shipping;

  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .insert({ user_id: req.user.id, status: 'pending', subtotal, tax, shipping, total, shipping_address })
    .select()
    .single();

  if (orderErr) return res.status(500).json({ error: orderErr.message });

  const lineRows = orderItems.map(li => ({ ...li, order_id: order.id }));
  const { error: liErr } = await supabaseAdmin.from('order_items').insert(lineRows);
  if (liErr) return res.status(500).json({ error: liErr.message });

  // Decrement stock
  for (const item of items) {
    const { data: prod } = await supabaseAdmin.from('products').select('stock').eq('id', item.product_id).single();
    await supabaseAdmin.from('products').update({ stock: Math.max(0, (prod?.stock ?? 0) - item.qty) }).eq('id', item.product_id);
  }

  await supabaseAdmin.from('cart_items').delete().eq('user_id', req.user.id);
  res.status(201).json({ ...order, items: lineRows });
});

// GET /api/orders/mine — customer's own orders
router.get('/mine', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*, products(name, emoji, sku))')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/orders/:id/tracking — tracking info (auth)
router.get('/:id/tracking', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('id, status, tracking, created_at, updated_at')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (error) return res.status(404).json({ error: 'Order not found or not accessible' });
  res.json(data);
});

// POST /api/orders/:id/cancel — cancel pending order (auth)
router.post('/:id/cancel', requireAuth, async (req, res) => {
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, status, user_id, order_items(product_id, qty)')
    .eq('id', req.params.id)
    .single();

  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
  if (order.status !== 'pending') return res.status(400).json({ error: 'Only pending orders can be cancelled' });

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  // Restore stock
  for (const item of order.order_items) {
    const { data: prod } = await supabaseAdmin.from('products').select('stock').eq('id', item.product_id).single();
    await supabaseAdmin.from('products').update({ stock: (prod?.stock ?? 0) + item.qty }).eq('id', item.product_id);
  }

  res.json(data);
});

// ── Admin routes ─────────────────────────────────────────────

// GET /api/orders/stats — sales metrics
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  const { period = 'month' } = req.query;
  const now = new Date();

  let since;
  if (period === 'day')   since = new Date(now.setDate(now.getDate() - 1));
  if (period === 'week')  since = new Date(now.setDate(now.getDate() - 7));
  if (period === 'month') since = new Date(now.setMonth(now.getMonth() - 1));
  if (period === 'year')  since = new Date(now.setFullYear(now.getFullYear() - 1));
  if (!since) since = new Date(0);

  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('id, status, total, created_at')
    .gte('created_at', since.toISOString());

  if (error) return res.status(500).json({ error: error.message });

  const stats = {
    period,
    total_orders:   orders.length,
    revenue:        orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + parseFloat(o.total || 0), 0),
    pending:        orders.filter(o => o.status === 'pending').length,
    processing:     orders.filter(o => o.status === 'processing').length,
    shipped:        orders.filter(o => o.status === 'shipped').length,
    delivered:      orders.filter(o => o.status === 'delivered').length,
    cancelled:      orders.filter(o => o.status === 'cancelled').length,
  };

  res.json(stats);
});

// GET /api/orders — all orders (admin)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
  const from  = (page - 1) * limit;

  const { data, error, count } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*, products(name, emoji))', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);

  if (error) return res.status(500).json({ error: error.message });

  const userIds = [...new Set(data.map(o => o.user_id))];
  const { data: profiles } = await supabaseAdmin.from('profiles').select('id, full_name, email').in('id', userIds);
  const pMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
  const enriched = data.map(o => ({ ...o, profiles: pMap[o.user_id] || null }));

  res.json({ data: enriched, total: count, page, totalPages: Math.ceil(count / limit) });
});

// GET /api/orders/:id — single order detail (admin)
router.get('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*, products(name, emoji, sku))')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Order not found' });

  if (data.user_id) {
    const { data: profile } = await supabaseAdmin.from('profiles').select('id, full_name, email').eq('id', data.user_id).single();
    data.profiles = profile || null;
  }

  res.json(data);
});

// PATCH /api/orders/:id/status — update order status (admin)
router.patch('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  await logAudit(req.user.id, 'orders.status', 'order', req.params.id, { status });
  res.json(data);
});

// PATCH /api/orders/:id/notes — add internal notes (admin)
router.patch('/:id/notes', requireAuth, requireAdmin, async (req, res) => {
  const { notes } = req.body;

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ notes, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select('id, notes, updated_at')
    .single();

  if (error) return res.status(400).json({ error: error.message });
  await logAudit(req.user.id, 'orders.notes', 'order', req.params.id, { notes });
  res.json(data);
});

// PATCH /api/orders/:id/tracking — set tracking number / info (admin)
router.patch('/:id/tracking', requireAuth, requireAdmin, async (req, res) => {
  const { tracking } = req.body;

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ tracking, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select('id, tracking, updated_at')
    .single();

  if (error) return res.status(400).json({ error: error.message });
  await logAudit(req.user.id, 'orders.tracking', 'order', req.params.id, { tracking });
  res.json(data);
});

export default router;
