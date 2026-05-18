import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Layers, Clock, FileText, DollarSign } from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiFetch } from '../../config/api';
import usePageTitle from '../../hooks/usePageTitle';
import '../AdminDash.css';
import './OrderDetail.css';

const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';

const statusColors = {
  pending:  { bg: '#f59e0b10', border: '#f59e0b33', text: '#f59e0b' },
  quoted:   { bg: '#2e94d110', border: '#2e94d133', text: '#2e94d1' },
  accepted: { bg: '#34c76e10', border: '#34c76e33', text: '#34c76e' },
  declined: { bg: '#f0525210', border: '#f0525233', text: '#f05252' },
  expired:  { bg: '#6b728010', border: '#6b728033', text: '#6b7280' },
};

export default function QuotationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const toast = useToast();
  usePageTitle(`Quotation #${id}`);

  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Admin editable fields
  const [adminNotes, setAdminNotes] = useState('');
  const [quotedAmount, setQuotedAmount] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('pending');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch(`/quotations/${id}`, { token: getToken() });
        setQuotation(data);
        setAdminNotes(data.admin_notes || '');
        setQuotedAmount(data.quoted_amount != null ? String(data.quoted_amount) : '');
        setValidUntil(data.valid_until ? data.valid_until.slice(0, 10) : '');
        setSelectedStatus(data.status || 'pending');
      } catch (err) {
        toast.error('Failed to load quotation');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        status: selectedStatus,
        admin_notes: adminNotes || null,
        quoted_amount: quotedAmount !== '' ? Number(quotedAmount) : null,
        valid_until: validUntil || null,
      };
      const updated = await apiFetch(`/quotations/${id}`, {
        token: getToken(),
        method: 'PATCH',
        body,
      });
      setQuotation(prev => ({ ...prev, ...updated }));
      toast.success(`Quotation #${id} updated`);
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--color-text-muted)' }}>
            Loading quotation…
          </div>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="admin-page">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-body" style={{ textAlign: 'center', padding: '80px 20px' }}>
            <p style={{ fontSize: '1.25rem', color: 'var(--color-text-muted)' }}>Quotation not found</p>
            <button className="btn btn-ghost" onClick={() => navigate('/admin/quotations')} style={{ marginTop: 16 }}>
              <ArrowLeft size={16} /> Back to Quotations
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sc = statusColors[quotation.status] || statusColors.pending;

  return (
    <div className="admin-page">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/quotations')}>
              <ArrowLeft size={16} /> Back
            </button>
            <div>
              <h1 className="admin-page-title" style={{ margin: 0 }}>Quotation #{quotation.id}</h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                Submitted {new Date(quotation.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ padding: '4px 12px', borderRadius: 8, fontWeight: 700, fontSize: '0.8125rem', color: sc.text, background: sc.bg, border: `1px solid ${sc.border}` }}>
              {cap(quotation.status)}
            </span>
          </div>
        </div>

        <div className="admin-body">
          <div className="od-grid">
            {/* Client Info */}
            <div className="card card-padded od-section">
              <h3 className="od-section-title"><User size={16} /> Client</h3>
              <div className="od-info-row">
                <span className="od-info-label">Name</span>
                <span>{quotation.profile?.full_name || '—'}</span>
              </div>
              <div className="od-info-row">
                <span className="od-info-label">Email</span>
                <span>{quotation.profile?.email || '—'}</span>
              </div>
              <div className="od-info-row">
                <span className="od-info-label">Phone</span>
                <span>{quotation.profile?.phone || '—'}</span>
              </div>
              <div className="od-info-row">
                <span className="od-info-label">Address</span>
                <span>{quotation.profile?.address || '—'}</span>
              </div>
            </div>

            {/* Service & Request */}
            <div className="card card-padded od-section">
              <h3 className="od-section-title"><Layers size={16} /> Service Requested</h3>
              <div className="od-info-row">
                <span className="od-info-label">Service</span>
                <span>{quotation.services?.name || <em style={{ color: 'var(--color-text-muted)' }}>General inquiry</em>}</span>
              </div>
              <div className="od-info-row">
                <span className="od-info-label">Budget Range</span>
                <span>{quotation.budget_range || '—'}</span>
              </div>
            </div>

            {/* Timeline */}
            <div className="card card-padded od-section">
              <h3 className="od-section-title"><Clock size={16} /> Timeline</h3>
              <div className="od-info-row">
                <span className="od-info-label">Submitted</span>
                <span>{new Date(quotation.created_at).toLocaleDateString()}</span>
              </div>
              {quotation.accepted_at && (
                <div className="od-info-row">
                  <span className="od-info-label">Accepted</span>
                  <span>{new Date(quotation.accepted_at).toLocaleDateString()}</span>
                </div>
              )}
              {quotation.declined_at && (
                <div className="od-info-row">
                  <span className="od-info-label">Declined</span>
                  <span>{new Date(quotation.declined_at).toLocaleDateString()}</span>
                </div>
              )}
              {quotation.valid_until && (
                <div className="od-info-row">
                  <span className="od-info-label">Valid Until</span>
                  <span>{new Date(quotation.valid_until).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Quoted Amount */}
            <div className="card card-padded od-section">
              <h3 className="od-section-title"><DollarSign size={16} /> Quoted Amount</h3>
              <div className="od-info-row od-total-row">
                <strong>Amount</strong>
                <strong style={{ color: 'var(--color-green-primary)', fontSize: '1.125rem' }}>
                  {quotation.quoted_amount != null
                    ? `KSh ${Number(quotation.quoted_amount).toLocaleString()}`
                    : <em style={{ color: 'var(--color-text-muted)', fontWeight: 400, fontSize: '1rem' }}>Not set</em>}
                </strong>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="card card-padded" style={{ marginTop: 20 }}>
            <h3 className="od-section-title"><FileText size={16} /> Client Description</h3>
            <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
              {quotation.description || 'No description provided.'}
            </p>
          </div>

          {/* Admin Response Panel */}
          <div className="card card-padded" style={{ marginTop: 20 }}>
            <h3 className="od-section-title" style={{ marginBottom: 20 }}>Admin Response</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Status</label>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.9rem' }}
                  id="quot-status-select"
                >
                  {['pending', 'quoted', 'accepted', 'declined', 'expired'].map(s => (
                    <option key={s} value={s}>{cap(s)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Quoted Amount (KSh)</label>
                <input
                  type="number"
                  min="0"
                  value={quotedAmount}
                  onChange={e => setQuotedAmount(e.target.value)}
                  placeholder="e.g. 150000"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  id="quot-amount-input"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Valid Until</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={e => setValidUntil(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  id="quot-valid-until"
                />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Admin Notes (visible only to admins)</label>
              <textarea
                rows={4}
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                placeholder="Add internal notes about this quotation…"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }}
                id="quot-admin-notes"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
                id="quot-save-btn"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
