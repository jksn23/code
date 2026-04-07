import React, { useState, useEffect } from 'react';
import { getAset, getKategori, createAset, updateAset, deleteAset, ajukanLelang } from '../services/api.js';
import { useAuth } from '../context/AuthContext';
import CurrencyInput from '../components/CurrencyInput';

function AsetModal({ item, kategoriList, onClose, onSave, role }) {
  const [form, setForm] = useState({
    nama: item?.nama || '',
    kategori_id: item?.kategoriId || '',
    harga_pasar: item?.hargaPasar || '',
    deskripsi: item?.deskripsi || ''
  });
  const [dokumen, setDokumen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama || !form.kategori_id || !form.harga_pasar) return setError('Nama, Kategori, dan Harga Pasar wajib diisi');
    
    setLoading(true); setError('');
    try {
      if (item) {
        await updateAset(item.id, form);
      } else {
        const formData = new FormData();
        Object.keys(form).forEach(k => formData.append(k, form[k]));
        if (dokumen) formData.append('dokumen_aset', dokumen);
        await createAset(formData);
      }
      onSave();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <h3>{item ? '✏️ Edit Aset' : '➕ Tambah Aset'}</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Kategori</label>
            <select className="form-control" value={form.kategori_id} onChange={(e) => setForm({ ...form, kategori_id: e.target.value })}>
              <option value="">-- Pilih Kategori --</option>
              {kategoriList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Nama Aset</label>
            <input className="form-control" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Contoh: Rumah Jl. Merdeka No. 5" />
          </div>
          <div className="form-group">
            <label className="form-label">Harga Pasar (Rp)</label>
            <CurrencyInput
              value={form.harga_pasar}
              onChange={(v) => setForm({ ...form, harga_pasar: v })}
              placeholder="Contoh: 500.000.000"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Deskripsi / Spesifikasi</label>
            <textarea className="form-control" rows={3} value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} placeholder="Jelaskan kondisi aset..." />
          </div>
          {!item && role === 'PENJUAL' && (
            <div className="form-group">
              <label className="form-label">Dokumen Pendukung Aset (PDF/Image)</label>
              <input type="file" className="form-control" accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => setDokumen(e.target.files[0])} />
            </div>
          )}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : '💾 Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const formatRp = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

const statusBadge = (status) => {
  const map = {
    'DRAFT': { label: 'Draft', color: '#6b7280', bg: '#f3f4f6' },
    'PENDING': { label: 'Menunggu Jadwal', color: '#b45309', bg: '#fef3c7' },
    'ACTIVE': { label: 'Lelang Aktif', color: '#16a34a', bg: '#dcfce3' },
    'FINISHED': { label: 'Selesai', color: '#2563eb', bg: '#dbeafe' },
  };
  const ui = map[status] || map['DRAFT'];
  return <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, color: ui.color, backgroundColor: ui.bg }}>{ui.label}</span>;
}

export default function AsetPage() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [filterKategori, setFilterKategori] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { type: 'delete'|'ajukan', id }

  const role = user?.role || 'PEMBELI';

  const load = async () => {
    setLoading(true);
    try {
      const [asetRes, kategoriRes] = await Promise.all([
        getAset(filterKategori || null),
        getKategori()
      ]);
      setData(asetRes.data);
      setKategoriList(kategoriRes.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterKategori]);

  const handleDelete = async (id) => {
    try { 
      await deleteAset(id); 
      setConfirmModal(null);
      load(); 
    } catch (e) { alert(e.message); }
  };

  const handleAjukan = async (id) => {
    try { 
      await ajukanLelang(id); 
      alert('Berhasil diajukan! Menunggu admin.');
      setConfirmModal(null);
      load(); 
    } catch (e) { alert(e.message); }
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h2>🏷️ Manajemen Aset</h2>
          <p>Kelola data aset {role === 'PENJUAL' ? 'yang akan Anda lelang' : 'dalam sistem'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>➕ Tambah Aset Baru</button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Filter by Kategori</label>
          <select className="form-control" value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)}>
            <option value="">Semua Kategori</option>
            {kategoriList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="empty-state"><span className="spinner" /></div> :
          data.length === 0 ? <div className="empty-state"><div className="icon">🏷️</div><p>Belum ada aset.</p></div> :
          <div className="table-wrapper">
            <table>
              <thead><tr><th>No</th><th>Cek</th><th>Nama Aset</th><th>Kategori</th><th>Harga Pasar</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                {data.map((item, i) => (
                  <tr key={item.id}>
                    <td>{i + 1}</td>
                    <td>
                       {item.dokumenUrl ? <a href={`http://localhost:5000/${item.dokumenUrl}`} target="_blank" rel="noreferrer" style={{color:'var(--primary)',fontSize:12}}>Lihat Doc</a> : '-'}
                    </td>
                    <td>
                      <strong>{item.nama}</strong>
                      {role === 'ADMIN' && item.penjual && <div style={{fontSize:11,color:'var(--text-muted)'}}>Oleh: {item.penjual.user.nama}</div>}
                    </td>
                    <td>{item.kategori?.nama}</td>
                    <td style={{ color: '#10b981', fontWeight: 600 }}>{formatRp(item.hargaPasar)}</td>
                    <td>
                      <div>{statusBadge(item.statusLelang)}</div>
                      {item.hasil?.length > 0 && <span className="badge badge-primary" style={{marginTop:4,display:'inline-block'}}>Nilai Limit Tersedia</span>}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        {item.statusLelang === 'DRAFT' && (
                          <>
                            <button className="btn btn-secondary btn-sm" onClick={() => setModal(item)}>✏️</button>
                            <button className="btn btn-danger btn-sm" onClick={() => setConfirmModal({ type: 'delete', id: item.id })}>🗑️</button>
                            {role === 'PENJUAL' && <button className="btn btn-primary btn-sm" onClick={() => setConfirmModal({ type: 'ajukan', id: item.id })}>🚀 Ajukan Lelang</button>}
                          </>
                        )}
                        {item.statusLelang !== 'DRAFT' && (
                           <span style={{fontSize: 12, color: 'var(--text-muted)'}}>LOCKED</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
      </div>

      {modal && (
        <AsetModal
          item={modal === 'add' ? null : modal}
          kategoriList={kategoriList}
          role={role}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}

      {/* Custom Confirm Modal */}
      {confirmModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400, textAlign: 'center', padding: 32 }}>
            <h3 style={{ fontSize: 20, marginBottom: 12 }}>
              {confirmModal.type === 'ajukan' ? 'Konfirmasi Ajukan Lelang' : 'Konfirmasi Hapus'}
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
              {confirmModal.type === 'ajukan' 
                ? 'Ajukan lelang aset ini? Pastikan Nilai Limit sudah dihitung oleh sistem melalui Admin!'
                : 'Yakin ingin menghapus data aset ini secara permanen?'}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmModal(null)}>Batal</button>
              <button 
                className={confirmModal.type === 'ajukan' ? 'btn btn-primary' : 'btn btn-danger'} 
                onClick={() => confirmModal.type === 'ajukan' ? handleAjukan(confirmModal.id) : handleDelete(confirmModal.id)}
              >
                {confirmModal.type === 'ajukan' ? 'Ya, Ajukan Lelang' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
