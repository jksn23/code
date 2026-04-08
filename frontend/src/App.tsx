// @ts-nocheck
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
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
import BuyerVerificationPage from './pages/BuyerVerificationPage';
import UserManagementPage from './pages/UserManagementPage';
import LelangAdminPage from './pages/LelangAdminPage';
import BuyerAssetsPage from './pages/BuyerAssetsPage';
import BuyerPaymentsPage from './pages/BuyerPaymentsPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import LelangPublikPage from './pages/LelangPublikPage';
import LelangRoomPage from './pages/LelangRoomPage';
import LaporanPage from './pages/LaporanPage';
import SellerWaitingPage from './pages/SellerWaitingPage';
import AuctionSummaryPage from './pages/AuctionSummaryPage';
import { isSellerApprovedStatus, resolveSellerStatus } from './utils/sellerVerification';
import './index.css';

const NO_SIDEBAR_PATHS = ['/login', '/register'];

const Layout = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Close sidebar whenever route changes (mobile nav click)
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const isNoSidebar = NO_SIDEBAR_PATHS.includes(location.pathname);
  if (isNoSidebar) return <>{children}</>;
  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-wrapper">
        <Navbar onMenuToggle={() => setSidebarOpen((p) => !p)} />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
};

const AuthGuard = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'PENJUAL' && !isSellerApprovedStatus(resolveSellerStatus(user))) {
    return <SellerWaitingPage />;
  }
  return <Outlet />;
};

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
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/lelang" element={<LelangPublikPage />} />
            <Route path="/lelang/summary" element={<AuctionSummaryPage />} />
            <Route path="/lelang/:id" element={<LelangRoomPage />} />

            <Route element={<AuthGuard />}>
              <Route path="/" element={<DashboardPage />} />

              <Route element={<RoleRoute allowedRoles={['ADMIN', 'PENJUAL']} />}>
                <Route path="/aset" element={<AsetPage />} />
                <Route path="/hasil" element={<HasilPage />} />
              </Route>

              <Route element={<RoleRoute allowedRoles={['PEMBELI']} />}>
                <Route path="/aset-saya" element={<BuyerAssetsPage />} />
                <Route path="/pembayaran" element={<BuyerPaymentsPage />} />
              </Route>

              <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
                <Route path="/input-nilai" element={<InputNilaiPage />} />
                <Route path="/penjual" element={<PenjualPage />} />
                <Route path="/penjual/:id" element={<AdminSellerDetailPage />} />
                <Route path="/pembeli-verifikasi" element={<BuyerVerificationPage />} />
                <Route path="/users-admin" element={<UserManagementPage />} />
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
