import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Grid, Shield, User, FileText } from 'lucide-react';
import './BottomNav.css';

const navItems = [
  { path: '/',         label: 'Home',     icon: Home },
  { path: '/catalog',  label: 'Catalog',  icon: Grid },
  { path: '/services', label: 'Services', icon: Shield },
  { path: '/account',  label: 'Account',  icon: User },
  { path: '/contact',  label: 'Contact',  icon: FileText },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-nav" aria-label="Bottom navigation">
      {navItems.map(({ path, label, icon: Icon }) => (
        <button
          key={path}
          className={`bottom-nav-item ${isActive(path) ? 'active' : ''}`}
          onClick={() => navigate(path)}
          id={`nav-${label.toLowerCase()}`}
        >
          <div className="bottom-nav-icon-wrap">
            <Icon size={22} />
          </div>
          <span className="bottom-nav-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
