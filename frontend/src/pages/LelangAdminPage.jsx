import React, { useEffect, useState } from 'react';
import {
  getAset,
  createLelangAndApprove,
  getLelangSelesaiAdmin,
  verifikasiPembayaranLelang,
  tolakPembayaranLelang,
  getInvoiceLelang,
} from '../services/api.js';
import { downloadInvoicePdf } from '../utils/invoice';

const formatRp = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v || 0);
const formatDate = (d) => (d ? new Date(d).toLocaleString('id-ID') : '-');

const paymentStatusUi = (status) => {
  const map = {
    UNPAID: { label: 'Belum Upload', bg: '#fef3c7', color: '#b45309' },
    PENDING_VERIFICATION: { label: 'Menunggu Verifikasi', bg: '#dbeafe', color: '#1d4ed8' },
    LUNAS: { label: 'Lunas', bg: '#dcfce7', color: '#16a34a' },
    DITOLAK: { label: 'Ditolak', bg: '#fee2e2', color: '#b91c1c' },
  };
  return map[status] || { label: status || '-', bg: '#e2e8f0', color: '#475569' };
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
  const [reviewModal, setReviewModal] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAset();
      const filtered = res.data.filter((item) => item.statusLelang !== 'DRAFT');
      setData(filtered);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSelesai = async () => {
    setLoadingSelesai(true);
    try {
      const res = await getLelangSelesaiAdmin();
      setDataSelesai(res.data);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoadingSelesai(false);
    }
  };

  useEffect(() => {
    load();
    loadSelesai();
  }, []);

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!form.waktuBuka || !form.durasiMenit) return alert('Isi tanggal buka dan durasi lelang');

    setSubmitting(true);
    try {
      await createLelangAndApprove(modal.id, form);
      alert('Jadwal berhasil dibuat. Waktu buka dan tutup dihitung berdasarkan antrean.');
      setModal(null);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openReviewModal = async (lelang) => {
    setReviewModal({
      lelang,
      invoice: null,
      note: lelang.catatanPembayaran || '',
      loading: true,
      submitting: false,
      error: '',
    });

    try {
      const res = await getInvoiceLelang(lelang.id);
      setReviewModal({
        lelang,
        invoice: res.data,
        note: lelang.catatanPembayaran || res.data.catatanPembayaran || '',
        loading: false,
        submitting: false,
        error: '',
      });
    } catch (err) {
      setReviewModal({
        lelang,
        invoice: null,
        note: lelang.catatanPembayaran || '',
        loading: false,
        submitting: false,
        error: err.message,
      });
    }
  };

  const closeReviewModal = () => setReviewModal(null);

  const handleVerifikasiPembayaran = async () => {
    if (!reviewModal?.lelang) return;
    if (!window.confirm(`Verifikasi pembayaran LUNAS untuk aset "${reviewModal.lelang.aset?.nama}"?`)) return;

    setReviewModal((prev) => ({ ...prev, submitting: true }));
    try {
      await verifikasiPembayaranLelang(reviewModal.lelang.id, { catatan: reviewModal.note });
      alert('Pembayaran berhasil diverifikasi sebagai LUNAS');
      closeReviewModal();
      loadSelesai();
    } catch (err) {
      alert(err.message);
      setReviewModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleTolakPembayaran = async () => {
    if (!reviewModal?.lelang) return;
    if (!reviewModal.note?.trim()) return alert('Catatan penolakan wajib diisi');
    if (!window.confirm(`Tolak bukti pembayaran untuk aset "${reviewModal.lelang.aset?.nama}"?`)) return;

    setReviewModal((prev) => ({ ...prev, submitting: true }));
    try {
      await tolakPembayaranLelang(reviewModal.lelang.id, { catatan: reviewModal.note });
      alert('Pembayaran ditolak. Pemenang harus mengunggah ulang bukti.');
      closeReviewModal();
      loadSelesai();
    } catch (err) {
      alert(err.message);
      setReviewModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const statusBadge = (status, options) => {
    const map = options || {
      ACTIVE: { color: '#16a34a', bg: '#dcfce3' },
      PENDING: { color: '#b45309', bg: '#fef3c7' },
      FINISHED: { color: '#2563eb', bg: '#dbeafe' },
    };
    const item = map[status] || { color: '#555', bg: '#f3f4f6' };
    return (
      <span className="badge" style={{ backgroundColor: item.bg, color: item.color, fontWeight: 600 }}>
        {status}
      </span>
    );
  };

  return (
    <div>
      <div className="page-header">
        <h2>⏱️ Manajemen Lelang</h2>
        <p>Kelola jadwal lelang, invoice pembayaran, dan verifikasi bukti transfer pemenang.</p>
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
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Aset</th>
                    <th>Penjual</th>
                    <th>Nilai Limit Dasar</th>
                    <th>Status</th>
                    <th>Jadwal</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => {
                    const hasil = item.hasil?.[0];
                    const lelang = item.lelang?.[item.lelang.length - 1];
                    return (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td>
                          <strong>{item.nama}</strong>
                          <br />
                          <small>{item.kategori?.nama}</small>
                        </td>
                        <td>{item.penjual?.user?.nama || '-'}</td>
                        <td style={{ color: '#10b981', fontWeight: 600 }}>
                          {hasil ? formatRp(hasil.nilaiLimit) : 'Belum Dihitung'}
                        </td>
                        <td>{statusBadge(item.statusLelang)}</td>
                        <td>
                          {lelang ? (
                            <div style={{ fontSize: 12 }}>
                              Buka: {formatDate(lelang.waktuBuka)}
                              <br />
                              Tutup: {formatDate(lelang.waktuTutup)}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          {item.statusLelang === 'PENDING' && (
                            <button className="btn btn-primary btn-sm" onClick={() => setModal(item)}>
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
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Aset</th>
                    <th>Pemenang</th>
                    <th>Penawaran Tertinggi</th>
                    <th>Invoice</th>
                    <th>Bukti Bayar</th>
                    <th>Waktu Selesai</th>
                    <th>Status Bayar</th>
                    <th>Status Barang</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {dataSelesai.map((item, index) => {
                    const topBid = item.penawaran?.[0];
                    const paymentUi = paymentStatusUi(item.statusPembayaran);
                    const isPaid = item.statusPembayaran === 'LUNAS';
                    const isReceived = item.statusBarang === 'DITERIMA';

                    return (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td>
                          <strong>{item.aset?.nama}</strong>
                          <br />
                          <small>{item.aset?.kategori?.nama}</small>
                        </td>
                        <td>
                          {item.pemenang ? (
                            <div>
                              <div style={{ fontWeight: 600 }}>{item.pemenang.nama}</div>
                              <small style={{ color: 'var(--text-muted)' }}>{item.pemenang.email}</small>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Tidak ada penawaran</span>
                          )}
                        </td>
                        <td style={{ fontWeight: 600, color: '#10b981' }}>
                          {topBid ? formatRp(topBid.nominal) : '-'}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {item.invoiceNumber || '-'}
                        </td>
                        <td>
                          {item.buktiBayarUrl ? (
                            <a
                              href={`http://localhost:5000/${item.buktiBayarUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary btn-sm"
                            >
                              Lihat Bukti
                            </a>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Belum ada</span>
                          )}
                        </td>
                        <td style={{ fontSize: 12 }}>{formatDate(item.waktuTutup)}</td>
                        <td>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 700,
                              background: paymentUi.bg,
                              color: paymentUi.color,
                            }}
                          >
                            {paymentUi.label}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 700,
                              background: isReceived ? '#dcfce3' : '#e0e7ff',
                              color: isReceived ? '#16a34a' : '#4f46e5',
                            }}
                          >
                            {isReceived ? '📦 Diterima' : '🚚 Dalam Proses'}
                          </span>
                        </td>
                        <td>
                          {item.pemenang ? (
                            <button className="btn btn-primary btn-sm" onClick={() => openReviewModal(item)}>
                              {isPaid ? 'Lihat Invoice' : item.buktiBayarUrl ? 'Review Bukti' : 'Lihat Detail'}
                            </button>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>-</span>
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

      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Sahkan Jadwal Lelang</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <p>Aset: <strong>{modal.nama}</strong></p>
              <p>Nilai Limit: <strong>{formatRp(modal.hasil?.[0]?.nilaiLimit)}</strong></p>
            </div>

            <form onSubmit={handleApprove}>
              <div className="form-group">
                <label className="form-label">Waktu Pembukaan Lelang (Slot Pertama)</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={form.waktuBuka}
                  onChange={(e) => setForm({ ...form, waktuBuka: e.target.value })}
                  required
                />
                <small style={{ color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  Jika slot sudah terisi aset lain, waktu buka akan otomatis digeser ke antrean berikutnya.
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
                  onChange={(e) => setForm({ ...form, durasiMenit: e.target.value })}
                  required
                />
                <small style={{ color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  Waktu tutup otomatis dihitung dari waktu buka + durasi.
                </small>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Menyimpan...' : 'Terbitkan Lelang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reviewModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeReviewModal()}>
          <div className="modal" style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <h3>Review Pembayaran Lelang</h3>
              <button className="btn btn-secondary btn-sm" onClick={closeReviewModal}>✕</button>
            </div>

            {reviewModal.loading ? (
              <div className="empty-state"><span className="spinner" /></div>
            ) : reviewModal.error ? (
              <div className="alert alert-danger">{reviewModal.error}</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>INVOICE</div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{reviewModal.invoice?.invoiceNumber}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                      Jatuh tempo: {formatDate(reviewModal.invoice?.paymentDueDate)}
                    </div>
                    <div style={{ marginTop: 12, fontSize: 14 }}>
                      <div><strong>Aset:</strong> {reviewModal.invoice?.aset?.nama}</div>
                      <div><strong>Pemenang:</strong> {reviewModal.invoice?.pemenang?.nama}</div>
                      <div><strong>Nominal:</strong> {formatRp(reviewModal.invoice?.transaksi?.nominalMenang)}</div>
                      <div><strong>Rekening Tujuan:</strong> {reviewModal.invoice?.penjual?.rekeningBank} / {reviewModal.invoice?.penjual?.nomorRekening}</div>
                    </div>
                    <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button className="btn btn-secondary" onClick={() => downloadInvoicePdf(reviewModal.invoice)}>
                        🧾 Unduh Invoice
                      </button>
                      {reviewModal.invoice?.buktiBayarUrl && (
                        <a
                          href={`http://localhost:5000/${reviewModal.invoice.buktiBayarUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-primary"
                        >
                          👁️ Lihat Bukti Bayar
                        </a>
                      )}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>STATUS PEMBAYARAN</div>
                    <div
                      style={{
                        display: 'inline-flex',
                        padding: '6px 12px',
                        borderRadius: 99,
                        fontSize: 12,
                        fontWeight: 700,
                        background: paymentStatusUi(reviewModal.lelang.statusPembayaran).bg,
                        color: paymentStatusUi(reviewModal.lelang.statusPembayaran).color,
                        marginBottom: 14,
                      }}
                    >
                      {paymentStatusUi(reviewModal.lelang.statusPembayaran).label}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                      Upload terakhir: {formatDate(reviewModal.invoice?.tanggalUploadBukti)}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      Diverifikasi: {formatDate(reviewModal.invoice?.tanggalVerifikasiPembayaran)}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Catatan Admin</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Tambahkan catatan verifikasi atau alasan penolakan bukti pembayaran"
                    value={reviewModal.note}
                    onChange={(e) => setReviewModal((prev) => ({ ...prev, note: e.target.value }))}
                  />
                </div>

                <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Gunakan verifikasi jika bukti valid. Gunakan tolak jika bukti tidak jelas atau tidak sesuai.
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {reviewModal.lelang.statusPembayaran !== 'LUNAS' && reviewModal.invoice?.buktiBayarUrl && (
                      <>
                        <button className="btn btn-danger" onClick={handleTolakPembayaran} disabled={reviewModal.submitting}>
                          {reviewModal.submitting ? 'Memproses...' : 'Tolak Bukti'}
                        </button>
                        <button className="btn btn-success" onClick={handleVerifikasiPembayaran} disabled={reviewModal.submitting}>
                          {reviewModal.submitting ? 'Memproses...' : 'Verifikasi Lunas'}
                        </button>
                      </>
                    )}
                    <button className="btn btn-secondary" onClick={closeReviewModal}>Tutup</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
