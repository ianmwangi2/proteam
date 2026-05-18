import { supabaseAdmin } from '../config/supabase.js';
import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// ── Audit log helper (exported for use in other routes) ──────

/**
 * Log an admin action to the audit_logs table.
 * @param {string} adminId   - UUID of the admin performing the action
 * @param {string} action    - e.g. 'products.update'
 * @param {string} targetType - e.g. 'product'
 * @param {any}    targetId  - e.g. 42
 * @param {object} payload   - any relevant data
 */
export async function logAudit(adminId, action, targetType, targetId, payload) {
  try {
    await supabaseAdmin.from('audit_logs').insert({
      admin_id:    adminId || null,
      action,
      target_type: targetType || null,
      target_id:   targetId != null ? String(targetId) : null,
      payload:     payload || {},
    });
  } catch (err) {
    // Non-critical — never throw from audit logging
    console.error('Audit log write failed:', err.message);
  }
}

// ── Routes ────────────────────────────────────────────────────

// GET /api/audit-logs — view audit history (admin)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  const { action, targetType, adminId } = req.query;
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
  const from  = (page - 1) * limit;

  let query = supabaseAdmin
    .from('audit_logs')
    .select('*, profiles(full_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);

  if (action)     query = query.ilike('action', `%${action}%`);
  if (targetType) query = query.eq('target_type', targetType);
  if (adminId)    query = query.eq('admin_id', adminId);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, total: count, page, totalPages: Math.ceil(count / limit) });
});

export default router;
