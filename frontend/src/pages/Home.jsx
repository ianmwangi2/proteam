import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Camera, Flame, Fingerprint, Wifi, ChevronRight, Zap, Headphones, Wrench, Lock, ScanLine, ParkingSquare, Star, Quote } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import usePageTitle from '../hooks/usePageTitle';
import './Home.css';

const stats = [
  { value: 200, suffix: '+', label: 'Projects Completed' },
  { value: 25,  suffix: '+', label: 'Clients Served' },
  { value: 10,  suffix: '+', label: 'Years Experience' },
  { value: 24,  suffix: '/7', label: 'Technical Support' },
];

const whyUs = [
  { icon: Shield,      title: 'Enterprise Grade',    desc: 'Military-spec hardware deployed in banks, airports, and corporate facilities across Kenya.' },
  { icon: Zap,         title: 'Rapid Deployment',    desc: 'Our certified engineers deploy and commission systems within 24-48 hours of order confirmation.' },
  { icon: Headphones,  title: '24/7 Support',        desc: 'Round-the-clock technical assistance for all installed systems, including remote diagnostics.' },
  { icon: Wrench,      title: 'Skilled Engineers',   desc: 'A team of 8 experienced engineers trained on Hikvision, Dahua, Bosch, and Axis systems.' },
];

const serviceHighlights = [
  { id: 1, name: 'CCTV Surveillance',       icon: Camera,        color: '#34c76e', desc: '4K cameras, NVRs & remote monitoring for 24/7 protection', href: 'cctv' },
  { id: 2, name: 'Access Control',          icon: Fingerprint,   color: '#2e94d1', desc: 'Biometric, card & PIN systems for secure entry management', href: 'access-control' },
  { id: 3, name: 'Fire Alarm Systems',      icon: Flame,         color: '#f97316', desc: 'Early detection, suppression & compliance-ready installations', href: 'fire-alarm' },
  { id: 4, name: 'Intruder Alarms',         icon: Shield,        color: '#f05252', desc: 'PIR detectors, GSM dialers & central monitoring integration', href: 'intruder-alarm' },
  { id: 5, name: 'Electric Fencing',        icon: Zap,           color: '#f59e0b', desc: 'High-tensile perimeter fencing with monitored energizers', href: 'electric-fence' },
  { id: 6, name: 'Security Screening',      icon: ScanLine,      color: '#8b5cf6', desc: 'Walk-through detectors, X-ray scanners & explosive detection', href: 'security-screening' },
  { id: 7, name: 'Automated Gates',         icon: Lock,          color: '#06b6d4', desc: 'Electric gates, bollards & vehicle barriers for entry control', href: 'automated-gates' },
  { id: 8, name: 'Networking & Cabling',    icon: Wifi,          color: '#a855f7', desc: 'Structured cabling, fiber optics, PoE switches & PABX systems', href: 'networking' },
  { id: 9, name: 'Parking Management',      icon: ParkingSquare, color: '#0ea5e9', desc: 'LPR cameras, barriers & occupancy guidance systems', href: 'parking' },
];

const clients = [
  'Bomas of Kenya', 'NSSF', 'Neema Hospital', 'IEBC',
  'iHub', 'Kenya Golf Union', 'National Bank', 'Bomas of Kenya',
  'NSSF', 'Neema Hospital', 'IEBC', 'iHub',
];

const testimonials = [
  {
    name: 'James Mutua',
    role: 'Head of Security, National Bank',
    quote: 'Pro.Team installed our full CCTV and access control system across 3 branches. Professional, fast, and the support has been excellent ever since.',
    rating: 5,
    avatar: 'JM',
  },
  {
    name: 'Grace Wanjiku',
    role: 'Facilities Manager, Neema Hospital',
    quote: 'We needed a compliant fire alarm system urgently. Pro.Team delivered and commissioned within 4 days. Highly recommend their fire safety team.',
    rating: 5,
    avatar: 'GW',
  },
  {
    name: 'David Ochieng',
    role: 'IT Director, iHub',
    quote: 'The structured cabling and networking they did for our new floor is immaculate. Zero downtime since installation, and the team was very knowledgeable.',
    rating: 5,
    avatar: 'DO',
  },
];

// Count-up hook
function useCountUp(target, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function StatItem({ value, suffix, label }) {
  const ref = useRef(null);
  const [started, setStarted] = useState(false);
  const count = useCountUp(value, 1600, started);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="hero-stat">
      <strong className="hero-stat-value">{count}{suffix}</strong>
      <span className="hero-stat-label">{label}</span>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  usePageTitle('Home');

  return (
    <div className="page-wrapper">
      <Navbar />

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-bg-grid" />
        <div className="hero-glow" />
        <div className="hero-glow-blue" />
        <div className="container hero-content">
          <div className="hero-left">
            {/* Pill badge — already had CSS, now used */}
            <div className="hero-pill animate-fadeInUp">
              <span className="hero-pill-dot" />
              Trusted by 25+ Kenyan Enterprises
            </div>

            <h1 className="hero-title animate-fadeInUp stagger-1">
              Secure Your World <br />
              <span className="hero-accent">Today</span>
            </h1>
            <p className="hero-subtitle animate-fadeInUp stagger-2">
              Advanced security solutions — CCTV, access control, fire alarms and biometric systems — designed for homes and enterprises across East Africa.
            </p>
            <div className="hero-ctas animate-fadeInUp stagger-3">
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/services')} id="hero-explore-btn">
                Explore Our Services <ArrowRight size={18} />
              </button>
              <button className="btn btn-ghost btn-lg" onClick={() => navigate('/contact')} id="hero-contact-btn">
                Talk to an Expert
              </button>
            </div>
            <div className="hero-stats animate-fadeInUp stagger-4">
              {stats.map((s) => (
                <StatItem key={s.label} value={s.value} suffix={s.suffix} label={s.label} />
              ))}
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-visual">
              <div className="hero-photo-wrap animate-fadeInUp stagger-2">
                <img
                  src="/hero_bg.png"
                  alt="Pro.Team engineer installing a CCTV surveillance camera"
                  className="hero-photo-img"
                />
                <div className="hero-photo-overlay" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CLIENTS MARQUEE ── */}
      <section className="clients-strip">
        <div className="container clients-strip-inner">
          <p className="text-label clients-strip-label">Trusted by Kenya's leading organisations</p>
          <div className="clients-marquee-wrap">
            <div className="clients-marquee">
              {[...clients, ...clients].map((name, i) => (
                <span key={i} className="client-chip">{name}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES SHOWCASE ── */}
      <section className="section" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="container">
          <div className="section-header">
            <div>
              <p className="text-label" style={{ marginBottom: 6, color: 'var(--brand-green-bright)' }}>What We Offer</p>
              <h2 className="section-title">Our Services</h2>
            </div>
            <button className="btn btn-ghost" onClick={() => navigate('/services')} id="home-view-all-services">
              View All Services <ArrowRight size={16} />
            </button>
          </div>
          <div className="categories-grid home-services-grid">
            {serviceHighlights.map((svc) => (
              <button
                key={svc.id}
                className="category-card card"
                onClick={() => navigate(`/services/${svc.href}`)}
                id={`home-svc-${svc.id}`}
              >
                <div className="cat-icon-wrap" style={{ background: `${svc.color}12`, border: `1px solid ${svc.color}25` }}>
                  <svc.icon size={28} color={svc.color} />
                </div>
                <h3 className="cat-name">{svc.name}</h3>
                <p className="cat-desc">{svc.desc}</p>
                <div className="cat-footer">
                  <span style={{ color: svc.color, fontSize: '0.78rem', fontWeight: 600 }}>Learn More</span>
                  <ChevronRight size={16} color={svc.color} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section className="section why-section">
        <div className="container">
          <div className="why-us-wrap">
            <div className="why-us-left">
              <p className="text-label" style={{ color: 'var(--brand-green-bright)', marginBottom: 10 }}>Why Proteam</p>
              <h2 className="why-us-title">Built for Security Professionals</h2>
              <p className="why-us-desc">
                We partner with leading manufacturers including Hikvision, Dahua, Bosch, and Axis to deliver enterprise-grade security infrastructure across East Africa.
              </p>
              <div className="why-us-badges">
                <span className="why-badge">✓ ISO-aligned Installations</span>
                <span className="why-badge">✓ Licensed Engineers</span>
                <span className="why-badge">✓ 1-Year Warranty</span>
              </div>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/about')} id="why-learn-more">
                Learn More About Us <ArrowRight size={18} />
              </button>
            </div>
            <div className="why-us-grid">
              {whyUs.map((item) => (
                <div key={item.title} className="why-card card card-padded">
                  <div className="why-icon">
                    <item.icon size={24} color="#34c76e" />
                  </div>
                  <h4 className="why-title">{item.title}</h4>
                  <p className="why-desc">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="section testimonials-section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-3xl)' }}>
            <p className="text-label" style={{ color: 'var(--brand-green-bright)', marginBottom: 8 }}>Client Feedback</p>
            <h2 className="section-title">What Our Clients Say</h2>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: 520, margin: '12px auto 0', lineHeight: 1.7 }}>
              Trusted by organisations across Kenya for reliable, professional security solutions.
            </p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((t) => (
              <div key={t.name} className="testimonial-card card card-padded">
                <div className="testimonial-stars">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={15} fill="#f59e0b" color="#f59e0b" />
                  ))}
                </div>
                <Quote size={20} className="testimonial-quote-icon" />
                <p className="testimonial-text">"{t.quote}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.avatar}</div>
                  <div>
                    <p className="testimonial-name">{t.name}</p>
                    <p className="testimonial-role">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="cta-section">
        <div className="cta-bg-pattern" />
        <div className="container cta-inner">
          <div>
            <h2 className="cta-title">Ready to Secure Your Business?</h2>
            <p className="cta-desc">Get a free site survey and tailored security proposal from our certified engineers — at no cost to you.</p>
          </div>
          <div className="cta-actions">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/contact')} id="cta-survey-btn">
              Book a Free Survey
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => navigate('/services')} id="cta-services-btn">
              View Our Services
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
