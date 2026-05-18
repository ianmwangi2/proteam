import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { logAudit } from './audit.js';

const router = Router();

// ── Public ──────────────────────────────────────────────────

// GET /api/services — list all active services
router.get('/', async (req, res) => {
  const showAll = req.query.all === 'true'; // admin can pass ?all=true

  let query = supabaseAdmin
    .from('services')
    .select('*')
    .order('sort_order')
    .order('created_at');

  if (!showAll) query = query.eq('is_active', true);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/services/:id — single service detail
router.get('/:id', async (req, res) => {
  const col = isNaN(req.params.id) ? 'slug' : 'id';

  const { data, error } = await supabaseAdmin
    .from('services')
    .select('*')
    .eq(col, req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Service not found' });
  res.json(data);
});

// GET /api/services/:id/products — products linked to this service
router.get('/:id/products', async (req, res) => {
  const col = isNaN(req.params.id) ? 'slug' : 'id';

  // Resolve service id first (in case slug was used)
  const { data: svc, error: svcErr } = await supabaseAdmin
    .from('services')
    .select('id')
    .eq(col, req.params.id)
    .single();

  if (svcErr) return res.status(404).json({ error: 'Service not found' });

  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
  const from  = (page - 1) * limit;

  const { data, error, count } = await supabaseAdmin
    .from('products')
    .select('*', { count: 'exact' })
    .eq('service_id', svc.id)
    .order('id')
    .range(from, from + limit - 1);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, total: count, page, totalPages: Math.ceil(count / limit) });
});

// ── Admin ────────────────────────────────────────────────────

// POST /api/services — create service
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { slug, name, tagline, description, icon, image_url, features, is_active, sort_order } = req.body;

  if (!name?.trim()) return res.status(400).json({ error: 'Service name is required' });
  if (!slug?.trim()) return res.status(400).json({ error: 'Service slug is required' });

  const { data, error } = await supabaseAdmin
    .from('services')
    .insert({
      slug: slug.trim().toLowerCase(),
      name: name.trim(),
      tagline,
      description,
      icon,
      image_url,
      features: features || [],
      is_active: is_active !== false,
      sort_order: sort_order || 0,
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  await logAudit(req.user.id, 'services.create', 'service', data.id, { name: data.name });
  res.status(201).json(data);
});

// PUT /api/services/:id — update service
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { name, tagline, description, icon, image_url, features, is_active, sort_order, slug } = req.body;

  const updates = { updated_at: new Date().toISOString() };
  if (name       !== undefined) updates.name       = name.trim();
  if (slug       !== undefined) updates.slug       = slug.trim().toLowerCase();
  if (tagline    !== undefined) updates.tagline    = tagline;
  if (description!== undefined) updates.description= description;
  if (icon       !== undefined) updates.icon       = icon;
  if (image_url  !== undefined) updates.image_url  = image_url;
  if (features   !== undefined) updates.features   = features;
  if (is_active  !== undefined) updates.is_active  = is_active;
  if (sort_order !== undefined) updates.sort_order = sort_order;

  const { data, error } = await supabaseAdmin
    .from('services')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  await logAudit(req.user.id, 'services.update', 'service', req.params.id, updates);
  res.json(data);
});

// DELETE /api/services/:id — delete service
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('services')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });

  await logAudit(req.user.id, 'services.delete', 'service', req.params.id, {});
  res.status(204).end();
});

export default router;
