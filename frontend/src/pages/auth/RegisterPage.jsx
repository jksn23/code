import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerPembeli, registerPenjual } from '../../services/api';

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

const validateRegisterForm = ({ role, formData, files }) => {
  const errors = {};

  if (!formData.nama?.trim()) {
    errors.nama = 'Nama lengkap wajib diisi.';
  } else if (formData.nama.trim().length < 3) {
    errors.nama = 'Nama minimal 3 karakter.';
  }

  if (!formData.email?.trim()) {
    errors.email = 'Email wajib diisi.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
    errors.email = 'Format email tidak valid.';
  }

  if (!formData.password) {
    errors.password = 'Password wajib diisi.';
  } else if (formData.password.length < 6) {
    errors.password = 'Password minimal 6 karakter.';
  }

  if (!files.ktp_file) {
    errors.ktp_file = 'File KTP wajib diupload.';
  } else if (!ALLOWED_FILE_TYPES.includes(files.ktp_file.type)) {
    errors.ktp_file = 'Format file KTP harus JPG, PNG, atau PDF.';
  }

  if (files.npwp_file && !ALLOWED_FILE_TYPES.includes(files.npwp_file.type)) {
    errors.npwp_file = 'Format file NPWP harus JPG, PNG, atau PDF.';
  }

  if (role === 'PENJUAL') {
    if (!formData.rekeningBank?.trim()) {
      errors.rekeningBank = 'Nama bank wajib diisi.';
    }

    if (!formData.nomorRekening?.trim()) {
      errors.nomorRekening = 'Nomor rekening wajib diisi.';
    } else if (!/^\d{8,20}$/.test(formData.nomorRekening.trim())) {
      errors.nomorRekening = 'Nomor rekening harus 8-20 digit angka.';
    }
  }

  return errors;
};

export default function RegisterPage() {
  const [role, setRole] = useState('PEMBELI');
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    rekeningBank: '',
    nomorRekening: '',
  });
  const [files, setFiles] = useState({
    ktp_file: null,
    npwp_file: null,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const visibleErrors = useMemo(() => {
    const result = {};
    Object.entries(fieldErrors).forEach(([key, value]) => {
      if (touched[key]) result[key] = value;
    });
    return result;
  }, [fieldErrors, touched]);

  const refreshErrors = (nextRole, nextFormData, nextFiles) => {
    setFieldErrors(validateRegisterForm({ role: nextRole, formData: nextFormData, files: nextFiles }));
  };

  const handleTextChange = (event) => {
    const nextFormData = { ...formData, [event.target.name]: event.target.value };
    setFormData(nextFormData);
    refreshErrors(role, nextFormData, files);
  };

  const handleFileChange = (event) => {
    const nextFiles = { ...files, [event.target.name]: event.target.files?.[0] || null };
    setFiles(nextFiles);
    refreshErrors(role, formData, nextFiles);
  };

  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    refreshErrors(role, formData, files);
  };

  const handleRoleChange = (nextRole) => {
    setRole(nextRole);
    setTouched({});
    setError(null);
    refreshErrors(nextRole, formData, files);
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    const nextTouched = {
      nama: true,
      email: true,
      password: true,
      ktp_file: true,
      npwp_file: true,
      rekeningBank: role === 'PENJUAL',
      nomorRekening: role === 'PENJUAL',
    };
    const errors = validateRegisterForm({ role, formData, files });

    setTouched(nextTouched);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError('Periksa kembali form registrasi Anda.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (role === 'PEMBELI' && ['rekeningBank', 'nomorRekening'].includes(key)) return;
        form.append(key, value);
      });

      if (files.ktp_file) form.append('ktp_file', files.ktp_file);

      if (role === 'PEMBELI') {
        form.append('role', role);
        await registerPembeli(form);
      } else {
        if (files.npwp_file) form.append('npwp_file', files.npwp_file);
        await registerPenjual(form);
      }

      navigate('/login', {
        state: { successMessage: 'Registrasi Berhasil, Silahkan Login' },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 20, background: 'var(--bg)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2>Registrasi Akun</h2>
          <p style={{ color: 'var(--text-muted)' }}>Pilih tipe akun dan lengkapi semua data dengan benar.</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button
            type="button"
            className={`btn ${role === 'PEMBELI' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
            onClick={() => handleRoleChange('PEMBELI')}
          >
            Pembeli
          </button>
          <button
            type="button"
            className={`btn ${role === 'PENJUAL' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
            onClick={() => handleRoleChange('PENJUAL')}
          >
            Penjual
          </button>
        </div>

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">Nama Lengkap</label>
            <input
              type="text"
              className="form-control"
              name="nama"
              value={formData.nama}
              onChange={handleTextChange}
              onBlur={() => handleBlur('nama')}
              placeholder="Masukkan nama lengkap"
            />
            {visibleErrors.nama && <div className="field-error">{visibleErrors.nama}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              name="email"
              value={formData.email}
              onChange={handleTextChange}
              onBlur={() => handleBlur('email')}
              placeholder="nama@email.com"
            />
            {visibleErrors.email && <div className="field-error">{visibleErrors.email}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              name="password"
              value={formData.password}
              onChange={handleTextChange}
              onBlur={() => handleBlur('password')}
              placeholder="Minimal 6 karakter"
            />
            {visibleErrors.password && <div className="field-error">{visibleErrors.password}</div>}
          </div>

          {role === 'PEMBELI' && (
            <div style={{ background: 'var(--surface)', padding: 16, borderRadius: 8, marginTop: 16 }}>
              <h4 style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>Dokumen Verifikasi Identitas</h4>
              <div className="form-group">
                <label className="form-label">Upload KTP (JPG/PNG/PDF)</label>
                <input
                  type="file"
                  className="form-control"
                  name="ktp_file"
                  onChange={handleFileChange}
                  onBlur={() => handleBlur('ktp_file')}
                  accept=".jpg,.jpeg,.png,.pdf"
                />
                {visibleErrors.ktp_file && <div className="field-error">{visibleErrors.ktp_file}</div>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Akun pembeli tetap bisa login setelah daftar, tetapi fitur bidding baru aktif setelah KYC disetujui admin.
              </div>
            </div>
          )}

          {role === 'PENJUAL' && (
            <div style={{ background: 'var(--surface)', padding: 16, borderRadius: 8, marginTop: 16 }}>
              <h4 style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>Dokumen dan Informasi Finansial Penjual</h4>
              <div className="form-group">
                <label className="form-label">Upload KTP (JPG/PNG/PDF)</label>
                <input
                  type="file"
                  className="form-control"
                  name="ktp_file"
                  onChange={handleFileChange}
                  onBlur={() => handleBlur('ktp_file')}
                  accept=".jpg,.jpeg,.png,.pdf"
                />
                {visibleErrors.ktp_file && <div className="field-error">{visibleErrors.ktp_file}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Upload NPWP (Opsional)</label>
                <input
                  type="file"
                  className="form-control"
                  name="npwp_file"
                  onChange={handleFileChange}
                  onBlur={() => handleBlur('npwp_file')}
                  accept=".jpg,.jpeg,.png,.pdf"
                />
                {visibleErrors.npwp_file && <div className="field-error">{visibleErrors.npwp_file}</div>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">Nama Bank</label>
                  <input
                    type="text"
                    className="form-control"
                    name="rekeningBank"
                    placeholder="Contoh: BCA / Mandiri"
                    value={formData.rekeningBank}
                    onChange={handleTextChange}
                    onBlur={() => handleBlur('rekeningBank')}
                  />
                  {visibleErrors.rekeningBank && <div className="field-error">{visibleErrors.rekeningBank}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Nomor Rekening</label>
                  <input
                    type="text"
                    className="form-control"
                    name="nomorRekening"
                    placeholder="1234567890"
                    value={formData.nomorRekening}
                    onChange={handleTextChange}
                    onBlur={() => handleBlur('nomorRekening')}
                  />
                  {visibleErrors.nomorRekening && <div className="field-error">{visibleErrors.nomorRekening}</div>}
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Anda tidak dapat melakukan lelang sebelum dokumen diverifikasi oleh admin. Data rekening diperlukan untuk proses transfer.
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 24 }} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Daftar Sekarang'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          Sudah punya akun? <Link to="/login" style={{ color: 'var(--primary)' }}>Login di sini</Link>
        </div>
      </div>
    </div>
  );
}
