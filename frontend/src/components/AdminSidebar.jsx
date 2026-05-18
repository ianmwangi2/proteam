import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ClipboardList, Package, Users, TrendingUp, Settings, LifeBuoy, MessageSquare, Menu, X } from 'lucide-react';

const navItems = [
  { id: 'dash',        label: 'Dashboard',  icon: Home,           to: '/admin' },
  { id: 'quotations',  label: 'Quotations', icon: ClipboardList,  to: '/admin/quotations' },
  { id: 'products',   label: 'Inventory',  icon: Package,        to: '/admin/inventory' },
  { id: 'tickets',    label: 'Support',    icon: LifeBuoy,       to: '/admin/support' },
  { id: 'messages',   label: 'Messages',   icon: MessageSquare,  to: '/admin/messages' },
  { id: 'users',      label: 'Users',      icon: Users,          to: '/admin/users' },
  { id: 'reports',    label: 'Reports',    icon: TrendingUp,     to: '/admin/reports' },
  { id: 'settings',   label: 'Settings',   icon: Settings,       to: '/admin/settings' },
];

export default function AdminSidebar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const go = (to) => { navigate(to); setOpen(false); };

  return (
    <>
      <button className="admin-hamburger" onClick={() => setOpen(v => !v)} aria-label="Toggle menu">
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
      {open && <div className="admin-sidebar-overlay" onClick={() => setOpen(false)} />}
      <aside className={`admin-sidebar${open ? ' open' : ''}`}>
        <div className="admin-logo">
          <img src="/logo.png" alt="Pro.Team Technologies logo" style={{ width: 24, height: 24, objectFit: 'contain' }} />
          <span>Pro.Team Admin</span>
        </div>
        <nav className="admin-nav">
          {navItems.map(item => {
            const isActive = item.to === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.to);
            return (
              <button
                key={item.id}
                className={`admin-nav-link ${isActive ? 'active' : ''}`}
                onClick={() => go(item.to)}
                id={`admin-nav-${item.id}`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="admin-sidebar-footer">
          <button className="btn btn-ghost btn-sm admin-exit-btn" onClick={() => go('/')}>
            ← Back to Website
          </button>
        </div>
      </aside>
    </>
  );
}
