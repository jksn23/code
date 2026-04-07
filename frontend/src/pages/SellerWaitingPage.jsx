import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reuploadDokumenPenjual } from '../services/api';

const STATUS_UI = {
  PENDING: {
    title: 'Menunggu Verifikasi',
    icon: '⏳',
    badge: '⏳ Menunggu Review Admin',
    toneBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    help: 'Dokumen Anda sedang diperiksa oleh admin. Silakan tunggu hingga proses review selesai.',
  },
  REVISION_REQUESTED: {
    title: 'Revisi Dokumen Diperlukan',
    icon: '🛠️',
    badge: '🛠️ Perlu Revisi',
    toneBg: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
    help: 'Admin menemukan kendala pada dokumen Anda. Perbarui dokumen lalu kirim ulang dari halaman ini.',
  },
  REJECTED: {
    title: 'Verifikasi Ditolak',
    icon: '❌',
    badge: '❌ Ditolak',
    toneBg: 'linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%)',
    help: 'Akun penjual belum dapat diaktifkan. Periksa catatan admin lalu unggah ulang dokumen yang benar.',
  },
};

export default function SellerWaitingPage() {
  const { logout, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ rekeningBank: '', nomorRekening: '' });
  const [files, setFiles] = useState({ ktp_file: null, npwp_file: null });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    setForm({
      rekeningBank: user?.rekeningBank || '',
      nomorRekening: user?.nomorRekening || '',
    });
  }, [user?.rekeningBank, user?.nomorRekening]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRefresh = async () => {
    await refreshProfile();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const payload = new FormData();
      payload.append('rekeningBank', form.rekeningBank);
      payload.append('nomorRekening', form.nomorRekening);
      if (files.ktp_file) payload.append('ktp_file', files.ktp_file);
      if (files.npwp_file) payload.append('npwp_file', files.npwp_file);

      await reuploadDokumenPenjual(payload);
      await refreshProfile();
      setFiles({ ktp_file: null, npwp_file: null });
      setFeedback({ type: 'success', msg: 'Dokumen berhasil dikirim ulang. Status kembali ke menunggu verifikasi.' });
    } catch (error) {
      setFeedback({ type: 'error', msg: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const verificationStatus = user?.verificationStatus || 'PENDING';
  const ui = STATUS_UI[verificationStatus] || STATUS_UI.PENDING;
  const canRevise = verificationStatus === 'REVISION_REQUESTED' || verificationStatus === 'REJECTED';

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
        overflowY: 'auto',
      }}
    >
      <div style={{ maxWidth: 760, width: '100%' }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: ui.toneBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 28px',
            fontSize: 44,
            boxShadow: '0 8px 24px rgba(15,23,42,0.35)',
          }}
        >
          {ui.icon}
        </div>

        <div className="card" style={{ padding: '36px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div
              style={{
                display: 'inline-flex',
                padding: '6px 14px',
                borderRadius: 99,
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--text)',
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              {ui.badge}
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{ui.title}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 0 }}>
              Halo, <strong style={{ color: 'var(--text)' }}>{user?.nama || 'Penjual'}</strong>. {ui.help}
            </p>
          </div>

          {feedback && (
            <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: 18 }}>
              {feedback.msg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
                Status Saat Ini
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status Verifikasi</div>
                  <div style={{ fontWeight: 700 }}>{ui.badge}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Jumlah Revisi</div>
                  <div style={{ fontWeight: 700 }}>{user?.revisionCount || 0} kali</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Catatan Admin</div>
                  <div style={{ fontWeight: 600, lineHeight: 1.6 }}>
                    {user?.verificationNote || 'Belum ada catatan khusus dari admin.'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
                Alur Verifikasi
              </div>
              {[
                { no: '1', label: 'Dokumen diterima sistem', done: true },
                { no: '2', label: canRevise ? 'Seller memperbarui dokumen' : 'Admin memeriksa KTP & NPWP', done: canRevise ? false : verificationStatus !== 'PENDING' },
                { no: '3', label: 'Akun diaktifkan & siap digunakan', done: verificationStatus === 'APPROVED' },
              ].map((step) => (
                <div key={step.no} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
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
                    {step.done ? '✓' : step.no}
                  </div>
                  <span style={{ fontSize: 14, color: step.done ? 'var(--text)' : 'var(--text-muted)', fontWeight: step.done ? 600 : 400 }}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {canRevise && (
            <div className="card" style={{ marginBottom: 20, background: 'var(--bg)', borderColor: 'var(--border)' }}>
              <h4 style={{ marginBottom: 14 }}>📤 Unggah Ulang Dokumen</h4>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Nama Bank</label>
                    <input
                      className="form-control"
                      value={form.rekeningBank}
                      onChange={(e) => setForm((prev) => ({ ...prev, rekeningBank: e.target.value }))}
                      placeholder="Contoh: BCA / Mandiri"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nomor Rekening</label>
                    <input
                      className="form-control"
                      value={form.nomorRekening}
                      onChange={(e) => setForm((prev) => ({ ...prev, nomorRekening: e.target.value }))}
                      placeholder="1234567890"
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Upload Ulang KTP</label>
                    <input
                      type="file"
                      className="form-control"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => setFiles((prev) => ({ ...prev, ktp_file: e.target.files?.[0] || null }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Upload Ulang NPWP</label>
                    <input
                      type="file"
                      className="form-control"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => setFiles((prev) => ({ ...prev, npwp_file: e.target.files?.[0] || null }))}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Mengirim...' : 'Kirim Ulang Dokumen'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handleRefresh}>
                    Refresh Status
                  </button>
                </div>
              </form>
            </div>
          )}

          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
            Jika admin sudah menyetujui akun Anda, halaman ini akan tertutup otomatis setelah data profil diperbarui.
          </p>

          <div style={{ display: 'flex', gap: 10 }}>
            <a
              href="mailto:admin@elelang.co.id"
              className="btn btn-secondary"
              style={{ flex: 1, justifyContent: 'center', padding: '12px 0' }}
            >
              📧 Hubungi Admin
            </a>
            <button
              onClick={handleLogout}
              className="btn btn-danger"
              style={{ flex: 1, padding: '12px 0' }}
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
