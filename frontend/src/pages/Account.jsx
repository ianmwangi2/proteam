import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, User, Bell, LogOut, Settings, FileText, LifeBuoy, Mail, Lock, UserPlus, LogIn, Save, Check, AlertTriangle, Eye, EyeOff, Shield, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../config/api';
import { supabase } from '../config/supabase';
import usePageTitle from '../hooks/usePageTitle';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Account.css';

const menuItems = [
  { id:'details',      label:'Personal Details',  icon:User },
  { id:'quotations',   label:'My Quotations',     icon:FileText },
  { id:'notifications',label:'Notifications',     icon:Bell },
  { id:'support',      label:'Support Tickets',   icon:LifeBuoy },
  { id:'settings',     label:'Account Settings',  icon:Settings },
];

/* ── Auth Form (Sign In / Sign Up) ─────────────────────────── */

function AuthForm() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!fullName.trim()) { setError('Full name is required'); setLoading(false); return; }
        await register(email, password, fullName);
        setSuccess('Account created! Check your email to confirm, then sign in.');
        setMode('signin');
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card card card-padded">
        <div className="auth-header">
          <div className="auth-logo">
            <img src="/logo.png" alt="Pro.Team Technologies logo" style={{ width: 48, height: 48, objectFit: 'contain' }} />
          </div>
          <h2 className="auth-title">{mode === 'signin' ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="auth-subtitle">
            {mode === 'signin'
              ? 'Sign in to your Pro.Team account'
              : 'Join Pro.Team Technologies'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
          >
            <LogIn size={16} /> Sign In
          </button>
          <button
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
          >
            <UserPlus size={16} /> Sign Up
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <div className="auth-field">
              <label htmlFor="fullName">Full Name</label>
              <div className="auth-input-wrap">
                <User size={16} className="auth-input-icon" />
                <input
                  id="fullName"
                  type="text"
                  placeholder="John Mwangi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="email">Email Address</label>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" />
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input
                id="password"
                type="password"
                placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full auth-submit" disabled={loading}>
            {loading
              ? (mode === 'signin' ? 'Signing in...' : 'Creating account...')
              : (mode === 'signin' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p className="auth-footer-text">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button className="auth-link" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setSuccess(''); }}>
            {mode === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}

/* ── Dashboard (Logged-in view) ────────────────────────────── */

/* ── Personal Details Panel ─── */
function PersonalDetailsPanel({ profile, getToken }) {
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const update = (field) => (e) => { setForm({ ...form, [field]: e.target.value }); setSaved(false); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiFetch('/users/me', { token: getToken(), method: 'PUT', body: form });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Personal Details</h2>
      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
      <form onSubmit={handleSave} className="acct-panel-form">
        <div className="auth-field">
          <label htmlFor="pd-name">Full Name</label>
          <div className="auth-input-wrap">
            <User size={16} className="auth-input-icon" />
            <input id="pd-name" type="text" value={form.full_name} onChange={update('full_name')} placeholder="Your full name" />
          </div>
        </div>
        <div className="auth-field">
          <label htmlFor="pd-phone">Phone Number</label>
          <div className="auth-input-wrap">
            <Mail size={16} className="auth-input-icon" />
            <input id="pd-phone" type="tel" value={form.phone} onChange={update('phone')} placeholder="+254 7XX XXX XXX" />
          </div>
        </div>
        <div className="auth-field">
          <label htmlFor="pd-address">Address</label>
          <div className="auth-input-wrap">
            <Mail size={16} className="auth-input-icon" />
            <input id="pd-address" type="text" value={form.address} onChange={update('address')} placeholder="Nairobi, Kenya" />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 8 }}>
          {saved ? <><Check size={16} /> Saved</> : saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
        </button>
      </form>
    </div>
  );
}

/* ── My Quotations Panel ─── */
function QuotationsPanel({ quotations, loadingQuotations, navigate, onAccept, onDecline }) {
  const statusColor = (s) => {
    switch (s) {
      case 'accepted': return '#34c76e';
      case 'quoted':   return '#2e94d1';
      case 'declined': return '#f05252';
      case 'expired':  return '#6b7280';
      default:         return '#f59e0b'; // pending
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>My Quotations</h2>
      {loadingQuotations ? (
        <div className="card card-padded" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-text-secondary)' }}>Loading quotations...</div>
      ) : quotations.length === 0 ? (
        <div className="card card-padded" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-text-secondary)' }}>
          <FileText size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <h4 style={{ marginBottom: 8 }}>No quotation requests yet</h4>
          <p style={{ margin: '0 0 20px', fontSize: '0.875rem' }}>
            Browse our services and request a quote to get started.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/services')}>
            <Shield size={16} /> View Services
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {quotations.map(q => (
            <div key={q.id} className="card card-padded" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.25rem', marginTop: 2 }}>
                📋
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
                  <p style={{ fontWeight: 600, margin: 0, fontSize: '0.9375rem' }}>
                    {q.services?.name || 'General Inquiry'}
                  </p>
                  <span style={{
                    padding: '3px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700,
                    color: statusColor(q.status),
                    background: `${statusColor(q.status)}18`,
                    border: `1px solid ${statusColor(q.status)}33`,
                    textTransform: 'capitalize', flexShrink: 0,
                  }}>
                    {q.status}
                  </span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: '0 0 8px' }}>
                  Submitted {new Date(q.created_at).toLocaleDateString()}
                  {q.budget_range ? ` · Budget: ${q.budget_range}` : ''}
                  {q.quoted_amount != null ? ` · Quoted: KSh ${Number(q.quoted_amount).toLocaleString()}` : ''}
                  {q.valid_until ? ` · Valid until: ${new Date(q.valid_until).toLocaleDateString()}` : ''}
                </p>
                {/* Accept / Decline — only shown when status is 'quoted' */}
                {q.status === 'quoted' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => onAccept(q.id)}
                      id={`quot-accept-${q.id}`}
                    >
                      ✓ Accept Quote
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => onDecline(q.id)}
                      style={{ color: 'var(--color-red)', borderColor: 'rgba(240,82,82,0.25)' }}
                      id={`quot-decline-${q.id}`}
                    >
                      ✕ Decline
                    </button>
                  </div>
                )}
                {/* Admin notes visible to user once quoted */}
                {q.status !== 'pending' && q.admin_notes && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: '8px 0 0', padding: '8px 12px', background: 'rgba(52,199,110,0.05)', borderRadius: 6, border: '1px solid rgba(52,199,110,0.1)' }}>
                    💬 {q.admin_notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Notifications Panel ─── */
function NotificationsPanel() {
  const [prefs, setPrefs] = useState({ quotationUpdates: true, promotions: false, security: true });
  const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Notifications</h2>
      <div className="card card-padded">
        <h4 style={{ marginBottom: 16 }}>Email Preferences</h4>
        {[
          { key: 'quotationUpdates', label: 'Quotation Updates', desc: 'Get notified when your quotation status changes' },
          { key: 'promotions', label: 'Promotions & Offers', desc: 'Receive deals and special offers' },
          { key: 'security', label: 'Security Alerts', desc: 'Important alerts about your account security' },
        ].map(({ key, label, desc }) => (
          <div key={key} className="notif-pref-row">
            <div>
              <strong style={{ display: 'block', fontSize: '0.9375rem', marginBottom: 2 }}>{label}</strong>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>{desc}</span>
            </div>
            <button
              className={`notif-toggle ${prefs[key] ? 'active' : ''}`}
              onClick={() => toggle(key)}
              aria-label={`Toggle ${label}`}
            >
              <span className="notif-toggle-knob" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Support Tickets Panel ─── */
function SupportTicketsPanel({ navigate }) {
  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Support Tickets</h2>
      <div className="card card-padded" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <LifeBuoy size={40} style={{ marginBottom: 12, opacity: 0.4, color: 'var(--color-text-secondary)' }} />
        <h4 style={{ marginBottom: 8 }}>No Support Tickets</h4>
        <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 20px', fontSize: '0.875rem' }}>
          Need help? Visit our support center to submit a ticket or chat with a technician.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/support')}>
          <LifeBuoy size={16} /> Go to Support Center
        </button>
      </div>
    </div>
  );
}

/* ── Account Settings Panel ─── */
function AccountSettingsPanel() {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPw !== confirmPw) { setPwMsg({ type: 'error', text: 'Passwords do not match' }); return; }
    if (newPw.length < 6) { setPwMsg({ type: 'error', text: 'Password must be at least 6 characters' }); return; }
    setPwSaving(true);
    setPwMsg({ type: '', text: '' });
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      setPwMsg({ type: 'success', text: 'Password updated successfully' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      setPwMsg({ type: 'error', text: err.message || 'Failed to update password' });
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Account Settings</h2>

      {/* Change Password */}
      <div className="card card-padded" style={{ marginBottom: 24 }}>
        <h4 style={{ marginBottom: 16 }}><Lock size={18} style={{ verticalAlign: -3, marginRight: 8 }} />Change Password</h4>
        {pwMsg.text && <div className={pwMsg.type === 'error' ? 'auth-error' : 'auth-success'} style={{ marginBottom: 12 }}>{pwMsg.text}</div>}
        <form onSubmit={handlePasswordChange} className="acct-panel-form">
          <div className="auth-field">
            <label htmlFor="new-pw">New Password</label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input id="new-pw" type={showPw ? 'text' : 'password'} value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Min. 6 characters" required minLength={6} />
              <button type="button" className="pw-toggle-btn" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="auth-field">
            <label htmlFor="confirm-pw">Confirm New Password</label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input id="confirm-pw" type={showPw ? 'text' : 'password'} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Repeat new password" required minLength={6} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={pwSaving} style={{ marginTop: 8 }}>
            {pwSaving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="card card-padded" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
        <h4 style={{ marginBottom: 8, color: '#f05252' }}><AlertTriangle size={18} style={{ verticalAlign: -3, marginRight: 8 }} />Danger Zone</h4>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '0 0 16px' }}>
          Deleting your account is permanent and cannot be undone. All your data will be lost.
        </p>
        <button className="btn btn-ghost" style={{ color: '#f05252', borderColor: 'rgba(239,68,68,0.3)' }} onClick={() => alert('Please contact support to delete your account.')}>
          <Trash2 size={16} /> Delete Account
        </button>
      </div>
    </div>
  );
}

/* ── Main Dashboard ─── */
function Dashboard() {
  const { user, profile, isAdmin, getToken, logout } = useAuth();
  const navigate = useNavigate();
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const email = user?.email || '';
  const [activeTab, setActiveTab] = useState('quotations');

  const [quotations, setQuotations] = useState([]);
  const [loadingQuotations, setLoadingQuotations] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch('/quotations/mine', { token: getToken() });
        setQuotations(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load quotations:', err);
      } finally {
        setLoadingQuotations(false);
      }
    };
    load();
  }, []);

  const handleAcceptQuotation = async (id) => {
    try {
      const updated = await apiFetch(`/quotations/${id}/accept`, { token: getToken(), method: 'POST' });
      setQuotations(prev => prev.map(q => q.id === id ? { ...q, ...updated } : q));
    } catch (err) {
      console.error('Accept failed:', err);
    }
  };

  const handleDeclineQuotation = async (id) => {
    if (!window.confirm('Are you sure you want to decline this quote?')) return;
    try {
      const updated = await apiFetch(`/quotations/${id}/decline`, { token: getToken(), method: 'POST' });
      setQuotations(prev => prev.map(q => q.id === id ? { ...q, ...updated } : q));
    } catch (err) {
      console.error('Decline failed:', err);
    }
  };

  const totalQuotations = quotations.length;
  const pendingCount    = quotations.filter(q => q.status === 'pending').length;
  const acceptedCount   = quotations.filter(q => q.status === 'accepted').length;

  const handleSignOut = async () => {
    await logout();
  };

  const roleBadge = isAdmin ? 'Admin' : 'Member';

  const renderPanel = () => {
    switch (activeTab) {
      case 'details':      return <PersonalDetailsPanel profile={profile} getToken={getToken} />;
      case 'quotations':   return <QuotationsPanel quotations={quotations} loadingQuotations={loadingQuotations} navigate={navigate} onAccept={handleAcceptQuotation} onDecline={handleDeclineQuotation} />;
      case 'notifications':return <NotificationsPanel />;
      case 'support':      return <SupportTicketsPanel navigate={navigate} />;
      case 'settings':     return <AccountSettingsPanel />;
      default: return null;
    }
  };

  return (
    <div className="account-layout">
      {/* Sidebar */}
      <aside className="account-sidebar">
        <div className="account-profile-card card card-padded">
          <div className="account-avatar">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="32" fill="#f5c5a3" />
              <ellipse cx="32" cy="28" rx="13" ry="13" fill="#e8a882" />
              <ellipse cx="32" cy="56" rx="20" ry="15" fill="#34c76e" opacity="0.8" />
            </svg>
          </div>
          <h3 className="account-name">{displayName}</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{email}</p>
          <div className="account-tier">
            <Shield size={12} color="#34c76e" />
            {roleBadge}
          </div>
        </div>
        <nav className="account-nav card">
          {menuItems.map((item, i) => (
            <div key={item.id}>
              <button
                className={`account-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
                id={`acc-nav-${item.id}`}
              >
                <item.icon size={18} color={activeTab === item.id ? '#34c76e' : '#6b7280'} />
                <span>{item.label}</span>
                <ChevronRight size={16} color="#4b5563" />
              </button>
              {i < menuItems.length - 1 && <div className="divider" style={{ margin: '0 16px' }} />}
            </div>
          ))}
        </nav>
        <button className="btn btn-ghost btn-full signout-btn" onClick={handleSignOut}>
          <LogOut size={16} color="#f05252" /> Sign Out
        </button>
      </aside>

      {/* Main */}
      <div className="account-main">
        <div className="account-stats">
          {[
            [loadingQuotations ? '—' : totalQuotations, 'Quotations'],
            [loadingQuotations ? '—' : pendingCount,    'Pending'],
            [loadingQuotations ? '—' : acceptedCount,   'Accepted'],
            [loadingQuotations ? '—' : quotations.filter(q => q.status === 'quoted').length, 'Quoted'],
          ].map(([v, l]) => (
            <div key={l} className="account-stat card card-padded">
              <strong className="account-stat-val">{v}</strong>
              <span className="account-stat-label">{l}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32 }}>
          {renderPanel()}
        </div>
      </div>
    </div>
  );
}

/* ── Page Shell ────────────────────────────────────────────── */

export default function Account() {
  const { user, loading } = useAuth();
  usePageTitle('Account');

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="container account-page">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-text-secondary)' }}>Loading...</div>
        ) : user ? (
          <Dashboard />
        ) : (
          <AuthForm />
        )}
      </div>
      <Footer />
    </div>
  );
}
