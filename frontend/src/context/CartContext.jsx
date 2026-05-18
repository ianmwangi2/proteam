import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { apiFetch } from '../config/api';

const CartContext = createContext();

const STORAGE_KEY = 'proteam-cart';

function loadCart() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'SET_CART':
      return action.payload;
    case 'ADD_ITEM': {
      const existing = state.find((i) => i.id === action.payload.id);
      if (existing) {
        return state.map((i) =>
          i.id === action.payload.id
            ? { ...i, qty: i.qty + (action.payload.qty || 1), cartItemId: action.payload.cartItemId || i.cartItemId }
            : i
        );
      }
      return [...state, { ...action.payload, qty: action.payload.qty || 1 }];
    }
    case 'REMOVE_ITEM':
      return state.filter((i) => i.id !== action.payload);
    case 'UPDATE_QUANTITY':
      return state
        .map((i) =>
          i.id === action.payload.id
            ? { ...i, qty: action.payload.qty, cartItemId: action.payload.cartItemId || i.cartItemId }
            : i
        )
        .filter((i) => i.qty > 0);
    case 'CLEAR_CART':
      return [];
    default:
      return state;
  }
}

/* Normalize a server cart row into the local item shape */
function normalizeServerItem(row) {
  return {
    id: row.product_id,
    cartItemId: row.id,
    name: row.products?.name || '',
    price: parseFloat(String(row.products?.price_ksh || '0').replace(/[^0-9.]/g, '')) || 0,
    emoji: row.products?.emoji || '',
    image: row.products?.image || null,
    sku: row.products?.sku || '',
    qty: row.qty,
  };
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, null, loadCart);
  const { user, getToken } = useAuth();
  const toast = useToast();
  const syncingRef = useRef(false);

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // On login: merge localStorage cart into server, then load server cart
  // On logout: keep current cart in localStorage (already persisted)
  useEffect(() => {
    if (!user) return;
    const token = getToken();
    if (!token) return;

    const syncOnLogin = async () => {
      if (syncingRef.current) return;
      syncingRef.current = true;
      try {
        // Fetch the canonical server cart first
        const serverCart = await apiFetch('/cart', { token });
        const serverMap = new Map(serverCart.map(r => [r.product_id, r]));

        // Push only localStorage items that don't already exist on the server
        const localItems = loadCart();
        for (const item of localItems) {
          if (!serverMap.has(item.id)) {
            try {
              await apiFetch('/cart', { token, method: 'POST', body: { product_id: item.id, qty: item.qty } });
            } catch { /* ignore errors for individual items */ }
          }
        }

        // Re-fetch and use server cart as source of truth
        const finalCart = serverMap.size !== serverCart.length || localItems.some(i => !serverMap.has(i.id))
          ? await apiFetch('/cart', { token })
          : serverCart;
        dispatch({ type: 'SET_CART', payload: finalCart.map(normalizeServerItem) });
      } catch (err) {
        console.error('Cart sync failed:', err);
      } finally {
        syncingRef.current = false;
      }
    };

    syncOnLogin();
  }, [user]);

  const getTokenSafe = useCallback(() => {
    try { return getToken(); } catch { return null; }
  }, [getToken]);

  const addItem = useCallback(async (product, qty = 1) => {
    const itemPayload = {
      id: product.id,
      name: product.name,
      price: product.numericPrice ?? (parseFloat(product.priceKsh?.replace(/[^0-9.]/g, '')) || 0),
      emoji: product.emoji,
      image: product.image || null,
      sku: product.sku,
      qty,
    };
    dispatch({ type: 'ADD_ITEM', payload: itemPayload });
    toast?.cart(`${product.name} added to cart`);

    const token = getTokenSafe();
    if (token) {
      try {
        const res = await apiFetch('/cart', { token, method: 'POST', body: { product_id: product.id, qty } });
        // Update local state with the server's cartItemId
        dispatch({
          type: 'ADD_ITEM',
          payload: { ...itemPayload, qty: 0, cartItemId: res.id },
        });
      } catch (err) {
        console.error('Server cart add failed:', err);
      }
    }
  }, [getTokenSafe]);

  const removeItem = useCallback(async (productId) => {
    const item = items.find(i => i.id === productId);
    dispatch({ type: 'REMOVE_ITEM', payload: productId });

    const token = getTokenSafe();
    if (token && item?.cartItemId) {
      try {
        await apiFetch(`/cart/${item.cartItemId}`, { token, method: 'DELETE' });
      } catch (err) {
        console.error('Server cart remove failed:', err);
      }
    }
  }, [items, getTokenSafe]);

  const updateQuantity = useCallback(async (productId, qty) => {
    const item = items.find(i => i.id === productId);
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: productId, qty } });

    const token = getTokenSafe();
    if (token && item?.cartItemId) {
      try {
        await apiFetch(`/cart/${item.cartItemId}`, { token, method: 'PATCH', body: { qty } });
      } catch (err) {
        console.error('Server cart update failed:', err);
      }
    }
  }, [items, getTokenSafe]);

  const clearCart = useCallback(async () => {
    dispatch({ type: 'CLEAR_CART' });

    const token = getTokenSafe();
    if (token) {
      try {
        await apiFetch('/cart', { token, method: 'DELETE' });
      } catch (err) {
        console.error('Server cart clear failed:', err);
      }
    }
  }, [getTokenSafe]);

  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
