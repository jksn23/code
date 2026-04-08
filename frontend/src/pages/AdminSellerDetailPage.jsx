import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPenjualById, verifikasiPenjual } from '../services/api.js';
import { getSellerStatusMeta, resolveSellerStatus } from '../utils/sellerVerification.js';

const BASE_URL = 'http://localhost:5000';

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';

const StatusBadge = ({ status }) => {
  const meta = getSellerStatusMeta(status);
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
        background: meta.bg,
        color: meta.color,
      }}
    >
      {meta.label}
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
        <span style={{ fontSize: 32 }}>File</span>
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
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 20px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}
        >
          {isPDF ? 'Buka PDF' : 'Buka Dokumen'}
        </a>
      )}
    </div>
  );
};

export default function AdminSellerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [asetFilter, setAsetFilter] = useState('all');
  const [note, setNote] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getPenjualById(id);
      setData(res.data);
      setNote(res.data?.verificationNote || '');
    } catch (error) {
      setFeedback({ type: 'error', msg: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleVerify = async (action) => {
    if (action === 'reject' && !note.trim()) {
      setFeedback({ type: 'error', msg: 'Catatan penolakan seller wajib diisi.' });
      return;
    }

    const confirmation = window.confirm(
      action === 'approve'
        ? `Setujui dan verifikasi akun penjual "${data?.user?.nama}"?`
        : `Tolak verifikasi akun penjual "${data?.user?.nama}"? Seller akan diminta memperbaiki dokumen.`
    );

    if (!confirmation) return;

    setActionLoading(true);
    setFeedback(null);
    try {
      await verifikasiPenjual(Number(id), { action, note });
      setFeedback({
        type: 'success',
        msg: action === 'approve' ? 'Seller berhasil diverifikasi.' : 'Seller berhasil ditandai perlu revisi.',
      });
      load();
    } catch (error) {
      setFeedback({ type: 'error', msg: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredAssets = useMemo(() => {
    const assets = data?.aset || [];
    return assets.filter((asset) => {
      if (asetFilter === 'sold') return asset.statusLelang === 'FINISHED';
      if (asetFilter === 'unsold') return asset.statusLelang !== 'FINISHED';
      return true;
    });
  }, [asetFilter, data?.aset]);

  const soldCount = useMemo(() => (data?.aset || []).filter((asset) => asset.statusLelang === 'FINISHED').length, [data?.aset]);

  if (loading) return <div className="spinner" style={{ margin: '80px auto' }} />;

  if (!data) {
    return (
      <div className="alert alert-danger" style={{ margin: 24 }}>
        Data penjual tidak ditemukan. <Link to="/penjual">Kembali</Link>
      </div>
    );
  }

  const sellerStatus = resolveSellerStatus(data);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate('/penjual')}>
            Kembali ke Daftar Penjual
          </button>
          <h2 style={{ marginTop: 10 }}>Detail Penjual</h2>
        </div>
        <StatusBadge status={sellerStatus} />
      </div>

      {feedback && (
        <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: 20 }}>
          {feedback.msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <h4 style={{ marginBottom: 16 }}>Informasi Akun</h4>
          <div style={{ display: 'grid', gap: 12 }}>
            {[
              { label: 'Nama', value: data.user?.nama },
              { label: 'Email', value: data.user?.email },
              { label: 'Tanggal Daftar', value: formatDate(data.user?.createdAt) },
              { label: 'Status Seller', value: sellerStatus },
              { label: 'Diverifikasi Pada', value: formatDate(data.verifiedAt) },
              { label: 'Diverifikasi Oleh', value: data.verifier?.nama || '-' },
              { label: 'Bank', value: data.rekeningBank || '-' },
              { label: 'No. Rekening', value: data.nomorRekening || '-' },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <h4>Aset Terdaftar ({data.aset?.length || 0})</h4>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { key: 'all', label: `Semua (${data.aset?.length || 0})` },
                { key: 'sold', label: `Terjual (${soldCount})` },
                { key: 'unsold', label: `Belum Terjual (${(data.aset?.length || 0) - soldCount})` },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`btn btn-sm ${asetFilter === item.key ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setAsetFilter(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="empty-state"><p>Belum ada aset pada filter ini.</p></div>
          ) : (
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {filteredAssets.map((asset) => (
                <div key={asset.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', alignItems: 'center', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{asset.nama}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{asset.kategori?.nama || 'Tanpa kategori'}</div>
                  </div>
                  <span className="badge badge-primary" style={{ fontSize: 11 }}>{asset.statusLelang}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h4 style={{ marginBottom: 16 }}>Dokumen Verifikasi</h4>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <DocPreview url={data.ktpUrl} label="KTP" />
          <DocPreview url={data.npwpUrl} label="NPWP" />
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h4 style={{ marginBottom: 16 }}>Aksi Verifikasi</h4>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
          Pastikan semua dokumen sudah diperiksa sebelum memverifikasi akun penjual ini.
        </p>
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">Catatan Admin</label>
          <textarea
            className="form-control"
            rows={4}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Tulis catatan approval atau alasan revisi dokumen seller"
          />
        </div>
        {data.verificationNote && (
          <div className="card" style={{ background: 'var(--surface-light)', marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Catatan Terakhir Tersimpan</div>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>{data.verificationNote}</div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ padding: '12px 28px', fontWeight: 700 }} onClick={() => handleVerify('approve')} disabled={actionLoading}>
            {actionLoading ? 'Memproses...' : 'Verifikasi dan Setujui Akun'}
          </button>
          <button className="btn btn-danger" style={{ padding: '12px 28px', fontWeight: 700 }} onClick={() => handleVerify('reject')} disabled={actionLoading}>
            {actionLoading ? 'Memproses...' : 'Tolak & Minta Revisi'}
          </button>
          <Link to="/penjual" className="btn btn-secondary" style={{ padding: '12px 28px' }}>
            Kembali ke Daftar
          </Link>
        </div>
      </div>
    </div>
  );
}
