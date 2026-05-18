import { useState, useMemo } from 'react';
import {
  Search, Plus, Edit, Trash2, Bell, X, Save,
  AlertTriangle, CheckCircle, XCircle, ChevronUp, ChevronDown,
} from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../config/api';
import AdminSidebar from '../components/AdminSidebar';
import ProductImage from '../components/ProductImage';
import usePageTitle from '../hooks/usePageTitle';
import './Inventory.css';

const CATEGORIES = ['All', 'CCTV', 'Access Control', 'Biometric', 'Networking', 'Alarms', 'Residential'];

const LOW_THRESHOLD  = 20;
const WARN_THRESHOLD = 40;

function stockStatus(qty) {
  if (qty === 0)              return { label: 'Out of Stock', color: '#f05252', Icon: XCircle };
  if (qty <= LOW_THRESHOLD)   return { label: 'Low Stock',   color: '#f59e0b', Icon: AlertTriangle };
  if (qty <= WARN_THRESHOLD)  return { label: 'Limited',     color: '#eab308', Icon: AlertTriangle };
  return                             { label: 'In Stock',    color: '#34c76e', Icon: CheckCircle };
}

const EMPTY_FORM = { name: '', sku: '', category: 'CCTV', price_ksh: '', stock: '', emoji: '📦', description: '' };

function ProductModal({ item, onClose, onSaved }) {
  const { getToken } = useAuth();
  const toast = useToast();
  const isEdit = !!item;
  const [form, setForm] = useState(
    isEdit
      ? { name: item.name, sku: item.sku, category: item.category, price_ksh: item.numericPrice || '', stock: item.stock, emoji: item.emoji || '📦', description: item.desc || '' }
      : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price_ksh) return;
    setSaving(true);
    try {
      const token = getToken();
      const body = { ...form, price_ksh: Number(form.price_ksh), stock: Number(form.stock) || 0 };
      if (isEdit) {
        await apiFetch(`/products/${item.id}`, { token, method: 'PUT', body });
        toast.success('Product updated');
      } else {
        await apiFetch('/products', { token, method: 'POST', body });
        toast.success('Product created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Product' : 'Add Product'}</h3>
          <button className="toast-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 20px 20px' }}>
          <label><span className="text-label">Name</span>
            <input className="input" value={form.name} onChange={set('name')} required maxLength={200} /></label>
          <div style={{ display: 'flex', gap: 12 }}>
            <label style={{ flex: 1 }}><span className="text-label">SKU</span>
              <input className="input" value={form.sku} onChange={set('sku')} maxLength={30} /></label>
            <label style={{ flex: 1 }}><span className="text-label">Category</span>
              <select className="input" value={form.category} onChange={set('category')}>
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select></label>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <label style={{ flex: 1 }}><span className="text-label">Price (KSh)</span>
              <input className="input" type="number" min="0" value={form.price_ksh} onChange={set('price_ksh')} required /></label>
            <label style={{ flex: 1 }}><span className="text-label">Stock</span>
              <input className="input" type="number" min="0" value={form.stock} onChange={set('stock')} /></label>
          </div>
          <label><span className="text-label">Emoji</span>
            <input className="input" value={form.emoji} onChange={set('emoji')} maxLength={4} style={{ width: 60 }} /></label>
          <label><span className="text-label">Description</span>
            <textarea className="input" rows={3} value={form.description} onChange={set('description')} maxLength={500} /></label>
          <button className="btn btn-primary" type="submit" disabled={saving} style={{ width: '100%', marginTop: 8 }}>
            <Save size={16} /> {saving ? 'Saving…' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Inventory() {
  const { products, setProducts } = useProducts();
  const { getToken } = useAuth();
  const toast = useToast();
  usePageTitle('Inventory');
  const [search,      setSearch]      = useState('');
  const [activeCat,   setActiveCat]   = useState('All');
  const [sortField,   setSortField]   = useState('name');
  const [sortDir,     setSortDir]     = useState('asc');
  const [showModal,   setShowModal]   = useState(false);
  const [editItem,    setEditItem]    = useState(null);
  const [deleteId,    setDeleteId]    = useState(null);
  const [showAlerts,  setShowAlerts]  = useState(false);

  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const lowCount   = products.filter(p => p.stock > 0 && p.stock <= LOW_THRESHOLD).length;
  const outCount   = products.filter(p => p.stock === 0).length;

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const matchCat    = activeCat === 'All' || p.category === activeCat;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
                       || p.sku.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });

    list = [...list].sort((a, b) => {
      let av = a[sortField], bv = b[sortField];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 :  1;
      if (av > bv) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });

    return list;
  }, [search, activeCat, sortField, sortDir]);

  function handleSort(field) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }

  function SortIcon({ field }) {
    if (sortField !== field) return null;
    return sortDir === 'asc'
      ? <ChevronUp size={12} style={{ marginLeft: 4, opacity: 0.7 }} />
      : <ChevronDown size={12} style={{ marginLeft: 4, opacity: 0.7 }} />;
  }

  const refreshProducts = async () => {
    try {
      const res = await apiFetch('/products');
      const items = Array.isArray(res) ? res : res.data;
      const { default: normalize } = await import('../hooks/useProducts.js').then(() => ({}));
      // Re-normalize inline — same as useProducts normalize
      setProducts(items.map(p => ({
        id: p.id, sku: p.sku, category: p.category,
        label: p.label || p.category?.toUpperCase(), name: p.name,
        price: p.price_usd ? `$${Number(p.price_usd).toFixed(2)}` : '',
        priceKsh: `KSh ${Number(p.price_ksh).toLocaleString()}`,
        numericPrice: Number(p.price_ksh), badge: p.badge || null,
        emoji: p.emoji || '📦', bg: p.bg || '#0d180d',
        rating: Number(p.rating) || 0, reviews: p.reviews || 0,
        stock: p.stock || 0, desc: p.description || '',
      })));
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const token = getToken();
      await apiFetch(`/products/${deleteId}`, { token, method: 'DELETE' });
      toast.success('Product deleted');
      setDeleteId(null);
      refreshProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const lowStockItems = products.filter(p => p.stock > 0 && p.stock <= LOW_THRESHOLD);
  const outOfStockItems = products.filter(p => p.stock === 0);

  return (
    <div className="admin-page">
      <AdminSidebar />

      {/* Content */}
      <div className="admin-content">
        <div className="admin-topbar">
          <div>
            <h1 className="admin-page-title">Inventory</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              {filtered.length} of {products.length} products shown
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn-icon relative" id="inv-bell-btn" onClick={() => setShowAlerts(!showAlerts)} aria-label="Stock alerts">
              <Bell size={18} />
              {(lowCount + outCount) > 0 && <span className="admin-bell-badge">{lowCount + outCount}</span>}
            </button>
            <button className="btn btn-primary" id="inv-add-btn" onClick={() => { setEditItem(null); setShowModal(true); }}><Plus size={16} /> Add Product</button>
          </div>
        </div>

        <div className="admin-body">

          {/* Summary cards */}
          <div className="inv-summary-row">
            <div className="inv-summary-card card card-padded">
              <span className="inv-summary-label">Total SKUs</span>
              <strong className="inv-summary-val">{products.length}</strong>
            </div>
            <div className="inv-summary-card card card-padded">
              <span className="inv-summary-label">Total Units in Stock</span>
              <strong className="inv-summary-val" style={{ color: 'var(--color-green-primary)' }}>{totalUnits.toLocaleString()}</strong>
            </div>
            <div className="inv-summary-card card card-padded">
              <span className="inv-summary-label">Low Stock Items</span>
              <strong className="inv-summary-val" style={{ color: '#f59e0b' }}>{lowCount}</strong>
            </div>
            <div className="inv-summary-card card card-padded">
              <span className="inv-summary-label">Out of Stock</span>
              <strong className="inv-summary-val" style={{ color: '#f05252' }}>{outCount}</strong>
            </div>
          </div>

          {/* Toolbar */}
          <div className="inv-toolbar card card-padded">
            <div className="inv-search-wrap">
              <Search size={16} color="var(--color-text-muted)" />
              <input
                className="inv-search"
                placeholder="Search by name or SKU…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                id="inv-search"
              />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`inv-cat-pill ${activeCat === cat ? 'active' : ''}`}
                  onClick={() => setActiveCat(cat)}
                  id={`inv-cat-${cat.toLowerCase().replace(' ', '-')}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="inv-table card" style={{ marginTop: 20 }}>
            <div className="inv-table-header">
              <button className="inv-th-btn" onClick={() => handleSort('name')}>
                Product <SortIcon field="name" />
              </button>
              <button className="inv-th-btn" onClick={() => handleSort('sku')}>
                SKU <SortIcon field="sku" />
              </button>
              <button className="inv-th-btn" onClick={() => handleSort('category')}>
                Category <SortIcon field="category" />
              </button>
              <button className="inv-th-btn" onClick={() => handleSort('price')}>
                Price <SortIcon field="price" />
              </button>
              <button className="inv-th-btn" onClick={() => handleSort('stock')}>
                Units in Stock <SortIcon field="stock" />
              </button>
              <span>Status</span>
              <span>Actions</span>
            </div>

            {filtered.length === 0 && (
              <div className="inv-empty">
                <span style={{ fontSize: '2.5rem' }}>🔍</span>
                <p>No products match your search.</p>
              </div>
            )}

            {filtered.map(item => {
              const { label: statusLabel, color: statusColor, Icon: StatusIcon } = stockStatus(item.stock);
              return (
                <div key={item.id} className="inv-table-row" id={`inv-row-${item.sku}`}>
                  {/* Product */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="inv-product-thumb"><ProductImage image={item.image} emoji={item.emoji} name={item.name} size="xs" /></div>
                    <div>
                      <strong style={{ fontSize: '0.9375rem' }}>{item.name}</strong>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>{item.desc}</p>
                    </div>
                  </div>

                  {/* SKU */}
                  <span className="text-label" style={{ color: 'var(--color-green-primary)', fontFamily: 'monospace' }}>{item.sku}</span>

                  {/* Category */}
                  <span className="badge badge-gray">{item.category}</span>

                  {/* Price */}
                  <div>
                    <strong style={{ fontSize: '0.9375rem' }}>{item.price}</strong>
                    <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: 0 }}>{item.priceKsh}</p>
                  </div>

                  {/* Units in Stock */}
                  <div className="inv-stock-cell">
                    <div className="inv-stock-bar-wrap">
                      <div
                        className="inv-stock-bar-fill"
                        style={{
                          width: `${Math.min(100, (item.stock / 120) * 100)}%`,
                          background: statusColor,
                        }}
                      />
                    </div>
                    <span className="inv-stock-qty" style={{ color: statusColor }}>
                      {item.stock} <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>units</span>
                    </span>
                  </div>

                  {/* Status badge */}
                  <span className="inv-status-badge" style={{ color: statusColor, borderColor: `${statusColor}33`, background: `${statusColor}10` }}>
                    <StatusIcon size={12} />
                    {statusLabel}
                  </span>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-icon edit-btn"   id={`inv-edit-${item.sku}`} onClick={() => { setEditItem(item); setShowModal(true); }} aria-label={`Edit ${item.name}`}><Edit   size={15} /></button>
                    <button className="btn-icon delete-btn" id={`inv-del-${item.sku}`}  onClick={() => setDeleteId(item.id)} aria-label={`Delete ${item.name}`}><Trash2 size={15} /></button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Stock alerts dropdown */}
        {showAlerts && (
          <div className="card card-padded" style={{ position: 'fixed', top: 60, right: 24, width: 340, maxHeight: 400, overflowY: 'auto', zIndex: 1000 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4>Stock Alerts</h4>
              <button className="toast-close" onClick={() => setShowAlerts(false)} aria-label="Close alerts"><X size={16} /></button>
            </div>
            {outOfStockItems.length === 0 && lowStockItems.length === 0 && (
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>All stock levels are healthy.</p>
            )}
            {outOfStockItems.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: '0.875rem' }}>
                <XCircle size={14} color="#f05252" />
                <span>{p.emoji} <strong>{p.name}</strong> — Out of Stock</span>
              </div>
            ))}
            {lowStockItems.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: '0.875rem' }}>
                <AlertTriangle size={14} color="#f59e0b" />
                <span>{p.emoji} <strong>{p.name}</strong> — {p.stock} units left</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product modal */}
      {showModal && (
        <ProductModal
          item={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSaved={refreshProducts}
        />
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-content card" onClick={e => e.stopPropagation()} style={{ maxWidth: 380, textAlign: 'center' }}>
            <div style={{ padding: '24px 20px' }}>
              <Trash2 size={32} color="#f05252" style={{ marginBottom: 12 }} />
              <h3 style={{ marginBottom: 8 }}>Delete Product?</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 20 }}>This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
                <button className="btn" style={{ background: '#f05252', color: '#fff' }} onClick={handleDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
