import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getKategori, getAset, getKriteria, getHasil, getRiwayatPembayaranPembeli } from '../services/api.js';
import { useAuth } from '../context/AuthContext';

const formatRp = (val) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val || 0);

const paymentBadge = (status) => {
  const map = {
    UNPAID: { label: 'Perlu Upload Bukti', color: '#b45309', bg: '#fef3c7' },
    PENDING_VERIFICATION: { label: 'Menunggu Verifikasi', color: '#1d4ed8', bg: '#dbeafe' },
    LUNAS: { label: 'Lunas', color: '#15803d', bg: '#dcfce7' },
    DITOLAK: { label: 'Bukti Ditolak', color: '#b91c1c', bg: '#fee2e2' },
  };
  const ui = map[status] || { label: status || '-', color: '#64748b', bg: '#e2e8f0' };

  return (
    <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700, color: ui.color, background: ui.bg }}>
      {ui.label}
    </span>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ kategori: 0, kriteria: 0, aset: 0, hasil: 0 });
  const [topHasil, setTopHasil] = useState([]);
  const [buyerPayments, setBuyerPayments] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const kategoriRes = await getKategori();
        const kategoriList = kategoriRes.data || [];

        const [asetRes, kriteriaRes, buyerPaymentRes] = await Promise.all([
          getAset().catch(() => ({ data: [] })),
          getKriteria().catch(() => ({ data: [] })),
          user?.role === 'PEMBELI'
            ? getRiwayatPembayaranPembeli().catch(() => ({ data: [] }))
            : Promise.resolve({ data: [] }),
        ]);

        const hasilAll = await Promise.all(
          kategoriList.map((kategori) => getHasil(kategori.id).then((response) => response.data).catch(() => []))
        );

        const allHasil = hasilAll.flat();
        setStats({
          kategori: kategoriList.length,
          kriteria: kriteriaRes.data.length,
          aset: asetRes.data.length,
          hasil: allHasil.length,
        });
        setTopHasil(
          [...allHasil]
            .sort((a, b) => parseFloat(b.nilaiPreferensi) - parseFloat(a.nilaiPreferensi))
            .slice(0, 5)
        );
        setBuyerPayments(buyerPaymentRes.data || []);
      } catch {
        setTopHasil([]);
      }
    };

    load();
  }, [user?.role]);

  const buyerStats = {
    menang: buyerPayments.length,
    perluTindakan: buyerPayments.filter((item) => ['UNPAID', 'DITOLAK'].includes(item.statusPembayaran)).length,
    menungguVerifikasi: buyerPayments.filter((item) => item.statusPembayaran === 'PENDING_VERIFICATION').length,
    lunas: buyerPayments.filter((item) => item.statusPembayaran === 'LUNAS').length,
  };

  const defaultStats = [
    { label: 'Kategori', value: stats.kategori, icon: '🗂️' },
    { label: 'Kriteria', value: stats.kriteria, icon: '📋' },
    { label: 'Aset', value: stats.aset, icon: '🏷️' },
    { label: 'Hasil SPK', value: stats.hasil, icon: '🏆' },
  ];

  const buyerStatCards = [
    { label: 'Lelang Saya Menang', value: buyerStats.menang, icon: '🏁' },
    { label: 'Perlu Tindakan', value: buyerStats.perluTindakan, icon: '💳' },
    { label: 'Menunggu Verifikasi', value: buyerStats.menungguVerifikasi, icon: '🕒' },
    { label: 'Pembayaran Lunas', value: buyerStats.lunas, icon: '✅' },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>📊 Dashboard</h2>
        <p>
          {user?.role === 'PEMBELI'
            ? 'Pantau status invoice dan pembayaran lelang yang Anda menangkan'
            : 'Sistem Pendukung Keputusan - Penentuan Nilai Aset Lelang (AHP & SAW)'}
        </p>
      </div>

      <div className="stats-grid">
        {(user?.role === 'PEMBELI' ? buyerStatCards : defaultStats).map((item) => (
          <div key={item.label} className="stat-card">
            <div className="stat-icon">{item.icon}</div>
            <div>
              <div className="stat-label">{item.label}</div>
              <div className="stat-value">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {user?.role === 'PEMBELI' && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontSize: 16, marginBottom: 4 }}>💳 Riwayat Pembayaran Lelang Saya</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                Masuk ke room lelang untuk unduh invoice dan unggah bukti transfer.
              </p>
            </div>
            <Link to="/lelang" className="btn btn-secondary">Lihat Daftar Lelang</Link>
          </div>

          {buyerPayments.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🔨</div>
              <p>Anda belum memenangkan lelang apa pun.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Aset</th>
                    <th>Invoice</th>
                    <th>Nominal</th>
                    <th>Status</th>
                    <th>Jatuh Tempo</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {buyerPayments.slice(0, 5).map((item, index) => {
                    const topBid = item.penawaran?.[0];
                    return (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td>
                          <strong>{item.aset?.nama}</strong>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.aset?.kategori?.nama}</div>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{item.invoiceNumber || '-'}</td>
                        <td style={{ color: '#10b981', fontWeight: 700 }}>{formatRp(topBid?.nominal || 0)}</td>
                        <td>{paymentBadge(item.statusPembayaran)}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {item.paymentDueDate ? new Date(item.paymentDueDate).toLocaleString('id-ID') : '-'}
                        </td>
                        <td>
                          <Link to={`/lelang/${item.id}`} className="btn btn-primary btn-sm">
                            Buka Room
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h3 style={{ fontSize: 15, marginBottom: 16 }}>🏆 Top 5 Aset Nilai Tertinggi</h3>
        {topHasil.length === 0 ? (
          <div className="empty-state">
            <div className="icon">⚖️</div>
            <p>Belum ada hasil perhitungan SAW. Mulai dengan menambahkan data.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Aset</th>
                  <th>Kategori</th>
                  <th>Nilai Preferensi</th>
                  <th>Nilai Limit</th>
                </tr>
              </thead>
              <tbody>
                {topHasil.map((item, index) => (
                  <tr key={item.id}>
                    <td>
                      <span className={`rank-badge ${['rank-1', 'rank-2', 'rank-3'][index] || 'rank-other'}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td><strong>{item.aset?.nama}</strong></td>
                    <td>{item.aset?.kategori?.nama}</td>
                    <td>{parseFloat(item.nilaiPreferensi).toFixed(4)}</td>
                    <td style={{ color: '#10b981', fontWeight: 700 }}>{formatRp(item.nilaiLimit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card mt-4">
        <h3 style={{ fontSize: 15, marginBottom: 12 }}>📖 Panduan Penggunaan Sistem</h3>
        <ol style={{ paddingLeft: 20, lineHeight: 2, fontSize: 14, color: 'var(--text-muted)' }}>
          <li>Tambahkan <strong style={{ color: 'var(--text)' }}>Kategori</strong> (Tanah & Bangunan, Kendaraan, Elektronik)</li>
          <li>Tambahkan <strong style={{ color: 'var(--text)' }}>Kriteria</strong> untuk setiap kategori (tentukan tipe benefit/cost)</li>
          <li>Tambahkan <strong style={{ color: 'var(--text)' }}>Aset</strong> beserta harga pasar</li>
          <li>Input <strong style={{ color: 'var(--text)' }}>Nilai Kriteria</strong> untuk setiap aset</li>
          <li>Hitung <strong style={{ color: 'var(--text)' }}>AHP</strong> - input matriks pairwise comparison, validasi CR &lt; 0.1</li>
          <li>Hitung <strong style={{ color: 'var(--text)' }}>SAW</strong> - dapatkan ranking dan nilai limit aset dalam Rupiah</li>
        </ol>
      </div>
    </div>
  );
}
