import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// POST /api/contact — submit a contact message (public)
router.post('/', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('message').trim().isLength({ min: 10, max: 5000 }).withMessage('Message must be 10-5000 characters'),
  body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 20 }),
  body('subject').optional({ values: 'falsy' }).trim().isLength({ max: 200 }),
  body('service').optional({ values: 'falsy' }).trim().isLength({ max: 100 }).withMessage('Service name too long'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { name, email, phone, subject, service, message } = req.body;

  const { data, error } = await supabaseAdmin
    .from('contact_messages')
    .insert({
      name:    name.trim(),
      email:   email.trim(),
      phone:   phone?.trim()   || null,
      subject: subject?.trim() || null,
      service: service?.trim() || null,
      message: message.trim(),
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ success: true, id: data.id });
});

// GET /api/contact — list all messages (admin)
router.get('/', requireAuth, requireAdmin, async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH /api/contact/:id/read — mark as read (admin)
router.patch('/:id/read', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('contact_messages')
    .update({ read: true })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

export default router;
