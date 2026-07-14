import React, { useState, useEffect } from 'react';
import { getKategori, createKategori, updateKategori, deleteKategori } from '../services/api.js';
import { FolderTree, Plus, Pencil, Save, X, Trash2 } from 'lucide-react';
import { useModal } from '../context/ModalContext';

function KategoriModal({ item, onClose, onSave }) {
  const [nama, setNama] = useState(item?.nama || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nama.trim()) return setError('Nama kategori wajib diisi');
    setLoading(true); setError('');
    try {
      if (item) await updateKategori(item.id, { nama });
      else await createKategori({ nama });
      onSave();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {item ? <><Pencil size={18} /> Edit Kategori</> : <><Plus size={18} /> Tambah Kategori</>}
          </h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nama Kategori</label>
            <input className="form-control" value={nama} onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Tanah & Bangunan" autoFocus />
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

export default function KategoriPage() {
  const { showAlert, showConfirm } = useModal();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | item
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try { const res = await getKategori(); setData(res.data); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id, nama) => {
    const isConfirmed = await showConfirm(`Hapus kategori "${nama || 'ini'}"? Data kriteria & aset terkait juga akan terhapus.`, {
      title: 'Hapus Kategori',
      type: 'danger',
      confirmText: 'Ya, Hapus Kategori',
    });
    if (!isConfirmed) return;

    setDeleting(id);
    try {
      await deleteKategori(id);
      showAlert('Kategori berhasil dihapus.', 'success');
      load();
    }
    catch (e) { showAlert(e.message, 'error'); }
    finally { setDeleting(null); }
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FolderTree size={24} style={{ color: 'var(--primary)' }} /> Manajemen Kategori
          </h2>
          <p>Kelola kategori aset lelang (Tanah & Bangunan, Kendaraan, Elektronik)</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setModal('add')}>
          <Plus size={18} /> Tambah
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="empty-state"><span className="spinner" /><p>Memuat data...</p></div>
        ) : data.length === 0 ? (
          <div className="empty-state"><div style={{ marginBottom: 12 }}><FolderTree size={40} opacity={0.3} /></div><p>Belum ada kategori. Tambahkan kategori pertama!</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>No</th><th>Nama Kategori</th><th>Kriteria</th><th>Aset</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {data.map((item, i) => (
                  <tr key={item.id}>
                    <td>{i + 1}</td>
                    <td><strong>{item.nama}</strong></td>
                    <td><span className="badge badge-primary">{item._count?.kriteria ?? 0} kriteria</span></td>
                    <td><span className="badge badge-success">{item._count?.aset ?? 0} aset</span></td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-secondary btn-sm" onClick={() => setModal(item)}>✏️ Edit</button>
                        <button className="btn btn-danger btn-sm" disabled={deleting === item.id} onClick={() => handleDelete(item.id)}>
                          {deleting === item.id ? <span className="spinner" /> : '🗑️ Hapus'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <KategoriModal
          item={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
