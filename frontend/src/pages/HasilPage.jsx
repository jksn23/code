import React, { useState, useEffect } from 'react';
import { getKategori, getHasil } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Trophy, Scale } from 'lucide-react';

const formatRp = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export default function HasilPage() {
  const { user } = useAuth();
  const [kategoriList, setKategoriList] = useState([]);
  const [selectedKategori, setSelectedKategori] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getKategori().then((r) => setKategoriList(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedKategori) { setData([]); return; }
    setLoading(true);
    getHasil(selectedKategori).then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [selectedKategori]);

  const rankClass = (i) => ['rank-1', 'rank-2', 'rank-3'][i] || 'rank-other';

  return (
    <div>
      <div className="page-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Trophy size={24} /> Hasil & Ranking Aset</h2>
        <p>Tampilan hasil akhir nilai limit aset berdasarkan kategori</p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Pilih Kategori</label>
          <select className="form-control" value={selectedKategori} onChange={(e) => setSelectedKategori(e.target.value)}>
            <option value="">-- Pilih Kategori --</option>
            {kategoriList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><span className="spinner" /></div>
      ) : data.length > 0 ? (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Nama Aset</th>
                  <th>Kategori</th>
                  <th>Nilai Preferensi (Vi)</th>
                  <th>Nilai Limit (Rp)</th>
                  <th>Terhitung</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, i) => (
                  <tr key={item.id}>
                    <td><span className={`rank-badge ${rankClass(i)}`}>{i + 1}</span></td>
                    <td><strong>{item.aset?.nama}</strong></td>
                    <td>{item.aset?.kategori?.nama}</td>
                    <td>{parseFloat(item.nilaiPreferensi).toFixed(6)}</td>
                    <td style={{ color: '#10b981', fontWeight: 700 }}>{formatRp(item.nilaiLimit)}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(item.createdAt).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : selectedKategori ? (
        <div className="card">
          <div className="empty-state">
            <div style={{ marginBottom: 12 }}><Scale size={48} opacity={0.3} /></div>
            <p>{user?.role === 'ADMIN' ? 'Belum ada hasil. Jalankan perhitungan SAW terlebih dahulu.' : 'Data Belum Tersedia'}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
