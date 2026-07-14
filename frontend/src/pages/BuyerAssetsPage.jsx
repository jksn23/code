import React, { useEffect, useMemo, useState } from 'react';
import { getBuyerOwnedAssets, getInvoiceLelang, konfirmasiTerimaBarang } from '../services/api';
import { assetUrl } from '../config/env.js';
import { useModal } from '../context/ModalContext';
import { PackageCheck, CheckCircle2, Clock, FileText } from 'lucide-react';

const formatRp = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
}).format(value || 0);

const formatDate = (value) => value ? new Date(value).toLocaleString('id-ID') : '-';

function AssetDetailModal({ item, invoice, loadingInvoice, onClose, onRefresh }) {
  const { showAlert, showConfirm } = useModal();
  const [submitting, setSubmitting] = useState(false);

  const handleConfirmReceived = async () => {
    const isConfirmed = await showConfirm('Konfirmasi bahwa aset/barang lelang sudah Anda terima dengan baik?', {
      title: 'Konfirmasi Penerimaan Barang',
      type: 'warning',
      confirmText: 'Ya, Barang Diterima',
    });
    if (!isConfirmed) return;

    setSubmitting(true);
    try {
      await konfirmasiTerimaBarang(item.lelangId);
      showAlert('Konfirmasi penerimaan barang berhasil disimpan.', 'success');
      await onRefresh();
      onClose();
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 860 }}>
        <div className="modal-header">
          <h3>Detail Aset Pemenang</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 20 }}>
          <div className="card" style={{ background: 'var(--surface-light)' }}>
            <h4 style={{ marginBottom: 12 }}>Informasi Aset</h4>
            <div style={{ display: 'grid', gap: 10 }}>
              <div><strong>Nama Aset:</strong> {item.aset?.nama}</div>
              <div><strong>Kategori:</strong> {item.aset?.kategori}</div>
              <div><strong>Harga Pasar:</strong> {formatRp(item.aset?.hargaPasar)}</div>
              <div><strong>Nilai Limit:</strong> {formatRp(item.aset?.nilaiLimit)}</div>
              <div><strong>Harga Menang:</strong> {formatRp(item.transaksi?.hargaMenang)}</div>
              <div><strong>Profit Lelang:</strong> {formatRp(item.transaksi?.profitLelang)}</div>
              <div><strong>Progress Aset:</strong> {item.statusBarang === 'DITERIMA' ? 'Diterima' : 'Belum Diterima'}</div>
              <div><strong>Status Pembayaran:</strong> {item.statusPembayaran}</div>
              <div><strong>Deskripsi:</strong> {item.aset?.deskripsi || '-'}</div>
            </div>
          </div>

          <div className="card" style={{ background: 'var(--surface-light)' }}>
            <h4 style={{ marginBottom: 12 }}>Nota Pembayaran</h4>
            {loadingInvoice ? (
              <div className="empty-state">Memuat nota...</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                <div><strong>No. Invoice:</strong> {invoice?.invoiceNumber || item.invoiceNumber || '-'}</div>
                <div><strong>Dibuat:</strong> {formatDate(invoice?.invoiceGeneratedAt || item.invoiceGeneratedAt)}</div>
                <div><strong>Jatuh Tempo:</strong> {formatDate(invoice?.paymentDueDate || item.paymentDueDate)}</div>
                <div><strong>Bank Tujuan:</strong> {invoice?.penjual?.rekeningBank || item.penjual?.rekeningBank}</div>
                <div><strong>No Rekening:</strong> {invoice?.penjual?.nomorRekening || item.penjual?.nomorRekening}</div>
                <div><strong>Catatan Admin:</strong> {invoice?.catatanPembayaran || item.catatanPembayaran || '-'}</div>
                {item.buktiBayarUrl && (
                  <a href={assetUrl(item.buktiBayarUrl)} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ width: 'fit-content' }}>
                    Lihat Bukti Bayar
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Tutup</button>
          {item.statusPembayaran === 'LUNAS' && item.statusBarang !== 'DITERIMA' && (
            <button type="button" className="btn btn-primary" onClick={handleConfirmReceived} disabled={submitting}>
              {submitting ? 'Memproses...' : 'Konfirmasi Diterima'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BuyerAssetsPage() {
  const { showAlert } = useModal();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getBuyerOwnedAssets();
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

  const filtered = useMemo(() => {
    if (filter === 'received') return items.filter((item) => item.statusBarang === 'DITERIMA');
    if (filter === 'pending') return items.filter((item) => item.statusBarang !== 'DITERIMA');
    return items;
  }, [items, filter]);

  const counts = useMemo(() => ({
    total: items.length,
    received: items.filter((item) => item.statusBarang === 'DITERIMA').length,
    pending: items.filter((item) => item.statusBarang !== 'DITERIMA').length,
  }), [items]);

  const openDetail = async (item) => {
    setDetail(item);
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
          <PackageCheck size={24} style={{ color: 'var(--primary)' }} /> Aset Saya (Pemenang Lelang)
        </h2>
        <p>Kelola aset hasil lelang yang telah Anda menangkan dan lakukan konfirmasi penerimaan barang.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Total Aset Dimenangkan', value: counts.total, accent: 'var(--primary)' },
          { label: 'Belum Diterima', value: counts.pending, accent: 'var(--warning)' },
          { label: 'Sudah Diterima', value: counts.received, accent: 'var(--success)' },
        ].map((item) => (
          <div key={item.label} className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: item.accent }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { key: 'all', label: `Semua (${counts.total})` },
          { key: 'pending', label: `Belum Diterima (${counts.pending})` },
          { key: 'received', label: `Sudah Diterima (${counts.received})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`btn btn-sm ${filter === tab.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="empty-state"><span className="spinner" /> Memuat daftar aset...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">Belum ada aset lelang yang Anda menangkan pada kategori ini.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Aset</th>
                  <th>Kategori</th>
                  <th>Harga Menang</th>
                  <th>Status Bayar</th>
                  <th>Progress Barang</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, index) => (
                  <tr key={item.lelangId}>
                    <td>{index + 1}</td>
                    <td style={{ fontWeight: 600 }}>{item.aset?.nama}</td>
                    <td>{item.aset?.kategori}</td>
                    <td>{formatRp(item.transaksi?.hargaMenang)}</td>
                    <td>
                      <span className={`badge ${item.statusPembayaran === 'LUNAS' ? 'badge-success' : 'badge-warning'}`}>
                        {item.statusPembayaran}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${item.statusBarang === 'DITERIMA' ? 'badge-success' : 'badge-secondary'}`}>
                        {item.statusBarang === 'DITERIMA' ? 'Diterima' : 'Belum Diterima'}
                      </span>
                    </td>
                    <td>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => openDetail(item)}>
                        Detail &amp; Lacak
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detail && (
        <AssetDetailModal
          item={detail}
          invoice={invoice}
          loadingInvoice={loadingInvoice}
          onClose={() => setDetail(null)}
          onRefresh={load}
        />
      )}
    </div>
  );
}
