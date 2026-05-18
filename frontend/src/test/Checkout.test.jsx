import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// ── Mocks ───────────────────────────────────────────────
vi.mock('../config/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'mock-jwt', user: { id: 'u1' } } },
      }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

vi.mock('../config/api', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), cart: vi.fn() }),
}));

import { apiFetch } from '../config/api';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';

const { default: Checkout } = await import('../pages/Checkout');

const mockProfile = {
  id: 'u1', full_name: 'Test User', email: 'test@example.com', role: 'customer',
};

function renderCheckout() {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Checkout />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  // Seed cart with items
  localStorage.setItem('proteam-cart', JSON.stringify([
    { id: 1, name: 'Camera', price: 5000, qty: 2, emoji: '📷', sku: 'CAM-001' },
  ]));
  apiFetch.mockImplementation((path) => {
    if (path === '/users/me') return Promise.resolve(mockProfile);
    // Cart sync endpoint — return server cart items matching localStorage
    if (path === '/cart') return Promise.resolve([
      { id: 101, product_id: 1, qty: 2, products: { name: 'Camera', price_ksh: '5000', emoji: '📷', sku: 'CAM-001' } },
    ]);
    return Promise.resolve([]);
  });
});

describe('Checkout', () => {
  async function renderAndWait() {
    renderCheckout();
    await waitFor(() => expect(screen.getByText('Shipping Information')).toBeInTheDocument());
  }

  it('shows progress steps', async () => {
    await renderAndWait();
    expect(screen.getByText('Cart')).toBeInTheDocument();
    expect(screen.getByText('Shipping')).toBeInTheDocument();
    expect(screen.getByText('Payment')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
  });

  it('shows shipping form fields', async () => {
    await renderAndWait();
    expect(screen.getByPlaceholderText('John')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nairobi')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('+254 700 000 000')).toBeInTheDocument();
  });

  it('shows order summary with cart items', async () => {
    await renderAndWait();
    expect(screen.getByText(/Camera/)).toBeInTheDocument();
  });

  it('shows delivery method options', async () => {
    await renderAndWait();
    expect(screen.getByText(/Express Installation/i)).toBeInTheDocument();
    expect(screen.getByText(/Standard Delivery/i)).toBeInTheDocument();
  });

  it('calculates tax at 16%', async () => {
    await renderAndWait();
    // subtotal = 10,000 (5000×2), tax = 1,600
    expect(screen.getByText(/1,600/)).toBeInTheDocument();
  });

  it('shows validation error without required fields', async () => {
    await renderAndWait();
    const btn = screen.getByText(/Place Order/);
    await act(async () => fireEvent.click(btn));
    expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument();
  });

  it('posts order when form is valid', async () => {
    apiFetch.mockImplementation((path, opts) => {
      if (path === '/users/me') return Promise.resolve(mockProfile);
      if (path === '/cart') return Promise.resolve([
        { id: 101, product_id: 1, qty: 2, products: { name: 'Camera', price_ksh: '5000', emoji: '📷', sku: 'CAM-001' } },
      ]);
      if (path === '/orders') return Promise.resolve({ id: 42, total: 13100 });
      return Promise.resolve([]);
    });

    await renderAndWait();

    fireEvent.change(screen.getByPlaceholderText('John'), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText('123 Security Avenue, Westlands'), { target: { value: '123 Main St' } });
    fireEvent.change(screen.getByPlaceholderText('Nairobi'), { target: { value: 'Nairobi' } });
    fireEvent.change(screen.getByPlaceholderText('+254 700 000 000'), { target: { value: '+254 700 000 000' } });

    await act(async () => fireEvent.click(screen.getByText(/Place Order/)));

    await waitFor(() => expect(screen.getByText('Order Placed!')).toBeInTheDocument());
    expect(screen.getByText(/Order #42/)).toBeInTheDocument();
  });

  it('shows error on order failure', async () => {
    apiFetch.mockImplementation((path, opts) => {
      if (path === '/users/me') return Promise.resolve(mockProfile);
      if (path === '/cart') return Promise.resolve([
        { id: 101, product_id: 1, qty: 2, products: { name: 'Camera', price_ksh: '5000', emoji: '📷', sku: 'CAM-001' } },
      ]);
      if (path === '/orders') return Promise.reject(new Error('Insufficient stock'));
      return Promise.resolve([]);
    });

    await renderAndWait();

    fireEvent.change(screen.getByPlaceholderText('John'), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText('123 Security Avenue, Westlands'), { target: { value: '123 Main St' } });
    fireEvent.change(screen.getByPlaceholderText('Nairobi'), { target: { value: 'Nairobi' } });
    fireEvent.change(screen.getByPlaceholderText('+254 700 000 000'), { target: { value: '+254 700 000 000' } });

    await act(async () => fireEvent.click(screen.getByText(/Place Order/)));

    await waitFor(() => expect(screen.getByText('Insufficient stock')).toBeInTheDocument());
  });
});
