import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getLelangSummary } from '../services/api.js';

const formatRp = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v || 0);

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '-';

const formatTime = (d) =>
  d ? new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';

export default function AuctionSummaryPage() {
  const [searchParams] = useSearchParams();
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getLelangSummary(date);
        setSummary(res.data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [date]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="spinner" />
    </div>
  );

  if (error) return (
    <div className="alert alert-danger" style={{ margin: 24 }}>
      {error} — <Link to="/lelang">Kembali ke Daftar Lelang</Link>
    </div>
  );

  if (!summary || summary.totalLelang === 0) return (
    <div>
      <div className="page-header">
        <h2>📋 Ringkasan Lelang</h2>
        <p>{formatDate(date)}</p>
      </div>
      <div className="card">
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <p>Tidak ada sesi lelang yang selesai pada tanggal ini.</p>
          <Link to="/lelang" className="btn btn-primary" style={{ marginTop: 12 }}>
            Kembali ke Daftar Lelang
          </Link>
        </div>
      </div>
    </div>
  );

  const surplus = summary.totalPendapatan - summary.totalNilaiLimit;
  const surplusPercent = summary.totalNilaiLimit > 0
    ? ((surplus / summary.totalNilaiLimit) * 100).toFixed(1)
    : 0;

  return (
    <div>
      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 60%, #4f46e5 100%)',
        borderRadius: 16,
        padding: '36px 40px',
        marginBottom: 24,
        color: '#fff',
      }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
          Ringkasan Sesi Lelang
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>
          🏛️ {formatDate(date)}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', margin: 0 }}>
          Semua sesi lelang pada tanggal ini telah selesai
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          {
            label: 'Total Objek Lelang',
            value: summary.totalLelang,
            sub: `${summary.totalTerjual} terjual`,
            icon: '🔨',
            color: '#6366f1',
          },
          {
            label: 'Total Nilai Limit (SPK)',
            value: formatRp(summary.totalNilaiLimit),
            sub: 'Berdasarkan hasil AHP-SAW',
            icon: '⚖️',
            color: '#f59e0b',
          },
          {
            label: 'Total Pendapatan Lelang',
            value: formatRp(summary.totalPendapatan),
            sub: 'Harga penawaran tertinggi',
            icon: '💰',
            color: '#10b981',
          },
          {
            label: 'Surplus dari Nilai Limit',
            value: formatRp(surplus),
            sub: `+${surplusPercent}% di atas limit`,
            icon: '📈',
            color: surplus >= 0 ? '#10b981' : '#ef4444',
          },
        ].map((s) => (
          <div key={s.label} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '20px 24px',
          }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1.2 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabel Detail per Objek */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0 }}>📦 Detail Setiap Objek Lelang</h3>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>No</th>
                <th>Aset</th>
                <th>Kategori</th>
                <th>Penjual</th>
                <th>Waktu</th>
                <th>Nilai Limit</th>
                <th>Harga Terjual</th>
                <th>Pemenang</th>
                <th>Pembayaran</th>
              </tr>
            </thead>
            <tbody>
              {summary.lelangList.map((l, i) => {
                const bidTertinggi = l.penawaran?.[0];
                const nilaiLimit = parseFloat(l.aset?.hasil?.[0]?.nilaiLimit || 0);
                const hargaTerjual = bidTertinggi ? parseFloat(bidTertinggi.nominal) : 0;
                const selisih = hargaTerjual - nilaiLimit;

                return (
                  <tr key={l.id}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{i + 1}</td>
                    <td>
                      <strong style={{ display: 'block' }}>{l.aset?.nama}</strong>
                    </td>
                    <td>
                      <span className="badge badge-primary" style={{ fontSize: 11 }}>
                        {l.aset?.kategori?.nama}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>{l.aset?.penjual?.user?.nama || '-'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      <div>{formatTime(l.waktuBuka)}</div>
                      <div>– {formatTime(l.waktuTutup)}</div>
                    </td>
                    <td style={{ color: '#f59e0b', fontWeight: 700, fontSize: 13 }}>
                      {formatRp(nilaiLimit)}
                    </td>
                    <td>
                      {hargaTerjual > 0 ? (
                        <div>
                          <div style={{ fontWeight: 700, color: '#10b981' }}>{formatRp(hargaTerjual)}</div>
                          <div style={{ fontSize: 11, color: selisih >= 0 ? '#10b981' : '#ef4444' }}>
                            {selisih >= 0 ? '+' : ''}{formatRp(selisih)}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Tidak ada bid</span>
                      )}
                    </td>
                    <td>
                      {l.pemenang ? (
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>🏆 {l.pemenang.nama}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.pemenang.email}</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>—</span>
                      )}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: 99,
                        fontSize: 12,
                        fontWeight: 700,
                        background: l.statusPembayaran === 'LUNAS' ? '#dcfce7' : '#fef3c7',
                        color: l.statusPembayaran === 'LUNAS' ? '#16a34a' : '#92400e',
                      }}>
                        {l.statusPembayaran === 'LUNAS' ? '✅ LUNAS' : '⏳ BELUM'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'center' }}>
        <Link to="/lelang" className="btn btn-secondary" style={{ padding: '12px 28px' }}>
          Kembali ke Daftar Lelang
        </Link>
        <Link to="/laporan" className="btn btn-primary" style={{ padding: '12px 28px' }}>
          📊 Lihat Laporan Lengkap
        </Link>
      </div>
    </div>
  );
}
