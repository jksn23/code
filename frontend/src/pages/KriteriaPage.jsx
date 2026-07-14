import React, { useState, useEffect } from 'react';
import { getKriteria, getKategori, createKriteria, updateKriteria, deleteKriteria } from '../services/api.js';
import { ListOrdered, Pencil, Trash2, Plus, Save, X } from 'lucide-react';
import { useModal } from '../context/ModalContext';

function KriteriaModal({ item, kategoriList, onClose, onSave }) {
  const [form, setForm] = useState({ nama: item?.nama || '', kategori_id: item?.kategoriId || '', tipe: item?.tipe || 'benefit' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama || !form.kategori_id) return setError('Semua field wajib diisi');
    setLoading(true); setError('');
    try {
      if (item) await updateKriteria(item.id, form);
      else await createKriteria(form);
      onSave();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {item ? <><Pencil size={18} /> Edit Kriteria</> : <><Plus size={18} /> Tambah Kriteria</>}
          </h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={16} /></button>
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
            <label className="form-label">Nama Kriteria</label>
            <input className="form-control" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Contoh: Kondisi Fisik" />
          </div>
          <div className="form-group">
            <label className="form-label">Tipe Kriteria</label>
            <select className="form-control" value={form.tipe} onChange={(e) => setForm({ ...form, tipe: e.target.value })}>
              <option value="benefit">Benefit (Semakin besar semakin baik)</option>
              <option value="cost">Cost (Semakin kecil semakin baik)</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} disabled={loading}>
              {loading ? <span className="spinner" /> : <><Save size={16} /> Simpan</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function KriteriaPage() {
  const { showAlert, showConfirm } = useModal();
  const [data, setData] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [filterKategori, setFilterKategori] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [kriteriaRes, kategoriRes] = await Promise.all([getKriteria(filterKategori || null), getKategori()]);
      setData(kriteriaRes.data);
      setKategoriList(kategoriRes.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterKategori]);

  const handleDelete = async (id, nama) => {
    const isConfirmed = await showConfirm(`Hapus kriteria "${nama || 'ini'}"?`, {
      title: 'Hapus Kriteria',
      type: 'danger',
      confirmText: 'Ya, Hapus Kriteria',
    });
    if (!isConfirmed) return;

    try {
      await deleteKriteria(id);
      showAlert('Kriteria berhasil dihapus.', 'success');
      load();
    } catch (e) {
      showAlert(e.message, 'error');
    }
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ListOrdered size={24} style={{ color: 'var(--primary)' }} /> Manajemen Kriteria
          </h2>
          <p>Kelola kriteria penilaian aset berdasarkan kategori (dinamis per kategori)</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setModal('add')}>
          <Plus size={18} /> Tambah
        </button>
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
          data.length === 0 ? <div className="empty-state"><div style={{ marginBottom: 12 }}><ListOrdered size={40} opacity={0.3} /></div><p>Belum ada kriteria.</p></div> :
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>No</th><th>Nama Kriteria</th><th>Kategori</th><th>Tipe</th><th>Aksi</th></tr></thead>
              <tbody>
                {data.map((item, i) => (
                  <tr key={item.id}>
                    <td>{i + 1}</td>
                    <td><strong>{item.nama}</strong></td>
                    <td>{item.kategori?.nama}</td>
                    <td>
                      <span className={`badge ${item.tipe === 'benefit' ? 'badge-success' : 'badge-warning'}`}>
                        {item.tipe === 'benefit' ? '↑ Benefit' : '↓ Cost'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-secondary btn-sm" onClick={() => setModal(item)}>✏️ Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>🗑️ Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
      </div>

      {modal && (
        <KriteriaModal
          item={modal === 'add' ? null : modal}
          kategoriList={kategoriList}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
