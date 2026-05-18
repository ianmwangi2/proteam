import { useState, useEffect, useMemo } from 'react';
import { Search, MessageSquare, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiFetch } from '../../config/api';
import usePageTitle from '../../hooks/usePageTitle';
import '../AdminDash.css';
import './SupportTickets.css';

const statusOptions = ['All', 'open', 'in_progress', 'resolved', 'closed'];
const priorityOptions = ['All', 'low', 'medium', 'high'];

const statusColors = {
  open:        { bg: '#f59e0b10', border: '#f59e0b33', text: '#f59e0b', Icon: Clock },
  in_progress: { bg: '#2e94d110', border: '#2e94d133', text: '#2e94d1', Icon: MessageSquare },
  resolved:    { bg: '#34c76e10', border: '#34c76e33', text: '#34c76e', Icon: CheckCircle },
  closed:      { bg: '#6b728010', border: '#6b728033', text: '#6b7280', Icon: XCircle },
};

const priorityColors = {
  low:    { text: '#6b7280', bg: '#6b728010', border: '#6b728033' },
  medium: { text: '#f59e0b', bg: '#f59e0b10', border: '#f59e0b33' },
  high:   { text: '#f05252', bg: '#f0525210', border: '#f0525233' },
};

const cap = (s) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

function relTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function SupportTickets() {
  usePageTitle('Support Tickets');
  const { getToken } = useAuth();
  const toast = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch('/support', { token: getToken() });
        setTickets(data);
      } catch (err) {
        console.error('Failed to load tickets:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await apiFetch(`/support/${ticketId}/status`, {
        token: getToken(),
        method: 'PATCH',
        body: { status: newStatus },
      });
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      toast.success(`Ticket #${ticketId} updated to ${cap(newStatus)}`);
    } catch (err) {
      toast.error('Failed to update ticket: ' + err.message);
    }
  };

  const filtered = useMemo(() => {
    return tickets.filter(t => {
      const matchStatus = statusFilter === 'All' || t.status === statusFilter;
      const matchPriority = priorityFilter === 'All' || t.priority === priorityFilter;
      const userName = t.profiles?.full_name || t.profiles?.email || '';
      const matchSearch = t.subject.toLowerCase().includes(search.toLowerCase())
        || userName.toLowerCase().includes(search.toLowerCase())
        || String(t.id).includes(search);
      return matchStatus && matchPriority && matchSearch;
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
  const highPriorityCount = tickets.filter(t => t.priority === 'high' && t.status !== 'closed' && t.status !== 'resolved').length;

  return (
    <div className="admin-page">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-topbar">
          <div>
            <h1 className="admin-page-title">Support Tickets</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              {filtered.length} of {tickets.length} tickets
            </p>
          </div>
        </div>

        <div className="admin-body">
          {/* Summary */}
          <div className="tkt-summary-row">
            <div className="tkt-summary-card card card-padded">
              <span className="tkt-summary-label">Open</span>
              <strong className="tkt-summary-val" style={{ color: '#f59e0b' }}>{openCount}</strong>
            </div>
            <div className="tkt-summary-card card card-padded">
              <span className="tkt-summary-label">In Progress</span>
              <strong className="tkt-summary-val" style={{ color: '#2e94d1' }}>{inProgressCount}</strong>
            </div>
            <div className="tkt-summary-card card card-padded">
              <span className="tkt-summary-label">Resolved / Closed</span>
              <strong className="tkt-summary-val" style={{ color: 'var(--color-green-primary)' }}>{resolvedCount}</strong>
            </div>
            <div className="tkt-summary-card card card-padded">
              <span className="tkt-summary-label">High Priority</span>
              <strong className="tkt-summary-val" style={{ color: highPriorityCount > 0 ? '#f05252' : 'var(--color-text-primary)' }}>
                {highPriorityCount > 0 && <AlertTriangle size={18} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />}
                {highPriorityCount}
              </strong>
            </div>
          </div>

          {/* Toolbar */}
          <div className="tkt-toolbar card card-padded">
            <div className="tkt-search-wrap">
              <Search size={16} color="var(--color-text-muted)" />
              <input
                className="tkt-search"
                placeholder="Search by subject, user, or ticket ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Status:</span>
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
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Priority:</span>
              {priorityOptions.map(p => (
                <button
                  key={p}
                  className={`inv-cat-pill ${priorityFilter === p ? 'active' : ''}`}
                  onClick={() => setPriorityFilter(p)}
                >
                  {p === 'All' ? 'All' : cap(p)}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="tkt-table card" style={{ marginTop: 20 }}>
            <div className="tkt-table-header">
              <span>Ticket</span>
              <span>User</span>
              <span>Priority</span>
              <span>Status</span>
              <span>Created</span>
              <span>Actions</span>
            </div>

            {loading && (
              <div className="tkt-empty"><p>Loading tickets…</p></div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="tkt-empty">
                <span style={{ fontSize: '2.5rem' }}>🎫</span>
                <p>No tickets match your filters.</p>
              </div>
            )}

            {filtered.map(ticket => {
              const sc = statusColors[ticket.status] || statusColors.open;
              const pc = priorityColors[ticket.priority] || priorityColors.medium;
              const isExpanded = expandedId === ticket.id;
              return (
                <div key={ticket.id}>
                  <div
                    className={`tkt-table-row ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.9375rem' }}>#{ticket.id}</strong>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>{ticket.subject}</p>
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.875rem' }}>{ticket.profiles?.full_name || '—'}</strong>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>{ticket.profiles?.email || ''}</p>
                    </div>
                    <span className="tkt-priority-badge" style={{ color: pc.text, borderColor: pc.border, background: pc.bg }}>
                      {cap(ticket.priority)}
                    </span>
                    <span className="tkt-status-badge" style={{ color: sc.text, borderColor: sc.border, background: sc.bg }}>
                      <sc.Icon size={12} />
                      {cap(ticket.status)}
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{relTime(ticket.created_at)}</span>
                    <select
                      className="tkt-status-select"
                      value={ticket.status}
                      onChange={(e) => { e.stopPropagation(); handleStatusChange(ticket.id, e.target.value); }}
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: sc.text, borderColor: sc.border, background: sc.bg }}
                    >
                      {['open', 'in_progress', 'resolved', 'closed'].map(s => (
                        <option key={s} value={s}>{cap(s)}</option>
                      ))}
                    </select>
                  </div>
                  {isExpanded && (
                    <div className="tkt-expanded-body">
                      <p className="tkt-description">{ticket.description}</p>
                      <div className="tkt-meta">
                        <span>Created: {new Date(ticket.created_at).toLocaleString()}</span>
                        {ticket.updated_at && <span>Updated: {new Date(ticket.updated_at).toLocaleString()}</span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
