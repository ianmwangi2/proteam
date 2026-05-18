import { useState, useEffect, useMemo } from 'react';
import { Search, Mail, MailOpen, Eye, Clock } from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiFetch } from '../../config/api';
import usePageTitle from '../../hooks/usePageTitle';
import '../AdminDash.css';
import './Messages.css';

function relTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Messages() {
  usePageTitle('Contact Messages');
  const { getToken } = useAuth();
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [readFilter, setReadFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch('/contact', { token: getToken() });
        setMessages(data);
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const markAsRead = async (id) => {
    try {
      await apiFetch(`/contact/${id}/read`, { token: getToken(), method: 'PATCH' });
      setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
      toast.success('Message marked as read');
    } catch (err) {
      toast.error('Failed to update: ' + err.message);
    }
  };

  const filtered = useMemo(() => {
    return messages.filter(m => {
      const matchRead = readFilter === 'All'
        || (readFilter === 'unread' && !m.read)
        || (readFilter === 'read' && m.read);
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase())
        || m.email.toLowerCase().includes(search.toLowerCase())
        || (m.subject || '').toLowerCase().includes(search.toLowerCase())
        || m.message.toLowerCase().includes(search.toLowerCase());
      return matchRead && matchSearch;
    });
  }, [messages, search, readFilter]);

  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <div className="admin-page">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-topbar">
          <div>
            <h1 className="admin-page-title">Contact Messages</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              {filtered.length} of {messages.length} messages
            </p>
          </div>
        </div>

        <div className="admin-body">
          {/* Summary */}
          <div className="msg-summary-row">
            <div className="msg-summary-card card card-padded">
              <span className="msg-summary-label">Total Messages</span>
              <strong className="msg-summary-val">{messages.length}</strong>
            </div>
            <div className="msg-summary-card card card-padded">
              <span className="msg-summary-label">Unread</span>
              <strong className="msg-summary-val" style={{ color: unreadCount > 0 ? '#f59e0b' : 'var(--color-green-primary)' }}>
                {unreadCount > 0 && <Mail size={18} style={{ marginRight: 6 }} />}
                {unreadCount}
              </strong>
            </div>
            <div className="msg-summary-card card card-padded">
              <span className="msg-summary-label">Read</span>
              <strong className="msg-summary-val" style={{ color: 'var(--color-green-primary)' }}>{messages.length - unreadCount}</strong>
            </div>
          </div>

          {/* Toolbar */}
          <div className="msg-toolbar card card-padded">
            <div className="msg-search-wrap">
              <Search size={16} color="var(--color-text-muted)" />
              <input
                className="msg-search"
                placeholder="Search by name, email, subject, or message…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['All', 'unread', 'read'].map(f => (
                <button
                  key={f}
                  className={`inv-cat-pill ${readFilter === f ? 'active' : ''}`}
                  onClick={() => setReadFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="msg-table card" style={{ marginTop: 20 }}>
            <div className="msg-table-header">
              <span></span>
              <span>From</span>
              <span>Subject</span>
              <span>Received</span>
              <span>Actions</span>
            </div>

            {loading && (
              <div className="msg-empty"><p>Loading messages…</p></div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="msg-empty">
                <span style={{ fontSize: '2.5rem' }}>📬</span>
                <p>No messages match your search.</p>
              </div>
            )}

            {filtered.map(msg => {
              const isExpanded = expandedId === msg.id;
              return (
                <div key={msg.id}>
                  <div
                    className={`msg-table-row ${!msg.read ? 'unread' : ''} ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="msg-read-indicator">
                      {msg.read ? <MailOpen size={16} color="var(--color-text-muted)" /> : <Mail size={16} color="#f59e0b" />}
                    </span>
                    <div>
                      <strong style={{ fontSize: '0.9375rem' }}>{msg.name}</strong>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>{msg.email}</p>
                    </div>
                    <span style={{ fontSize: '0.875rem', color: msg.read ? 'var(--color-text-secondary)' : 'var(--color-text-primary)', fontWeight: msg.read ? 400 : 600 }}>
                      {msg.subject || '(No subject)'}
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                      <Clock size={12} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />
                      {relTime(msg.created_at)}
                    </span>
                    <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                      {!msg.read && (
                        <button className="btn btn-ghost btn-sm" onClick={() => markAsRead(msg.id)}>
                          <Eye size={14} /> Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="msg-expanded-body">
                      {msg.phone && (
                        <p className="msg-phone">Phone: {msg.phone}</p>
                      )}
                      <div className="msg-content">{msg.message}</div>
                      <div className="msg-meta">
                        <span>Received: {new Date(msg.created_at).toLocaleString()}</span>
                        <span>Status: {msg.read ? 'Read' : 'Unread'}</span>
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
