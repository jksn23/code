import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SellerWaitingPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    /*
     * Halaman ini di-render di dalam Layout (ada sidebar).
     * Gunakan negative margin-left untuk menutup area sidebar
     * dan tampilkan full-screen centering dari kiri layar.
     */
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: 24,
    }}>
      <div style={{
        maxWidth: 520,
        width: '100%',
        textAlign: 'center',
      }}>
        {/* Icon */}
        <div style={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 28px',
          fontSize: 44,
          boxShadow: '0 8px 24px rgba(245,158,11,0.35)',
        }}>
          ⏳
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '40px 36px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
            Menunggu Verifikasi
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
            Halo, <strong style={{ color: 'var(--text)' }}>{user?.nama || 'Penjual'}</strong>! Akun Anda sedang
            dalam proses peninjauan oleh <strong style={{ color: 'var(--text)' }}>Pejabat Lelang (Admin)</strong>.
            Silakan tunggu hingga dokumen KTP, NPWP, dan informasi rekening bank Anda diverifikasi.
          </p>

          {/* Steps */}
          <div style={{
            background: 'var(--bg)',
            borderRadius: 12,
            padding: '20px 24px',
            marginBottom: 28,
            textAlign: 'left',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
              Proses Verifikasi
            </div>
            {[
              { no: '1', label: 'Dokumen diterima sistem', done: true },
              { no: '2', label: 'Admin memeriksa KTP & NPWP', done: false },
              { no: '3', label: 'Akun diaktifkan & siap digunakan', done: false },
            ].map((step) => (
              <div key={step.no} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: step.done ? '#10b981' : 'var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  color: step.done ? '#fff' : 'var(--text-muted)',
                  flexShrink: 0,
                }}>
                  {step.done ? '✓' : step.no}
                </div>
                <span style={{
                  fontSize: 14,
                  color: step.done ? 'var(--text)' : 'var(--text-muted)',
                  fontWeight: step.done ? 600 : 400,
                }}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
            Proses verifikasi biasanya memerlukan waktu 1×24 jam kerja. Jika ada kendala, hubungi Admin.
          </p>

          <div style={{ display: 'flex', gap: 10 }}>
            <a
              href="mailto:admin@elelang.co.id"
              className="btn btn-secondary"
              style={{ flex: 1, justifyContent: 'center', padding: '12px 0' }}
            >
              📧 Hubungi Admin
            </a>
            <button
              onClick={handleLogout}
              className="btn btn-danger"
              style={{ flex: 1, padding: '12px 0' }}
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
