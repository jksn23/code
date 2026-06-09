import React, { useState, useEffect, useCallback } from 'react';
import { getKategori, getAset, getKriteria, getNilaiAset, inputNilaiAset } from '../services/api.js';
import { PenSquare, X, CheckCircle2, LayoutList, Package, FolderTree, ListOrdered } from 'lucide-react';

// ─── Helper ──────────────────────────────────────────────────────────
const formatRupiah = (val) =>
  val != null
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
    : '—';

// ─── Modal komponen pengisian nilai ──────────────────────────────────
const SCALE_OPTIONS = Array.from({ length: 10 }, (_, index) => String(index + 1));
const DYNAMIC_VALUE_PATTERNS = [
  /kilometer/i,
  /\bkm\b/i,
  /tahun produksi/i,
  /tahun kendaraan/i,
  /usia pemakaian/i,
];

const isDynamicValueCriteria = (kriteria) =>
  DYNAMIC_VALUE_PATTERNS.some((pattern) => pattern.test(kriteria.nama || ''));

const normalizeNilaiForInput = (kriteria, value) => {
  if (value == null || value === '') return '';
  const textValue = String(value);
  if (isDynamicValueCriteria(kriteria)) return textValue;

  const numericValue = Number(textValue);
  if (Number.isInteger(numericValue) && numericValue >= 1 && numericValue <= 10) {
    return String(numericValue);
  }
  return textValue;
};

const getDynamicPlaceholder = (kriteria) => {
  const nama = (kriteria.nama || '').toLowerCase();
  if (nama.includes('kilometer') || /\bkm\b/.test(nama)) return 'Contoh: 23000';
  if (nama.includes('tahun')) return 'Contoh: 2023';
  if (nama.includes('usia')) return 'Contoh: 3';
  return 'Masukkan angka nilai asli...';
};

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
        const existingMap = {};
        existing.forEach((item) => {
          existingMap[item.kriteriaId] = item.nilai;
        });
        const map = {};
        kriteriaList.forEach((k) => {
          map[k.id] = normalizeNilaiForInput(k, existingMap[k.id]);
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

    const invalidScale = kriteriaList.filter((k) => {
      if (isDynamicValueCriteria(k)) return false;
      const value = Number(nilaiForm[k.id]);
      return !Number.isInteger(value) || value < 1 || value > 10;
    });
    if (invalidScale.length > 0) {
      setAlert({ type: 'danger', msg: 'Kriteria berskala tetap hanya boleh bernilai 1 sampai 10.' });
      return;
    }

    const invalidDynamic = kriteriaList.filter((k) => {
      if (!isDynamicValueCriteria(k)) return false;
      const value = Number(nilaiForm[k.id]);
      return Number.isNaN(value) || value < 0;
    });
    if (invalidDynamic.length > 0) {
      setAlert({ type: 'danger', msg: 'Kriteria dinamis harus diisi dengan angka asli yang valid.' });
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
              {kriteriaList.map((k) => {
                const isDynamic = isDynamicValueCriteria(k);
                return (
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
                    {isDynamic ? (
                      <>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          className="form-control"
                          value={nilaiForm[k.id] || ''}
                          onChange={(e) => setNilaiForm((prev) => ({ ...prev, [k.id]: e.target.value }))}
                          placeholder={getDynamicPlaceholder(k)}
                          required
                        />
                        <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                          Isi angka asli sesuai data aset.
                        </small>
                      </>
                    ) : (
                      <>
                        <select
                          className="form-control"
                          value={nilaiForm[k.id] || ''}
                          onChange={(e) => setNilaiForm((prev) => ({ ...prev, [k.id]: e.target.value }))}
                          required
                        >
                          <option value="">Pilih nilai 1-10</option>
                          {SCALE_OPTIONS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                        <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                          Skala penilaian tetap 1-10.
                        </small>
                      </>
                    )}
                  </div>
                );
              })}
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
        const asets = asetRes.data || [];
        setAsetList(asets);
        setKriteriaList(kriteriaRes.data || []);

        const initialSaved = new Set();
        asets.forEach(a => {
          if (a.nilaiAset && a.nilaiAset.length > 0) {
            initialSaved.add(a.id);
          }
        });
        setSavedAsetIds(initialSaved);
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
            <div>Skala tetap menggunakan dropdown 1-10.</div>
            <div>Nilai dinamis seperti kilometer, tahun produksi, dan usia pemakaian tetap diisi angka asli.</div>
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
