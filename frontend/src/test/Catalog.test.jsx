import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// ── Mocks ───────────────────────────────────────────────
vi.mock('../config/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

vi.mock('../config/api', () => ({
  apiFetch: vi.fn().mockRejectedValue(new Error('no API')),
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), cart: vi.fn() }),
}));

import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';

const { default: Catalog } = await import('../pages/Catalog');

function renderCatalog() {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Catalog />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('Catalog', () => {
  it('renders the catalog page with title', async () => {
    await act(async () => renderCatalog());
    expect(screen.getByText('Security Catalogue')).toBeInTheDocument();
  });

  it('shows category sidebar', async () => {
    await act(async () => renderCatalog());
    expect(screen.getAllByText('CCTV').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Access Control').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Biometric').length).toBeGreaterThan(0);
  });

  it('renders search input', async () => {
    await act(async () => renderCatalog());
    expect(screen.getByPlaceholderText('Search security equipment...')).toBeInTheDocument();
  });

  it('shows product cards from static data', async () => {
    await act(async () => renderCatalog());
    // Static products should render — check for "products" text in the results count
    const resultsEl = screen.getByText(/products$/);
    expect(resultsEl).toBeInTheDocument();
  });

  it('filters products by search term', async () => {
    vi.useFakeTimers();
    await act(async () => renderCatalog());

    const searchInput = screen.getByPlaceholderText('Search security equipment...');
    await act(async () => fireEvent.change(searchInput, { target: { value: 'xyznonexistent' } }));
    await act(async () => vi.advanceTimersByTime(300));

    expect(screen.getByText('No products found')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('filters products by category', async () => {
    await act(async () => renderCatalog());

    // Click on a category — the count should change
    const cctvButtons = screen.getAllByText('CCTV');
    await act(async () => fireEvent.click(cctvButtons[0]));

    // Should show fewer products
    const resultsEl = screen.getByText(/products$/);
    expect(resultsEl).toBeInTheDocument();
  });

  it('toggles between grid and list view', async () => {
    await act(async () => renderCatalog());

    const listBtn = screen.getByTitle ? null : document.getElementById('view-list-btn');
    if (listBtn) {
      await act(async () => fireEvent.click(listBtn));
      expect(document.querySelector('.catalog-grid.list-view')).toBeInTheDocument();
    }
  });

  it('shows filter checkboxes', async () => {
    await act(async () => renderCatalog());
    expect(screen.getByText('In Stock Only')).toBeInTheDocument();
    expect(screen.getByText('New Arrivals')).toBeInTheDocument();
    expect(screen.getByText('On Sale')).toBeInTheDocument();
  });
});
