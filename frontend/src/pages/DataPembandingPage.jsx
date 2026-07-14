import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Plus, BarChart2, AlertTriangle, ExternalLink, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { useModal } from '../context/ModalContext';
import {
  getPembandingByAset,
  searchPembanding,
  getScrapingJobStatus,
  addManualPembanding,
  hitungMedianPembanding,
  selectPembanding,
} from '../services/api';

// ─── Polling interval untuk status job (ms) ───────────────────────────────────
const POLL_INTERVAL_MS = 3000;

const DataPembandingPage = () => {
  const { showAlert } = useModal();
  const { asetId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [hargaReferensi, setHargaReferensi] = useState(null);
  const [tingkatKeyakinan, setTingkatKeyakinan] = useState(null);
  const [skorKeyakinan, setSkorKeyakinan] = useState(null);
  const [alasanKeyakinan, setAlasanKeyakinan] = useState(null);
  const [loading, setLoading] = useState(false);

  // Async job state
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null); // null | 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'FAILED'
  const [isSearching, setIsSearching] = useState(false);
  const pollTimerRef = useRef(null);

  // Form Manual
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualData, setManualData] = useState({
    judul: '', sumber: '', sourceUrl: '', harga: '',
    lokasi: '', tahun: '', kondisi: '', spesifikasi: '',
  });

  useEffect(() => {
    fetchData();
    return () => clearInterval(pollTimerRef.current);
  }, [asetId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getPembandingByAset(asetId);
      setData(res.data || []);
      setHargaReferensi(res.hargaReferensiPasar);
      setTingkatKeyakinan(res.tingkatKeyakinan);
      setSkorKeyakinan(res.skorKeyakinan);
      setAlasanKeyakinan(res.alasanKeyakinan);
    } catch {
      showAlert('Gagal mengambil data pembanding', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── Poll job status setiap POLL_INTERVAL_MS ────────────────────────────────
  const startPolling = (newJobId) => {
    clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await getScrapingJobStatus(asetId, newJobId);
        const state = res.data?.status;
        setJobStatus(state);

        if (state === 'COMPLETED') {
          clearInterval(pollTimerRef.current);
          setIsSearching(false);
          fetchData();
        } else if (state === 'FAILED' || state === 'NOT_FOUND') {
          clearInterval(pollTimerRef.current);
          setIsSearching(false);
          showAlert(`Proses scraping ${state === 'FAILED' ? 'gagal' : 'tidak ditemukan'}. Coba lagi.`, 'error');
        }
      } catch {
        clearInterval(pollTimerRef.current);
        setIsSearching(false);
      }
    }, POLL_INTERVAL_MS);
  };

  // ─── Trigger scraping job ────────────────────────────────────────────────────
  const handleSearch = async () => {
    try {
      setIsSearching(true);
      setJobStatus('WAITING');
      const res = await searchPembanding(asetId);

      if (res.jobId) {
        // Async mode dengan BullMQ
        setJobId(res.jobId);
        startPolling(res.jobId);
      } else {
        // Fallback synchronous mode
        showAlert(res.message || 'Pencarian selesai', 'success');
        setIsSearching(false);
        fetchData();
      }
    } catch (error) {
      showAlert(error.message || 'Gagal mencari data', 'error');
      setIsSearching(false);
      setJobStatus(null);
    }
  };

  const handleToggleSelect = async (id, currentStatus) => {
    try {
      await selectPembanding(id, { dipilihPenjual: !currentStatus });
      fetchData();
    } catch {
      showAlert('Gagal mengubah status', 'error');
    }
  };

  const handleHitungMedian = async () => {
    const selectedCount = data.filter(
      (d) => d.dipilihPenjual && d.statusValidasi !== 'DITOLAK'
    ).length;
    if (selectedCount < 3) {
      showAlert('Minimal pilih 3 data pembanding yang tidak ditolak', 'warning');
      return;
    }
    try {
      const res = await hitungMedianPembanding(asetId);
      showAlert(res.message, 'success');
      // ── Simpan median dari response SEBELUM fetchData
      const medianValue = Number(res.data.median);
      const hasil = res.data.hasil;
      // Refresh tabel
      await fetchData();
      if (medianValue && medianValue > 0) {
        setHargaReferensi(medianValue);
      }
      if (hasil) {
        setTingkatKeyakinan(hasil.tingkatKeyakinan);
        setSkorKeyakinan(hasil.skorKeyakinan ? Number(hasil.skorKeyakinan) : null);
        setAlasanKeyakinan(hasil.alasanKeyakinan);
      }
    } catch (error) {
      showAlert(error.message || 'Gagal menghitung referensi pasar', 'error');
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      await addManualPembanding(asetId, manualData);
      showAlert('Data manual berhasil ditambahkan', 'success');
      setShowManualForm(false);
      setManualData({ judul: '', sumber: '', sourceUrl: '', harga: '', lokasi: '', tahun: '', kondisi: '', spesifikasi: '' });
      fetchData();
    } catch (error) {
      showAlert(error.message || 'Gagal menambahkan data manual', 'error');
    }
  };

  const formatRupiah = (angka) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angka);

  // ─── Job Status Progress Bar ─────────────────────────────────────────────────
  const getJobStatusLabel = () => {
    if (!jobStatus) return '';
    const labels = {
      WAITING: 'Menunggu antrean...',
      ACTIVE: 'Sedang scraping marketplace...',
      COMPLETED: 'Scraping selesai!',
      FAILED: 'Scraping gagal',
    };
    return labels[jobStatus] || jobStatus;
  };

  const getJobStatusColor = () => {
    if (jobStatus === 'COMPLETED') return 'progress-success';
    if (jobStatus === 'FAILED') return 'progress-error';
    return 'progress-info';
  };

  // ─── Outlier Badge ─────────────────────────────────────────────────────────
  const OutlierBadge = ({ isOutlier }) =>
    isOutlier ? (
      <span
        className="badge"
        style={{ background: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid var(--warning)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
        title="Terdeteksi sebagai outlier (IQR) — harga terlalu jauh dari rata-rata"
      >
        <AlertTriangle size={12} /> Outlier
      </span>
    ) : null;

  // ─── Similarity Score Bar ──────────────────────────────────────────────────
  const SimilarityBar = ({ similarity, skor }) => {
    const pct = similarity != null
      ? Math.round(Number(similarity) * 100)
      : (skor ?? 80);
    const colorClass = pct >= 80 ? 'text-success' : pct >= 50 ? 'text-warning' : 'text-error';
    return (
      <div className="flex flex-col items-center">
        <div
          className={`radial-progress ${colorClass} text-xs`}
          style={{ '--value': pct, '--size': '2.5rem' }}
        >
          {pct}%
        </div>
        {similarity != null && (
          <span className="text-xs text-gray-400 mt-1">Fuse.js</span>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Data Pembanding Aset</h1>
          <p className="text-gray-600">Cari dan pilih minimal 3 data pembanding untuk aset ini.</p>
        </div>
        <button onClick={() => navigate('/aset')} className="btn btn-secondary">Kembali</button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-base-100 shadow-xl p-6">
          <h2 className="card-title text-primary mb-2">Harga Referensi Pasar</h2>
          <div className="text-3xl font-bold">
            {hargaReferensi ? formatRupiah(hargaReferensi) : 'Belum dihitung'}
          </div>

          {tingkatKeyakinan && (
            <div className="mt-4 p-3 rounded-lg border bg-base-200 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold uppercase text-gray-500">Keyakinan Data</span>
                <span className={`badge badge-sm font-bold text-[10px] ${
                  tingkatKeyakinan === 'TINGGI' ? 'badge-success' :
                  tingkatKeyakinan === 'SEDANG' ? 'badge-warning' : 'badge-error'
                }`}>
                  {tingkatKeyakinan} ({skorKeyakinan ? `${skorKeyakinan}%` : '-'})
                </span>
              </div>
              {alasanKeyakinan?.alasan && alasanKeyakinan.alasan.length > 0 && (
                <ul className="list-disc pl-4 space-y-1 text-gray-500">
                  {alasanKeyakinan.alasan.map((alasan, index) => (
                    <li key={index}>{alasan}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <p className="text-sm text-gray-500 mt-2">
            Dihitung dari median data pembanding non-outlier yang dipilih.
          </p>
        </div>

        <div className="card bg-base-100 shadow-xl p-6 md:col-span-2 flex flex-col justify-center gap-4">
          <div className="flex gap-4">
            <button
              className={`btn btn-primary flex-1 ${isSearching ? 'disabled' : ''}`}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? <span className="loading loading-spinner" /> : <><Search size={16} /> Cari Otomatis</>}
            </button>
            <button
              className="btn btn-secondary flex-1"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={() => setShowManualForm(!showManualForm)}
            >
              <Plus size={16} /> Tambah Manual
            </button>
            <button
              className="btn btn-primary flex-1"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={handleHitungMedian}
            >
              <BarChart2 size={16} /> Hitung Referensi
            </button>
          </div>

          {/* Progress Bar Scraping Job */}
          {isSearching && (
            <div className="w-full">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{getJobStatusLabel()}</span>
                {jobId && <span className="text-gray-300">Job: {jobId.slice(0, 8)}…</span>}
              </div>
              <progress className={`progress ${getJobStatusColor()} w-full`} />
            </div>
          )}

          {/* Legend */}
          <div className="flex gap-4 text-xs text-gray-500 flex-wrap" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><LinkIcon size={12} style={{ color: 'var(--success)' }} /> Link produk langsung</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Search size={12} style={{ color: 'var(--warning)' }} /> Link halaman pencarian</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={12} style={{ color: 'var(--warning)' }} /> Outlier IQR (harga tidak wajar)</span>
          </div>
        </div>
      </div>

      {/* Manual Form */}
      {showManualForm && (
        <div className="card bg-base-100 shadow-xl mb-8 p-6">
          <h3 className="font-bold text-lg mb-4">Tambah Data Manual</h3>
          <form onSubmit={handleManualSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="input input-bordered" placeholder="Judul Iklan/Aset" value={manualData.judul} onChange={(e) => setManualData({ ...manualData, judul: e.target.value })} required />
            <input className="input input-bordered" placeholder="Sumber (Misal: OLX, Carmudi)" value={manualData.sumber} onChange={(e) => setManualData({ ...manualData, sumber: e.target.value })} required />
            <input className="input input-bordered" placeholder="URL Sumber (harus https://...)" type="url" value={manualData.sourceUrl} onChange={(e) => setManualData({ ...manualData, sourceUrl: e.target.value })} required />
            <input className="input input-bordered" placeholder="Harga" type="number" value={manualData.harga} onChange={(e) => setManualData({ ...manualData, harga: e.target.value })} required />
            <input className="input input-bordered" placeholder="Tahun" type="number" value={manualData.tahun} onChange={(e) => setManualData({ ...manualData, tahun: e.target.value })} />
            <input className="input input-bordered" placeholder="Lokasi" value={manualData.lokasi} onChange={(e) => setManualData({ ...manualData, lokasi: e.target.value })} />
            <button type="submit" className="btn btn-primary md:col-span-2">Simpan</button>
          </form>
        </div>
      )}

      {/* Data Table */}
      <div className="card bg-base-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead className="bg-base-200">
              <tr>
                <th>Pilih</th>
                <th>Judul &amp; Sumber</th>
                <th>Harga</th>
                <th>Detail</th>
                <th>Kecocokan</th>
                <th>Status Validasi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-4"><span className="loading loading-spinner" /></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-4">Belum ada data pembanding. Klik &quot;Cari Otomatis&quot; untuk memulai.</td></tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className={item.isOutlier ? 'opacity-70' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        checked={item.dipilihPenjual}
                        onChange={() => handleToggleSelect(item.id, item.dipilihPenjual)}
                      />
                    </td>
                    <td>
                      <div className="font-bold flex items-center gap-2">
                        {item.judul}
                        <OutlierBadge isOutlier={item.isOutlier} />
                      </div>
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                        title={item.sourceUrl}
                      >
                        {item.sumber}
                        {item.sourceUrl && (item.sourceUrl.includes('/search?') || item.sourceUrl.includes('/items/q-') || item.sourceUrl.includes('/cari/'))
                          ? <span title="Link halaman pencarian — klik untuk verifikasi manual" style={{ color: 'var(--warning)', display: 'inline-flex', alignItems: 'center' }}><Search size={12} /></span>
                          : <span title="Link produk langsung dari sumber" style={{ color: 'var(--success)', display: 'inline-flex', alignItems: 'center' }}><LinkIcon size={12} /></span>
                        }
                      </a>
                    </td>
                    <td className="font-semibold text-green-600">{formatRupiah(item.harga)}</td>
                    <td className="text-sm">
                      {item.tahun && <div>Tahun: {item.tahun}</div>}
                      {item.lokasi && <div>Lokasi: {item.lokasi}</div>}
                      {item.kondisi && <div className="text-gray-400 text-xs">{item.kondisi}</div>}
                    </td>
                    <td>
                      <SimilarityBar similarity={item.similarity} skor={item.skorKecocokan} />
                    </td>
                    <td>
                      <span className={`badge ${
                        item.statusValidasi === 'DITERIMA' ? 'badge-success' :
                        item.statusValidasi === 'DITOLAK' ? 'badge-error' : 'badge-warning'
                      }`}>
                        {item.statusValidasi}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataPembandingPage;
