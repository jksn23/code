import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerPembeli, registerPenjual } from '../../services/api';

export default function RegisterPage() {
  const [role, setRole] = useState('PEMBELI'); // PEMBELI or PENJUAL
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
  });
  const [files, setFiles] = useState({
    ktp_file: null,
    npwp_file: null
  });
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleTextChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setFiles({ ...files, [e.target.name]: e.target.files[0] });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      Object.keys(formData).forEach(k => form.append(k, formData[k]));
      if (files.ktp_file) form.append('ktp_file', files.ktp_file);

      if (role === 'PEMBELI') {
        form.append('role', role);
        await registerPembeli(form);
      } else {
        if (files.npwp_file) form.append('npwp_file', files.npwp_file);
        await registerPenjual(form);
      }
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 20, background: 'var(--bg)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 500 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2><span className="icon">📝</span> Registrasi Akun</h2>
          <p style={{ color: 'var(--text-muted)' }}>Pilih tipe akun Anda</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button 
            type="button" 
            className={`btn ${role === 'PEMBELI' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ flex: 1 }} 
            onClick={() => setRole('PEMBELI')}
          >
            🧑 Pembeli
          </button>
          <button 
            type="button" 
            className={`btn ${role === 'PENJUAL' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ flex: 1 }} 
            onClick={() => setRole('PENJUAL')}
          >
            💼 Penjual
          </button>
        </div>

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">Nama Lengkap</label>
            <input type="text" className="form-control" name="nama" value={formData.nama} onChange={handleTextChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" name="email" value={formData.email} onChange={handleTextChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" name="password" value={formData.password} onChange={handleTextChange} required minLength={6} />
          </div>

          {role === 'PEMBELI' && (
            <div style={{ background: 'var(--surface)', padding: 16, borderRadius: 8, marginTop: 16 }}>
              <h4 style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>Dokumen Verifikasi Identitas</h4>
              <div className="form-group">
                <label className="form-label">Upload KTP (JPG/PNG/PDF)</label>
                <input type="file" className="form-control" name="ktp_file" onChange={(e) => setFiles({ ...files, ktp_file: e.target.files[0] })} required accept=".jpg,.jpeg,.png,.pdf" />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                ℹ️ Akun pembeli tetap bisa login setelah daftar, tetapi fitur bidding baru aktif setelah KYC disetujui admin.
              </div>
            </div>
          )}

          {role === 'PENJUAL' && (
            <div style={{ background: 'var(--surface)', padding: 16, borderRadius: 8, marginTop: 16 }}>
              <h4 style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>Dokumen & Informasi Finansial Penjual</h4>
              <div className="form-group">
                <label className="form-label">Upload KTP (JPG/PNG/PDF)</label>
                <input type="file" className="form-control" name="ktp_file" onChange={(e) => setFiles({ ...files, ktp_file: e.target.files[0] })} required accept=".jpg,.jpeg,.png,.pdf" />
              </div>
              <div className="form-group">
                <label className="form-label">Upload NPWP (Opsional)</label>
                <input type="file" className="form-control" name="npwp_file" onChange={(e) => setFiles({ ...files, npwp_file: e.target.files[0] })} accept=".jpg,.jpeg,.png,.pdf" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                 <div className="form-group">
                   <label className="form-label">Nama Bank</label>
                   <input type="text" className="form-control" name="rekeningBank" placeholder="Contoh: BCA / Mandiri" value={formData.rekeningBank || ''} onChange={handleTextChange} required />
                 </div>
                 <div className="form-group">
                   <label className="form-label">Nomor Rekening</label>
                   <input type="text" className="form-control" name="nomorRekening" placeholder="1234567890" value={formData.nomorRekening || ''} onChange={handleTextChange} required />
                 </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                ℹ️ Anda tidak dapat melakukan lelang sebelum dokumen diverifikasi oleh Admin. Data rekening diperlukan untuk transfer pemenang.
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
