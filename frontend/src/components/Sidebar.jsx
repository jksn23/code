import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
      { label: 'Beranda', icon: '📊', to: '/' },
    ], roles: ['ADMIN', 'PENJUAL', 'PEMBELI'] },

    { group: 'Lelang', items: [
      { label: 'Daftar Lelang', icon: '📢', to: '/lelang' },
    ], roles: ['ADMIN', 'PENJUAL', 'PEMBELI'] },
    
    { group: 'Master Data', items: [
      { label: 'Kategori', icon: '🗂️', to: '/kategori' },
      { label: 'Kriteria', icon: '📋', to: '/kriteria' },
    ], roles: ['ADMIN'] },

    { group: 'Manajemen Aset', items: [
      { label: 'Data Aset', icon: '🏷️', to: '/aset' },
    ], roles: ['ADMIN', 'PENJUAL'] },

    { group: 'SPK (AHP & SAW)', items: [
      { label: 'Input Nilai', icon: '✏️', to: '/input-nilai' },
      { label: 'Hasil / Ranking', icon: '🏆', to: '/hasil' },
    ], roles: ['ADMIN', 'PENJUAL'] },

    { group: 'Manajemen SPK', items: [
      { label: 'Hitung AHP', icon: '🧮', to: '/ahp' },
      { label: 'Hitung SAW', icon: '⚖️', to: '/saw' },
    ], roles: ['ADMIN'] },

    { group: 'Manajemen Lelang', items: [
      { label: 'Verifikasi Penjual', icon: '👤', to: '/penjual' },
      { label: 'Kelola Lelang', icon: '⏱️', to: '/lelang-admin' },
    ], roles: ['ADMIN'] },

    { group: 'Laporan', items: [
      { label: 'Generate Laporan', icon: '📄', to: '/laporan' },
    ], roles: ['ADMIN'] },
  ];

  return (
    <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div className="sidebar-logo">
        <h1>⚖️ E-Lelang</h1>
        <p>SPK AHP-SAW</p>
      </div>
      
      <div style={{ padding: '0 20px', marginBottom: 20 }}>
        <div style={{ background: 'var(--surface-light)', padding: '12px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff' }}>
            {user?.nama?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{user?.nama}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{role}</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav" style={{ flex: 1, overflowY: 'auto' }}>
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

      <div style={{ padding: 20, borderTop: '1px solid var(--border)' }}>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  );
}
