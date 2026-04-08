import React, { useState, useEffect } from 'react';
import { getKategori, hitungSAW } from '../services/api.js';

const formatRp = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export default function SAWPage() {
  const [kategoriList, setKategoriList] = useState([]);
  const [selectedKategori, setSelectedKategori] = useState('');
  const [hasil, setHasil] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showDetail, setShowDetail] = useState(null);

  useEffect(() => {
    getKategori().then((r) => setKategoriList(r.data)).catch(() => {});
  }, []);

  const handleHitung = async () => {
    if (!selectedKategori) return setAlert({ type: 'warning', msg: 'Pilih kategori terlebih dahulu' });
    setLoading(true); setAlert(null); setHasil(null);
    try {
      const res = await hitungSAW({ kategori_id: selectedKategori });
      setHasil(res.data);
      setAlert({ type: 'success', msg: `✅ Perhitungan SAW selesai. ${res.data.jumlahAset} aset berhasil diranking.` });
    } catch (err) {
      setAlert({ type: 'danger', msg: err.message });
    } finally { setLoading(false); }
  };

  const rankClass = (r) => r === 1 ? 'rank-1' : r === 2 ? 'rank-2' : r === 3 ? 'rank-3' : 'rank-other';

  return (
    <div>
      <div className="page-header">
        <h2>⚖️ Perhitungan SAW</h2>
        <p>Hitung nilai preferensi dan nilai limit aset menggunakan Simple Additive Weighting</p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="flex gap-3" style={{ alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label">Pilih Kategori</label>
            <select className="form-control" value={selectedKategori} onChange={(e) => { setSelectedKategori(e.target.value); setHasil(null); setAlert(null); }}>
              <option value="">-- Pilih Kategori --</option>
              {kategoriList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
          </div>
          <button className="btn btn-success" onClick={handleHitung} disabled={loading || !selectedKategori}>
            {loading ? <span className="spinner" /> : '⚖️ Hitung SAW'}
          </button>
        </div>
        <div className="alert alert-info mt-2" style={{ fontSize: 12 }}>
          ℹ️ Pastikan AHP sudah dihitung terlebih dahulu untuk kategori ini. Bobot kriteria dari AHP akan digunakan dalam SAW.
        </div>
      </div>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      {hasil && (
        <>
          {/* Bobot Kriteria digunakan */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Kriteria & Bobot AHP yang Digunakan</h3>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Kriteria</th><th>Tipe</th><th>Bobot</th><th>Max Nilai</th><th>Min Nilai</th></tr></thead>
                <tbody>
                  {hasil.detailKriteria?.map((k) => (
                    <tr key={k.id}>
                      <td>{k.nama}</td>
                      <td><span className={`badge ${k.tipe === 'benefit' ? 'badge-success' : 'badge-warning'}`}>{k.tipe}</span></td>
                      <td><strong>{(k.bobot * 100).toFixed(2)}%</strong></td>
                      <td>{k.max}</td>
                      <td>{k.min}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Hasil Ranking */}
          <div className="card">
            <h3 style={{ fontSize: 15, marginBottom: 16 }}>🏆 Hasil Perankingan & Nilai Limit Aset</h3>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr><th>Rank</th><th>Nama Aset</th><th>Harga Pasar</th><th>Nilai Preferensi (Vi)</th><th>Nilai Limit</th><th>Detail</th></tr>
                </thead>
                <tbody>
                  {hasil.ranking?.map((item) => (
                    <React.Fragment key={item.id}>
                      <tr>
                        <td><span className={`rank-badge ${rankClass(item.ranking)}`}>{item.ranking}</span></td>
                        <td><strong>{item.nama}</strong></td>
                        <td>{formatRp(item.hargaPasar)}</td>
                        <td><strong>{item.nilaiPreferensi}</strong></td>
                        <td style={{ color: '#10b981', fontWeight: 700 }}>{formatRp(item.nilaiLimit)}</td>
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => setShowDetail(showDetail === item.id ? null : item.id)}>
                            {showDetail === item.id ? '▲ Tutup' : '▼ Detail'}
                          </button>
                        </td>
                      </tr>
                      {showDetail === item.id && (
                        <tr>
                          <td colSpan={6} style={{ padding: '12px 24px', background: 'rgba(0,0,0,0.2)' }}>
                            <strong style={{ fontSize: 13 }}>Detail Normalisasi SAW untuk {item.nama}:</strong>
                            <table style={{ marginTop: 8 }}>
                              <thead>
                                <tr><th>Kriteria</th><th>Tipe</th><th>Nilai Asli</th><th>Bobot (Wj)</th><th>Nilai Norm (Rij)</th><th>Kontribusi (Wi*Rij)</th></tr>
                              </thead>
                              <tbody>
                                {item.detailNormalisasi?.map((d) => (
                                  <tr key={d.kriteriaId}>
                                    <td>{d.namaKriteria}</td>
                                    <td><span className={`badge ${d.tipe === 'benefit' ? 'badge-success' : 'badge-warning'}`}>{d.tipe}</span></td>
                                    <td>{d.nilaiAsli}</td>
                                    <td>{(d.bobot * 100).toFixed(2)}%</td>
                                    <td>{d.nilaiNorm}</td>
                                    <td><strong>{d.kontribusi}</strong></td>
                                  </tr>
                                ))}
                                <tr>
                                  <td colSpan={5} style={{ textAlign: 'right' }}><strong>Vi (Total)</strong></td>
                                  <td><strong style={{ color: 'var(--primary-light)' }}>{item.nilaiPreferensi}</strong></td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
