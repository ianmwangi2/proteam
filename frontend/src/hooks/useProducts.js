import { useState, useEffect } from 'react';
import { apiFetch } from '../config/api';
import { products as staticProducts } from '../data/products';

// Normalize API product shape to match the frontend shape
function normalize(p) {
  return {
    id: p.id,
    sku: p.sku,
    category: p.category,
    label: p.label || p.category?.toUpperCase(),
    name: p.name,
    price: p.price_usd ? `$${Number(p.price_usd).toFixed(2)}` : '',
    priceKsh: `KSh ${Number(p.price_ksh).toLocaleString()}`,
    numericPrice: Number(p.price_ksh),
    badge: p.badge || null,
    emoji: p.emoji || '📦',
    image: p.image || null,
    bg: p.bg || '#0d180d',
    rating: Number(p.rating) || 0,
    reviews: p.reviews || 0,
    stock: p.stock || 0,
    desc: p.description || '',
  };
}

let cachedProducts = null;

export function useProducts() {
  const [products, setProducts] = useState(cachedProducts || staticProducts);
  const [loading, setLoading] = useState(!cachedProducts);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cachedProducts) return;
    let cancelled = false;

    apiFetch('/products')
      .then((res) => {
        if (cancelled) return;
        const items = Array.isArray(res) ? res : res.data;
        const normalized = items.map(normalize);
        cachedProducts = normalized;
        setProducts(normalized);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        // Keep using static products as fallback
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { products, setProducts, loading, error };
}
