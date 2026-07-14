import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  Megaphone,
  FolderTree,
  ListOrdered,
  Tag,
  PenSquare,
  Trophy,
  Scale,
  UserCheck,
  Users,
  Clock,
  FileText,
  ShieldCheck,
  Settings,
  X,
  Zap,
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const role = user?.role || 'PEMBELI';

  const navItems = [
    { group: 'Home', items: [
      { label: 'Beranda', icon: <Home size={18} strokeWidth={2} />, to: '/' },
    ], roles: ['ADMIN', 'PENJUAL', 'PEMBELI'] },

    { group: 'Lelang', items: [
      { label: 'Daftar Lelang', icon: <Megaphone size={18} strokeWidth={2} />, to: '/lelang' },
      { label: 'Preset Quick Bid', icon: <Zap size={18} strokeWidth={2} />, to: '/quick-bid', roles: ['PEMBELI'] },
    ], roles: ['ADMIN', 'PENJUAL', 'PEMBELI'] },

    { group: 'Master Data', items: [
      { label: 'Kategori', icon: <FolderTree size={18} strokeWidth={2} />, to: '/kategori' },
      { label: 'Kriteria', icon: <ListOrdered size={18} strokeWidth={2} />, to: '/kriteria' },
    ], roles: ['ADMIN'] },

    { group: 'Manajemen Aset', items: [
      { label: 'Data Aset', icon: <Tag size={18} strokeWidth={2} />, to: '/aset', roles: ['ADMIN', 'PENJUAL'] },
      { label: 'Aset Saya', icon: <Tag size={18} strokeWidth={2} />, to: '/aset-saya', roles: ['PEMBELI'] },
    ], roles: ['ADMIN', 'PENJUAL', 'PEMBELI'] },

    { group: 'SPK (AHP & SAW)', items: [
      { label: 'Validasi Penilaian', icon: <PenSquare size={18} strokeWidth={2} />, to: '/admin/penilaian-aset', roles: ['ADMIN'] },
      { label: 'Hasil / Ranking', icon: <Trophy size={18} strokeWidth={2} />, to: '/hasil', roles: ['ADMIN', 'PENJUAL'] },
    ], roles: ['ADMIN', 'PENJUAL'] },

    { group: 'Manajemen SPK', items: [
      { label: 'Hitung SAW', icon: <Scale size={18} strokeWidth={2} />, to: '/saw' },
    ], roles: ['ADMIN'] },

    { group: 'Manajemen Lelang', items: [
      { label: 'Verifikasi Penjual', icon: <UserCheck size={18} strokeWidth={2} />, to: '/penjual' },
      { label: 'Verifikasi Pembeli', icon: <ShieldCheck size={18} strokeWidth={2} />, to: '/pembeli-verifikasi' },
      { label: 'Kelola Lelang', icon: <Clock size={18} strokeWidth={2} />, to: '/lelang-admin' },
    ], roles: ['ADMIN'] },

    { group: 'Manajemen User', items: [
      { label: 'Data User', icon: <Users size={18} strokeWidth={2} />, to: '/users-admin' },
    ], roles: ['ADMIN'] },

    { group: 'Transaksi Pembeli', items: [
      { label: 'Pembayaran', icon: <FileText size={18} strokeWidth={2} />, to: '/pembayaran' },
    ], roles: ['PEMBELI'] },

    { group: 'Administrasi Dokumen', items: [
      { label: role === 'PENJUAL' ? 'Dokumen Saya' : 'Dokumen ADMS', icon: <FileText size={18} strokeWidth={2} />, to: '/dokumen-adms' },
    ], roles: ['ADMIN', 'PENJUAL'] },

    { group: 'Laporan', items: [
      { label: 'Generate Laporan', icon: <FileText size={18} strokeWidth={2} />, to: '/laporan' },
    ], roles: ['ADMIN'] },

    { group: 'Pengaturan', items: [
      { label: 'Pengaturan Sistem', icon: <Settings size={18} strokeWidth={2} />, to: '/pengaturan' },
    ], roles: ['ADMIN'] },
  ];

  return (
    <>
      {/* Mobile overlay — darkens background when sidebar is open */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Scale size={20} className="icon-title" /> E-Lelang
            </h1>
            {/* Close button — visible on mobile only */}
            <button
              className="sidebar-close-btn"
              onClick={onClose}
              aria-label="Tutup menu"
            >
              <X size={18} />
            </button>
          </div>
          <p>Sistem Pendukung Keputusan</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.filter((g) => g.roles.includes(role)).map((group) => (
            <div key={group.group}>
              <div className="sidebar-section-label">{group.group}</div>
              {group.items
                .filter((item) => !item.roles || item.roles.includes(role))
                .map((item) => (
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
      </aside>
    </>
  );
}
