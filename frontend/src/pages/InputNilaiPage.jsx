import React, { useState, useEffect } from 'react';
import { getKategori, getAset, getKriteria, getNilaiAset, inputNilaiAset } from '../services/api.js';

export default function InputNilaiPage() {
  const [kategoriList, setKategoriList] = useState([]);
  const [asetList, setAsetList] = useState([]);
  const [kriteriaList, setKriteriaList] = useState([]);
  const [selectedKategori, setSelectedKategori] = useState('');
  const [selectedAset, setSelectedAset] = useState('');
  const [nilaiForm, setNilaiForm] = useState({});
  const [existingNilai, setExistingNilai] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    getKategori().then((r) => setKategoriList(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedKategori) { setAsetList([]); setKriteriaList([]); return; }
    Promise.all([getAset(selectedKategori), getKriteria(selectedKategori)])
      .then(([aRes, kRes]) => { setAsetList(aRes.data); setKriteriaList(kRes.data); })
      .catch(() => {});
    setSelectedAset('');
    setNilaiForm({});
  }, [selectedKategori]);

  useEffect(() => {
    if (!selectedAset) { setNilaiForm({}); return; }
    getNilaiAset(selectedAset).then((r) => {
      const existing = r.data;
      setExistingNilai(existing);
      const map = {};
      existing.forEach((n) => { map[n.kriteriaId] = String(n.nilai); });
      // Isi dari yang sudah ada, sisanya kosong
      kriteriaList.forEach((k) => { if (!map[k.id]) map[k.id] = ''; });
      setNilaiForm(map);
    }).catch(() => {});
  }, [selectedAset, kriteriaList]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nilai_list = kriteriaList.map((k) => ({ kriteria_id: k.id, nilai: nilaiForm[k.id] }));
    const empty = nilai_list.filter((n) => n.nilai === '' || n.nilai === undefined);
    if (empty.length > 0) return setAlert({ type: 'danger', msg: 'Semua nilai kriteria wajib diisi!' });

    setLoading(true); setAlert(null);
    try {
      await inputNilaiAset({ aset_id: selectedAset, nilai_list });
      setAlert({ type: 'success', msg: '✅ Nilai berhasil disimpan!' });
    } catch (e) {
      setAlert({ type: 'danger', msg: e.message });
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h2>✏️ Input Nilai Kriteria</h2>
        <p>Input nilai setiap aset berdasarkan kriteria pada kategorinya</p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">1. Pilih Kategori</label>
            <select className="form-control" value={selectedKategori} onChange={(e) => setSelectedKategori(e.target.value)}>
              <option value="">-- Pilih Kategori --</option>
              {kategoriList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">2. Pilih Aset</label>
            <select className="form-control" value={selectedAset} onChange={(e) => setSelectedAset(e.target.value)} disabled={!selectedKategori}>
              <option value="">-- Pilih Aset --</option>
              {asetList.map((a) => <option key={a.id} value={a.id}>{a.nama}</option>)}
            </select>
          </div>
        </div>
      </div>

      {selectedAset && kriteriaList.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>3. Input Nilai Kriteria</h3>
          {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {kriteriaList.map((k) => (
                <div key={k.id} className="form-group">
                  <label className="form-label">
                    {k.nama}
                    <span className={`badge ${k.tipe === 'benefit' ? 'badge-success' : 'badge-warning'}`} style={{ marginLeft: 8 }}>
                      {k.tipe}
                    </span>
                  </label>
                  <input
                    type="number" step="any" className="form-control"
                    value={nilaiForm[k.id] || ''}
                    onChange={(e) => setNilaiForm({ ...nilaiForm, [k.id]: e.target.value })}
                    placeholder="Masukkan nilai..."
                  />
                </div>
              ))}
            </div>
            <div className="mt-4">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner" /> : '💾 Simpan Nilai'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Jika kategori dipilih tapi BELUM ADA kriteria sama sekali */}
      {selectedKategori && kriteriaList.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="icon">⚠️</div>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Kategori ini belum memiliki data kriteria</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Tambahkan kriteria terlebih dahulu melalui menu <strong>Master Data → Kriteria</strong>,
              kemudian kembali ke halaman ini untuk melakukan input nilai.
            </p>
          </div>
        </div>
      )}

      {selectedKategori && kriteriaList.length > 0 && !selectedAset && (
        <div className="card">
          <div className="empty-state"><div className="icon">👆</div><p>Pilih aset untuk mulai input nilai kriteria</p></div>
        </div>
      )}
    </div>
  );
}
