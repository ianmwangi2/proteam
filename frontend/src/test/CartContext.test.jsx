import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CartProvider, useCart } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock supabase client used by AuthContext
vi.mock('../config/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

vi.mock('../config/api', () => ({
  apiFetch: vi.fn(),
}));

function TestComponent() {
  const { items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal } = useCart();
  return (
    <div>
      <span data-testid="count">{itemCount}</span>
      <span data-testid="subtotal">{subtotal}</span>
      <span data-testid="items">{JSON.stringify(items)}</span>
      <button onClick={() => addItem({ id: 1, name: 'Camera', numericPrice: 5000, emoji: '📷', sku: 'CAM-001' })}>Add</button>
      <button onClick={() => addItem({ id: 2, name: 'Alarm', numericPrice: 3000, emoji: '🔔', sku: 'ALM-001' })}>Add2</button>
      <button onClick={() => removeItem(1)}>Remove</button>
      <button onClick={() => updateQuantity(1, 3)}>SetQty3</button>
      <button onClick={() => clearCart()}>Clear</button>
    </div>
  );
}

function renderWithProviders() {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <TestComponent />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe('CartContext', () => {
  it('starts with empty cart', async () => {
    await act(async () => renderWithProviders());
    expect(screen.getByTestId('count').textContent).toBe('0');
    expect(screen.getByTestId('subtotal').textContent).toBe('0');
  });

  it('adds an item', async () => {
    await act(async () => renderWithProviders());
    await act(async () => fireEvent.click(screen.getByText('Add')));
    expect(screen.getByTestId('count').textContent).toBe('1');
    expect(screen.getByTestId('subtotal').textContent).toBe('5000');
  });

  it('increments qty when adding same item twice', async () => {
    await act(async () => renderWithProviders());
    await act(async () => fireEvent.click(screen.getByText('Add')));
    await act(async () => fireEvent.click(screen.getByText('Add')));
    expect(screen.getByTestId('count').textContent).toBe('2');
    expect(screen.getByTestId('subtotal').textContent).toBe('10000');
  });

  it('removes an item', async () => {
    await act(async () => renderWithProviders());
    await act(async () => fireEvent.click(screen.getByText('Add')));
    await act(async () => fireEvent.click(screen.getByText('Remove')));
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('updates quantity', async () => {
    await act(async () => renderWithProviders());
    await act(async () => fireEvent.click(screen.getByText('Add')));
    await act(async () => fireEvent.click(screen.getByText('SetQty3')));
    expect(screen.getByTestId('count').textContent).toBe('3');
    expect(screen.getByTestId('subtotal').textContent).toBe('15000');
  });

  it('clears all items', async () => {
    await act(async () => renderWithProviders());
    await act(async () => fireEvent.click(screen.getByText('Add')));
    await act(async () => fireEvent.click(screen.getByText('Add2')));
    await act(async () => fireEvent.click(screen.getByText('Clear')));
    expect(screen.getByTestId('count').textContent).toBe('0');
    expect(screen.getByTestId('subtotal').textContent).toBe('0');
  });

  it('persists to localStorage', async () => {
    await act(async () => renderWithProviders());
    await act(async () => fireEvent.click(screen.getByText('Add')));
    const saved = JSON.parse(localStorage.getItem('proteam-cart'));
    expect(saved).toHaveLength(1);
    expect(saved[0].name).toBe('Camera');
  });
});
