import React, { useEffect, useMemo, useState } from 'react';
import { getSemuaPembeli, verifikasiPembeli } from '../services/api';
import { assetUrl } from '../config/env.js';

const STATUS_OPTIONS = {
  PENDING: { label: '⏳ Pending', bg: '#fef3c7', color: '#92400e' },
  APPROVED: { label: '✅ Approved', bg: '#dcfce7', color: '#166534' },
  REJECTED: { label: '❌ Rejected', bg: '#fee2e2', color: '#b91c1c' },
  UNVERIFIED: { label: '⚪ Unverified', bg: '#e2e8f0', color: '#334155' },
};

const formatDate = (value) => value ? new Date(value).toLocaleString('id-ID') : '-';

export default function BuyerVerificationPage() {
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
      alert(error.message);
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
      alert('Catatan penolakan wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      await verifikasiPembeli(selected.id, { action, note });
      await load();
      setSelected(null);
      setNote('');
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>🪪 Verifikasi Pembeli</h2>
        <p>Review KTP pembeli dan kunci akses bidding sampai KYC disetujui.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Total Pembeli', value: counts.total, accent: '#6366f1' },
          { label: 'Pending', value: counts.pending, accent: '#d97706' },
          { label: 'Approved', value: counts.approved, accent: '#16a34a' },
          { label: 'Rejected', value: counts.rejected, accent: '#dc2626' },
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
          <div className="empty-state"><span className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">Tidak ada data pembeli pada filter ini.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Pembeli</th>
                  <th>Status KYC</th>
                  <th>Tanggal Daftar</th>
                  <th>Catatan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((buyer, index) => {
                  const tone = STATUS_OPTIONS[buyer.buyerVerificationStatus] || STATUS_OPTIONS.UNVERIFIED;
                  return (
                    <tr key={buyer.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{buyer.nama}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{buyer.email}</div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: tone.bg, color: tone.color }}>
                          {tone.label}
                        </span>
                      </td>
                      <td style={{ fontSize: 13 }}>{formatDate(buyer.createdAt)}</td>
                      <td style={{ fontSize: 13, maxWidth: 260, color: 'var(--text-muted)' }}>
                        {buyer.buyerVerificationNote || '-'}
                      </td>
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
          </div>
        )}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && setSelected(null)}>
          <div className="modal" style={{ maxWidth: 860 }}>
            <div className="modal-header">
              <h3>Review KYC Pembeli</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div className="card" style={{ background: 'var(--surface-light)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nama</div>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>{selected.nama}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Email</div>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>{selected.email}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status Saat Ini</div>
                <div style={{ fontWeight: 700 }}>{selected.buyerVerificationStatus}</div>
              </div>

              <div className="card" style={{ background: 'var(--surface-light)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>Dokumen KTP</div>
                {selected.ktpUrl ? (
                  /\.(jpg|jpeg|png|gif|webp)$/i.test(selected.ktpUrl) ? (
                    <img
                      src={assetUrl(selected.ktpUrl)}
                      alt="KTP Pembeli"
                      style={{ width: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 12, border: '1px solid var(--border)' }}
                    />
                  ) : (
                    <a href={assetUrl(selected.ktpUrl)} target="_blank" rel="noreferrer" className="btn btn-secondary">
                      Buka Dokumen KTP
                    </a>
                  )
                ) : (
                  <div className="empty-state">Pembeli belum mengunggah KTP.</div>
                )}
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 20 }}>
              <label className="form-label">Catatan Admin</label>
              <textarea
                className="form-control"
                rows={4}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Tulis catatan approval atau alasan penolakan KYC"
              />
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelected(null)}>Tutup</button>
              <button type="button" className="btn btn-danger" disabled={submitting} onClick={() => handleSubmit('reject')}>
                {submitting ? 'Memproses...' : 'Tolak KYC'}
              </button>
              <button type="button" className="btn btn-primary" disabled={submitting} onClick={() => handleSubmit('approve')}>
                {submitting ? 'Memproses...' : 'Setujui KYC'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
