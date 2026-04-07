import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPenjualById, approvePenjual, rejectPenjual } from '../services/api.js';

const BASE_URL = 'http://localhost:5000';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';

const STATUS_MAP = {
  PENDING: { label: '⏳ Menunggu Verifikasi', bg: '#fef3c7', color: '#92400e' },
  APPROVED: { label: '✅ Disetujui', bg: '#dcfce7', color: '#166534' },
  REVISION_REQUESTED: { label: '🛠️ Revisi Dokumen', bg: '#fee2e2', color: '#b91c1c' },
  REJECTED: { label: '❌ Ditolak', bg: '#fee2e2', color: '#b91c1c' },
};

const StatusBadge = ({ status }) => {
  const ui = STATUS_MAP[status] || STATUS_MAP.PENDING;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px',
        borderRadius: 99,
        fontSize: 13,
        fontWeight: 700,
        background: ui.bg,
        color: ui.color,
      }}
    >
      {ui.label}
    </span>
  );
};

const DocPreview = ({ url, label }) => {
  if (!url) {
    return (
      <div
        style={{
          flex: 1,
          border: '2px dashed var(--border)',
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          gap: 8,
          minHeight: 180,
        }}
      >
        <span style={{ fontSize: 32 }}>📁</span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label} tidak diupload</span>
      </div>
    );
  }

  const fullUrl = `${BASE_URL}/${url}`;
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const isPDF = /\.pdf$/i.test(url);

  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>{label}</div>
      {isImage ? (
        <a href={fullUrl} target="_blank" rel="noreferrer">
          <img
            src={fullUrl}
            alt={label}
            style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 10, cursor: 'pointer', border: '2px solid var(--border)' }}
          />
        </a>
      ) : (
        <a
          href={fullUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 20px',
            background: 'var(--bg)',
            borderRadius: 10,
            border: '1px solid var(--border)',
            color: 'var(--primary)',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          {isPDF ? '📄' : '📎'} Buka {label}
        </a>
      )}
    </div>
  );
};

export default function AdminSellerDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [note, setNote] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getPenjualById(id);
      setData(res.data);
      setNote(res.data?.verificationNote || '');
    } catch (e) {
      setFeedback({ type: 'error', msg: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleApprove = async () => {
    const confirmed = window.confirm(`Setujui akun penjual "${data?.user?.nama}"?`);
    if (!confirmed) return;

    setActionLoading(true);
    setFeedback(null);
    try {
      await approvePenjual(Number(id), { note });
      setFeedback({ type: 'success', msg: 'Akun penjual berhasil disetujui.' });
      await load();
    } catch (e) {
      setFeedback({ type: 'error', msg: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!note.trim()) {
      setFeedback({ type: 'error', msg: 'Alasan penolakan wajib diisi.' });
      return;
    }

    const confirmed = window.confirm(`Tolak verifikasi penjual "${data?.user?.nama}" dan minta revisi dokumen?`);
    if (!confirmed) return;

    setActionLoading(true);
    setFeedback(null);
    try {
      await rejectPenjual(Number(id), { note });
      setFeedback({ type: 'success', msg: 'Penjual diminta merevisi dokumen.' });
      await load();
    } catch (e) {
      setFeedback({ type: 'error', msg: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="spinner" style={{ margin: '80px auto' }} />;

  if (!data) {
    return (
      <div className="alert alert-danger" style={{ margin: 24 }}>
        Data penjual tidak ditemukan. <Link to="/penjual">Kembali</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Link to="/penjual" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
            ← Kembali ke Daftar Penjual
          </Link>
          <h2 style={{ marginTop: 6 }}>Detail Penjual</h2>
        </div>
        <StatusBadge status={data.verificationStatus} />
      </div>

      {feedback && (
        <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 8 }}>
          {feedback.msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <h4 style={{ marginBottom: 16 }}>👤 Informasi Akun</h4>
          <div style={{ display: 'grid', gap: 12 }}>
            {[
              { label: 'Nama', value: data.user?.nama },
              { label: 'Email', value: data.user?.email },
              { label: 'Tanggal Daftar', value: formatDate(data.user?.createdAt) },
              { label: 'Bank', value: data.rekeningBank || '-' },
              { label: 'No. Rekening', value: data.nomorRekening || '-' },
              { label: 'Jumlah Revisi Dokumen', value: data.revisionCount || 0 },
              { label: 'Diverifikasi Oleh', value: data.verifikator?.nama || '-' },
              { label: 'Tanggal Review Terakhir', value: formatDate(data.verifiedAt) },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h4 style={{ marginBottom: 16 }}>🏷️ Aset Terdaftar ({data.aset?.length || 0})</h4>
          {data.aset?.length === 0 ? (
            <div className="empty-state"><p>Belum ada aset.</p></div>
          ) : (
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {data.aset?.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{item.nama}</span>
                  <span className="badge badge-primary" style={{ fontSize: 11 }}>{item.statusLelang}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h4 style={{ marginBottom: 16 }}>📄 Dokumen Verifikasi</h4>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <DocPreview url={data.ktpUrl} label="KTP" />
          <DocPreview url={data.npwpUrl} label="NPWP" />
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h4 style={{ marginBottom: 16 }}>📝 Catatan Admin</h4>
        <textarea
          className="form-control"
          rows={5}
          placeholder="Isi catatan persetujuan atau alasan revisi dokumen"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
          Catatan ini akan terlihat oleh penjual pada halaman menunggu verifikasi.
        </p>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h4 style={{ marginBottom: 16 }}>⚖️ Aksi Verifikasi</h4>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
          Jika dokumen valid, setujui akun. Jika ada masalah, minta revisi dengan alasan yang jelas.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            style={{ padding: '12px 28px', fontWeight: 700 }}
            onClick={handleApprove}
            disabled={actionLoading}
          >
            {actionLoading ? 'Memproses...' : '✅ Setujui Akun'}
          </button>
          <button
            className="btn btn-danger"
            style={{ padding: '12px 28px', fontWeight: 700 }}
            onClick={handleReject}
            disabled={actionLoading}
          >
            {actionLoading ? 'Memproses...' : '🛠️ Tolak & Minta Revisi'}
          </button>
          <Link to="/penjual" className="btn btn-secondary" style={{ padding: '12px 28px' }}>
            Kembali ke Daftar
          </Link>
        </div>
      </div>
    </div>
  );
}
