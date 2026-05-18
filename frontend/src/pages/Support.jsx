import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, Clock, BookOpen, MessageCircle, Ticket, Plus, X, Send } from 'lucide-react';
import { apiFetch } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import usePageTitle from '../hooks/usePageTitle';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Support.css';

const faqs = [
  { q: 'How long does installation take?', a: 'Standard residential installations take 1 day. Small business setups typically take 1-2 days. Large enterprise or multi-site projects may take up to 2 weeks depending on scope.' },
  { q: 'What warranty do your products carry?', a: 'All products come with a minimum 1-year manufacturer warranty. We also offer 2-year extended warranties on select Hikvision, Dahua, and Bosch equipment.' },
  { q: 'Do you offer 24/7 monitoring?', a: 'Yes — we partner with certified monitoring centres for round-the-clock surveillance support. Monitoring packages can be added to any CCTV or alarm installation.' },
  { q: 'Do you cover areas outside Nairobi?', a: 'Yes. We service all major towns in Kenya including Mombasa, Kisumu, Nakuru, and Eldoret. We also serve Uganda and Tanzania for enterprise clients. Contact us for project-specific travel rates.' },
  { q: 'What brands do you install?', a: 'We are certified installers for Hikvision, Dahua, Bosch, Axis, ZKTeco, DSC, and Pyronix. We also work with several regional manufacturers depending on project requirements.' },
  { q: 'What maintenance plans do you offer?', a: 'We offer quarterly, bi-annual, and annual maintenance contracts. Each plan includes scheduled site visits, equipment health checks, firmware updates, and priority support response.' },
  { q: 'Can I integrate with my existing alarm system?', a: 'In most cases, yes. Our engineers will assess your current setup during the site survey and advise on integration options. We can connect most modern IP-based systems to a unified management platform.' },
  { q: 'How do I request a site survey?', a: 'Fill in the Contact form with your location and a brief description of your requirements. We will schedule a free survey within 48 hours during business days.' },
];

const STATUS_BADGE = {
  open: 'badge-green',
  in_progress: 'badge-blue',
  resolved: 'badge-gray',
  closed: 'badge-gray',
};

function TicketModal({ onClose, onCreated }) {
  const { getToken } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ subject: '', description: '', priority: 'medium' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) return;
    setSubmitting(true);
    try {
      const token = getToken();
      const ticket = await apiFetch('/support', { token, method: 'POST', body: form });
      toast.success('Ticket submitted successfully!');
      onCreated(ticket);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Submit a Support Ticket</h3>
          <button className="toast-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="ticket-form">
          <label>
            <span className="text-label">Subject</span>
            <input
              className="input"
              placeholder="Brief description of the issue"
              value={form.subject}
              onChange={e => setForm({ ...form, subject: e.target.value })}
              required
              maxLength={200}
            />
          </label>
          <label>
            <span className="text-label">Priority</span>
            <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label>
            <span className="text-label">Description</span>
            <textarea
              className="input"
              rows={5}
              placeholder="Describe the issue in detail..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              required
              maxLength={2000}
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%' }}>
            <Send size={16} /> {submitting ? 'Submitting…' : 'Submit Ticket'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Support() {
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const { user, getToken } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  usePageTitle('Support');

  useEffect(() => {
    if (!user) return;
    const loadTickets = async () => {
      setLoadingTickets(true);
      try {
        const token = getToken();
        const data = await apiFetch('/support/mine', { token });
        setTickets(data);
      } catch {
        // user may not have tickets yet
      } finally {
        setLoadingTickets(false);
      }
    };
    loadTickets();
  }, [user]);

  const handleNewTicket = () => {
    if (!user) {
      toast.info('Please sign in to submit a ticket');
      navigate('/account');
      return;
    }
    setShowModal(true);
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 3600000) return `${Math.max(1, Math.round(diff / 60000))} min ago`;
    if (diff < 86400000) return `${Math.round(diff / 3600000)} hours ago`;
    if (diff < 604800000) return `${Math.round(diff / 86400000)} days ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <div className="support-hero">
        <div className="container">
          <p className="text-label" style={{ color: 'var(--color-green-primary)', marginBottom: 8 }}>Help Center</p>
          <h1>Support Portal</h1>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: 480, margin: '8px 0 24px' }}>Find answers, browse documentation, or create a support ticket.</p>
          <div className="support-search-bar">
            <Search size={20} color="#6b7280" />
            <input className="support-search-input" placeholder="Search for solutions, guides, documentation..." value={search} onChange={e => setSearch(e.target.value)} id="support-search" />
          </div>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="support-layout">
            <div className="support-main">
              {/* Help Cards */}
              <div className="support-options">
                {[
                  { icon: Ticket, title: 'Submit a Ticket', desc: 'Create a new support request for technical issues', action: 'New Ticket', onClick: handleNewTicket },
                  { icon: BookOpen, title: 'Knowledge Base', desc: 'Browse our extensive library of guides and manuals', action: 'Browse Docs', onClick: () => setOpenFaq(0) },
                  { icon: MessageCircle, title: 'Live Chat', desc: 'Chat with a certified technician right now', action: 'Start Chat', onClick: handleNewTicket },
                ].map(opt => (
                  <div key={opt.title} className="support-option-card card card-padded">
                    <opt.icon size={28} color="#34c76e" />
                    <h4 style={{ margin: '12px 0 4px' }}>{opt.title}</h4>
                    <p style={{ fontSize: '0.875rem', margin: '0 0 16px' }}>{opt.desc}</p>
                    <button className="btn btn-primary btn-sm" onClick={opt.onClick}>{opt.action}</button>
                  </div>
                ))}
              </div>

              {/* FAQ */}
              <h2 style={{ margin: '48px 0 20px' }}>Frequently Asked Questions</h2>
              <div className="faq-list">
                {faqs.map((faq, i) => (
                  <div key={i} className="faq-item card">
                    <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)} id={`faq-${i}`}>
                      <span>{faq.q}</span>
                      <ChevronRight size={18} style={{ transform: openFaq === i ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                    {openFaq === i && <p className="faq-answer">{faq.a}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar: Real tickets */}
            <aside className="support-sidebar">
              <div className="tickets-panel card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
                  <h4>My Tickets</h4>
                  <button className="btn btn-primary btn-sm" onClick={handleNewTicket} id="new-ticket-btn"><Plus size={14} /> New</button>
                </div>
                {!user && (
                  <p style={{ padding: '24px 20px', fontSize: '0.875rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>Sign in to view your tickets</p>
                )}
                {user && loadingTickets && (
                  <p style={{ padding: '24px 20px', fontSize: '0.875rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>Loading…</p>
                )}
                {user && !loadingTickets && tickets.length === 0 && (
                  <p style={{ padding: '24px 20px', fontSize: '0.875rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>No tickets yet</p>
                )}
                {tickets.map((t, i) => (
                  <div key={t.id}>
                    <div className="ticket-row" id={`ticket-${t.id}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>#{t.id}</span>
                        <span className={`badge ${STATUS_BADGE[t.status] || 'badge-gray'}`}>{t.status.replace('_', ' ').toUpperCase()}</span>
                      </div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0 0 6px', lineHeight: 1.3 }}>{t.subject}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        <Clock size={11} /> {formatDate(t.created_at)}
                      </div>
                    </div>
                    {i < tickets.length - 1 && <div className="divider" style={{ margin: '0 20px' }} />}
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {showModal && <TicketModal onClose={() => setShowModal(false)} onCreated={(t) => setTickets(prev => [t, ...prev])} />}

      <Footer />
    </div>
  );
}
