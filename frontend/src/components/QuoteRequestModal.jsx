import { useState } from 'react';
import { X, MessageSquare, LogIn, CheckCircle, ChevronDown, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../config/api';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { services } from '../data/services';
import './QuoteRequestModal.css';

const BUDGET_RANGES = [
  'Under KSh 50,000',
  'KSh 50,000 – 150,000',
  'KSh 150,000 – 500,000',
  'KSh 500,000 – 1,000,000',
  'Over KSh 1,000,000',
  'Flexible / To be discussed',
];

/**
 * QuoteRequestModal
 *
 * Props:
 *   onClose()         – called when modal should close
 *   prefilledService  – optional service object { id, title, slug }
 *                       When provided the service selector is pre-selected.
 */
export default function QuoteRequestModal({ onClose, prefilledService = null }) {
  const { user, getToken } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [serviceSlug, setServiceSlug] = useState(prefilledService?.id || '');
  const [description, setDescription] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Resolve numeric service_id from slug via services data
  const resolveServiceId = (slug) => {
    // The DB services table is seeded with slugs matching data/services.js id fields.
    // We pass the slug to the backend; the backend stores service_id via a join.
    // However, our backend expects a numeric service_id. We'll pass null for now
    // and include the service name in the description instead, since the frontend
    // doesn't have the DB numeric IDs. The admin sees the service name in the description.
    // If service_ids are known, update this map.
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    setSubmitting(true);
    try {
      const selectedService = services.find(s => s.id === serviceSlug);
      const descriptionWithService = selectedService
        ? `[Service: ${selectedService.title}]\n\n${description.trim()}`
        : description.trim();

      await apiFetch('/quotations', {
        token: getToken(),
        method: 'POST',
        body: {
          service_id: null, // populated by backend once DB service rows exist
          description: descriptionWithService,
          budget_range: budgetRange || null,
        },
      });

      setSuccess(true);
      toast.success('Quote request submitted! We\'ll be in touch within 24 hours.');
    } catch (err) {
      toast.error(err.message || 'Failed to submit quote request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) onClose();
  };

  return (
    <div className="qrm-overlay" onClick={handleClose} role="dialog" aria-modal="true" aria-label="Request a Quote">
      <div className="qrm-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="qrm-header">
          <div className="qrm-header-left">
            <div className="qrm-icon-wrap">
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className="qrm-title">Request a Quote</h2>
              <p className="qrm-subtitle">We respond within 24 hours on business days</p>
            </div>
          </div>
          <button className="qrm-close btn-icon" onClick={handleClose} aria-label="Close" disabled={submitting}>
            <X size={18} />
          </button>
        </div>

        {/* Auth gate */}
        {!user ? (
          <div className="qrm-auth-gate">
            <div className="qrm-auth-icon">
              <Shield size={40} color="var(--brand-green-bright)" />
            </div>
            <h3 className="qrm-auth-title">Sign in to request a quote</h3>
            <p className="qrm-auth-desc">
              Create a free account to submit a quote request and track its status from your dashboard.
            </p>
            <div className="qrm-auth-actions">
              <button
                className="btn btn-primary qrm-btn"
                onClick={() => { onClose(); navigate('/account'); }}
                id="qrm-signin-btn"
              >
                <LogIn size={16} /> Sign In / Create Account
              </button>
              <button className="btn btn-ghost qrm-btn" onClick={handleClose}>
                Maybe later
              </button>
            </div>
          </div>
        ) : success ? (
          /* Success state */
          <div className="qrm-success">
            <div className="qrm-success-icon">
              <CheckCircle size={52} color="var(--brand-green-bright)" />
            </div>
            <h3 className="qrm-success-title">Quote Request Submitted!</h3>
            <p className="qrm-success-desc">
              Our team will review your request and respond within 24 hours.
              You can track the status in your <strong>Account → My Quotations</strong>.
            </p>
            <div className="qrm-success-actions">
              <button
                className="btn btn-primary qrm-btn"
                onClick={() => { onClose(); navigate('/account'); }}
                id="qrm-view-quotations-btn"
              >
                View My Quotations
              </button>
              <button className="btn btn-ghost qrm-btn" onClick={handleClose}>
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Form */
          <form className="qrm-form" onSubmit={handleSubmit} noValidate>
            {/* Service selector */}
            <div className="qrm-field">
              <label className="qrm-label" htmlFor="qrm-service">
                Service <span className="qrm-req">*</span>
              </label>
              <div className="qrm-select-wrap">
                <select
                  id="qrm-service"
                  className="qrm-select"
                  value={serviceSlug}
                  onChange={e => setServiceSlug(e.target.value)}
                  required
                >
                  <option value="">Select a service…</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                  <option value="general">General Inquiry</option>
                </select>
                <ChevronDown size={16} className="qrm-select-icon" />
              </div>
            </div>

            {/* Budget */}
            <div className="qrm-field">
              <label className="qrm-label" htmlFor="qrm-budget">
                Estimated Budget
              </label>
              <div className="qrm-select-wrap">
                <select
                  id="qrm-budget"
                  className="qrm-select"
                  value={budgetRange}
                  onChange={e => setBudgetRange(e.target.value)}
                >
                  <option value="">Select a range…</option>
                  {BUDGET_RANGES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="qrm-select-icon" />
              </div>
            </div>

            {/* Description */}
            <div className="qrm-field">
              <label className="qrm-label" htmlFor="qrm-description">
                Project Description <span className="qrm-req">*</span>
              </label>
              <textarea
                id="qrm-description"
                className="qrm-textarea"
                rows={5}
                placeholder="Tell us about your project: location, size, specific requirements, timeline, or any questions you have…"
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
              <span className="qrm-char-count">{description.length} / 1000</span>
            </div>

            {/* Pre-filled service notice */}
            {prefilledService && (
              <div className="qrm-prefill-notice">
                <Shield size={14} color="var(--brand-green-bright)" />
                Quoting for: <strong>{prefilledService.title}</strong>
              </div>
            )}

            <div className="qrm-actions">
              <button
                type="submit"
                className="btn btn-primary qrm-btn"
                disabled={submitting || !description.trim() || !serviceSlug}
                id="qrm-submit-btn"
              >
                {submitting ? (
                  <span className="qrm-spinner" />
                ) : (
                  <MessageSquare size={16} />
                )}
                {submitting ? 'Submitting…' : 'Submit Quote Request'}
              </button>
              <button
                type="button"
                className="btn btn-ghost qrm-btn"
                onClick={handleClose}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
