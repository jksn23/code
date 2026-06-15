import React, { useState, useEffect } from 'react';
import { getAset, getKategori, createAset, createAsetProperty, createAssetVehicle, createAssetElectronic, updateAset, deleteAset, ajukanLelang } from '../services/api.js';
import { useAuth } from '../context/AuthContext';
import CurrencyInput from '../components/CurrencyInput';
import { Pencil, Trash2, Send, FileText, Lock, Plus, Tag } from 'lucide-react';
import { assetUrl } from '../config/env.js';

function AsetModal({ item, kategoriList, onClose, onSave, role }) {
  const [form, setForm] = useState({
    nama: item?.nama || '',
    kategori_id: item?.kategoriId || '',
    harga_pasar: item?.hargaPasar || '',
    deskripsi: item?.deskripsi || '',
    // Property fields
    certificate_number: '', owner_name: '', land_area: '', building_area: '',
    village: '', district: '', city: '', province: '', njop_per_m2: '',
    // Vehicle fields
    brand: '', type: '', year: '', color: '', plate_number: '', engine_number: '', chassis_number: '',
    // Electronic fields
    series: '',
  });
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedKategori = kategoriList.find(k => String(k.id) === String(form.kategori_id));
  const kategoriNama = selectedKategori?.nama?.toLowerCase() || '';
  const isProperty = kategoriNama.includes('tanah') || kategoriNama.includes('bangunan') || kategoriNama.includes('property');
  const isVehicle = kategoriNama.includes('kendaraan') || kategoriNama.includes('vehicle');
  const isElectronic = kategoriNama.includes('elektronik') || kategoriNama.includes('electronic');

  const handleFileChange = (fieldName, file) => {
    setFiles(prev => ({ ...prev, [fieldName]: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama || !form.kategori_id) return setError('Nama dan Kategori wajib diisi');

    setLoading(true); setError('');
    try {
      if (item) {
        await updateAset(item.id, { nama: form.nama, kategori_id: form.kategori_id, harga_pasar: form.harga_pasar });
      } else {
        const formData = new FormData();
        formData.append('nama', form.nama);
        formData.append('kategori_id', form.kategori_id);
        formData.append('deskripsi', form.deskripsi);

        if (isProperty) {
          formData.append('certificate_number', form.certificate_number);
          formData.append('owner_name', form.owner_name);
          formData.append('land_area', form.land_area);
          if (form.building_area) formData.append('building_area', form.building_area);
          formData.append('village', form.village);
          formData.append('district', form.district);
          formData.append('city', form.city);
          formData.append('province', form.province);
          formData.append('njop_per_m2', form.njop_per_m2);
          if (files.property_photo) formData.append('property_photo', files.property_photo);
          if (files.certificate_file_pdf) formData.append('certificate_file_pdf', files.certificate_file_pdf);
          await createAsetProperty(formData);
        } else if (isVehicle) {
          formData.append('harga_pasar', form.harga_pasar);
          formData.append('brand', form.brand);
          formData.append('type', form.type);
          formData.append('year', form.year);
          formData.append('color', form.color);
          formData.append('plate_number', form.plate_number);
          formData.append('engine_number', form.engine_number);
          formData.append('chassis_number', form.chassis_number);
          if (files.vehicle_photo) formData.append('vehicle_photo', files.vehicle_photo);
          if (files.vehicle_bpkb) formData.append('vehicle_bpkb', files.vehicle_bpkb);
          if (files.vehicle_stnk) formData.append('vehicle_stnk', files.vehicle_stnk);
          await createAssetVehicle(formData);
        } else if (isElectronic) {
          formData.append('harga_pasar', form.harga_pasar);
          formData.append('brand', form.brand);
          formData.append('series', form.series);
          formData.append('type', form.type);
          if (files.item_photo) formData.append('item_photo', files.item_photo);
          await createAssetElectronic(formData);
        } else {
          formData.append('harga_pasar', form.harga_pasar);
          if (files.dokumen_aset) formData.append('dokumen_aset', files.dokumen_aset);
          await createAset(formData);
        }
      }
      onSave();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const f = (field, label, placeholder, type = 'text', required = true) => (
    <div className="form-group" key={field}>
      <label className="form-label">{label}{required && ' *'}</label>
      <input className="form-control" type={type} value={form[field]} placeholder={placeholder}
        onChange={(e) => setForm({ ...form, [field]: e.target.value })} required={required} />
    </div>
  );

  const fileInput = (fieldName, label) => (
    <div className="form-group" key={fieldName}>
      <label className="form-label">{label}</label>
      <input type="file" className="form-control" accept=".jpg,.jpeg,.png,.pdf"
        onChange={(e) => handleFileChange(fieldName, e.target.files[0])} />
    </div>
  );

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600, maxHeight: '90vh', overflow: 'auto' }}>
        <div className="modal-header">
          <h3>{item ? '✏️ Edit Aset' : '➕ Tambah Aset'}</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Kategori *</label>
            <select className="form-control" value={form.kategori_id} onChange={(e) => setForm({ ...form, kategori_id: e.target.value })} disabled={!!item}>
              <option value="">-- Pilih Kategori --</option>
              {kategoriList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
          </div>
          {f('nama', 'Nama Aset', 'Contoh: Rumah Jl. Merdeka No. 5')}

          {/* --- PROPERTY FIELDS --- */}
          {isProperty && !item && (
            <>
              <div style={{ padding: '12px 16px', background: 'var(--surface-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>📋 Data Properti</div>
                {f('certificate_number', 'Nomor Sertifikat', 'SHM-001234')}
                {f('owner_name', 'Nama Pemilik', 'Nama pemilik properti')}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {f('land_area', 'Luas Tanah (m²)', '120', 'number')}
                  {f('building_area', 'Luas Bangunan (m²)', '80', 'number', false)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {f('village', 'Kelurahan', 'Kelurahan')}
                  {f('district', 'Kecamatan', 'Kecamatan')}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {f('city', 'Kota/Kabupaten', 'Kota')}
                  {f('province', 'Provinsi', 'Provinsi')}
                </div>
                <div className="form-group">
                  <label className="form-label">NJOP per m² (Rp) *</label>
                  <CurrencyInput value={form.njop_per_m2} onChange={(v) => setForm({ ...form, njop_per_m2: v })} placeholder="Contoh: 2.500.000" />
                </div>
                {form.njop_per_m2 && form.land_area && (
                  <div style={{ padding: 12, background: 'var(--success-bg)', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                    Base Property Value: Rp {new Intl.NumberFormat('id-ID').format(Number(form.njop_per_m2) * (Number(form.land_area) + (Number(form.building_area) || 0)))}
                  </div>
                )}
              </div>
              {fileInput('property_photo', '📷 Foto Properti')}
              {fileInput('certificate_file_pdf', '📄 File Sertifikat (PDF)')}
            </>
          )}

          {/* --- VEHICLE FIELDS --- */}
          {isVehicle && !item && (
            <>
              <div className="form-group">
                <label className="form-label">Harga Pasar (Rp) *</label>
                <CurrencyInput value={form.harga_pasar} onChange={(v) => setForm({ ...form, harga_pasar: v })} placeholder="Contoh: 150.000.000" />
              </div>
              <div style={{ padding: '12px 16px', background: 'var(--surface-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>🚗 Data Kendaraan</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {f('brand', 'Merek', 'Toyota')}
                  {f('type', 'Tipe', 'Avanza G')}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {f('year', 'Tahun', '2020', 'number')}
                  {f('color', 'Warna', 'Hitam')}
                  {f('plate_number', 'Nomor Plat', 'B 1234 ABC')}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {f('engine_number', 'Nomor Mesin', 'Nomor mesin')}
                  {f('chassis_number', 'Nomor Rangka', 'Nomor rangka')}
                </div>
              </div>
              {fileInput('vehicle_photo', '📷 Foto Kendaraan')}
              {fileInput('vehicle_bpkb', '📄 File BPKB')}
              {fileInput('vehicle_stnk', '📄 File STNK')}
            </>
          )}

          {/* --- ELECTRONIC FIELDS --- */}
          {isElectronic && !item && (
            <>
              <div className="form-group">
                <label className="form-label">Harga Pasar (Rp) *</label>
                <CurrencyInput value={form.harga_pasar} onChange={(v) => setForm({ ...form, harga_pasar: v })} placeholder="Contoh: 5.000.000" />
              </div>
              <div style={{ padding: '12px 16px', background: 'var(--surface-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>💻 Data Elektronik</div>
                {f('brand', 'Merek', 'Samsung')}
                {f('series', 'Seri', 'Galaxy S24 Ultra', 'text', false)}
                {f('type', 'Tipe', 'Smartphone')}
              </div>
              {fileInput('item_photo', '📷 Foto Barang')}
            </>
          )}

          {/* --- GENERIC / EDIT FIELDS --- */}
          {!isProperty && !isVehicle && !isElectronic && !item && (
            <>
              <div className="form-group">
                <label className="form-label">Harga Pasar (Rp) *</label>
                <CurrencyInput value={form.harga_pasar} onChange={(v) => setForm({ ...form, harga_pasar: v })} placeholder="Contoh: 500.000.000" />
              </div>
              {fileInput('dokumen_aset', '📎 Dokumen Pendukung (PDF/Image)')}
            </>
          )}
          {item && (
            <div className="form-group">
              <label className="form-label">Harga Pasar (Rp) *</label>
              <CurrencyInput value={form.harga_pasar} onChange={(v) => setForm({ ...form, harga_pasar: v })} placeholder="Contoh: 500.000.000" />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Deskripsi / Spesifikasi</label>
            <textarea className="form-control" rows={3} value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} placeholder="Jelaskan kondisi aset..." />
          </div>
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
  const [confirmModal, setConfirmModal] = useState(null);

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
                         <a href={assetUrl(item.dokumenUrl)} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" title="Lihat Dokumen">
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
