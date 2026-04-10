import React, { useState, useEffect } from 'react';
import { getKategori, getKriteria, hitungAHP } from '../services/api.js';
import { Calculator, AlertTriangle, BarChart2, CheckCircle, XCircle } from 'lucide-react';

// Konversi nilai AHP ke skala saaty
const skala = [1/9, 1/8, 1/7, 1/6, 1/5, 1/4, 1/3, 1/2, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const skalaTeks = (v) => {
  if (v === 1) return '1';
  if (v > 1) return v.toString();
  return `1/${Math.round(1/v)}`;
};

export default function AHPPage() {
  const [kategoriList, setKategoriList] = useState([]);
  const [kriteriaList, setKriteriaList] = useState([]);
  const [selectedKategori, setSelectedKategori] = useState('');
  const [matrix, setMatrix] = useState([]);
  const [hasil, setHasil] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    getKategori().then((r) => setKategoriList(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedKategori) { setKriteriaList([]); setMatrix([]); setHasil(null); return; }
    getKriteria(selectedKategori).then((r) => {
      const kl = r.data;
      setKriteriaList(kl);
      const n = kl.length;
      // Init matriks identitas n x n
      setMatrix(Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : null))));
      setHasil(null);
    }).catch(() => {});
  }, [selectedKategori]);

  const setVal = (i, j, val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return;
    setMatrix((prev) => {
      const m = prev.map((r) => [...r]);
      m[i][j] = num;
      m[j][i] = parseFloat((1 / num).toFixed(8));
      return m;
    });
  };

  const handleHitung = async () => {
    // Validasi: semua sel harus terisi
    const incomplete = matrix.some((row) => row.some((v) => v === null || v === undefined));
    if (incomplete) return setAlert({ type: 'warning', msg: 'Lengkapi semua nilai perbandingan!' });

    setLoading(true); setAlert(null); setHasil(null);
    try {
      const res = await hitungAHP({ kategori_id: selectedKategori, matrix });
      setHasil(res.data);
      if (res.success) setAlert({ type: 'success', msg: res.message });
    } catch (err) {
      setAlert({ type: 'danger', msg: err.message });
    } finally { setLoading(false); }
  };

  const n = kriteriaList.length;

  return (
    <div>
      <div className="page-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Calculator /> Perhitungan AHP</h2>
        <p>Input matriks pairwise comparison untuk menentukan bobot setiap kriteria</p>
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

      {n >= 2 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16 }}>Matriks Pairwise Comparison ({n} x {n})</h3>
            <div className="alert alert-info" style={{ margin: 0, padding: '6px 12px', fontSize: 12 }}>
              Skala: 1=Sama | 3=Sedang | 5=Kuat | 7=Sangat Kuat | 9=Mutlak
            </div>
          </div>

          <div className="table-wrapper">
            <table className="table matrix-table">
              <thead>
                <tr>
                  <th></th>
                  {kriteriaList.map((k) => <th key={k.id}>{k.nama}</th>)}
                </tr>
              </thead>
              <tbody>
                {kriteriaList.map((row, i) => (
                  <tr key={row.id}>
                    <th>{row.nama}</th>
                    {kriteriaList.map((col, j) => (
                      <td key={col.id}>
                        {i === j ? (
                          <div className="matrix-diagonal">1</div>
                        ) : i < j ? (
                          <select
                            className="matrix-input"
                            value={matrix[i]?.[j] ?? ''}
                            onChange={(e) => setVal(i, j, e.target.value)}
                          >
                            <option value="">-</option>
                            {skala.map((s) => (
                              <option key={s} value={s}>{skalaTeks(s)}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="matrix-mirror" style={{ padding: 6, textAlign: 'center', fontSize: 13 }}>
                            {matrix[i]?.[j] !== null ? skalaTeks(parseFloat(matrix[i]?.[j]?.toFixed(4))) : '-'}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={handleHitung} disabled={loading}>
              {loading ? <span className="spinner" /> : <><Calculator size={18} /> Hitung AHP</>}
            </button>
          </div>
        </div>
      )}

      {selectedKategori && n < 2 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <div style={{ marginBottom: 16 }}><AlertTriangle size={48} color="var(--warning)" opacity={0.8} /></div>
          <h3 style={{ marginBottom: 8, color: 'var(--text)' }}>Kriteria Tidak Cukup</h3>
          <p>Kategori ini memiliki kurang dari 2 kriteria. Perhitungan AHP membutuhkan setidaknya 2 kriteria untuk saling dibandingkan.</p>
          <p style={{ marginTop: 8 }}>Silakan tambahkan kriteria baru pada menu <strong>Master Data &gt; Kriteria</strong> terlebih dahulu.</p>
        </div>
      )}

      {alert && <div className={`alert alert-${alert.type}`} style={{ whiteSpace: 'pre-wrap' }}>{alert.msg}</div>}

      {hasil && (
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 16 }}><BarChart2 /> Hasil Perhitungan AHP</h3>

          {/* CR Status */}
          <div className={`alert alert-${hasil.isConsistent ? 'success' : 'danger'}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
            {hasil.isConsistent ? <CheckCircle size={18} /> : <XCircle size={18} />}
            <span><strong>Consistency Ratio (CR) = {hasil.CR}</strong>{' - '}{hasil.isConsistent ? 'Konsisten (CR < 0.1)' : 'Tidak Konsisten (CR ≥ 0.1)'}</span>
          </div>

          {/* Detail Bobot */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <h4 style={{ fontSize: 14, marginBottom: 12, color: 'var(--text-muted)' }}>Bobot Kriteria (Eigen Vector)</h4>
              <table className="table">
                <thead><tr><th>Kriteria</th><th>Tipe</th><th>Bobot (Wi)</th></tr></thead>
                <tbody>
                  {hasil.kriteria?.map((k) => (
                    <tr key={k.id}>
                      <td>{k.nama}</td>
                      <td><span className={`badge ${k.tipe === 'benefit' ? 'badge-success' : 'badge-warning'}`}>{k.tipe}</span></td>
                      <td><strong>{(k.bobot * 100).toFixed(2)}%</strong></td>
                    </tr>
                  ))}
                  <tr><td colSpan={2}><strong>Total</strong></td><td><strong>100%</strong></td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <h4 style={{ fontSize: 14, marginBottom: 12, color: 'var(--text-muted)' }}>Indikator Konsistensi</h4>
              <table className="table">
                <tbody>
                  {[
                    ['n (Jumlah Kriteria)', hasil.n],
                    ['λmax', hasil.lambdaMax],
                    ['CI (Consistency Index)', hasil.CI],
                    ['RI (Random Index)', hasil.RI],
                    ['CR (Consistency Ratio)', hasil.CR],
                  ].map(([label, val]) => (
                    <tr key={label}><td style={{ color: 'var(--text-muted)' }}>{label}</td><td><strong>{val}</strong></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
