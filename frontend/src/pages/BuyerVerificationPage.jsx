import React, { useEffect, useMemo, useState } from 'react';
import { getSemuaPembeli, verifikasiPembeli } from '../services/api';
import { assetUrl } from '../config/env.js';
import { useModal } from '../context/ModalContext';
import { ShieldCheck, CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';

const STATUS_OPTIONS = {
  PENDING: { label: 'Pending', bg: 'var(--warning-bg)', color: 'var(--warning)', icon: <Clock size={12} /> },
  APPROVED: { label: 'Approved', bg: 'var(--success-bg)', color: 'var(--success)', icon: <CheckCircle2 size={12} /> },
  REJECTED: { label: 'Rejected', bg: 'var(--danger-bg)', color: 'var(--danger)', icon: <XCircle size={12} /> },
  UNVERIFIED: { label: 'Unverified', bg: 'var(--surface-light)', color: 'var(--text-muted)', icon: <Clock size={12} /> },
};

const formatDate = (value) => value ? new Date(value).toLocaleString('id-ID') : '-';

export default function BuyerVerificationPage() {
  const { showAlert, showConfirm } = useModal();
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getSemuaPembeli();
      setBuyers(res.data || []);
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
    if (filter === 'all') return buyers;
    return buyers.filter((item) => item.buyerVerificationStatus === filter);
  }, [buyers, filter]);

  const counts = useMemo(() => ({
    total: buyers.length,
    pending: buyers.filter((item) => item.buyerVerificationStatus === 'PENDING').length,
    approved: buyers.filter((item) => item.buyerVerificationStatus === 'APPROVED').length,
    rejected: buyers.filter((item) => item.buyerVerificationStatus === 'REJECTED').length,
  }), [buyers]);

  const openModal = (buyer) => {
    setSelected(buyer);
    setNote(buyer.buyerVerificationNote || '');
  };

  const handleSubmit = async (action) => {
    if (!selected) return;
    if (action === 'reject' && !note.trim()) {
      showAlert('Catatan penolakan wajib diisi.', 'warning');
      return;
    }

    const isConfirmed = await showConfirm(
      action === 'approve'
        ? `Setujui verifikasi identitas pembeli "${selected.nama}"?`
        : `Tolak verifikasi identitas pembeli "${selected.nama}"?`,
      {
        title: action === 'approve' ? 'Setujui Pembeli' : 'Tolak Verifikasi Pembeli',
        type: action === 'approve' ? 'warning' : 'danger',
        confirmText: action === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak',
      }
    );

    if (!isConfirmed) return;

    setSubmitting(true);
    try {
      await verifikasiPembeli(selected.id, { action, note });
      showAlert(action === 'approve' ? 'Pembeli berhasil diverifikasi.' : 'Verifikasi pembeli ditolak.', 'success');
      await load();
      setSelected(null);
      setNote('');
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldCheck size={24} style={{ color: 'var(--primary)' }} /> Verifikasi Pembeli (KYC)
        </h2>
        <p>Review KTP pembeli dan kunci akses bidding sampai KYC disetujui.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Total Pembeli', value: counts.total, accent: 'var(--primary)' },
          { label: 'Pending', value: counts.pending, accent: 'var(--warning)' },
          { label: 'Approved', value: counts.approved, accent: 'var(--success)' },
          { label: 'Rejected', value: counts.rejected, accent: 'var(--danger)' },
        ].map((item) => (
          <div key={item.label} className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: item.accent }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: `Semua (${counts.total})` },
          { key: 'PENDING', label: `Pending (${counts.pending})` },
          { key: 'APPROVED', label: `Approved (${counts.approved})` },
          { key: 'REJECTED', label: `Rejected (${counts.rejected})` },
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
          <div className="spinner" style={{ margin: '40px auto' }} />
        ) : filtered.length === 0 ? (
          <div className="empty-state"><p>Tidak ada data pembeli pada kategori ini.</p></div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nama Pembeli</th>
                <th>Email</th>
                <th>Status KYC</th>
                <th>No KTP</th>
                <th>Waktu Daftar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((buyer) => {
                const statusMeta = STATUS_OPTIONS[buyer.buyerVerificationStatus || 'UNVERIFIED'];
                return (
                  <tr key={buyer.id}>
                    <td style={{ fontWeight: 600 }}>{buyer.nama}</td>
                    <td>{buyer.email}</td>
                    <td>
                      <span className="badge" style={{ background: statusMeta.bg, color: statusMeta.color, border: `1px solid ${statusMeta.color}`, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {statusMeta.icon} {statusMeta.label}
                      </span>
                    </td>
                    <td>{buyer.ktpNumber || '-'}</td>
                    <td>{formatDate(buyer.createdAt)}</td>
                    <td>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => openModal(buyer)}>
                        Review KTP
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3>Verifikasi KTP — {selected.nama}</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              <div><strong>No KTP:</strong> {selected.ktpNumber || 'Belum diisi'}</div>
              <div><strong>Status Sekarang:</strong> {selected.buyerVerificationStatus}</div>

              {selected.ktpUrl ? (
                <div>
                  <label className="form-label" style={{ marginBottom: 8 }}>Foto / Dokumen KTP</label>
                  {/\.(jpg|jpeg|png|gif|webp)$/i.test(selected.ktpUrl) ? (
                    <img src={assetUrl(selected.ktpUrl)} alt="KTP Pembeli" style={{ width: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--border)' }} />
                  ) : (
                    <a href={assetUrl(selected.ktpUrl)} target="_blank" rel="noreferrer" className="btn btn-secondary">
                      <FileText size={16} /> Lihat Dokumen KTP (PDF)
                    </a>
                  )}
                </div>
              ) : (
                <div className="alert alert-danger">Pembeli belum mengunggah foto KTP.</div>
              )}

              <div className="form-group">
                <label className="form-label">Catatan Verifikasi</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Tulis alasan jika menolak verifikasi KYC pembeli ini..."
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelected(null)}>Batal</button>
              <button type="button" className="btn btn-danger" onClick={() => handleSubmit('reject')} disabled={submitting}>
                Tolak KTP
              </button>
              <button type="button" className="btn btn-primary" onClick={() => handleSubmit('approve')} disabled={submitting}>
                Setujui KTP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
