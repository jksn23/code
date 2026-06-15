import React, { useEffect, useMemo, useState } from 'react';
import { createLelangAndApprove, getAset, getLelangSelesaiAdmin, verifikasiPembayaranLelang } from '../services/api.js';
import CurrencyInput from '../components/CurrencyInput';
import { assetUrl } from '../config/env.js';

const formatRp = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);
const formatDate = (value) => value ? new Date(value).toLocaleString('id-ID') : '-';
const DEFAULT_DURATION_SECONDS = 60;
const LAST_SCHEDULE_KEY = 'lelang:lastScheduleSettings';

const statusBadge = (status, options) => {
  const map = options || {
    ACTIVE: { color: '#16a34a', bg: '#dcfce3' },
    PENDING: { color: '#b45309', bg: '#fef3c7' },
    FINISHED: { color: '#2563eb', bg: '#dbeafe' },
  };
  const tone = map[status] || { color: '#555', bg: '#f3f4f6' };
  return (
    <span className="badge" style={{ backgroundColor: tone.bg, color: tone.color, fontWeight: 600 }}>
      {status}
    </span>
  );
};

const readLastScheduleSettings = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LAST_SCHEDULE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const durasiDetik = Number(parsed?.durasiDetik);
    if (!parsed?.waktuBuka || !Number.isInteger(durasiDetik) || durasiDetik <= 0) return null;
    return { waktuBuka: parsed.waktuBuka, durasiDetik };
  } catch {
    return null;
  }
};

const saveLastScheduleSettings = (settings) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_SCHEDULE_KEY, JSON.stringify(settings));
};

const formatDuration = (seconds) => {
  const total = Number(seconds);
  if (!Number.isFinite(total) || total <= 0) return '-';
  if (total % 60 === 0) return `${total} detik (${total / 60} menit)`;
  return `${total} detik`;
};

const buildScheduleForm = (aset, lastScheduleSettings) => ({
  waktuBuka: lastScheduleSettings?.waktuBuka || '',
  durasiDetik: lastScheduleSettings?.durasiDetik || DEFAULT_DURATION_SECONDS,
  nilaiLimitAkhir: Number(aset?.hasil?.[0]?.nilaiLimit || 0),
});

const estimateQueue = (asetList, waktuBuka, durasiDetik) => {
  if (!waktuBuka || !durasiDetik) return null;

  const requestedStart = new Date(waktuBuka);
  if (Number.isNaN(requestedStart.getTime())) return null;

  const scheduled = asetList
    .flatMap((item) => item.lelang || [])
    .filter((item) => ['PENDING', 'ACTIVE'].includes(item.status) && item.waktuBuka && item.waktuTutup)
    .sort((a, b) => new Date(a.waktuBuka) - new Date(b.waktuBuka));

  let actualWaktuBuka = new Date(requestedStart);
  let queuePosition = 1;

  scheduled.forEach((item) => {
    const existingStart = new Date(item.waktuBuka);
    const existingEnd = new Date(item.waktuTutup);
    if (actualWaktuBuka >= existingStart && actualWaktuBuka < existingEnd) {
      actualWaktuBuka = new Date(existingEnd);
      queuePosition += 1;
    }
  });

  const actualWaktuTutup = new Date(actualWaktuBuka.getTime() + Number(durasiDetik) * 1000);
  return { queuePosition, actualWaktuBuka, actualWaktuTutup };
};

export default function LelangAdminPage() {
  const [data, setData] = useState([]);
  const [dataSelesai, setDataSelesai] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSelesai, setLoadingSelesai] = useState(true);
  const [activeTab, setActiveTab] = useState('aktif');
  const [modal, setModal] = useState(null);
  const [modalBuktiBayar, setModalBuktiBayar] = useState(null);
  const [lastScheduleSettings, setLastScheduleSettings] = useState(() => readLastScheduleSettings());
  const [form, setForm] = useState({ waktuBuka: '', durasiDetik: DEFAULT_DURATION_SECONDS, nilaiLimitAkhir: 0 });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAset();
      const filtered = (res.data || []).filter((item) => item.statusLelang !== 'DRAFT');
      setData(filtered);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSelesai = async () => {
    setLoadingSelesai(true);
    try {
      const res = await getLelangSelesaiAdmin();
      setDataSelesai(res.data || []);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoadingSelesai(false);
    }
  };

  useEffect(() => {
    load();
    loadSelesai();
  }, []);

  const scheduleEstimate = useMemo(() => estimateQueue(data, form.waktuBuka, form.durasiDetik), [data, form]);
  const formError = useMemo(() => {
    if (!form.waktuBuka) return '';
    const requested = new Date(form.waktuBuka);
    if (Number.isNaN(requested.getTime())) return 'Format waktu buka tidak valid.';
    if (requested.getTime() < Date.now()) return 'Waktu buka tidak boleh di masa lalu.';
    if (!Number.isInteger(Number(form.durasiDetik)) || Number(form.durasiDetik) <= 0) return 'Durasi wajib berupa angka bulat lebih dari 0 detik.';
    return '';
  }, [form]);

  const handleApprove = async (event) => {
    event.preventDefault();
    if (formError) {
      alert(formError);
      return;
    }

    setSubmitting(true);
    try {
      const res = await createLelangAndApprove(modal.id, {
        waktuBuka: form.waktuBuka,
        durasiDetik: Number(form.durasiDetik),
        nilaiLimit: form.nilaiLimitAkhir
      });
      const nextLastScheduleSettings = {
        waktuBuka: form.waktuBuka,
        durasiDetik: Number(form.durasiDetik),
      };
      saveLastScheduleSettings(nextLastScheduleSettings);
      setLastScheduleSettings(nextLastScheduleSettings);
      alert(res.message || 'Lelang berhasil dijadwalkan.');
      setModal(null);
      setForm({ waktuBuka: '', durasiDetik: DEFAULT_DURATION_SECONDS, nilaiLimitAkhir: 0 });
      load();
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifikasiPembayaran = (lelang) => {
    setModalBuktiBayar(lelang);
  };

  const executeVerifikasiPembayaran = async () => {
    if (!modalBuktiBayar) return;
    try {
      await verifikasiPembayaranLelang(modalBuktiBayar.id);
      alert('Pembayaran berhasil diverifikasi sebagai LUNAS.');
      setModalBuktiBayar(null);
      loadSelesai();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>⏱️ Manajemen Lelang</h2>
        <p>Atur slot lelang dengan validasi jadwal yang lebih aman dan pantau transaksi pasca lelang.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className={`btn ${activeTab === 'aktif' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('aktif')}>
          📋 Jadwalkan Lelang
        </button>
        <button className={`btn ${activeTab === 'selesai' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('selesai')}>
          ✅ Verifikasi Pembayaran ({dataSelesai.length})
        </button>
      </div>

      {activeTab === 'aktif' && (
        <div className="card">
          {loading ? (
            <div className="empty-state"><span className="spinner" /></div>
          ) : data.length === 0 ? (
            <div className="empty-state"><p>Belum ada pengajuan lelang.</p></div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Aset</th>
                    <th>Penjual</th>
                    <th>Nilai Limit</th>
                    <th>Status</th>
                    <th>Jadwal Terakhir</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => {
                    const latestLelang = item.lelang?.[item.lelang.length - 1];
                    return (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td>
                          <strong>{item.nama}</strong>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.kategori?.nama}</div>
                        </td>
                        <td>{item.penjual?.user?.nama || '-'}</td>
                        <td style={{ color: '#16a34a', fontWeight: 700 }}>{formatRp(item.hasil?.[0]?.nilaiLimit || 0)}</td>
                        <td>{statusBadge(item.statusLelang)}</td>
                        <td style={{ fontSize: 12 }}>
                          {latestLelang ? (
                            <>
                              Buka: {formatDate(latestLelang.waktuBuka)}<br />
                              Tutup: {formatDate(latestLelang.waktuTutup)}<br />
                              Durasi: {formatDuration(latestLelang.durasiMenit)}
                            </>
                          ) : 'Belum dijadwalkan'}
                        </td>
                        <td>
                          {item.statusLelang === 'PENDING' && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => {
                                setModal(item);
                                setForm(buildScheduleForm(item, lastScheduleSettings));
                              }}
                            >
                              Sahkan & Jadwalkan
                            </button>
                          )}
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

      {activeTab === 'selesai' && (
        <div className="card">
          {loadingSelesai ? (
            <div className="empty-state"><span className="spinner" /></div>
          ) : dataSelesai.length === 0 ? (
            <div className="empty-state"><p>Belum ada lelang yang selesai.</p></div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Aset</th>
                    <th>Pemenang</th>
                    <th>Penawaran Tertinggi</th>
                    <th>Waktu Selesai</th>
                    <th>Status Bayar</th>
                    <th>Status Barang</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {dataSelesai.map((item, index) => {
                    const topBid = item.penawaran?.[0];
                    const isPaid = item.statusPembayaran === 'LUNAS';
                    const isReceived = item.statusBarang === 'DITERIMA';
                    return (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td>
                          <strong>{item.aset?.nama}</strong>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.aset?.kategori?.nama}</div>
                        </td>
                        <td>
                          {item.pemenang ? (
                            <>
                              <div style={{ fontWeight: 700 }}>{item.pemenang.nama}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.pemenang.email}</div>
                            </>
                          ) : 'Tidak ada penawaran'}
                        </td>
                        <td style={{ fontWeight: 700, color: '#16a34a' }}>{topBid ? formatRp(topBid.nominal) : '-'}</td>
                        <td style={{ fontSize: 12 }}>{formatDate(item.waktuTutup)}</td>
                        <td>
                          <span className="badge" style={{ background: isPaid ? '#dcfce7' : '#fef3c7', color: isPaid ? '#166534' : '#92400e' }}>
                            {item.statusPembayaran}
                          </span>
                        </td>
                        <td>
                          <span className="badge" style={{ background: isReceived ? '#dcfce7' : '#dbeafe', color: isReceived ? '#166534' : '#1d4ed8' }}>
                            {item.statusBarang}
                          </span>
                        </td>
                        <td>
                          {!isPaid && item.pemenang && (
                            <button type="button" className="btn btn-primary btn-sm" onClick={() => handleVerifikasiPembayaran(item)}>
                              ✅ Tandai Lunas
                            </button>
                          )}
                          {isPaid && !isReceived && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Menunggu konfirmasi pembeli</span>}
                          {isPaid && isReceived && <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>🎉 Selesai</span>}
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

      {modal && (
        <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Sahkan Jadwal Lelang</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <p>Aset: <strong>{modal.nama}</strong></p>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                Saran Harga Sistem (SPK): <strong style={{ color: 'var(--primary)' }}>{formatRp(modal.hasil?.[0]?.nilaiLimit)}</strong>
              </div>

              {/* Detail Kategori Spesifik */}
              {modal.assetProperty && (
                <div style={{ padding: 12, background: 'var(--surface-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>📋 Detail Properti</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                    <div>Sertifikat: <strong>{modal.assetProperty.certificateNumber}</strong></div>
                    <div>Pemilik: <strong>{modal.assetProperty.ownerName}</strong></div>
                    <div>Luas Tanah: <strong>{modal.assetProperty.landArea} m²</strong></div>
                    <div>Luas Bangunan: <strong>{modal.assetProperty.buildingArea || '-'} m²</strong></div>
                    <div>NJOP/m²: <strong>{formatRp(modal.assetProperty.njopPerM2)}</strong></div>
                    <div>Base Value: <strong>{formatRp(modal.assetProperty.basePropertyValue)}</strong></div>
                    <div>Lokasi: <strong>{modal.assetProperty.village}, {modal.assetProperty.district}, {modal.assetProperty.city}, {modal.assetProperty.province}</strong></div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    {modal.assetProperty.propertyPhoto && <a href={assetUrl(modal.assetProperty.propertyPhoto)} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">📷 Foto Properti</a>}
                    {modal.assetProperty.certificateFile && <a href={assetUrl(modal.assetProperty.certificateFile)} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">📄 Sertifikat</a>}
                  </div>
                </div>
              )}

              {modal.assetVehicle && (
                <div style={{ padding: 12, background: 'var(--surface-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>🚗 Detail Kendaraan</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                    <div>Merek: <strong>{modal.assetVehicle.brand}</strong></div>
                    <div>Tipe: <strong>{modal.assetVehicle.type}</strong></div>
                    <div>Tahun: <strong>{modal.assetVehicle.year}</strong></div>
                    <div>Warna: <strong>{modal.assetVehicle.color}</strong></div>
                    <div>Plat: <strong>{modal.assetVehicle.plateNumber}</strong></div>
                    <div>No. Mesin: <strong>{modal.assetVehicle.engineNumber}</strong></div>
                    <div>No. Rangka: <strong>{modal.assetVehicle.chassisNumber}</strong></div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    {modal.assetVehicle.vehiclePhoto && <a href={assetUrl(modal.assetVehicle.vehiclePhoto)} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">📷 Foto</a>}
                    {modal.assetVehicle.bpkbFile && <a href={assetUrl(modal.assetVehicle.bpkbFile)} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">📄 BPKB</a>}
                    {modal.assetVehicle.stnkFile && <a href={assetUrl(modal.assetVehicle.stnkFile)} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">📄 STNK</a>}
                  </div>
                </div>
              )}

              {modal.assetElectronic && (
                <div style={{ padding: 12, background: 'var(--surface-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>💻 Detail Elektronik</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                    <div>Merek: <strong>{modal.assetElectronic.brand}</strong></div>
                    <div>Seri: <strong>{modal.assetElectronic.series}</strong></div>
                    <div>Tipe: <strong>{modal.assetElectronic.type}</strong></div>
                  </div>
                  {modal.assetElectronic.itemPhoto && (
                    <div style={{ marginTop: 8 }}>
                      <a href={assetUrl(modal.assetElectronic.itemPhoto)} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">📷 Foto Barang</a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {lastScheduleSettings && (
              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 12, marginBottom: 16, background: 'var(--surface-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Pengaturan waktu terakhir</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                      {formatDate(lastScheduleSettings.waktuBuka)} - {formatDuration(lastScheduleSettings.durasiDetik)}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setForm((prev) => ({
                      ...prev,
                      waktuBuka: lastScheduleSettings.waktuBuka,
                      durasiDetik: lastScheduleSettings.durasiDetik,
                    }))}
                  >
                    Gunakan
                  </button>
                </div>
              </div>
            )}

            {formError && <div className="alert alert-danger">{formError}</div>}

            <form onSubmit={handleApprove}>
              <div className="form-group">
                <label className="form-label">Harga Akhir Lelang (Nilai Limit Final)</label>
                <CurrencyInput
                  value={form.nilaiLimitAkhir}
                  onChange={(val) => setForm((prev) => ({ ...prev, nilaiLimitAkhir: val }))}
                  required
                />
                <small style={{ color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  Harga ini yang akan dikunci sebagai harga patokan minimum lelang.
                </small>
              </div>
              <div className="form-group">
                <label className="form-label">Waktu Pembukaan Slot Acuan</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={form.waktuBuka}
                  onChange={(event) => setForm((prev) => ({ ...prev, waktuBuka: event.target.value }))}
                  required
                />
                <small style={{ color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  Sistem akan menggeser slot otomatis jika bentrok dengan lelang aktif/pending lain.
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Durasi Lelang per Aset (detik)</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max="86400"
                  step="1"
                  value={form.durasiDetik}
                  onChange={(event) => setForm((prev) => ({ ...prev, durasiDetik: event.target.value }))}
                  required
                />
                <small style={{ color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  Masukkan satuan detik. Contoh: 2 menit = 120 detik.
                </small>
              </div>

              {scheduleEstimate && (
                <div className="card" style={{ background: 'var(--surface-light)', marginBottom: 16 }}>
                  <h4 style={{ marginBottom: 12 }}>Estimasi Slot</h4>
                  <div style={{ display: 'grid', gap: 8, fontSize: 14 }}>
                    <div>Posisi antrean: <strong>#{scheduleEstimate.queuePosition}</strong></div>
                    <div>Durasi: <strong>{formatDuration(form.durasiDetik)}</strong></div>
                    <div>Mulai aktual: <strong>{formatDate(scheduleEstimate.actualWaktuBuka)}</strong></div>
                    <div>Tutup aktual: <strong>{formatDate(scheduleEstimate.actualWaktuTutup)}</strong></div>
                  </div>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting || Boolean(formError)}>
                  {submitting ? 'Menyimpan...' : 'Terbitkan Lelang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Bukti Pembayaran */}
      {modalBuktiBayar && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModalBuktiBayar(null)}>
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: 18 }}>Verifikasi Bukti Pembayaran</h3>
              <button className="theme-toggle-btn" onClick={() => setModalBuktiBayar(null)}>&times;</button>
            </div>
            <div style={{ padding: '16px 0', textAlign: 'center' }}>
              <p style={{ marginBottom: 16, fontSize: 14, color: 'var(--text-muted)' }}>
                Bukti transfer untuk aset <strong>{modalBuktiBayar.aset?.nama}</strong>.
              </p>
              {modalBuktiBayar.buktiBayarUrl ? (
                <img 
                  src={assetUrl(modalBuktiBayar.buktiBayarUrl)} 
                  alt="Bukti Pembayaran" 
                  style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: 'var(--radius-md)', objectFit: 'contain', border: '1px solid var(--border)' }} 
                />
              ) : (
                <div style={{ padding: 32, background: 'var(--surface-light)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                  Pembeli belum mengunggah bukti pembayaran atau tautan tidak valid.
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setModalBuktiBayar(null)}>Tutup</button>
              <button 
                className="btn btn-primary" 
                onClick={executeVerifikasiPembayaran}
              >
                ✅ Sahkan Pembayaran LUNAS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
