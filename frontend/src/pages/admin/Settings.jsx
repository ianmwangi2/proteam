import { useState, useEffect } from 'react';
import { Bell, Save, Check, Loader } from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiFetch } from '../../config/api';
import usePageTitle from '../../hooks/usePageTitle';
import '../AdminDash.css';
import './Settings.css';

// Map between API snake_case keys and friendly camelCase keys
const keyMap = {
  company_name: 'companyName',
  company_email: 'email',
  company_phone: 'phone',
  company_address: 'address',
  currency: 'currency',
  tax_rate: 'taxRate',
  shipping_flat: 'shippingFlat',
  free_shipping_min: 'freeShippingMin',
  low_stock_threshold: 'lowStockThreshold',
};
const reverseKeyMap = Object.fromEntries(Object.entries(keyMap).map(([k, v]) => [v, k]));

const defaultSettings = {
  companyName: 'Pro.Team Technologies',
  email: 'proteamtechnologies122@gmail.com',
  phone: '+254 725 300 350',
  address: 'Nairobi, Kenya',
  currency: 'KSh',
  taxRate: '16',
  shippingFlat: '500',
  freeShippingMin: '10000',
  lowStockThreshold: '5',
};

export default function AdminSettings() {
  usePageTitle('Settings');
  const toast = useToast();
  const [settings, setSettings] = useState(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch('/settings');
        const mapped = { ...defaultSettings };
        for (const [apiKey, val] of Object.entries(data)) {
          const frontKey = keyMap[apiKey];
          if (frontKey) mapped[frontKey] = val;
        }
        setSettings(mapped);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const update = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {};
      for (const [frontKey, val] of Object.entries(settings)) {
        const apiKey = reverseKeyMap[frontKey];
        if (apiKey) body[apiKey] = val;
      }
      await apiFetch('/settings', { token: getToken(), method: 'PUT', body });
      setSaved(true);
      toast.success('Settings saved');
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      toast.error('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-topbar">
          <div>
            <h1 className="admin-page-title">Settings</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              Store configuration
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn-icon relative"><Bell size={18} /></button>
            <div className="admin-user-chip">
              <div className="admin-avatar-sm" />
              <span>Admin</span>
            </div>
          </div>
        </div>

        <div className="admin-body">
          <div className="stg-grid">
            {/* Company Info */}
            <div className="card card-padded stg-section">
              <h3 className="stg-section-title">Company Information</h3>
              <label className="stg-field">
                <span className="stg-label">Company Name</span>
                <input className="stg-input" value={settings.companyName} onChange={e => update('companyName', e.target.value)} />
              </label>
              <label className="stg-field">
                <span className="stg-label">Email</span>
                <input className="stg-input" type="email" value={settings.email} onChange={e => update('email', e.target.value)} />
              </label>
              <label className="stg-field">
                <span className="stg-label">Phone</span>
                <input className="stg-input" value={settings.phone} onChange={e => update('phone', e.target.value)} />
              </label>
              <label className="stg-field">
                <span className="stg-label">Address</span>
                <input className="stg-input" value={settings.address} onChange={e => update('address', e.target.value)} />
              </label>
            </div>

            {/* Pricing & Tax */}
            <div className="card card-padded stg-section">
              <h3 className="stg-section-title">Pricing &amp; Tax</h3>
              <label className="stg-field">
                <span className="stg-label">Currency</span>
                <input className="stg-input" value={settings.currency} onChange={e => update('currency', e.target.value)} />
              </label>
              <label className="stg-field">
                <span className="stg-label">Tax Rate (%)</span>
                <input className="stg-input" type="number" min="0" max="100" value={settings.taxRate} onChange={e => update('taxRate', e.target.value)} />
              </label>
            </div>

            {/* Shipping */}
            <div className="card card-padded stg-section">
              <h3 className="stg-section-title">Shipping</h3>
              <label className="stg-field">
                <span className="stg-label">Flat Shipping Fee (KSh)</span>
                <input className="stg-input" type="number" min="0" value={settings.shippingFlat} onChange={e => update('shippingFlat', e.target.value)} />
              </label>
              <label className="stg-field">
                <span className="stg-label">Free Shipping Minimum (KSh)</span>
                <input className="stg-input" type="number" min="0" value={settings.freeShippingMin} onChange={e => update('freeShippingMin', e.target.value)} />
              </label>
            </div>

            {/* Inventory */}
            <div className="card card-padded stg-section">
              <h3 className="stg-section-title">Inventory</h3>
              <label className="stg-field">
                <span className="stg-label">Low Stock Threshold</span>
                <input className="stg-input" type="number" min="0" value={settings.lowStockThreshold} onChange={e => update('lowStockThreshold', e.target.value)} />
              </label>
            </div>
          </div>

          <div className="stg-save-bar">
            <button className="btn btn-primary btn-md" onClick={handleSave} disabled={saving}>
              {saved ? <><Check size={16} /> Saved!</> : saving ? <><Loader size={16} /> Saving…</> : <><Save size={16} /> Save Settings</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
