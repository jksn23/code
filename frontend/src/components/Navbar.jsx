import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { Sun, Moon, LogOut, ChevronDown, User, Menu } from 'lucide-react';

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [theme, setTheme] = React.useState(() => {
    return localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });
  const profileRef = useRef(null);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  React.useEffect(() => {
    const handleOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const ROLE_LABELS = { ADMIN: 'Administrator', PENJUAL: 'Penjual', PEMBELI: 'Pembeli' };
  const roleLabel = ROLE_LABELS[user?.role] || user?.role || '';
  const initials = user?.nama?.charAt(0).toUpperCase() || '?';

  return (
    <header className="navbar">
      {/* Left: Hamburger (mobile only) + brand subtitle */}
      <div className="navbar-left">
        <button
          className="navbar-hamburger"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        <span className="navbar-brand-sub">Sistem Pendukung Keputusan Lelang</span>
      </div>

      {/* Right: Controls */}
      <div className="navbar-right">
        {/* Notification bell */}
        <NotificationBell />

        {/* Theme toggle */}
        <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle tema">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Profile dropdown */}
        <div className="navbar-profile-wrap" ref={profileRef}>
          <button
            className="navbar-profile-btn"
            onClick={() => setProfileOpen((p) => !p)}
            title="Profil saya"
          >
            <div className="navbar-avatar">{initials}</div>
            <span className="navbar-user-name">{user?.nama}</span>
            <ChevronDown size={14} className={`navbar-chevron ${profileOpen ? 'open' : ''}`} />
          </button>

          {profileOpen && (
            <div className="navbar-dropdown">
              {/* Profile info header */}
              <div className="navbar-dropdown-header">
                <div className="navbar-dropdown-avatar">{initials}</div>
                <div>
                  <div className="navbar-dropdown-name">{user?.nama}</div>
                  <div className="navbar-dropdown-email">{user?.email}</div>
                  <span className="badge badge-primary" style={{ marginTop: 4, fontSize: 10 }}>
                    {roleLabel}
                  </span>
                </div>
              </div>

              <div className="navbar-dropdown-divider" />

              <button className="navbar-dropdown-item" onClick={() => setProfileOpen(false)}>
                <User size={15} />
                Akun Saya
              </button>

              <div className="navbar-dropdown-divider" />

              <button className="navbar-dropdown-item danger" onClick={handleLogout}>
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
