import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { logAudit } from './audit.js';

const router = Router();

// ── Auth ─────────────────────────────────────────────────────

// POST /api/quotations — request a quote
router.post('/', requireAuth, async (req, res) => {
  const { service_id, description, budget_range } = req.body;

  if (!description?.trim()) {
    return res.status(400).json({ error: 'description is required' });
  }

  const { data, error } = await supabaseAdmin
    .from('quotations')
    .insert({
      user_id:      req.user.id,
      service_id:   service_id || null,
      status:       'pending',
      description:  description.trim(),
      budget_range: budget_range || null,
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// GET /api/quotations/mine — own quotations
router.get('/mine', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('quotations')
    .select('*, services(name, slug)')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/quotations/:id/accept — accept a quotation
router.post('/:id/accept', requireAuth, async (req, res) => {
  const { data: q } = await supabaseAdmin
    .from('quotations')
    .select('user_id, status')
    .eq('id', req.params.id)
    .single();

  if (!q) return res.status(404).json({ error: 'Quotation not found' });
  if (q.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
  if (q.status !== 'quoted') return res.status(400).json({ error: 'Quotation is not in quoted state' });

  const { data, error } = await supabaseAdmin
    .from('quotations')
    .update({
      status:      'accepted',
      accepted_at: new Date().toISOString(),
      updated_at:  new Date().toISOString(),
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// POST /api/quotations/:id/decline — decline a quotation
router.post('/:id/decline', requireAuth, async (req, res) => {
  const { data: q } = await supabaseAdmin
    .from('quotations')
    .select('user_id, status')
    .eq('id', req.params.id)
    .single();

  if (!q) return res.status(404).json({ error: 'Quotation not found' });
  if (q.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

  const { data, error } = await supabaseAdmin
    .from('quotations')
    .update({
      status:      'declined',
      declined_at: new Date().toISOString(),
      updated_at:  new Date().toISOString(),
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// ── Admin ────────────────────────────────────────────────────

// GET /api/quotations — all quotations (admin, with user info)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.query;
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
  const from  = (page - 1) * limit;

  let query = supabaseAdmin
    .from('quotations')
    .select('*, services(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });

  // Attach user profiles
  const userIds = [...new Set(data.map(q => q.user_id))];
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, phone')
    .in('id', userIds);

  const pMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
  const enriched = data.map(q => ({ ...q, profile: pMap[q.user_id] || null }));

  res.json({ data: enriched, total: count, page, totalPages: Math.ceil(count / limit) });
});

// GET /api/quotations/:id — single quotation (admin)
router.get('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('quotations')
    .select('*, services(name, slug)')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Quotation not found' });

  // Attach user profile
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, phone, address')
    .eq('id', data.user_id)
    .single();

  res.json({ ...data, profile: profile || null });
});

// PATCH /api/quotations/:id — update status / amount / notes (admin)
router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { status, quoted_amount, admin_notes, valid_until } = req.body;
  const validStatuses = ['pending', 'quoted', 'accepted', 'declined', 'expired'];

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  const updates = { updated_at: new Date().toISOString() };
  if (status        !== undefined) updates.status        = status;
  if (quoted_amount !== undefined) updates.quoted_amount = quoted_amount;
  if (admin_notes   !== undefined) updates.admin_notes   = admin_notes;
  if (valid_until   !== undefined) updates.valid_until   = valid_until;

  const { data, error } = await supabaseAdmin
    .from('quotations')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  await logAudit(req.user.id, 'quotations.update', 'quotation', req.params.id, updates);
  res.json(data);
});

export default router;
