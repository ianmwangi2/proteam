import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// ── Mocks ───────────────────────────────────────────────
vi.mock('../config/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

vi.mock('../config/api', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), cart: vi.fn() }),
}));

import { supabase } from '../config/supabase';
import { apiFetch } from '../config/api';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';

// Lazy-load Account so mocks are in place
const { default: Account } = await import('../pages/Account');

function renderAccount() {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Account />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
});

describe('Account — unauthenticated', () => {
  it('shows sign-in form when not logged in', async () => {
    renderAccount();
    await waitFor(() => expect(screen.getByText('Welcome Back')).toBeInTheDocument());
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('can switch to sign-up mode', async () => {
    renderAccount();
    await waitFor(() => expect(screen.getByText('Welcome Back')).toBeInTheDocument());
    const signUpTabsSwitch = screen.getAllByText('Sign Up');
    await act(async () => fireEvent.click(signUpTabsSwitch[0]));
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
  });

  it('shows validation error on sign-up without name', async () => {
    renderAccount();
    await waitFor(() => expect(screen.getByText('Welcome Back')).toBeInTheDocument());
    const signUpTabs = screen.getAllByText('Sign Up');
    await act(async () => fireEvent.click(signUpTabs[0]));

    // Fill email and password but leave name empty
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });

    await act(async () => fireEvent.submit(screen.getByRole('button', { name: /create account/i })));
    expect(screen.getByText('Full name is required')).toBeInTheDocument();
  });

  it('shows error message on failed sign-in', async () => {
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid credentials' },
    });

    renderAccount();
    await waitFor(() => expect(screen.getByText('Welcome Back')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'bad@email.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });

    const signInButtons = screen.getAllByRole('button', { name: /sign in/i });
    // Click the submit button (last one), not the tab button
    await act(async () => fireEvent.click(signInButtons[signInButtons.length - 1]));
    await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument());
  });
});

describe('Account — authenticated', () => {
  const mockSession = {
    access_token: 'mock-jwt',
    user: { id: 'u1', email: 'test@example.com' },
  };
  const mockProfile = {
    id: 'u1',
    full_name: 'John Mwangi',
    email: 'test@example.com',
    role: 'customer',
    phone: '+254 700 000 000',
    address: 'Nairobi',
  };

  beforeEach(() => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: mockSession } });
    apiFetch.mockImplementation((path) => {
      if (path === '/users/me') return Promise.resolve(mockProfile);
      if (path === '/orders/mine') return Promise.resolve([]);
      if (path === '/support/mine') return Promise.resolve([]);
      if (path === '/cart') return Promise.resolve([]);
      return Promise.resolve([]);
    });
  });

  it('shows dashboard with user name when logged in', async () => {
    renderAccount();
    expect(await screen.findByText(/John Mwangi/)).toBeInTheDocument();
  });

  it('shows sidebar menu items', async () => {
    renderAccount();
    expect(await screen.findByText('Personal Details')).toBeInTheDocument();
    expect(screen.getAllByText('Order History').length).toBeGreaterThan(0);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
  });

  it('navigates between panels', async () => {
    renderAccount();
    const detailsBtn = await screen.findByText('Personal Details');
    await act(async () => fireEvent.click(detailsBtn));
    await waitFor(() => expect(screen.getByText(/FULL NAME/i)).toBeInTheDocument());
  });
});
