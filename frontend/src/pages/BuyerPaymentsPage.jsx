import React, { useEffect, useState } from 'react';
import { getBuyerPendingPayments, getInvoiceLelang, uploadBuktiPembayaranLelang } from '../services/api';

const formatRp = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
}).format(value || 0);

const formatDate = (value) => value ? new Date(value).toLocaleString('id-ID') : '-';

function PaymentModal({ item, invoice, loadingInvoice, onClose, onPaid }) {
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
          <h3>Bayar Aset Lelang</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="card" style={{ background: 'var(--surface-light)', marginBottom: 16 }}>
          <h4 style={{ marginBottom: 12 }}>Ringkasan Pembayaran</h4>
          {loadingInvoice ? (
            <div className="empty-state">Memuat invoice...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><strong>Aset:</strong> {item.aset?.nama}</div>
              <div><strong>Invoice:</strong> {invoice?.invoiceNumber || item.invoiceNumber || '-'}</div>
              <div><strong>Harga Menang:</strong> {formatRp(item.transaksi?.hargaMenang)}</div>
              <div><strong>Jatuh Tempo:</strong> {formatDate(invoice?.paymentDueDate || item.paymentDueDate)}</div>
              <div><strong>Bank Tujuan:</strong> {invoice?.penjual?.rekeningBank || item.penjual?.rekeningBank}</div>
              <div><strong>No Rekening:</strong> {invoice?.penjual?.nomorRekening || item.penjual?.nomorRekening}</div>
              <div><strong>Status:</strong> {item.statusPembayaran}</div>
              <div><strong>Catatan Admin:</strong> {invoice?.catatanPembayaran || item.catatanPembayaran || '-'}</div>
            </div>
          )}
        </div>

        {item.buktiBayarUrl && (
          <div className="card" style={{ background: 'var(--surface-light)', marginBottom: 16 }}>
            <h4 style={{ marginBottom: 12 }}>Bukti Bayar Terakhir</h4>
            <a href={`http://localhost:5000/${item.buktiBayarUrl}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
              Lihat Bukti Bayar
            </a>
          </div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        {canUpload ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Upload Bukti Pembayaran</label>
              <input
                type="file"
                className="form-control"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Tutup</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Mengirim...' : 'Kirim Bukti Bayar'}
              </button>
            </div>
          </form>
        ) : (
          <div className="alert alert-info" style={{ marginBottom: 0 }}>
            {item.statusPembayaran === 'PENDING_VERIFICATION'
              ? 'Bukti bayar sudah dikirim dan sedang menunggu verifikasi admin.'
              : 'Pembayaran untuk aset ini sudah selesai.'}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BuyerPaymentsPage() {
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
      alert(error.message);
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
        <h2>💳 Pembayaran</h2>
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
                    <td>
                      <div style={{ fontWeight: 700 }}>{item.aset?.nama}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.invoiceNumber || '-'}</div>
                    </td>
                    <td style={{ fontWeight: 700, color: '#16a34a' }}>{formatRp(item.transaksi?.hargaMenang)}</td>
                    <td>{formatDate(item.paymentDueDate)}</td>
                    <td>
                      <span className={`badge ${item.statusPembayaran === 'DITOLAK' ? 'badge-danger' : item.statusPembayaran === 'PENDING_VERIFICATION' ? 'badge-warning' : 'badge-primary'}`}>
                        {item.statusPembayaran}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 260 }}>
                      {item.catatanPembayaran || '-'}
                    </td>
                    <td>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => openPayment(item)}>
                        {item.statusPembayaran === 'PENDING_VERIFICATION' ? 'Lihat Status' : 'Bayar'}
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
