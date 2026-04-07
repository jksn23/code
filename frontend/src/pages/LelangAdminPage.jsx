import React, { useState, useEffect } from 'react';
import { getAset, createLelangAndApprove, getLelangSelesaiAdmin, verifikasiPembayaranLelang } from '../services/api.js';

const formatRp = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v || 0);
const formatDate = (d) => d ? new Date(d).toLocaleString('id-ID') : '-';

export default function LelangAdminPage() {
  const [data, setData] = useState([]);
  const [dataSelesai, setDataSelesai] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSelesai, setLoadingSelesai] = useState(true);
  const [activeTab, setActiveTab] = useState('aktif'); // 'aktif' | 'selesai'
  
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ waktuBuka: '', durasiMenit: 60 });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAset();
      const filtered = res.data.filter(a => a.statusLelang !== 'DRAFT');
      setData(filtered);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSelesai = async () => {
    setLoadingSelesai(true);
    try {
      const res = await getLelangSelesaiAdmin();
      setDataSelesai(res.data);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoadingSelesai(false);
    }
  };

  useEffect(() => { load(); loadSelesai(); }, []);

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!form.waktuBuka || !form.durasiMenit) return alert("Isi tanggal buka dan durasi lelang");
    
    setSubmitting(true);
    try {
      await createLelangAndApprove(modal.id, form);
      const antrianMsg = `Jadwal berhasil dibuat! Waktu buka & tutup dihitung berdasarkan antrian.`;
      alert(antrianMsg);
      setModal(null);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifikasiPembayaran = async (lelang) => {
    if (!window.confirm(`Verifikasi pembayaran LUNAS untuk Aset "${lelang.aset?.nama}"?`)) return;
    try {
      await verifikasiPembayaranLelang(lelang.id);
      alert('Pembayaran berhasil diverifikasi sebagai LUNAS!');
      loadSelesai();
    } catch (err) {
      alert(err.message);
    }
  };

  const statusBadge = (status, options) => {
    const map = options || {
      ACTIVE: { color: '#16a34a', bg: '#dcfce3' },
      PENDING: { color: '#b45309', bg: '#fef3c7' },
      FINISHED: { color: '#2563eb', bg: '#dbeafe' },
    };
    const s = map[status] || { color: '#555', bg: '#f3f4f6' };
    return (
      <span className="badge" style={{ backgroundColor: s.bg, color: s.color, fontWeight: 600 }}>
        {status}
      </span>
    );
  };

  return (
    <div>
      <div className="page-header">
        <h2>⏱️ Manajemen Lelang</h2>
        <p>Verifikasi pengajuan lelang dari penjual dan verifikasi pembayaran pemenang</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          className={`btn ${activeTab === 'aktif' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('aktif')}>
          📋 Jadwalkan Lelang
        </button>
        <button
          className={`btn ${activeTab === 'selesai' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('selesai')}>
          ✅ Verifikasi Pembayaran ({dataSelesai.length})
        </button>
      </div>

      {/* Tab: Aktif / Jadwalkan */}
      {activeTab === 'aktif' && (
        <div className="card">
          {loading ? <div className="empty-state"><span className="spinner"/></div> :
            data.length === 0 ? <div className="empty-state"><p>Belum ada pengajuan lelang.</p></div> :
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Aset</th>
                    <th>Penjual</th>
                    <th>Nilai Limit Dasar</th>
                    <th>Status</th>
                    <th>Jadwal</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, i) => {
                    const hasil = item.hasil?.[0];
                    const lelang = item.lelang?.[item.lelang.length - 1];
                    
                    return (
                      <tr key={item.id}>
                        <td>{i + 1}</td>
                        <td><strong>{item.nama}</strong><br/><small>{item.kategori?.nama}</small></td>
                        <td>{item.penjual?.user?.nama || '-'}</td>
                        <td style={{ color: '#10b981', fontWeight: 600 }}>
                           {hasil ? formatRp(hasil.nilaiLimit) : 'Belum Dihitung'}
                        </td>
                        <td>{statusBadge(item.statusLelang)}</td>
                        <td>
                          {lelang ? (
                            <div style={{fontSize: 12}}>
                              Buka: {formatDate(lelang.waktuBuka)}<br/>
                              Tutup: {formatDate(lelang.waktuTutup)}
                            </div>
                          ) : '-'}
                        </td>
                        <td>
                          {item.statusLelang === 'PENDING' && (
                            <button className="btn btn-primary btn-sm" onClick={() => setModal(item)}>Sahkan & Jadwalkan</button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          }
        </div>
      )}

      {/* Tab: Selesai / Verifikasi Pembayaran */}
      {activeTab === 'selesai' && (
        <div className="card">
          {loadingSelesai ? <div className="empty-state"><span className="spinner"/></div> :
            dataSelesai.length === 0 ? <div className="empty-state"><p>Belum ada lelang yang selesai.</p></div> :
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Aset</th>
                    <th>Pemenang</th>
                    <th>Penawaran Tertinggi</th>
                    <th>Waktu Selesai</th>
                    <th>Status Bayar</th>
                    <th>Status Barang</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {dataSelesai.map((l, i) => {
                    const topBid = l.penawaran?.[0];
                    const isPaid = l.statusPembayaran === 'LUNAS';
                    const isReceived = l.statusBarang === 'DITERIMA';

                    return (
                      <tr key={l.id}>
                        <td>{i + 1}</td>
                        <td>
                          <strong>{l.aset?.nama}</strong><br/>
                          <small>{l.aset?.kategori?.nama}</small>
                        </td>
                        <td>
                          {l.pemenang ? (
                            <div>
                              <div style={{fontWeight:600}}>{l.pemenang.nama}</div>
                              <small style={{color:'var(--text-muted)'}}>{l.pemenang.email}</small>
                            </div>
                          ) : <span style={{color:'var(--text-muted)'}}>Tidak ada penawaran</span>}
                        </td>
                        <td style={{fontWeight:600, color:'#10b981'}}>
                          {topBid ? formatRp(topBid.nominal) : '-'}
                        </td>
                        <td style={{fontSize:12}}>{formatDate(l.waktuTutup)}</td>
                        <td>
                          <span style={{padding:'4px 10px', borderRadius:20, fontSize:12, fontWeight:600,
                            background: isPaid ? '#dcfce3' : '#fef3c7',
                            color: isPaid ? '#16a34a' : '#b45309'}}>
                            {isPaid ? '✅ LUNAS' : '⏳ BELUM LUNAS'}
                          </span>
                        </td>
                        <td>
                          <span style={{padding:'4px 10px', borderRadius:20, fontSize:12, fontWeight:600,
                            background: isReceived ? '#dcfce3' : '#e0e7ff',
                            color: isReceived ? '#16a34a' : '#4f46e5'}}>
                            {isReceived ? '📦 DITERIMA' : '🚚 DALAM PROSES'}
                          </span>
                        </td>
                        <td>
                          {l.pemenang && !isPaid && (
                            <div style={{display:'flex', gap:6, flexDirection:'column'}}>
                              <a
                                href={`https://wa.me/${l.pemenang.email ? '' : '6281234567890'}?text=Halo%20${encodeURIComponent(l.pemenang.nama)},%20konfirmasi%20pembayaran%20untuk%20Aset%20${encodeURIComponent(l.aset?.nama)}%20senilai%20${topBid?.nominal}`}
                                target="_blank" rel="noreferrer"
                                style={{display:'inline-block', padding:'5px 10px', background:'#25D366', color:'#fff', borderRadius:5, textDecoration:'none', fontSize:12, fontWeight:'bold', textAlign:'center'}}>
                                📱 WhatsApp
                              </a>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleVerifikasiPembayaran(l)}>
                                ✅ Tandai Lunas
                              </button>
                            </div>
                          )}
                          {isPaid && !isReceived && (
                            <span style={{fontSize:12, color:'var(--text-muted)'}}>Menunggu konfirmasi pembeli</span>
                          )}
                          {isPaid && isReceived && (
                            <span style={{fontSize:12, color:'#10b981', fontWeight:600}}>🎉 Selesai</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          }
        </div>
      )}

      {/* Modal: Jadwalkan Lelang */}
      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Sahkan Jadwal Lelang</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div style={{marginBottom: 16}}>
              <p>Aset: <strong>{modal.nama}</strong></p>
              <p>Nilai Limit: <strong>{formatRp(modal.hasil?.[0]?.nilaiLimit)}</strong></p>
            </div>
            
            <form onSubmit={handleApprove}>
              <div className="form-group">
                <label className="form-label">Waktu Pembukaan Lelang (Slot Pertama)</label>
                <input type="datetime-local" className="form-control" 
                  value={form.waktuBuka} onChange={(e) => setForm({...form, waktuBuka: e.target.value})} required/>
                <small style={{color:'var(--text-muted)', marginTop:4, display:'block'}}>Jika slot sudah terisi aset lain, waktu buka akan otomatis digeser ke antrian berikutnya.</small>
              </div>
              <div className="form-group">
                <label className="form-label">Durasi Lelang per Aset (menit)</label>
                <input type="number" className="form-control" min="1" max="1440"
                  value={form.durasiMenit} onChange={(e) => setForm({...form, durasiMenit: e.target.value})} required/>
                <small style={{color:'var(--text-muted)', marginTop:4, display:'block'}}>Waktu tutup akan otomatis = Waktu Buka + Durasi ini.</small>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Menyimpan...' : 'Terbitkan Lelang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
