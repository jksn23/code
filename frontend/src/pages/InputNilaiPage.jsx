import React, { useState, useEffect, useCallback } from 'react';
import { getKategori, getAset, getKriteria, getNilaiAset, inputNilaiAset } from '../services/api.js';
import { PenSquare, X, CheckCircle2, LayoutList, Package, AlertCircle, FolderTree, ListOrdered } from 'lucide-react';

// ─── Helper ──────────────────────────────────────────────────────────
const formatRupiah = (val) =>
  val != null
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
    : '—';

// ─── Modal komponen pengisian nilai ──────────────────────────────────
function InputNilaiModal({ aset, kriteriaList, onClose, onSaved }) {
  const [nilaiForm, setNilaiForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingNilai, setLoadingNilai] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    setLoadingNilai(true);
    getNilaiAset(aset.id)
      .then((res) => {
        const existing = res.data || [];
        const map = {};
        existing.forEach((item) => {
          map[item.kriteriaId] = String(item.nilai);
        });
        kriteriaList.forEach((k) => {
          if (!map[k.id]) map[k.id] = '';
        });
        setNilaiForm(map);
      })
      .catch(() => {
        const map = {};
        kriteriaList.forEach((k) => { map[k.id] = ''; });
        setNilaiForm(map);
      })
      .finally(() => setLoadingNilai(false));
  }, [aset.id, kriteriaList]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nilai_list = kriteriaList.map((k) => ({
      kriteria_id: k.id,
      nilai: nilaiForm[k.id],
    }));
    const empty = nilai_list.filter((item) => item.nilai === '' || item.nilai == null);
    if (empty.length > 0) {
      setAlert({ type: 'danger', msg: 'Semua nilai kriteria wajib diisi.' });
      return;
    }
    setLoading(true);
    setAlert(null);
    try {
      await inputNilaiAset({ aset_id: aset.id, nilai_list });
      setAlert({ type: 'success', msg: 'Nilai berhasil disimpan.' });
      setTimeout(() => {
        onSaved(aset.id);
        onClose();
      }, 900);
    } catch (err) {
      setAlert({ type: 'danger', msg: err.message || 'Gagal menyimpan nilai.' });
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: 17, marginBottom: 4 }}>Input Nilai Kriteria</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{aset.nama}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="theme-toggle-btn"
            style={{ flexShrink: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        {loadingNilai ? (
          <div className="empty-state" style={{ padding: '32px 0' }}>Memuat nilai...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

            <div style={{ display: 'grid', gap: 14 }}>
              {kriteriaList.map((k) => (
                <div key={k.id} className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    {k.nama}
                    <span
                      className={`badge ${k.tipe === 'benefit' ? 'badge-success' : 'badge-warning'}`}
                      style={{ marginLeft: 8 }}
                    >
                      {k.tipe}
                    </span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    className="form-control"
                    value={nilaiForm[k.id] || ''}
                    onChange={(e) => setNilaiForm((prev) => ({ ...prev, [k.id]: e.target.value }))}
                    placeholder="Masukkan angka nilai..."
                  />
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Batal
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner" /> : <><CheckCircle2 size={15} /> Simpan Nilai</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Halaman utama ────────────────────────────────────────────────────
export default function InputNilaiPage() {
  const [kategoriList, setKategoriList] = useState([]);
  const [asetList, setAsetList] = useState([]);
  const [kriteriaList, setKriteriaList] = useState([]);
  const [selectedKategori, setSelectedKategori] = useState('');
  const [loadingAset, setLoadingAset] = useState(false);
  const [savedAsetIds, setSavedAsetIds] = useState(new Set());

  // Aset yang sedang dibuka modal
  const [modalAset, setModalAset] = useState(null);

  useEffect(() => {
    getKategori()
      .then((res) => setKategoriList(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedKategori) {
      setAsetList([]);
      setKriteriaList([]);
      setSavedAsetIds(new Set());
      return;
    }

    setLoadingAset(true);
    Promise.all([getAset(selectedKategori), getKriteria(selectedKategori)])
      .then(([asetRes, kriteriaRes]) => {
        setAsetList(asetRes.data || []);
        setKriteriaList(kriteriaRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoadingAset(false));
  }, [selectedKategori]);

  const handleSaved = useCallback((asetId) => {
    setSavedAsetIds((prev) => new Set([...prev, asetId]));
  }, []);

  const selectedKategoriName = kategoriList.find((k) => String(k.id) === String(selectedKategori))?.nama;

  return (
    <div>
      <div className="page-header">
        <h2>Input Nilai Kriteria</h2>
        <p>Pilih kategori untuk melihat daftar aset, lalu klik tombol <strong>Input Nilai</strong> pada aset yang ingin dinilai</p>
      </div>

      {/* Panduan */}
      <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, rgba(129,140,248,0.10), rgba(52,211,153,0.07))' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, fontSize: 14 }}>
          <div>
            <strong style={{ display: 'block', marginBottom: 10, fontSize: 15 }}>Panduan Pengisian</strong>
            <ol style={{ paddingLeft: 18, display: 'grid', gap: 7, color: 'var(--text)' }}>
              <li>Pilih <strong>kategori</strong> di bawah ini.</li>
              <li>Daftar aset dalam kategori tersebut akan muncul dalam tabel.</li>
              <li>Klik tombol <strong>"Input Nilai"</strong> pada baris aset yang ingin dinilai.</li>
              <li>Isi semua kolom di popup, lalu klik <strong>Simpan Nilai</strong>.</li>
            </ol>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'grid', gap: 6, alignContent: 'start' }}>
            <strong style={{ color: 'var(--text)', fontSize: 14 }}>Catatan Teknis</strong>
            <div>• Bobot kriteria ditetapkan masing-masing melalui proses <strong>AHP</strong>.</div>
            <div>• Nilai <strong>benefit</strong>: semakin tinggi semakin baik.</div>
            <div>• Nilai <strong>cost</strong>: isi angka asli — sistem akan mengolahnya di perhitungan SAW.</div>
            <div>• Gunakan skala yang <strong>konsisten</strong> untuk seluruh aset dalam satu kategori.</div>
          </div>
        </div>
      </div>

      {/* Pilih Kategori */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 300px' }}>
            <label className="form-label">Pilih Kategori Aset</label>
            <select
              className="form-control"
              value={selectedKategori}
              onChange={(e) => setSelectedKategori(e.target.value)}
            >
              <option value="">-- Pilih Kategori --</option>
              {kategoriList.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          </div>
          {selectedKategoriName && (
            <div style={{ paddingTop: 20 }}>
              <span className="badge badge-primary" style={{ fontSize: 13, padding: '6px 14px' }}>
                <LayoutList size={13} style={{ display: 'inline', marginRight: 5 }} />
                {selectedKategoriName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* State: belum pilih kategori */}
      {!selectedKategori && (
        <div className="card">
          <div className="empty-state">
            <div style={{ marginBottom: 12 }}><FolderTree size={48} opacity={0.3} strokeWidth={1.5} /></div>
            <p style={{ fontWeight: 600, marginBottom: 6 }}>Pilih kategori terlebih dahulu</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Daftar aset akan muncul di sini setelah Anda memilih kategori di atas.</p>
          </div>
        </div>
      )}

      {/* State: loading */}
      {selectedKategori && loadingAset && (
        <div className="card">
          <div className="empty-state">Memuat daftar aset...</div>
        </div>
      )}

      {/* State: tidak ada kriteria */}
      {selectedKategori && !loadingAset && kriteriaList.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div style={{ marginBottom: 12 }}><ListOrdered size={48} opacity={0.3} strokeWidth={1.5} /></div>
            <p style={{ fontWeight: 600, marginBottom: 6 }}>Belum ada kriteria untuk kategori ini</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Tambahkan kriteria melalui menu <strong>Master Data &gt; Kriteria</strong>, kemudian kembali ke sini.
            </p>
          </div>
        </div>
      )}

      {/* State: tidak ada aset */}
      {selectedKategori && !loadingAset && kriteriaList.length > 0 && asetList.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div style={{ marginBottom: 12 }}><Package size={48} opacity={0.3} strokeWidth={1.5} /></div>
            <p style={{ fontWeight: 600, marginBottom: 6 }}>Belum ada aset dalam kategori ini</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Tambahkan aset melalui menu <strong>Manajemen Aset</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Tabel Aset */}
      {selectedKategori && !loadingAset && kriteriaList.length > 0 && asetList.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Header tabel */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: 15, marginBottom: 2 }}>Daftar Aset — {selectedKategoriName}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {asetList.length} aset &bull; {kriteriaList.length} kriteria
              </p>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
              Sudah dinilai &nbsp;|&nbsp;
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)', display: 'inline-block' }} />
              Belum dinilai
            </div>
          </div>

          <div className="table-wrapper" style={{ border: 0, borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 48 }}>No</th>
                  <th>Nama Aset</th>
                  <th>Harga Pasar</th>
                  <th>Kategori</th>
                  <th>Status Nilai</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {asetList.map((aset, idx) => {
                  const isSaved = savedAsetIds.has(aset.id);
                  return (
                    <tr key={aset.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{aset.nama}</div>
                        {aset.deskripsi && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {aset.deskripsi}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {aset.hargaPasar ? formatRupiah(aset.hargaPasar) : '—'}
                      </td>
                      <td>
                        <span className="badge badge-primary">{aset.kategori?.nama || selectedKategoriName}</span>
                      </td>
                      <td>
                        {isSaved ? (
                          <span className="badge badge-success">✓ Tersimpan</span>
                        ) : (
                          <span className="badge" style={{ background: 'var(--surface-light)', color: 'var(--text-muted)' }}>
                            Belum dinilai
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setModalAset(aset)}
                          style={{ gap: 6 }}
                        >
                          <PenSquare size={13} />
                          Input Nilai
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal popup */}
      {modalAset && (
        <InputNilaiModal
          aset={modalAset}
          kriteriaList={kriteriaList}
          onClose={() => setModalAset(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
