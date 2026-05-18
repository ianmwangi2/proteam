import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { logAudit } from './audit.js';

const router = Router();

// ── Admin only ───────────────────────────────────────────────

// GET /api/inventory/low-stock?threshold=5
router.get('/low-stock', requireAuth, requireAdmin, async (req, res) => {
  const threshold = parseInt(req.query.threshold) || 5;

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, sku, name, category, stock')
    .gt('stock', 0)
    .lte('stock', threshold)
    .order('stock');

  if (error) return res.status(500).json({ error: error.message });
  res.json({ threshold, data });
});

// GET /api/inventory/out-of-stock
router.get('/out-of-stock', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, sku, name, category, stock, updated_at')
    .eq('stock', 0)
    .order('updated_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/inventory/bulk-update — update multiple products' stock
router.post('/bulk-update', requireAuth, requireAdmin, async (req, res) => {
  const { updates } = req.body; // [{ product_id, stock, reason }]

  if (!Array.isArray(updates) || !updates.length) {
    return res.status(400).json({ error: 'updates array is required' });
  }

  const results = [];
  const errors  = [];

  for (const u of updates) {
    if (!u.product_id || u.stock == null) {
      errors.push({ product_id: u.product_id, error: 'product_id and stock are required' });
      continue;
    }

    // Fetch current stock
    const { data: prod } = await supabaseAdmin
      .from('products')
      .select('stock, name')
      .eq('id', u.product_id)
      .single();

    if (!prod) {
      errors.push({ product_id: u.product_id, error: 'Product not found' });
      continue;
    }

    const { data: updated, error } = await supabaseAdmin
      .from('products')
      .update({ stock: u.stock, updated_at: new Date().toISOString() })
      .eq('id', u.product_id)
      .select('id, sku, name, stock')
      .single();

    if (error) {
      errors.push({ product_id: u.product_id, error: error.message });
      continue;
    }

    // Log the change
    await supabaseAdmin.from('inventory_logs').insert({
      product_id:  u.product_id,
      admin_id:    req.user.id,
      change:      u.stock - prod.stock,
      reason:      u.reason || 'bulk-update',
      stock_after: u.stock,
    });

    results.push(updated);
  }

  await logAudit(req.user.id, 'inventory.bulk-update', 'inventory', null, { count: results.length });
  res.json({ updated: results, errors });
});

// POST /api/inventory/restock/:id — log a restock event
router.post('/restock/:id', requireAuth, requireAdmin, async (req, res) => {
  const { quantity, reason } = req.body;

  if (!quantity || isNaN(quantity) || quantity <= 0) {
    return res.status(400).json({ error: 'Positive quantity is required' });
  }

  const { data: prod, error: fetchErr } = await supabaseAdmin
    .from('products')
    .select('id, stock, name')
    .eq('id', req.params.id)
    .single();

  if (fetchErr) return res.status(404).json({ error: 'Product not found' });

  const newStock = prod.stock + parseInt(quantity);

  const { data, error } = await supabaseAdmin
    .from('products')
    .update({ stock: newStock, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  await supabaseAdmin.from('inventory_logs').insert({
    product_id:  req.params.id,
    admin_id:    req.user.id,
    change:      parseInt(quantity),
    reason:      reason || 'restock',
    stock_after: newStock,
  });

  await logAudit(req.user.id, 'inventory.restock', 'product', req.params.id, { quantity, newStock });
  res.json({ ...data, restock_quantity: parseInt(quantity) });
});

// GET /api/inventory/logs/:productId — view history for a product
router.get('/logs/:productId', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('inventory_logs')
    .select('*, profiles(full_name, email)')
    .eq('product_id', req.params.productId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
