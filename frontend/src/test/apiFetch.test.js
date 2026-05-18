import { describe, it, expect, vi } from 'vitest';
import { apiFetch } from '../config/api';

// We test the apiFetch wrapper with a mocked global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('apiFetch', () => {
  it('makes a GET request with the right URL', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });
    const result = await apiFetch('/products');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/products'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(result).toEqual([]);
  });

  it('attaches Authorization header when token is provided', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({}) });
    await apiFetch('/orders', { token: 'test-jwt-token' });
    const callArgs = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    expect(callArgs[1].headers['Authorization']).toBe('Bearer test-jwt-token');
  });

  it('sends JSON body on POST', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1 }) });
    const result = await apiFetch('/orders', { method: 'POST', body: { items: [] } });
    const callArgs = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    expect(callArgs[1].method).toBe('POST');
    expect(callArgs[1].body).toBe(JSON.stringify({ items: [] }));
    expect(result).toEqual({ id: 1 });
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 400, json: () => Promise.resolve({ error: 'Bad request' }) });
    await expect(apiFetch('/fail')).rejects.toThrow('Bad request');
  });

  it('returns null for 204 responses', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });
    const result = await apiFetch('/cart/1', { method: 'DELETE' });
    expect(result).toBeNull();
  });
});
