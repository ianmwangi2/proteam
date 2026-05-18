import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// ── Admin only ───────────────────────────────────────────────

// GET /api/analytics/quotations?period=month&groupBy=day
router.get('/quotations', requireAuth, requireAdmin, async (req, res) => {
  const { period = 'month', groupBy = 'day' } = req.query;
  const since = getPeriodStart(period);

  const { data: quotations, error } = await supabaseAdmin
    .from('quotations')
    .select('status, created_at')
    .gte('created_at', since.toISOString());

  if (error) return res.status(500).json({ error: error.message });

  const grouped = {};
  for (const q of quotations) {
    const key = groupByKey(q.created_at, groupBy);
    if (!grouped[key]) grouped[key] = { date: key, total: 0, accepted: 0, declined: 0, pending: 0 };
    grouped[key].total   += 1;
    if (q.status === 'accepted') grouped[key].accepted += 1;
    if (q.status === 'declined') grouped[key].declined += 1;
    if (q.status === 'pending')  grouped[key].pending  += 1;
  }

  const timeline      = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  const totalCount    = quotations.length;
  const acceptedCount = quotations.filter(q => q.status === 'accepted').length;
  const conversionRate = totalCount > 0 ? ((acceptedCount / totalCount) * 100).toFixed(1) : '0.0';

  res.json({ period, groupBy, total_quotations: totalCount, accepted: acceptedCount, conversion_rate: conversionRate, timeline });
});

// GET /api/analytics/services — top services by quotation volume
router.get('/services', requireAuth, requireAdmin, async (req, res) => {
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const since = getPeriodStart(req.query.period || 'month');

  const { data: quotations } = await supabaseAdmin
    .from('quotations')
    .select('service_id, status, services(name, slug)')
    .gte('created_at', since.toISOString());

  if (!quotations?.length) return res.json({ top_services: [] });

  const svcMap = {};
  for (const q of quotations) {
    const name = q.services?.name || 'General Inquiry';
    if (!svcMap[name]) svcMap[name] = { name, service_id: q.service_id, count: 0, accepted: 0, declined: 0 };
    svcMap[name].count++;
    if (q.status === 'accepted') svcMap[name].accepted++;
    if (q.status === 'declined') svcMap[name].declined++;
  }

  const ranked = Object.values(svcMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  res.json({ period: req.query.period || 'month', top_services: ranked });
});

// GET /api/analytics/customers — registered users & active enquirers
router.get('/customers', requireAuth, requireAdmin, async (req, res) => {
  const since = getPeriodStart(req.query.period || 'month');

  const [{ count: totalProfiles }, { data: quotations }] = await Promise.all([
    supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('quotations').select('user_id, created_at').neq('status', 'expired'),
  ]);

  const allQ         = quotations || [];
  const periodQ      = allQ.filter(q => new Date(q.created_at) >= since);

  // Users who submitted their FIRST quotation in the period
  const firstQuoteDates = {};
  for (const q of allQ) {
    if (!firstQuoteDates[q.user_id] || new Date(q.created_at) < new Date(firstQuoteDates[q.user_id])) {
      firstQuoteDates[q.user_id] = q.created_at;
    }
  }

  const newEnquirers      = Object.values(firstQuoteDates).filter(d => new Date(d) >= since).length;
  const uniqueInPeriod    = new Set(periodQ.map(q => q.user_id)).size;
  const returningEnquirers = Math.max(0, uniqueInPeriod - newEnquirers);

  res.json({
    period: req.query.period || 'month',
    total_customers:      totalProfiles,
    new_enquirers:        newEnquirers,
    active_enquirers:     uniqueInPeriod,
    returning_enquirers:  returningEnquirers,
  });
});

// GET /api/analytics/overview — quick dashboard summary
router.get('/overview', requireAuth, requireAdmin, async (req, res) => {
  const since = getPeriodStart('month');

  const [{ data: quotations }, { count: totalUsers }] = await Promise.all([
    supabaseAdmin.from('quotations').select('status, created_at'),
    supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
  ]);

  const allQ     = quotations || [];
  const monthQ   = allQ.filter(q => new Date(q.created_at) >= since);

  res.json({
    all_time: {
      total:    allQ.length,
      pending:  allQ.filter(q => q.status === 'pending').length,
      quoted:   allQ.filter(q => q.status === 'quoted').length,
      accepted: allQ.filter(q => q.status === 'accepted').length,
      declined: allQ.filter(q => q.status === 'declined').length,
    },
    this_month: {
      total:    monthQ.length,
      accepted: monthQ.filter(q => q.status === 'accepted').length,
    },
    total_users: totalUsers,
  });
});

// ── Helpers ──────────────────────────────────────────────────

function getPeriodStart(period) {
  const now = new Date();
  if (period === 'day')   return new Date(now.setDate(now.getDate() - 1));
  if (period === 'week')  return new Date(now.setDate(now.getDate() - 7));
  if (period === 'month') return new Date(now.setMonth(now.getMonth() - 1));
  if (period === 'year')  return new Date(now.setFullYear(now.getFullYear() - 1));
  return new Date(0);
}

function groupByKey(dateStr, groupBy) {
  const d = new Date(dateStr);
  if (groupBy === 'hour') return d.toISOString().slice(0, 13);
  if (groupBy === 'day')  return d.toISOString().slice(0, 10);
  if (groupBy === 'week') {
    const day  = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().slice(0, 10);
  }
  if (groupBy === 'month') return d.toISOString().slice(0, 7);
  return d.toISOString().slice(0, 10);
}

export default router;
