import React, { useState, useEffect } from 'react';
import { getKategori, getAset, getKriteria, getHasil } from '../services/api.js';

const formatRp = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export default function DashboardPage() {
  const [stats, setStats] = useState({ kategori: 0, kriteria: 0, aset: 0, hasil: 0 });
  const [kategoriList, setKategoriList] = useState([]);
  const [topHasil, setTopHasil] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const kRes = await getKategori();
        const kl = kRes.data;
        setKategoriList(kl);
        const [aRes, krRes] = await Promise.all([getAset(), getKriteria()]);
        
        // Ambil hasil dari semua kategori
        const hasilAll = await Promise.all(kl.map((k) => getHasil(k.id).then((r) => r.data).catch(() => [])));
        const allHasil = hasilAll.flat();
        
        setStats({ kategori: kl.length, kriteria: krRes.data.length, aset: aRes.data.length, hasil: allHasil.length });
        setTopHasil(allHasil.sort((a, b) => parseFloat(b.nilaiPreferensi) - parseFloat(a.nilaiPreferensi)).slice(0, 5));
      } catch {}
    };
    load();
  }, []);

  const statCards = [
    { label: 'Kategori', value: stats.kategori, icon: '🗂️' },
    { label: 'Kriteria', value: stats.kriteria, icon: '📋' },
    { label: 'Aset', value: stats.aset, icon: '🏷️' },
    { label: 'Hasil SPK', value: stats.hasil, icon: '🏆' },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>📊 Dashboard</h2>
        <p>Sistem Pendukung Keputusan — Penentuan Nilai Aset Lelang (AHP & SAW)</p>
      </div>

      <div className="stats-grid">
        {statCards.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, marginBottom: 16 }}>🏆 Top 5 Aset Nilai Tertinggi</h3>
        {topHasil.length === 0 ? (
          <div className="empty-state"><div className="icon">⚖️</div><p>Belum ada hasil perhitungan SAW. Mulai dengan menambahkan data.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Rank</th><th>Aset</th><th>Kategori</th><th>Nilai Preferensi</th><th>Nilai Limit</th></tr></thead>
              <tbody>
                {topHasil.map((item, i) => (
                  <tr key={item.id}>
                    <td>
                      <span className={`rank-badge ${['rank-1','rank-2','rank-3'][i] || 'rank-other'}`}>{i + 1}</span>
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
          <li>Hitung <strong style={{ color: 'var(--text)' }}>AHP</strong> — input matriks pairwise comparison, validasi CR &lt; 0.1</li>
          <li>Hitung <strong style={{ color: 'var(--text)' }}>SAW</strong> — dapatkan ranking & nilai limit aset dalam Rupiah</li>
        </ol>
      </div>
    </div>
  );
}
