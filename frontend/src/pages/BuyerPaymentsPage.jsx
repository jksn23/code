import React, { useEffect, useState } from 'react';
import { getBuyerPendingPayments, getInvoiceLelang, uploadBuktiPembayaranLelang } from '../services/api';
import { assetUrl } from '../config/env.js';
import { useModal } from '../context/ModalContext';
import { CreditCard, Upload, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

const formatRp = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
}).format(value || 0);

const formatDate = (value) => value ? new Date(value).toLocaleString('id-ID') : '-';

function PaymentModal({ item, invoice, loadingInvoice, onClose, onPaid }) {
  const { showAlert } = useModal();
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const canUpload = ['UNPAID', 'DITOLAK'].includes(item.statusPembayaran);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Bukti pembayaran wajib dipilih.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('bukti_bayar', file);
      await uploadBuktiPembayaranLelang(item.lelangId, formData);
      showAlert('Bukti pembayaran berhasil diunggah! Menunggu verifikasi admin.', 'success');
      await onPaid();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 760 }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CreditCard size={20} style={{ color: 'var(--primary)' }} /> Bayar Aset Lelang
          </h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="card" style={{ background: 'var(--surface-light)', marginBottom: 16 }}>
          <h4 style={{ marginBottom: 12 }}>Informasi Invoice</h4>
          {loadingInvoice ? (
            <div className="empty-state">Memuat detail invoice...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><strong>Nomor Invoice:</strong> {invoice?.invoiceNumber || item.invoiceNumber || '-'}</div>
              <div><strong>Total Tagihan:</strong> {formatRp(item.transaksi?.hargaMenang)}</div>
              <div><strong>Jatuh Tempo:</strong> {formatDate(invoice?.paymentDueDate || item.paymentDueDate)}</div>
              <div><strong>Status:</strong> {item.statusPembayaran}</div>
              <div><strong>Bank Tujuan:</strong> {invoice?.penjual?.rekeningBank || item.penjual?.rekeningBank || '-'}</div>
              <div><strong>Nomor Rekening:</strong> {invoice?.penjual?.nomorRekening || item.penjual?.nomorRekening || '-'}</div>
            </div>
          )}
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}

        {canUpload ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Unggah Bukti Pembayaran (JPG / PNG / PDF)</label>
              <input
                type="file"
                className="form-control"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
              <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} disabled={loading}>
                {loading ? <span className="spinner" /> : <><Upload size={16} /> Unggah Bukti Bayar</>}
              </button>
            </div>
          </form>
        ) : (
          <div className="alert alert-info">
            {item.statusPembayaran === 'MENUNGGU_VERIFIKASI'
              ? 'Bukti bayar sudah dikirim dan sedang menunggu verifikasi admin.'
              : 'Pembayaran untuk aset ini sudah selesai.'}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BuyerPaymentsPage() {
  const { showAlert } = useModal();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getBuyerPendingPayments();
      setItems(res.data || []);
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openPayment = async (item) => {
    setSelected(item);
    setInvoice(null);
    setLoadingInvoice(true);
    try {
      const res = await getInvoiceLelang(item.lelangId);
      setInvoice(res.data);
    } catch {
      setInvoice(null);
    } finally {
      setLoadingInvoice(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CreditCard size={24} style={{ color: 'var(--primary)' }} /> Pembayaran Pembeli
        </h2>
        <p>Daftar seluruh aset lelang yang masih membutuhkan tindakan pembayaran dari Anda.</p>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="empty-state"><span className="spinner" /> Memuat daftar pembayaran...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">Tidak ada pembayaran aktif. Semua aset Anda sudah lunas atau belum ada kemenangan lelang.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Aset</th>
                  <th>Nominal</th>
                  <th>Jatuh Tempo</th>
                  <th>Status</th>
                  <th>Catatan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.lelangId}>
                    <td>{index + 1}</td>
                    <td style={{ fontWeight: 600 }}>{item.aset?.nama}</td>
                    <td>{formatRp(item.transaksi?.hargaMenang)}</td>
                    <td>{formatDate(item.paymentDueDate)}</td>
                    <td>
                      <span className={`badge ${item.statusPembayaran === 'LUNAS' ? 'badge-success' : item.statusPembayaran === 'DITOLAK' ? 'badge-danger' : 'badge-primary'}`}>
                        {item.statusPembayaran}
                      </span>
                    </td>
                    <td>{item.catatanPembayaran || '-'}</td>
                    <td>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => openPayment(item)}>
                        Detail &amp; Bayar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <PaymentModal
          item={selected}
          invoice={invoice}
          loadingInvoice={loadingInvoice}
          onClose={() => setSelected(null)}
          onPaid={load}
        />
      )}
    </div>
  );
}
