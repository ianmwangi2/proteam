import { useState, useEffect, useMemo } from 'react';
import { Bell, Search, Shield, UserCheck, UserX } from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiFetch } from '../../config/api';
import usePageTitle from '../../hooks/usePageTitle';
import '../AdminDash.css';
import './Users.css';

const roleFilters = ['All', 'admin', 'customer'];
const fmt = (n) => `KSh ${Number(n).toLocaleString()}`;

export default function AdminUsers() {
  usePageTitle('Users');
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const { getToken } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch('/users', { token: getToken() });
        setUsers(data);
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await apiFetch(`/users/${userId}/role`, {
        token: getToken(),
        method: 'PATCH',
        body: { role: newRole },
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success(`Role updated to ${newRole}`);
    } catch (err) {
      toast.error('Failed to update role: ' + err.message);
    }
  };

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchRole = roleFilter === 'All' || u.role === roleFilter;
      const matchSearch = (u.full_name || '').toLowerCase().includes(search.toLowerCase())
        || (u.email || '').toLowerCase().includes(search.toLowerCase());
      return matchRole && matchSearch;
    });
  }, [users, search, roleFilter]);

  const adminCount = users.filter(u => u.role === 'admin').length;
  const totalCount = users.length;

  return (
    <div className="admin-page">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-topbar">
          <div>
            <h1 className="admin-page-title">Users</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              {filtered.length} of {totalCount} users
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
          {/* Summary */}
          <div className="usr-summary-row">
            <div className="usr-summary-card card card-padded">
              <span className="usr-summary-label">Total Users</span>
              <strong className="usr-summary-val">{totalCount}</strong>
            </div>
            <div className="usr-summary-card card card-padded">
              <span className="usr-summary-label">Admins</span>
              <strong className="usr-summary-val" style={{ color: '#a855f7' }}>{adminCount}</strong>
            </div>
            <div className="usr-summary-card card card-padded">
              <span className="usr-summary-label">Customers</span>
              <strong className="usr-summary-val" style={{ color: 'var(--color-green-primary)' }}>{totalCount - adminCount}</strong>
            </div>
          </div>

          {/* Toolbar */}
          <div className="usr-toolbar card card-padded">
            <div className="usr-search-wrap">
              <Search size={16} color="var(--color-text-muted)" />
              <input
                className="usr-search"
                placeholder="Search by name or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {roleFilters.map(r => (
                <button
                  key={r}
                  className={`inv-cat-pill ${roleFilter === r ? 'active' : ''}`}
                  onClick={() => setRoleFilter(r)}
                >
                  {r === 'All' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1) + 's'}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="usr-table card" style={{ marginTop: 20 }}>
            <div className="usr-table-header">
              <span>User</span>
              <span>Role</span>
              <span>Joined</span>
              <span>Actions</span>
            </div>

            {loading && (
              <div className="usr-empty"><p>Loading users…</p></div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="usr-empty">
                <span style={{ fontSize: '2.5rem' }}>👤</span>
                <p>No users match your search.</p>
              </div>
            )}

            {filtered.map(user => (
              <div key={user.id} className="usr-table-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="usr-avatar">
                    {(user.full_name || user.email || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.9375rem' }}>{user.full_name || '—'}</strong>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>{user.email}</p>
                  </div>
                </div>
                <span className={`usr-role-badge ${user.role === 'admin' ? 'role-admin' : 'role-customer'}`}>
                  {user.role === 'admin' ? <Shield size={12} /> : null}
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '4px 8px', fontSize: '0.8125rem', color: 'var(--color-text-primary)', cursor: 'pointer' }}
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
