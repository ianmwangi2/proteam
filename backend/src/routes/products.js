import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { logAudit } from './audit.js';

const router = Router();

// ── Public ──────────────────────────────────────────────────

// GET /api/products — list products (paginated)
router.get('/', async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
  const from  = (page - 1) * limit;

  const { data, error, count } = await supabaseAdmin
    .from('products')
    .select('*', { count: 'exact' })
    .order('id')
    .range(from, from + limit - 1);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, total: count, page, totalPages: Math.ceil(count / limit) });
});

// GET /api/products/search — full search + filtering
router.get('/search', async (req, res) => {
  const { q, serviceId, minPrice, maxPrice, rating, inStock, category } = req.query;
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
  const from  = (page - 1) * limit;

  let query = supabaseAdmin
    .from('products')
    .select('*', { count: 'exact' })
    .order('id')
    .range(from, from + limit - 1);

  if (q?.trim()) {
    query = query.ilike('name', `%${q.trim()}%`);
  }
  if (serviceId) query = query.eq('service_id', serviceId);
  if (category)  query = query.ilike('category', `%${category}%`);
  if (minPrice)  query = query.gte('price_ksh', parseFloat(minPrice));
  if (maxPrice)  query = query.lte('price_ksh', parseFloat(maxPrice));
  if (rating)    query = query.gte('rating', parseFloat(rating));
  if (inStock === 'true') query = query.gt('stock', 0);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, total: count, page, totalPages: Math.ceil(count / limit) });
});

// GET /api/products/trending — top-rated / best sellers
router.get('/trending', async (req, res) => {
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .gt('stock', 0)
    .order('rating', { ascending: false })
    .order('reviews', { ascending: false })
    .limit(limit);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/products/by-service/:serviceId — products for a service
router.get('/by-service/:serviceId', async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
  const from  = (page - 1) * limit;

  const { data, error, count } = await supabaseAdmin
    .from('products')
    .select('*', { count: 'exact' })
    .eq('service_id', req.params.serviceId)
    .order('id')
    .range(from, from + limit - 1);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, total: count, page, totalPages: Math.ceil(count / limit) });
});

// GET /api/products/by-category/:category
router.get('/by-category/:category', async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
  const from  = (page - 1) * limit;

  const { data, error, count } = await supabaseAdmin
    .from('products')
    .select('*', { count: 'exact' })
    .ilike('category', req.params.category)
    .order('id')
    .range(from, from + limit - 1);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, total: count, page, totalPages: Math.ceil(count / limit) });
});

// GET /api/products/:id — single product (public)
router.get('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Product not found' });
  res.json(data);
});

// ── Admin ────────────────────────────────────────────────────

// POST /api/products — create product
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { name, price_ksh, category, stock, description, sku, emoji, badge, image, service_id } = req.body;

  if (!name?.trim())
    return res.status(400).json({ error: 'Product name is required' });
  if (price_ksh == null || isNaN(price_ksh) || price_ksh < 0)
    return res.status(400).json({ error: 'Valid price is required' });

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({ name: name.trim(), price_ksh, category, stock: stock || 0, description, sku, emoji, badge, image, service_id: service_id || null })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  await logAudit(req.user.id, 'products.create', 'product', data.id, { name: data.name });
  res.status(201).json(data);
});

// PUT /api/products/:id — update product
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { name, price_ksh, category, stock, description, sku, emoji, badge, image, service_id } = req.body;

  const updates = { updated_at: new Date().toISOString() };
  if (name        !== undefined) updates.name        = name.trim();
  if (price_ksh   !== undefined) updates.price_ksh   = price_ksh;
  if (category    !== undefined) updates.category    = category;
  if (stock       !== undefined) updates.stock       = stock;
  if (description !== undefined) updates.description = description;
  if (sku         !== undefined) updates.sku         = sku;
  if (emoji       !== undefined) updates.emoji       = emoji;
  if (badge       !== undefined) updates.badge       = badge;
  if (image       !== undefined) updates.image       = image;
  if (service_id  !== undefined) updates.service_id  = service_id;

  const { data, error } = await supabaseAdmin
    .from('products')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  await logAudit(req.user.id, 'products.update', 'product', req.params.id, updates);
  res.json(data);
});

// DELETE /api/products/:id — delete product
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  await logAudit(req.user.id, 'products.delete', 'product', req.params.id, {});
  res.status(204).end();
});

export default router;
