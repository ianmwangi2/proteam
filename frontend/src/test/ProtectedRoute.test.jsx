import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../config/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

vi.mock('../config/api', () => ({
  apiFetch: vi.fn(),
}));

import { supabase } from '../config/supabase';
import { apiFetch } from '../config/api';
import { AuthProvider } from '../context/AuthContext';
import { ProtectedRoute, AdminRoute } from '../components/ProtectedRoute';

function SecretPage() {
  return <div>Secret Content</div>;
}

function AccountPage() {
  return <div>Account Page</div>;
}

function HomePage() {
  return <div>Home Page</div>;
}

describe('ProtectedRoute', () => {
  it('redirects to /account when not authenticated', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/secret']}>
          <AuthProvider>
            <Routes>
              <Route path="/secret" element={<ProtectedRoute><SecretPage /></ProtectedRoute>} />
              <Route path="/account" element={<AccountPage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Account Page')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'jwt', user: { id: 'u1' } } },
    });
    apiFetch.mockResolvedValue({ id: 'u1', role: 'customer' });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/secret']}>
          <AuthProvider>
            <Routes>
              <Route path="/secret" element={<ProtectedRoute><SecretPage /></ProtectedRoute>} />
              <Route path="/account" element={<AccountPage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Secret Content')).toBeInTheDocument();
  });
});

describe('AdminRoute', () => {
  it('redirects non-admin users to /', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'jwt', user: { id: 'u1' } } },
    });
    apiFetch.mockResolvedValue({ id: 'u1', role: 'customer' });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/admin']}>
          <AuthProvider>
            <Routes>
              <Route path="/admin" element={<AdminRoute><SecretPage /></AdminRoute>} />
              <Route path="/" element={<HomePage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });

  it('renders children for admin users', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'jwt', user: { id: 'u1' } } },
    });
    apiFetch.mockResolvedValue({ id: 'u1', role: 'admin' });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/admin']}>
          <AuthProvider>
            <Routes>
              <Route path="/admin" element={<AdminRoute><SecretPage /></AdminRoute>} />
              <Route path="/" element={<HomePage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Secret Content')).toBeInTheDocument();
  });
});
