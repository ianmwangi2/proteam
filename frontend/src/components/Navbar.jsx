import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Search, Menu, X, LogIn, User, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const navLinks = [
  { to: '/',         label: 'Home',     exact: true },
  { to: '/services', label: 'Services' },
  { to: '/about',    label: 'About' },
  { to: '/contact',  label: 'Contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled]       = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [searchOpen, setSearchOpen]   = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user, isAdmin, profile } = useAuth();
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile on escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container navbar-inner">

          {/* Logo */}
          <NavLink to="/" className="navbar-logo" id="nav-logo">
            <div className="logo-icon">
              <img src="/logo.png" alt="Pro.Team Technologies logo" className="logo-img" />
            </div>
            <div className="logo-text-group">
              <span className="logo-name">Pro.Team</span>
              <span className="logo-tag">Technologies</span>
            </div>
          </NavLink>

          {/* Desktop Nav Links */}
          <nav className="navbar-links" aria-label="Main navigation">
            {navLinks.map(({ to, label, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                id={`nav-${label.toLowerCase()}`}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="navbar-actions">
            {/* Search */}
            {searchOpen ? (
              <div className="navbar-search-bar">
                <Search size={16} className="search-bar-icon" />
                <input
                  autoFocus
                  className="navbar-search-input"
                  placeholder="Search services..."
                  id="navbar-search"
                  aria-label="Search services"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      navigate(`/services`);
                      setSearchOpen(false);
                      setSearchQuery('');
                    }
                    if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery(''); }
                  }}
                  onBlur={() => { setSearchOpen(false); setSearchQuery(''); }}
                />
              </div>
            ) : (
              <button className="btn-icon" onClick={() => setSearchOpen(true)} id="navbar-search-btn" aria-label="Search">
                <Search size={18} />
              </button>
            )}

            {/* Get a Quote — primary CTA */}
            <button
              className="btn btn-primary btn-sm navbar-quote-btn"
              onClick={() => navigate('/contact')}
              id="navbar-quote-btn"
            >
              <MessageSquare size={14} />
              Get a Quote
            </button>

            {/* Account */}
            {user ? (
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/account')} id="navbar-account-btn">
                <User size={14} /> {displayName || 'Account'}
              </button>
            ) : (
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/account')} id="navbar-account-btn">
                <LogIn size={14} /> Sign In
              </button>
            )}

            {/* Admin link */}
            {isAdmin && (
              <NavLink to="/admin" className="btn btn-ghost btn-sm admin-nav-link" id="navbar-admin-btn">
                Admin
              </NavLink>
            )}

            {/* Mobile hamburger */}
            <button
              className="btn-icon mobile-menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              id="navbar-mobile-menu-btn"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />
          <div className="mobile-drawer">
            <nav className="mobile-nav" aria-label="Mobile navigation">
              {navLinks.map(({ to, label, exact }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={exact}
                  className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                  id={`mobile-nav-${label.toLowerCase()}`}
                >
                  {label}
                </NavLink>
              ))}
              {isAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  Admin Dashboard
                </NavLink>
              )}
              <div className="mobile-nav-divider" />
              <button
                className="mobile-nav-link mobile-quote-cta"
                onClick={() => { navigate('/contact'); setMobileOpen(false); }}
              >
                <MessageSquare size={16} style={{ marginRight: 8, verticalAlign: -2 }} />
                Get a Quote
              </button>
              <button
                className="btn btn-ghost btn-full"
                style={{ marginTop: 4 }}
                onClick={() => { navigate('/account'); setMobileOpen(false); }}
              >
                {user ? `Account (${displayName})` : 'Sign In'}
              </button>
            </nav>
          </div>
        </>
      )}

      {/* Spacer */}
      <div style={{ height: 'var(--navbar-height)' }} />
    </>
  );
}
