const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * Fetch wrapper for calling the Proteam backend API.
 * Automatically attaches the Supabase JWT if provided.
 */
export async function apiFetch(path, { token, method = 'GET', body, ...opts } = {}) {
  const headers = { 'Content-Type': 'application/json', ...opts.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
    ...opts,
  });

  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
