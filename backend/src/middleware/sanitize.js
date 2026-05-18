/**
 * Simple HTML sanitizer middleware.
 * Strips HTML tags from all string fields in req.body
 * to prevent stored XSS attacks.
 */

const TAG_RE = /<[^>]*>/g;

function stripTags(value) {
  if (typeof value === 'string') return value.replace(TAG_RE, '');
  if (Array.isArray(value)) return value.map(stripTags);
  if (value && typeof value === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(value)) {
      clean[k] = stripTags(v);
    }
    return clean;
  }
  return value;
}

export function sanitizeBody(req, _res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = stripTags(req.body);
  }
  next();
}
