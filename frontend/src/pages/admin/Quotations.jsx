import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Eye } from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiFetch } from '../../config/api';
import usePageTitle from '../../hooks/usePageTitle';
import '../AdminDash.css';
import './Quotations.css';

const statusOptions = ['All', 'pending', 'quoted', 'accepted', 'declined', 'expired'];

const statusColors = {
  pending:  { bg: '#f59e0b10', border: '#f59e0b33', text: '#f59e0b' },
  quoted:   { bg: '#2e94d110', border: '#2e94d133', text: '#2e94d1' },
  accepted: { bg: '#34c76e10', border: '#34c76e33', text: '#34c76e' },
  declined: { bg: '#f0525210', border: '#f0525233', text: '#f05252' },
  expired:  { bg: '#6b728010', border: '#6b728033', text: '#6b7280' },
};

const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';

export default function Quotations() {
  usePageTitle('Quotations');
  const toast = useToast();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const { getToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch('/quotations', { token: getToken() });
        setQuotations(Array.isArray(res) ? res : (res.data || []));
      } catch (err) {
        console.error('Failed to load quotations:', err);
        toast.error('Failed to load quotations');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleStatusChange = async (quotId, newStatus) => {
    try {
      await apiFetch(`/quotations/${quotId}`, {
        token: getToken(),
        method: 'PATCH',
        body: { status: newStatus },
      });
      setQuotations(prev => prev.map(q => q.id === quotId ? { ...q, status: newStatus } : q));
      toast.success(`Quotation #${quotId} → ${cap(newStatus)}`);
    } catch (err) {
      toast.error('Failed to update status: ' + err.message);
    }
  };

  const filtered = useMemo(() => {
    return quotations.filter(q => {
      const matchStatus = statusFilter === 'All' || q.status === statusFilter;
      const name  = q.profile?.full_name || '';
      const email = q.profile?.email || '';
      const svc   = q.services?.name || '';
      const matchSearch =
        String(q.id).includes(search) ||
        name.toLowerCase().includes(search.toLowerCase()) ||
        email.toLowerCase().includes(search.toLowerCase()) ||
        svc.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [quotations, search, statusFilter]);

  const totalCount    = quotations.length;
  const pendingCount  = quotations.filter(q => q.status === 'pending').length;
  const quotedCount   = quotations.filter(q => q.status === 'quoted').length;
  const acceptedCount = quotations.filter(q => q.status === 'accepted').length;

  return (
    <div className="admin-page">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-topbar">
          <div>
            <h1 className="admin-page-title">Quotations</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              {filtered.length} of {totalCount} quotation requests
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn-icon relative">
              <Bell size={18} />
              {pendingCount > 0 && <span className="admin-bell-badge">{pendingCount}</span>}
            </button>
            <div className="admin-user-chip">
              <div className="admin-avatar-sm" />
              <span>Admin</span>
            </div>
          </div>
        </div>

        <div className="admin-body">
          {/* Summary cards */}
          <div className="ord-summary-row">
            <div className="ord-summary-card card card-padded">
              <span className="ord-summary-label">Total</span>
              <strong className="ord-summary-val">{totalCount}</strong>
            </div>
            <div className="ord-summary-card card card-padded">
              <span className="ord-summary-label">Pending</span>
              <strong className="ord-summary-val" style={{ color: '#f59e0b' }}>{pendingCount}</strong>
            </div>
            <div className="ord-summary-card card card-padded">
              <span className="ord-summary-label">Quoted</span>
              <strong className="ord-summary-val" style={{ color: '#2e94d1' }}>{quotedCount}</strong>
            </div>
            <div className="ord-summary-card card card-padded">
              <span className="ord-summary-label">Accepted</span>
              <strong className="ord-summary-val" style={{ color: 'var(--color-green-primary)' }}>{acceptedCount}</strong>
            </div>
          </div>

          {/* Toolbar */}
          <div className="ord-toolbar card card-padded">
            <div className="ord-search-wrap">
              <Search size={16} color="var(--color-text-muted)" />
              <input
                className="ord-search"
                placeholder="Search by ID, client name, email, or service…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                id="quotations-search"
              />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {statusOptions.map(s => (
                <button
                  key={s}
                  className={`inv-cat-pill ${statusFilter === s ? 'active' : ''}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === 'All' ? 'All' : cap(s)}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="ord-table card" style={{ marginTop: 20 }}>
            <div className="ord-table-header" style={{ gridTemplateColumns: '60px 1fr 130px 1fr 130px 120px 80px' }}>
              <span>ID</span>
              <span>Client</span>
              <span>Date</span>
              <span>Service</span>
              <span>Budget</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            {loading && (
              <div className="ord-empty"><p>Loading quotations…</p></div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="ord-empty">
                <span style={{ fontSize: '2.5rem' }}>📋</span>
                <p>No quotations match your search.</p>
              </div>
            )}

            {filtered.map(q => {
              const sc = statusColors[q.status] || statusColors.pending;
              return (
                <div key={q.id} className="ord-table-row" style={{ gridTemplateColumns: '60px 1fr 130px 1fr 130px 120px 80px' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-green-primary)' }}>#{q.id}</span>
                  <div>
                    <strong style={{ fontSize: '0.9375rem' }}>{q.profile?.full_name || '—'}</strong>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>{q.profile?.email || ''}</p>
                  </div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    {new Date(q.created_at).toLocaleDateString()}
                  </span>
                  <span style={{ fontSize: '0.875rem' }}>{q.services?.name || <em style={{ color: 'var(--color-text-muted)' }}>General</em>}</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{q.budget_range || '—'}</span>
                  <select
                    value={q.status}
                    onChange={e => handleStatusChange(q.id, e.target.value)}
                    style={{ color: sc.text, borderColor: sc.border, background: sc.bg, border: '1px solid', borderRadius: 6, padding: '4px 8px', fontSize: '0.8125rem', cursor: 'pointer' }}
                  >
                    {['pending', 'quoted', 'accepted', 'declined', 'expired'].map(s => (
                      <option key={s} value={s}>{cap(s)}</option>
                    ))}
                  </select>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate(`/admin/quotations/${q.id}`)}
                    id={`view-quot-${q.id}`}
                  >
                    <Eye size={14} /> View
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
