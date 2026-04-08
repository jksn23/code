import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { 
  Home, 
  Megaphone, 
  FolderTree, 
  ListOrdered, 
  Tag, 
  PenSquare, 
  Trophy, 
  Calculator, 
  Scale, 
  UserCheck, 
  Clock, 
  FileText,
  ShieldCheck,
  Sun,
  Moon,
  LogOut
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const role = user?.role || 'PEMBELI';

  const navItems = [
    { group: 'Home', items: [
      { label: 'Beranda', icon: <Home size={18} strokeWidth={2} />, to: '/' },
    ], roles: ['ADMIN', 'PENJUAL', 'PEMBELI'] },

    { group: 'Lelang', items: [
      { label: 'Daftar Lelang', icon: <Megaphone size={18} strokeWidth={2} />, to: '/lelang' },
    ], roles: ['ADMIN', 'PENJUAL', 'PEMBELI'] },
    
    { group: 'Master Data', items: [
      { label: 'Kategori', icon: <FolderTree size={18} strokeWidth={2} />, to: '/kategori' },
      { label: 'Kriteria', icon: <ListOrdered size={18} strokeWidth={2} />, to: '/kriteria' },
    ], roles: ['ADMIN'] },

    { group: 'Manajemen Aset', items: [
      { label: 'Data Aset', icon: <Tag size={18} strokeWidth={2} />, to: '/aset' },
    ], roles: ['ADMIN', 'PENJUAL'] },

    { group: 'SPK (AHP & SAW)', items: [
      { label: 'Input Nilai', icon: <PenSquare size={18} strokeWidth={2} />, to: '/input-nilai' },
      { label: 'Hasil / Ranking', icon: <Trophy size={18} strokeWidth={2} />, to: '/hasil' },
    ], roles: ['ADMIN', 'PENJUAL'] },

    { group: 'Manajemen SPK', items: [
      { label: 'Hitung AHP', icon: <Calculator size={18} strokeWidth={2} />, to: '/ahp' },
      { label: 'Hitung SAW', icon: <Scale size={18} strokeWidth={2} />, to: '/saw' },
    ], roles: ['ADMIN'] },

    { group: 'Manajemen Lelang', items: [
      { label: 'Verifikasi Penjual', icon: <UserCheck size={18} strokeWidth={2} />, to: '/penjual' },
      { label: 'Verifikasi Pembeli', icon: <ShieldCheck size={18} strokeWidth={2} />, to: '/pembeli-verifikasi' },
      { label: 'Kelola Lelang', icon: <Clock size={18} strokeWidth={2} />, to: '/lelang-admin' },
    ], roles: ['ADMIN'] },

    { group: 'Laporan', items: [
      { label: 'Generate Laporan', icon: <FileText size={18} strokeWidth={2} />, to: '/laporan' },
    ], roles: ['ADMIN'] },
  ];

  const [theme, setTheme] = React.useState('light');

  React.useEffect(() => {
    // Load existing theme preference or system default
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Scale size={20} className="icon-title" /> E-Lelang</h1>
          <p>Sistem Pendukung Keputusan</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <NotificationBell />
          <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle Light/Dark Mode">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.filter(g => g.roles.includes(role)).map((group) => (
          <div key={group.group}>
            <div className="sidebar-section-label">{group.group}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div style={{ padding: '20px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ 
            width: 36, height: 36, 
            background: 'var(--primary-bg)', 
            color: 'var(--primary-text)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontSize: '14px', fontWeight: 700
          }}>
            {user?.nama?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.nama}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{role}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', gap: 8 }}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
