import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Share2, Bell, Menu, SlidersHorizontal, Settings } from 'lucide-react';
import './PageHeader.css';

export default function PageHeader({
  title,
  subtitle,
  showBack = false,
  showSearch = false,
  showShare = false,
  showBell = false,
  showMenu = false,
  showFilter = false,
  showSettings = false,
  bellCount = 0,
  logo = false,
  onSearch,
  onMenu,
  onFilter,
  onShare,
  onBell,
  onSettings,
}) {
  const navigate = useNavigate();

  return (
    <header className="page-header">
      <div className="page-header-left">
        {showBack && (
          <button className="btn-icon" onClick={() => navigate(-1)} id="back-btn">
            <ChevronLeft size={20} />
          </button>
        )}
        {showMenu && (
          <button className="btn-icon" onClick={onMenu} id="menu-btn">
            <Menu size={20} />
          </button>
        )}
        {logo && (
          <div className="header-logo">
            <div className="logo-shield">
              <img src="/logo.png" alt="Pro.Team Technologies logo" style={{ width: 24, height: 24, objectFit: 'contain' }} />
            </div>
            <div className="logo-text-group">
              <span className="logo-brand">{typeof logo === 'string' ? logo : 'Pro.Team'}</span>
              {subtitle && <span className="logo-subtitle">{subtitle}</span>}
            </div>
          </div>
        )}
        {!logo && (
          <div className="header-title-group">
            <h1 className="header-title">{title}</h1>
            {subtitle && <p className="header-subtitle">{subtitle}</p>}
          </div>
        )}
      </div>

      <div className="page-header-right">
        {showFilter && (
          <button className="btn-icon" id="filter-btn" onClick={onFilter} aria-label="Filter">
            <SlidersHorizontal size={18} />
          </button>
        )}
        {showSearch && (
          <button className="btn-icon" onClick={onSearch} id="search-btn">
            <Search size={20} />
          </button>
        )}
        {showShare && (
          <button className="btn-icon" id="share-btn" onClick={onShare} aria-label="Share">
            <Share2 size={20} />
          </button>
        )}
        {showBell && (
          <button className="btn-icon relative" id="bell-btn" onClick={onBell} aria-label="Notifications">
            <Bell size={20} />
            {bellCount > 0 && <span className="header-badge">{bellCount}</span>}
          </button>
        )}
        {showSettings && (
          <button className="btn-icon" id="settings-btn" onClick={onSettings} aria-label="Settings">
            <Settings size={20} />
          </button>
        )}
      </div>
    </header>
  );
}
