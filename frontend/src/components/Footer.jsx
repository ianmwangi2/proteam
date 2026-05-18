import { NavLink } from 'react-router-dom';
import { Mail, Phone, MapPin, Twitter, Linkedin, Youtube, Instagram } from 'lucide-react';
import './Footer.css';

const footerLinks = {
  'Our Services': [
    { label: 'CCTV Surveillance', to: '/services' },
    { label: 'Access Control', to: '/services' },
    { label: 'Fire Alarm Systems', to: '/services' },
    { label: 'Electric Fencing', to: '/services' },
    { label: 'Security Screening', to: '/services' },
    { label: 'Automated Gates', to: '/services' },
    { label: 'Networking & Cabling', to: '/services' },
    { label: 'Parking Management', to: '/services' },
  ],
  'What We Do': [
    { label: 'Installation', to: '/services' },
    { label: 'Maintenance', to: '/services' },
    { label: 'Consulting', to: '/services' },
    { label: 'Site Survey', to: '/services' },
  ],
  Company: [
    { label: 'About Us', to: '/about' },
    { label: 'Our Team', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ],
};

const socials = [
  { icon: Twitter, href: 'https://x.com', label: 'Twitter' },
  { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
  { icon: Youtube, href: 'https://youtube.com', label: 'YouTube' },
  { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          {/* Brand Column */}
          <div className="footer-brand">
            <NavLink to="/" className="footer-logo">
              <div className="footer-logo-icon">
                <img src="/logo.png" alt="Pro.Team Technologies logo" style={{ width: 28, height: 28, objectFit: 'contain' }} />
              </div>
              <span className="footer-logo-name">Pro.Team Technologies</span>
            </NavLink>
            <p className="footer-tagline">
              Advanced security and technology solutions protecting businesses across Africa since 2010.
            </p>
            <div className="footer-contacts">
              <div className="footer-contact-item">
                <MapPin size={14} color="var(--brand-green-bright)" />
                <span>Nairobi, Kenya</span>
              </div>
              <div className="footer-contact-item">
                <Phone size={14} color="var(--brand-blue-mid)" />
                <span>+254 725 300 350</span>
              </div>
              <div className="footer-contact-item">
                <Mail size={14} color="var(--brand-blue-mid)" />
                <span>proteamtechnologies122@gmail.com</span>
              </div>
            </div>
            <div className="footer-socials">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  className="social-link"
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  id={`footer-social-${label.toLowerCase()}`}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="footer-col">
              <h4 className="footer-col-title">{category}</h4>
              <ul className="footer-col-links">
                {links.map(({ label, to }) => (
                  <li key={label}>
                    <NavLink to={to} className="footer-link" id={`footer-link-${label.toLowerCase().replace(/\s+/g, '-')}`}>
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="footer-copy">
            © {new Date().getFullYear()} Proteam Technologies Group K Ltd. All rights reserved.
          </p>
          <div className="footer-bottom-links">
            <NavLink to="/about" className="footer-bottom-link">Privacy Policy</NavLink>
            <NavLink to="/about" className="footer-bottom-link">Terms of Service</NavLink>
            <NavLink to="/about" className="footer-bottom-link">Cookie Policy</NavLink>
          </div>
          <div className="footer-cert">
            <span className="cert-badge">🔒 ISO 27001</span>
            <span className="cert-badge">✅ CE Certified</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
