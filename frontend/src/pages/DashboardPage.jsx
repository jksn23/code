import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDashboardSummary } from '../services/api';
import { getSellerStatusMeta, resolveSellerStatus } from '../utils/sellerVerification';

const formatRp = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
}).format(value || 0);

const formatDateTime = (value) => value ? new Date(value).toLocaleString('id-ID') : '-';

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getDashboardSummary();
        setSummary(res.data);
      } catch {
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const statCards = useMemo(() => {
    if (!summary) return [];

    if (summary.role === 'ADMIN') {
      return [
        { label: 'Seller Pending', value: summary.stats.sellerPending, accent: '#f59e0b' },
        { label: 'Buyer KYC Pending', value: summary.stats.buyerKycPending, accent: '#7c3aed' },
        { label: 'Aset Pending', value: summary.stats.asetPendingSchedule, accent: '#ea580c' },
        { label: 'Lelang Aktif', value: summary.stats.lelangAktif, accent: '#2563eb' },
        { label: 'Bayar Pending', value: summary.stats.pembayaranPending, accent: '#dc2626' },
        { label: 'Pendapatan', value: formatRp(summary.stats.totalPendapatan), accent: '#16a34a' },
      ];
    }

    if (summary.role === 'PENJUAL') {
      return [
        { label: 'Total Aset', value: summary.stats.totalAset, accent: '#6366f1' },
        { label: 'Pending Review', value: summary.stats.asetPendingVerifikasi, accent: '#f59e0b' },
        { label: 'Aktif Lelang', value: summary.stats.asetAktifLelang, accent: '#2563eb' },
        { label: 'Aset Terjual', value: summary.stats.asetTerjual, accent: '#16a34a' },
        { label: 'Hasil Penjualan', value: formatRp(summary.stats.totalHasilPenjualan), accent: '#0f766e' },
      ];
    }

    return [
      { label: 'Lelang Diikuti', value: summary.stats.lelangDiikuti, accent: '#6366f1' },
      { label: 'Menang Lelang', value: summary.stats.lelangDimenangkan, accent: '#16a34a' },
      { label: 'Pembayaran Pending', value: summary.stats.pembayaranPending, accent: '#dc2626' },
      { label: 'Belum Konfirmasi', value: summary.stats.barangBelumDikonfirmasi, accent: '#2563eb' },
      { label: 'Segera Dimulai', value: summary.stats.lelangSegeraDimulai, accent: '#d97706' },
    ];
  }, [summary]);

  const headerCopy = useMemo(() => {
    if (!summary) return { title: 'Dashboard', subtitle: 'Memuat ringkasan peran Anda.' };
    if (summary.role === 'ADMIN') {
      return {
        title: 'Dashboard Admin',
        subtitle: `Pantau seller, KYC buyer, jadwal lelang, dan pembayaran dari satu tempat. ${summary.unreadNotifications} notifikasi belum dibaca.`,
      };
    }
    if (summary.role === 'PENJUAL') {
      return {
        title: 'Dashboard Penjual',
        subtitle: 'Ringkasan aset, status seller, dan hasil penjualan terbaru Anda.',
      };
    }
    return {
      title: 'Dashboard Pembeli',
      subtitle: 'Pantau status KYC, kemenangan lelang, pembayaran, dan lelang yang sedang Anda ikuti.',
    };
  }, [summary]);

  const renderAdminHighlights = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 20 }}>
      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>Seller Menunggu Verifikasi</h3>
        {!summary.highlights.sellerPendingList?.length ? (
          <div className="empty-state">Tidak ada seller yang menunggu review.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {summary.highlights.sellerPendingList.map((seller) => (
              <div key={seller.id} style={{ padding: 14, borderRadius: 12, background: 'var(--surface-light)', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700 }}>{seller.user?.nama}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{seller.user?.email}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  Daftar: {formatDateTime(seller.user?.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>Lelang Selesai Terbaru</h3>
        {!summary.highlights.recentAuctions?.length ? (
          <div className="empty-state">Belum ada lelang selesai.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {summary.highlights.recentAuctions.map((item) => (
              <div key={item.id} style={{ paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700 }}>{item.aset?.nama}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Pemenang: {item.pemenang?.nama || 'Tidak ada'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Ditutup: {formatDateTime(item.waktuTutup)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSellerHighlights = () => {
    const sellerMeta = getSellerStatusMeta(resolveSellerStatus(user));
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 20 }}>
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Aset Terbaru Anda</h3>
          {!summary.highlights.recentAssets?.length ? (
            <div className="empty-state">Belum ada aset yang didaftarkan.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {summary.highlights.recentAssets.map((item) => (
                <div key={item.id} style={{ padding: 14, background: 'var(--surface-light)', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{item.nama}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.kategori?.nama}</div>
                    </div>
                    <span className="badge badge-primary">{item.statusLelang}</span>
                  </div>
                  {item.lelang?.[0] && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
                      Jadwal: {formatDateTime(item.lelang[0].waktuBuka)} sampai {formatDateTime(item.lelang[0].waktuTutup)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Profil Finansial</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ padding: 14, background: 'var(--surface-light)', borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status Verifikasi Seller</div>
              <div style={{ fontWeight: 700, marginTop: 4, color: sellerMeta.color }}>{sellerMeta.label}</div>
            </div>
            <div style={{ padding: 14, background: 'var(--surface-light)', borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Bank Tujuan</div>
              <div style={{ fontWeight: 700, marginTop: 4 }}>{summary.highlights.sellerProfile?.rekeningBank || '-'}</div>
            </div>
            <div style={{ padding: 14, background: 'var(--surface-light)', borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nomor Rekening</div>
              <div style={{ fontWeight: 700, marginTop: 4 }}>{summary.highlights.sellerProfile?.nomorRekening || '-'}</div>
            </div>
            <div style={{ padding: 14, background: 'var(--surface-light)', borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Hasil Penjualan</div>
              <div style={{ fontWeight: 700, marginTop: 4 }}>{formatRp(summary.stats.totalHasilPenjualan)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBuyerHighlights = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 20 }}>
      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>Riwayat Kemenangan Terbaru</h3>
        {!summary.highlights.recentWins?.length ? (
          <div className="empty-state">Anda belum memenangkan lelang.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {summary.highlights.recentWins.map((item) => (
              <div key={item.id} style={{ padding: 14, background: 'var(--surface-light)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ fontWeight: 700 }}>{item.aset?.nama}</div>
                  <span className="badge badge-primary">{item.statusPembayaran}</span>
                </div>
                <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                  Nominal menang: {formatRp(item.penawaran?.[0]?.nominal || 0)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Ditutup: {formatDateTime(item.waktuTutup)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>Status KYC & Lelang Diikuti</h3>
        <div style={{ padding: 16, borderRadius: 14, background: 'var(--surface-light)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status Saat Ini</div>
          <div style={{ fontSize: 20, fontWeight: 800, marginTop: 6 }}>{user?.buyerVerificationStatus || 'UNVERIFIED'}</div>
          <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {user?.buyerVerificationStatus === 'APPROVED'
              ? 'Akun Anda sudah dapat mengikuti bidding.'
              : user?.buyerVerificationNote || 'Admin belum menyetujui KTP Anda. Bidding akan dikunci sampai KYC disetujui.'}
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
            Diverifikasi: {formatDateTime(user?.buyerVerifiedAt)}
          </div>

          {summary.highlights.upcomingJoinedAuctions?.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Lelang yang Anda ikuti</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {summary.highlights.upcomingJoinedAuctions.map((item) => (
                  <div key={item.id} style={{ fontSize: 13 }}>
                    <strong>{item.aset?.nama}</strong>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      Mulai: {formatDateTime(item.waktuBuka)} | Status: {item.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h2>{headerCopy.title}</h2>
        <p>{headerCopy.subtitle}</p>
      </div>

      {loading ? (
        <div className="card"><div className="empty-state"><span className="spinner" /> Memuat dashboard...</div></div>
      ) : !summary ? (
        <div className="alert alert-danger">Gagal memuat ringkasan dashboard.</div>
      ) : (
        <>
          <div className="stats-grid">
            {statCards.map((item) => (
              <div key={item.label} className="stat-card">
                <div>
                  <div className="stat-label">{item.label}</div>
                  <div className="stat-value" style={{ color: item.accent }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>

          {summary.role === 'ADMIN' && renderAdminHighlights()}
          {summary.role === 'PENJUAL' && renderSellerHighlights()}
          {summary.role === 'PEMBELI' && renderBuyerHighlights()}
        </>
      )}
    </div>
  );
}
