import { useNavigate } from 'react-router-dom';
import { Target, Eye, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import usePageTitle from '../hooks/usePageTitle';
import './About.css';

const team = [
  {
    name: 'Paul Wamae',
    role: 'Founder & CEO',
    bio: 'Over 15 years of experience in physical security and technology integration across East Africa. Previously led security deployments at several multinational firms before founding Proteam Technologies in 2010.',
    avatar: 'PW',
    linkedin: '#',
  },
  {
    name: 'Peter Karuga',
    role: 'Co-Founder & Technical Director',
    bio: 'Certified Hikvision, Dahua, and Bosch systems engineer. Peter leads our technical team and has personally overseen 200+ installations across Kenya, Uganda, and Tanzania.',
    avatar: 'PK',
    linkedin: '#',
  },
];

const values = [
  { title: 'Integrity', desc: 'We operate with full transparency and honesty in every engagement.', icon: '🤝' },
  { title: 'Innovation', desc: 'We continuously adopt cutting-edge technology to stay ahead of threats.', icon: '🚀' },
  { title: 'Excellence', desc: 'Every installation meets the highest standards of quality and precision.', icon: '⭐' },
  { title: 'Partnership', desc: 'We build long-term relationships, not just one-time transactions.', icon: '🤲' },
];

const clients = [
  'Bomas of Kenya',
  'NSSF',
  'Neema Hospital',
  'IEBC',
  'iHub',
  'Kenya Golf Union',
  'National Bank',
];

export default function About() {
  const navigate = useNavigate();
  usePageTitle('About Us');
  return (
    <div className="page-wrapper">
      <Navbar />

      {/* Hero */}
      <div className="about-hero">
        <div className="container about-hero-inner">
          <div>
            <p className="text-label" style={{ color: 'var(--color-green-primary)', marginBottom: 8 }}>Who We Are</p>
            <h1 className="about-hero-title">Our Story</h1>
            <p className="about-hero-since">SINCE 2010 — NAIROBI, KENYA</p>
            <p className="about-hero-desc">Welcome to Proteam Technologies, your reliable partner in innovative IT solutions.</p>
            <p className="about-hero-desc">We are a team of highly skilled and experienced professionals, committed to providing tailored solutions that meet the unique needs of your business. At Proteam Technologies, we understand the importance of technology in driving business growth and success, which is why we offer cutting-edge IT solutions designed to improve productivity, enhance efficiency, and drive innovation.</p>
            <p className="about-hero-desc">Whether you are a small start-up or a large enterprise, we have the expertise and resources to deliver solutions that will help you achieve your business objectives.</p>
          </div>
          <div className="about-hero-stats">
            {[['200+', 'Projects'], ['25+', 'Clients'], ['10+', 'Engineers']].map(([v, l]) => (
              <div key={l} className="about-stat card card-padded">
                <strong className="about-stat-val">{v}</strong>
                <span className="about-stat-label">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission & Vision */}
      <section className="section">
        <div className="container">
          <div className="mv-grid">
            <div className="mv-card card card-padded">
              <Target size={32} color="#34c76e" style={{ marginBottom: 16 }} />
              <h3>Our Mission</h3>
              <p>To provide world-class security technology that protects assets and ensures peace of mind for our diverse clientele across Africa.</p>
            </div>
            <div className="mv-card card card-padded" style={{ borderColor: 'rgba(46,148,209,0.15)' }}>
              <Eye size={32} color="#2e94d1" style={{ marginBottom: 16 }} />
              <h3>Our Vision</h3>
              <p>To be the leading innovator in the African technology space, setting standards for safety, smart integration, and digital security.</p>
            </div>
            <div className="mv-card card card-padded">
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: 16 }}>💬</span>
              <h3>Our Promise</h3>
              <p>Every system we install comes with our quality guarantee — we won't close a project until it meets your expectations completely.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-3xl)' }}>
            <p className="text-label" style={{ color: 'var(--color-green-primary)', marginBottom: 8 }}>What Drives Us</p>
            <h2 className="section-title">Our Core Values</h2>
          </div>
          <div className="grid-4">
            {values.map((v) => (
              <div key={v.title} className="value-card card card-padded">
                <span className="value-icon">{v.icon}</span>
                <h4>{v.title}</h4>
                <p style={{ margin: 0 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section" style={{ background: 'var(--color-bg-secondary)', borderTop: '1px solid var(--color-border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-3xl)' }}>
            <p className="text-label" style={{ color: 'var(--color-green-primary)', marginBottom: 8 }}>The People</p>
            <h2 className="section-title">Meet Our Leadership</h2>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-xl)', flexWrap: 'wrap' }}>
            {team.map((t) => (
              <div key={t.name} className="team-card card card-padded">
                <div className="team-avatar-initials">{t.avatar}</div>
                <h4 className="team-name">{t.name}</h4>
                <p className="text-label" style={{ color: 'var(--brand-green-bright)', margin: '4px 0 10px' }}>{t.role}</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>{t.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clients */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-3xl)' }}>
            <p className="text-label" style={{ color: 'var(--color-green-primary)', marginBottom: 8 }}>Our Clients</p>
            <h2 className="section-title">Trusted By</h2>
          </div>
          <div className="clients-grid">
            {clients.map((name) => (
              <div key={name} className="client-card card card-padded">
                <span className="client-name">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section about-cta-section">
        <div className="container" style={{ textAlign: 'center' }}>
          <p className="text-label" style={{ color: 'var(--brand-green-bright)', marginBottom: 12 }}>Work With Us</p>
          <h2 style={{ marginBottom: 16, fontSize: '2.25rem' }}>Partner with the Best</h2>
          <p style={{ marginBottom: 36, maxWidth: 500, margin: '0 auto 36px', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>Let's discuss how we can design and implement a world-class security solution for your needs.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/contact')} id="about-cta-btn">
              Get a Free Consultation <ArrowRight size={18} />
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => navigate('/services')}>
              View Our Services
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
