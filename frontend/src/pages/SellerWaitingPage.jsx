import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resubmitSellerDocuments } from '../services/api';
import { getSellerStatusMeta, resolveSellerStatus } from '../utils/sellerVerification';

export default function SellerWaitingPage() {
  const { logout, refreshProfile, user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState({ ktp_file: null, npwp_file: null });
  const [form, setForm] = useState({
    rekeningBank: user?.rekeningBank || '',
    nomorRekening: user?.nomorRekening || '',
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const sellerStatus = resolveSellerStatus(user);
  const statusMeta = getSellerStatusMeta(sellerStatus);
  const isRejected = sellerStatus === 'REJECTED';

  useEffect(() => {
    refreshProfile();
    // refreshProfile intentionally only called once on mount here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setForm({
      rekeningBank: user?.rekeningBank || '',
      nomorRekening: user?.nomorRekening || '',
    });
  }, [user?.rekeningBank, user?.nomorRekening]);

  const stepState = useMemo(() => {
    if (sellerStatus === 'APPROVED') return [true, true, true];
    if (sellerStatus === 'REJECTED') return [true, true, false];
    return [true, false, false];
  }, [sellerStatus]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!files.ktp_file && !files.npwp_file && !form.rekeningBank.trim() && !form.nomorRekening.trim()) {
      setFeedback({ type: 'error', msg: 'Unggah minimal satu dokumen atau perbarui data rekening.' });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const formData = new FormData();
      if (files.ktp_file) formData.append('ktp_file', files.ktp_file);
      if (files.npwp_file) formData.append('npwp_file', files.npwp_file);
      formData.append('rekeningBank', form.rekeningBank);
      formData.append('nomorRekening', form.nomorRekening);
      await resubmitSellerDocuments(formData);
      await refreshProfile();
      setFiles({ ktp_file: null, npwp_file: null });
      setFeedback({
        type: 'success',
        msg: 'Dokumen berhasil dikirim ulang. Status seller Anda kembali menjadi menunggu review admin.',
      });
    } catch (error) {
      setFeedback({ type: 'error', msg: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 580,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: isRejected
              ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
              : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 28px',
            fontSize: 44,
            boxShadow: isRejected
              ? '0 8px 24px rgba(239,68,68,0.35)'
              : '0 8px 24px rgba(245,158,11,0.35)',
          }}
        >
          {isRejected ? '!' : '...'}
        </div>

        <div className="card" style={{ padding: '40px 36px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
            {isRejected ? 'Dokumen Perlu Revisi' : 'Menunggu Verifikasi'}
          </h2>

          <div
            style={{
              display: 'inline-flex',
              padding: '6px 14px',
              borderRadius: 999,
              background: statusMeta.bg,
              color: statusMeta.color,
              fontWeight: 700,
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {statusMeta.label}
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
            Halo, <strong style={{ color: 'var(--text)' }}>{user?.nama || 'Penjual'}</strong>!{' '}
            {isRejected
              ? 'Admin meminta Anda memperbarui dokumen seller sebelum akun dapat diaktifkan.'
              : 'Akun Anda sedang dalam proses peninjauan oleh Pejabat Lelang (Admin). Silakan tunggu hingga dokumen KTP, NPWP, dan informasi rekening bank Anda diverifikasi.'}
          </p>

          {feedback && (
            <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: 20, textAlign: 'left' }}>
              {feedback.msg}
            </div>
          )}

          {user?.sellerVerificationNote && (
            <div className="card" style={{ background: 'var(--surface-light)', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Catatan Admin</div>
              <div style={{ fontSize: 14, lineHeight: 1.7 }}>{user.sellerVerificationNote}</div>
            </div>
          )}

          <div
            style={{
              background: 'var(--bg)',
              borderRadius: 12,
              padding: '20px 24px',
              marginBottom: 28,
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
              Proses Verifikasi
            </div>
            {[
              { no: '1', label: 'Dokumen diterima sistem', done: stepState[0] },
              { no: '2', label: isRejected ? 'Admin menemukan revisi dokumen' : 'Admin memeriksa KTP & NPWP', done: stepState[1] },
              { no: '3', label: isRejected ? 'Seller memperbarui dan kirim ulang dokumen' : 'Akun diaktifkan & siap digunakan', done: stepState[2] },
            ].map((step) => (
              <div
                key={step.no}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: step.done ? '#10b981' : 'var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    color: step.done ? '#fff' : 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                >
                  {step.done ? 'OK' : step.no}
                </div>
                <span
                  style={{
                    fontSize: 14,
                    color: step.done ? 'var(--text)' : 'var(--text-muted)',
                    fontWeight: step.done ? 600 : 400,
                  }}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
            {isRejected
              ? 'Perbarui dokumen yang diminta lalu kirim ulang untuk review admin. Setelah itu status akan kembali menjadi pending.'
              : 'Proses verifikasi biasanya memerlukan waktu 1x24 jam kerja. Jika ada kendala, hubungi Admin.'}
          </p>

          {isRejected && (
            <form onSubmit={handleSubmit} style={{ textAlign: 'left', marginBottom: 24 }}>
              <div className="form-group">
                <label className="form-label">Upload Ulang KTP</label>
                <input
                  type="file"
                  className="form-control"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(event) => setFiles((prev) => ({ ...prev, ktp_file: event.target.files?.[0] || null }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Upload Ulang NPWP</label>
                <input
                  type="file"
                  className="form-control"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(event) => setFiles((prev) => ({ ...prev, npwp_file: event.target.files?.[0] || null }))}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Nama Bank</label>
                  <input
                    className="form-control"
                    value={form.rekeningBank}
                    onChange={(event) => setForm((prev) => ({ ...prev, rekeningBank: event.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nomor Rekening</label>
                  <input
                    className="form-control"
                    value={form.nomorRekening}
                    onChange={(event) => setForm((prev) => ({ ...prev, nomorRekening: event.target.value }))}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Mengirim...' : 'Kirim Ulang Dokumen Seller'}
              </button>
            </form>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <a
              href="mailto:admin@elelang.co.id"
              className="btn btn-secondary"
              style={{ flex: 1, justifyContent: 'center', padding: '12px 0' }}
            >
              Hubungi Admin
            </a>
            <button
              onClick={handleLogout}
              className="btn btn-danger"
              style={{ flex: 1, padding: '12px 0' }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
