import React, { useState, useEffect } from 'react';
import { getAset, getKategori, createAset, updateAset, deleteAset, ajukanLelang } from '../services/api.js';
import { useAuth } from '../context/AuthContext';
import CurrencyInput from '../components/CurrencyInput';
import { Pencil, Trash2, Send, FileText, Lock, Plus, Tag } from 'lucide-react';

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
  const [statusTerjualFilter, setStatusTerjualFilter] = useState('all');
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

  const filteredData = data.filter((item) => {
    if (statusTerjualFilter === 'sold') {
      return item.lelang?.some((lelang) => lelang.status === 'FINISHED' && lelang.pemenangId !== null);
    }
    if (statusTerjualFilter === 'unsold') {
      return !item.lelang?.some((lelang) => lelang.status === 'FINISHED' && lelang.pemenangId !== null);
    }
    return true;
  });

  const soldCount = data.filter((item) => item.lelang?.some((lelang) => lelang.status === 'FINISHED' && lelang.pemenangId !== null)).length;
  const unsoldCount = data.length - soldCount;

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
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Tag size={24} /> Manajemen Aset</h2>
          <p>Kelola data aset {role === 'PENJUAL' ? 'yang akan Anda lelang' : 'dalam sistem'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>
          <Plus size={16} strokeWidth={3} /> Tambah Aset Baru
        </button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Filter by Kategori</label>
            <select className="form-control" value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)}>
              <option value="">Semua Kategori</option>
              {kategoriList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: `Semua (${data.length})` },
              { key: 'sold', label: `Terjual (${soldCount})` },
              { key: 'unsold', label: `Belum Terjual (${unsoldCount})` },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`btn btn-sm ${statusTerjualFilter === tab.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusTerjualFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="empty-state"><span className="spinner" /></div> :
          filteredData.length === 0 ? <div className="empty-state"><FileText size={48} style={{opacity:0.2, marginBottom:16}} /><p>Tidak ada aset pada filter ini.</p></div> :
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th width="5%">No</th><th width="10%">Dokumen</th><th>Nama Aset</th><th>Kategori</th><th>Harga Pasar</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                {filteredData.map((item, i) => (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{i + 1}</td>
                    <td>
                       {item.dokumenUrl ? (
                         <a href={`http://localhost:5000/${item.dokumenUrl}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" title="Lihat Dokumen">
                           <FileText size={14} /> Doc
                         </a>
                       ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{item.nama}</div>
                      {role === 'ADMIN' && item.penjual && <div style={{fontSize:11,color:'var(--text-muted)'}}>Penjual: {item.penjual.user.nama}</div>}
                    </td>
                    <td><span className="badge" style={{ background: 'var(--surface-light)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{item.kategori?.nama}</span></td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{formatRp(item.hargaPasar)}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                        {statusBadge(item.statusLelang)}
                        {item.hasil?.length > 0 && <span className="badge badge-primary" style={{ fontSize: 9 }}>LIMIT: {formatRp(item.hasil[0].nilaiLimit || 0)}</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {item.statusLelang === 'DRAFT' ? (
                          <>
                            <button className="btn btn-secondary btn-sm" style={{ padding: '8px' }} onClick={() => setModal(item)} title="Edit">
                              <Pencil size={14} />
                            </button>
                            <button className="btn btn-danger btn-sm" style={{ padding: '8px' }} onClick={() => setConfirmModal({ type: 'delete', id: item.id })} title="Hapus">
                              <Trash2 size={14} />
                            </button>
                            {role === 'PENJUAL' && (
                              <button className="btn btn-primary btn-sm" onClick={() => setConfirmModal({ type: 'ajukan', id: item.id })}>
                                <Send size={14} /> Ajukan
                              </button>
                            )}
                          </>
                        ) : (
                           <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, background: 'var(--surface-hover)', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                             <Lock size={12} />
                             LOCKED
                           </div>
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
