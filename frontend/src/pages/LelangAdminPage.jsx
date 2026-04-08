import React, { useEffect, useMemo, useState } from 'react';
import { createLelangAndApprove, getAset, getLelangSelesaiAdmin, verifikasiPembayaranLelang } from '../services/api.js';

const formatRp = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);
const formatDate = (value) => value ? new Date(value).toLocaleString('id-ID') : '-';

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

const estimateQueue = (asetList, waktuBuka, durasiMenit) => {
  if (!waktuBuka || !durasiMenit) return null;

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

  const actualWaktuTutup = new Date(actualWaktuBuka.getTime() + Number(durasiMenit) * 60000);
  return { queuePosition, actualWaktuBuka, actualWaktuTutup };
};

export default function LelangAdminPage() {
  const [data, setData] = useState([]);
  const [dataSelesai, setDataSelesai] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSelesai, setLoadingSelesai] = useState(true);
  const [activeTab, setActiveTab] = useState('aktif');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ waktuBuka: '', durasiMenit: 60 });
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

  const scheduleEstimate = useMemo(() => estimateQueue(data, form.waktuBuka, form.durasiMenit), [data, form]);
  const formError = useMemo(() => {
    if (!form.waktuBuka) return '';
    const requested = new Date(form.waktuBuka);
    if (Number.isNaN(requested.getTime())) return 'Format waktu buka tidak valid.';
    if (requested.getTime() < Date.now()) return 'Waktu buka tidak boleh di masa lalu.';
    if (!Number(form.durasiMenit) || Number(form.durasiMenit) <= 0) return 'Durasi wajib lebih dari 0 menit.';
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
      const res = await createLelangAndApprove(modal.id, form);
      alert(res.message || 'Lelang berhasil dijadwalkan.');
      setModal(null);
      setForm({ waktuBuka: '', durasiMenit: 60 });
      load();
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifikasiPembayaran = async (lelang) => {
    if (!window.confirm(`Verifikasi pembayaran LUNAS untuk aset "${lelang.aset?.nama}"?`)) return;
    try {
      await verifikasiPembayaranLelang(lelang.id);
      alert('Pembayaran berhasil diverifikasi sebagai LUNAS.');
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
                              Tutup: {formatDate(latestLelang.waktuTutup)}
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
                                setForm({ waktuBuka: '', durasiMenit: 60 });
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
              <p>Nilai Limit: <strong>{formatRp(modal.hasil?.[0]?.nilaiLimit)}</strong></p>
            </div>

            {formError && <div className="alert alert-danger">{formError}</div>}

            <form onSubmit={handleApprove}>
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
                <label className="form-label">Durasi Lelang per Aset (menit)</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max="1440"
                  value={form.durasiMenit}
                  onChange={(event) => setForm((prev) => ({ ...prev, durasiMenit: event.target.value }))}
                  required
                />
              </div>

              {scheduleEstimate && (
                <div className="card" style={{ background: 'var(--surface-light)', marginBottom: 16 }}>
                  <h4 style={{ marginBottom: 12 }}>Estimasi Slot</h4>
                  <div style={{ display: 'grid', gap: 8, fontSize: 14 }}>
                    <div>Posisi antrean: <strong>#{scheduleEstimate.queuePosition}</strong></div>
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
    </div>
  );
}
