// @ts-nocheck
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import KategoriPage from './pages/KategoriPage';
import KriteriaPage from './pages/KriteriaPage';
import AsetPage from './pages/AsetPage';
import InputNilaiPage from './pages/InputNilaiPage';
import AHPPage from './pages/AHPPage';
import SAWPage from './pages/SAWPage';
import HasilPage from './pages/HasilPage';
import PenjualPage from './pages/PenjualPage';
import AdminSellerDetailPage from './pages/AdminSellerDetailPage';
import LelangAdminPage from './pages/LelangAdminPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import LelangPublikPage from './pages/LelangPublikPage';
import LelangRoomPage from './pages/LelangRoomPage';
import LaporanPage from './pages/LaporanPage';
import SellerWaitingPage from './pages/SellerWaitingPage';
import AuctionSummaryPage from './pages/AuctionSummaryPage';
import './index.css';

// Rute yang TIDAK menggunakan sidebar
const NO_SIDEBAR_PATHS = ['/login', '/register'];

const Layout = ({ children }) => {
  const location = useLocation();
  const isNoSidebar = NO_SIDEBAR_PATHS.includes(location.pathname);
  if (isNoSidebar) return <>{children}</>;
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
};

/**
 * Guard utama yang dipakai oleh SEMUA protected route.
 * - Jika tidak login → redirect ke /login
 * - Jika penjual belum diverifikasi → tampilkan SellerWaitingPage (full screen, z-index tinggi)
 * (Kecuali admin dan pembeli yang tidak perlu verifikasi)
 */
const AuthGuard = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  // Penjual belum diverifikasi → tampilkan halaman tunggu di atas segalanya
  if (user.role === 'PENJUAL' && user.isVerified === false) {
    return <SellerWaitingPage />;
  }
  return <Outlet />;
};

/**
 * Guard untuk rute yang hanya boleh diakses role tertentu.
 * Gunakan SETELAH AuthGuard (nested di bawahnya).
 */
const RoleRoute = ({ allowedRoles }) => {
  const { user } = useAuth();
  if (!allowedRoles.includes(user?.role)) return <Navigate to="/lelang" replace />;
  return <Outlet />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            {/* ===== Fully Public Routes ===== */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/lelang" element={<LelangPublikPage />} />
            {/*
              PENTING: /lelang/summary HARUS sebelum /lelang/:id
              agar React Router tidak menganggap "summary" sebagai dynamic :id
            */}
            <Route path="/lelang/summary" element={<AuctionSummaryPage />} />
            <Route path="/lelang/:id" element={<LelangRoomPage />} />

            {/* ===== Protected Routes (semua butuh login + penjual harus verified) ===== */}
            <Route element={<AuthGuard />}>
              {/* Dashboard: semua role yang login */}
              <Route path="/" element={<DashboardPage />} />

              {/* Halaman Aset & SPK: ADMIN + PENJUAL */}
              <Route element={<RoleRoute allowedRoles={['ADMIN', 'PENJUAL']} />}>
                <Route path="/aset" element={<AsetPage />} />
                <Route path="/input-nilai" element={<InputNilaiPage />} />
                <Route path="/hasil" element={<HasilPage />} />
              </Route>

              {/* Halaman Admin only */}
              <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
                <Route path="/penjual" element={<PenjualPage />} />
                <Route path="/penjual/:id" element={<AdminSellerDetailPage />} />
                <Route path="/lelang-admin" element={<LelangAdminPage />} />
                <Route path="/kategori" element={<KategoriPage />} />
                <Route path="/kriteria" element={<KriteriaPage />} />
                <Route path="/ahp" element={<AHPPage />} />
                <Route path="/saw" element={<SAWPage />} />
                <Route path="/laporan" element={<LaporanPage />} />
              </Route>
            </Route>
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}
