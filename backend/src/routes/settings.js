import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/settings — all settings (public, read-only)
router.get('/', async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('settings')
    .select('key, value')
    .order('key');

  if (error) return res.status(500).json({ error: error.message });

  // Return as an object for convenience
  const obj = Object.fromEntries(data.map(s => [s.key, s.value]));
  res.json(obj);
});

// PUT /api/settings — bulk update settings (admin)
router.put('/', requireAuth, requireAdmin, async (req, res) => {
  const entries = Object.entries(req.body);

  if (!entries.length) return res.status(400).json({ error: 'No settings provided' });

  const upserts = entries.map(([key, value]) => ({
    key,
    value: String(value),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabaseAdmin
    .from('settings')
    .upsert(upserts, { onConflict: 'key' });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ updated: entries.length });
});

export default router;
