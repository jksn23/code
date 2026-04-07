import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPenjualById, verifikasiPenjual } from '../services/api.js';

const BASE_URL = 'http://localhost:5000';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';

const StatusBadge = ({ aktif }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 700,
    background: aktif ? '#dcfce7' : '#fee2e2',
    color: aktif ? '#16a34a' : '#dc2626',
  }}>
    {aktif ? '✅ Terverifikasi' : '⏳ Belum Terverifikasi'}
  </span>
);

const DocPreview = ({ url, label }) => {
  if (!url) {
    return (
      <div style={{
        flex: 1, border: '2px dashed var(--border)', borderRadius: 12,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: 32, gap: 8,
        minHeight: 180,
      }}>
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
        <a href={fullUrl} target="_blank" rel="noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 20px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
          {isPDF ? '📄' : '📎'} Buka {label}
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

  const load = async () => {
    setLoading(true);
    try {
      const res = await getPenjualById(id);
      setData(res.data);
    } catch (e) {
      setFeedback({ type: 'error', msg: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleVerify = async (approve) => {
    const confirm = window.confirm(
      approve
        ? `Setujui dan verifikasi akun penjual "${data?.user?.nama}"?`
        : `Tolak verifikasi akun penjual "${data?.user?.nama}"? Status akan tetap BELUM TERVERIFIKASI.`
    );
    if (!confirm) return;

    setActionLoading(true);
    setFeedback(null);
    try {
      await verifikasiPenjual(Number(id), approve);
      setFeedback({
        type: 'success',
        msg: approve ? '✅ Penjual berhasil diverifikasi!' : '❌ Verifikasi dibatalkan.'
      });
      load();
    } catch (e) {
      setFeedback({ type: 'error', msg: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="spinner" style={{ margin: '80px auto' }} />;

  if (!data) return (
    <div className="alert alert-danger" style={{ margin: 24 }}>
      Data penjual tidak ditemukan. <Link to="/penjual">Kembali</Link>
    </div>
  );

  const isVerified = data.isVerified;

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Link to="/penjual" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
            ← Kembali ke Daftar Penjual
          </Link>
          <h2 style={{ marginTop: 6 }}>Detail Penjual</h2>
        </div>
        <StatusBadge aktif={isVerified} />
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 8 }}>
          {feedback.msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Profil */}
        <div className="card">
          <h4 style={{ marginBottom: 16 }}>👤 Informasi Akun</h4>
          <div style={{ display: 'grid', gap: 12 }}>
            {[
              { label: 'Nama', value: data.user?.nama },
              { label: 'Email', value: data.user?.email },
              { label: 'Tanggal Daftar', value: formatDate(data.user?.createdAt) },
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

        {/* Aset */}
        <div className="card">
          <h4 style={{ marginBottom: 16 }}>🏷️ Aset Terdaftar ({data.aset?.length || 0})</h4>
          {data.aset?.length === 0 ? (
            <div className="empty-state"><p>Belum ada aset.</p></div>
          ) : (
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {data.aset?.map((a) => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{a.nama}</span>
                  <span className="badge badge-primary" style={{ fontSize: 11 }}>{a.statusLelang}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dokumen */}
      <div className="card" style={{ marginTop: 20 }}>
        <h4 style={{ marginBottom: 16 }}>📄 Dokumen Verifikasi</h4>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <DocPreview url={data.ktpUrl} label="KTP" />
          <DocPreview url={data.npwpUrl} label="NPWP" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="card" style={{ marginTop: 20 }}>
        <h4 style={{ marginBottom: 16 }}>⚖️ Aksi Verifikasi</h4>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
          Pastikan semua dokumen sudah diperiksa sebelum memverifikasi akun penjual ini.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {!isVerified ? (
            <button
              className="btn btn-primary"
              style={{ padding: '12px 28px', fontWeight: 700 }}
              onClick={() => handleVerify(true)}
              disabled={actionLoading}
            >
              {actionLoading ? 'Memproses...' : '✅ Verifikasi & Setujui Akun'}
            </button>
          ) : (
            <button
              className="btn btn-danger"
              style={{ padding: '12px 28px', fontWeight: 700 }}
              onClick={() => handleVerify(false)}
              disabled={actionLoading}
            >
              {actionLoading ? 'Memproses...' : '❌ Batalkan Verifikasi'}
            </button>
          )}
          <Link to="/penjual" className="btn btn-secondary" style={{ padding: '12px 28px' }}>
            Kembali ke Daftar
          </Link>
        </div>
      </div>
    </div>
  );
}
