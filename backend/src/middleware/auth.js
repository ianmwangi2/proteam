import { supabase, supabaseAdmin } from '../config/supabase.js';

/**
 * Verifies the Supabase JWT from the Authorization header.
 * Attaches req.user on success.
 */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = header.slice(7);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = data.user;
  next();
}

/**
 * Requires the authenticated user to have an 'admin' role in the profiles table.
 * Must be used after requireAuth.
 */
export async function requireAdmin(req, res, next) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', req.user.id)
    .single();

  if (profile?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
