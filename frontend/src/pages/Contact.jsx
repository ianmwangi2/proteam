import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, ExternalLink } from 'lucide-react';
import { apiFetch } from '../config/api';
import { useToast } from '../context/ToastContext';
import usePageTitle from '../hooks/usePageTitle';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Contact.css';

const contactCards = [
  {
    id: 'phone',
    icon: Phone,
    label: 'PHONE',
    value: '+254 725 300 350',
    sub: 'Mon – Fri, 8am – 6pm EAT',
    color: 'var(--brand-green-bright)',
  },
  {
    id: 'email',
    icon: Mail,
    label: 'EMAIL',
    value: 'proteamtechnologies122@gmail.com',
    sub: 'We respond within 4 hours',
    color: 'var(--brand-blue-mid)',
  },
  {
    id: 'office',
    icon: MapPin,
    label: 'OFFICE',
    value: 'Westlands, Nairobi',
    sub: 'Kenya — walk-ins by appointment',
    color: 'var(--brand-green-bright)',
  },
  {
    id: 'hours',
    icon: Clock,
    label: 'HOURS',
    value: 'Mon – Sat: 8am – 6pm',
    sub: 'Sunday: Closed',
    color: 'var(--brand-blue-mid)',
  },
];

const quickHelp = [
  {
    title: 'Need a service consultation?',
    desc: "Call us directly — we can assess your security needs and arrange a site survey at your convenience.",
  },
  {
    title: 'Requesting a site survey?',
    desc: "Fill the form with your location and a brief description. We'll schedule within 48 hours.",
  },
  {
    title: 'After-sales / warranty issue?',
    desc: "Email with your project reference and we'll connect you with our technical team the same day.",
  },
];

const SUBJECTS = [
  'CCTV Surveillance System',
  'Access Control System',
  'Electric Fencing',
  'Intruder Alarm System',
  'Fire Alarm & Safety',
  'Security Screening',
  'Automated Gates & Bollards',
  'Time & Attendance System',
  'Networking & Cabling',
  'Car Parking Management',
  'Under Vehicle Scanning',
  'General Enquiry',
  'Other',
];

export default function Contact() {
  usePageTitle('Contact');
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await apiFetch('/contact', { method: 'POST', body: form });
      setSent(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      toast.success("Message sent! We'll be in touch soon.");
    } catch (err) {
      setError(err.message || 'Failed to send message. Please try again.');
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      {/* ── HERO ── */}
      <section className="contact-hero">
        <div className="contact-hero-overlay" />
        <div className="container contact-hero-content">
          <p className="text-label" style={{ color: '#2daa60', marginBottom: 12 }}>GET IN TOUCH</p>
          <h1 className="contact-hero-title">Let's Talk About Your Project</h1>
          <p className="contact-hero-sub">
            Whether you need a quote, technical advice, or just want to know if a service fits your
            setup — we're here and happy to help.
          </p>
        </div>

        {/* Contact cards strip */}
        <div className="contact-cards-strip">
          <div className="container contact-cards-inner">
            {contactCards.map(({ id, icon: Icon, label, value, sub, color }) => (
              <div key={id} className="contact-strip-card" id={`contact-card-${id}`}>
                <div className="contact-strip-icon" style={{ background: `${color === 'var(--brand-blue-mid)' ? 'rgba(46,148,209,0.1)' : 'rgba(29,107,62,0.1)'}`, borderColor: `${color === 'var(--brand-blue-mid)' ? 'rgba(46,148,209,0.2)' : 'rgba(52,199,110,0.2)'}` }}>
                  <Icon size={20} color={color} />
                </div>
                <div>
                  <p className="contact-strip-label" style={{ color }}>{label}</p>
                  <p className="contact-strip-value">{value}</p>
                  <p className="contact-strip-sub">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <section className="section">
        <div className="container contact-body">

          {/* Left: Form */}
          <div className="contact-form-wrap card card-padded">
            {sent ? (
              <div className="contact-sent">
                <CheckCircle size={52} color="#34c76e" />
                <h3>Message Sent!</h3>
                <p>Thank you for reaching out. We'll get back to you within 4 hours on business days.</p>
                <button className="btn btn-primary" onClick={() => setSent(false)}>Send Another Message</button>
              </div>
            ) : (
              <>
                <div className="contact-form-header">
                  <Send size={20} color="#34c76e" />
                  <h2>Send us a message</h2>
                </div>

                {error && (
                  <div className="contact-error">{error}</div>
                )}

                <form className="contact-form" onSubmit={handleSubmit} noValidate>
                  <div className="contact-form-row">
                    <div className="contact-field">
                      <label className="contact-label" htmlFor="contact-name">
                        Full name <span className="req">*</span>
                      </label>
                      <input
                        id="contact-name"
                        className="contact-input"
                        placeholder="Jane Mwangi"
                        value={form.name}
                        onChange={update('name')}
                        required
                      />
                    </div>
                    <div className="contact-field">
                      <label className="contact-label" htmlFor="contact-email">
                        Email address <span className="req">*</span>
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        className="contact-input"
                        placeholder="jane@company.co.ke"
                        value={form.email}
                        onChange={update('email')}
                        required
                      />
                    </div>
                  </div>

                  <div className="contact-form-row">
                    <div className="contact-field">
                      <label className="contact-label" htmlFor="contact-phone">Phone number</label>
                      <input
                        id="contact-phone"
                        className="contact-input"
                        placeholder="+254 7xx xxx xxx"
                        value={form.phone}
                        onChange={update('phone')}
                      />
                    </div>
                    <div className="contact-field">
                      <label className="contact-label" htmlFor="contact-subject">
                        Subject <span className="req">*</span>
                      </label>
                      <select
                        id="contact-subject"
                        className="contact-input contact-select"
                        value={form.subject}
                        onChange={update('subject')}
                        required
                      >
                        <option value="">Select a subject...</option>
                        {SUBJECTS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="contact-field">
                    <label className="contact-label" htmlFor="contact-message">
                      Message <span className="req">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      className="contact-input contact-textarea"
                      rows={6}
                      placeholder="Tell us about your project, what you need, or any questions you have..."
                      value={form.message}
                      onChange={update('message')}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary contact-submit-btn"
                    id="contact-submit"
                    disabled={sending}
                  >
                    <Send size={16} />
                    {sending ? 'Sending…' : 'Send message'}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Right: Quick Help + WhatsApp + Location */}
          <aside className="contact-sidebar">
            <div className="contact-quickhelp card card-padded">
              <h3 className="contact-quickhelp-title">Quick help</h3>
              {quickHelp.map((item) => (
                <div key={item.title} className="contact-quickhelp-item">
                  <p className="contact-quickhelp-q">{item.title}</p>
                  <p className="contact-quickhelp-a">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/254725300350?text=Hello%20Pro.Team%2C%20I%27d%20like%20to%20enquire%20about%20a%20security%20solution"
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-btn card card-padded"
              id="contact-whatsapp-btn"
            >
              <div className="whatsapp-icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div>
                <p className="whatsapp-title">Chat on WhatsApp</p>
                <p className="whatsapp-sub">Fastest response — reply in minutes</p>
              </div>
            </a>

            <div className="contact-location card card-padded">
              <MapPin size={32} color="#34c76e" />
              <p className="contact-location-name">Westlands, Nairobi</p>
              <a
                href="https://maps.google.com/?q=Westlands,Nairobi,Kenya"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline contact-maps-btn"
                id="contact-maps-link"
              >
                Open in Google Maps <ExternalLink size={14} />
              </a>
            </div>
          </aside>

        </div>
      </section>

      <Footer />
    </div>
  );
}
