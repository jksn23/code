import React, { useEffect, useMemo, useState } from 'react';
import { getBuyerOwnedAssets, getInvoiceLelang, konfirmasiTerimaBarang } from '../services/api';
import { assetUrl } from '../config/env.js';

const formatRp = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
}).format(value || 0);

const formatDate = (value) => value ? new Date(value).toLocaleString('id-ID') : '-';

function AssetDetailModal({ item, invoice, loadingInvoice, onClose, onRefresh }) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirmReceived = async () => {
    if (!window.confirm('Konfirmasi bahwa aset/barang sudah Anda terima?')) return;
    setSubmitting(true);
    try {
      await konfirmasiTerimaBarang(item.lelangId);
      await onRefresh();
      onClose();
    } catch (error) {
      alert(error.message);
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
      alert(error.message);
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
        <h2>📦 Aset Saya</h2>
        <p>Daftar seluruh aset yang Anda menangkan dari proses lelang beserta nota pembayaran dan progres pengiriman.</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: `Semua (${counts.total})` },
          { key: 'pending', label: `Belum Diterima (${counts.pending})` },
          { key: 'received', label: `Diterima (${counts.received})` },
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
          <div className="empty-state"><span className="spinner" /> Memuat aset Anda...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">Belum ada aset pada filter ini.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Aset</th>
                  <th>Harga Menang</th>
                  <th>Profit</th>
                  <th>Pembayaran</th>
                  <th>Progress</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, index) => (
                  <tr key={item.lelangId}>
                    <td>{index + 1}</td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{item.aset?.nama}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.aset?.kategori}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Invoice: {item.invoiceNumber || '-'}</div>
                    </td>
                    <td style={{ fontWeight: 700, color: '#16a34a' }}>{formatRp(item.transaksi?.hargaMenang)}</td>
                    <td>{formatRp(item.transaksi?.profitLelang)}</td>
                    <td>
                      <span className="badge badge-primary">{item.statusPembayaran}</span>
                    </td>
                    <td>
                      <span className={`badge ${item.statusBarang === 'DITERIMA' ? 'badge-success' : 'badge-warning'}`}>
                        {item.statusBarang === 'DITERIMA' ? 'DITERIMA' : 'BELUM DITERIMA'}
                      </span>
                    </td>
                    <td>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => openDetail(item)}>
                        Detail
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
