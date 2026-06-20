import React, { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, Search, XCircle, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getAdminPenilaianAset,
  getAdminPenilaianAsetDetail,
  updateAdminStatusPenilaian,
} from '../services/api.js';

const STATUS_LABEL = {
  DRAFT: 'Draft',
  MENUNGGU_VERIFIKASI: 'Menunggu Verifikasi',
  DISETUJUI: 'Disetujui',
  PERLU_REVISI: 'Perlu Revisi',
  DITOLAK: 'Ditolak',
};

const STATUS_CLASS = {
  MENUNGGU_VERIFIKASI: 'badge-warning',
  DISETUJUI: 'badge-success',
  PERLU_REVISI: 'badge-warning',
  DITOLAK: 'badge-danger',
};

const formatRp = (value) =>
  value == null
    ? '-'
    : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

const formatDate = (value) => (value ? new Date(value).toLocaleString('id-ID') : '-');

export default function AdminPenilaianAsetPage() {
  const [items, setItems] = useState([]);
  const [detail, setDetail] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const loadList = async () => {
    setLoading(true);
    try {
      const res = await getAdminPenilaianAset();
      setItems(res.data || []);
      if (!selectedId && res.data?.length) setSelectedId(res.data[0].id);
    } catch (err) {
      setAlert({ type: 'danger', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (asetId) => {
    if (!asetId) return;
    setDetailLoading(true);
    setAlert(null);
    try {
      const res = await getAdminPenilaianAsetDetail(asetId);
      setDetail(res.data);
      setCatatan(res.data?.aset?.catatanPenilaian || '');
    } catch (err) {
      setAlert({ type: 'danger', msg: err.message });
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  useEffect(() => {
    loadDetail(selectedId);
  }, [selectedId]);

  const handleStatus = async (status) => {
    if (['PERLU_REVISI', 'DITOLAK'].includes(status) && !catatan.trim()) {
      setAlert({ type: 'danger', msg: 'Catatan admin wajib diisi untuk revisi atau penolakan.' });
      return;
    }
    setActionLoading(true);
    setAlert(null);
    try {
      const res = await updateAdminStatusPenilaian(detail.aset.id, { status, catatan });
      setDetail(res.data);
      setCatatan(res.data?.aset?.catatanPenilaian || '');
      await loadList();
      setAlert({ type: 'success', msg: 'Status penilaian berhasil diperbarui.' });
    } catch (err) {
      setAlert({ type: 'danger', msg: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h2>Validasi Penilaian Aset</h2>
          <p>Admin memeriksa nilai kriteria dan hasil SAW yang dikirim oleh penjual.</p>
        </div>
        <button className="btn btn-secondary" onClick={loadList} disabled={loading}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 0.9fr) minmax(0, 1.4fr)', gap: 16, alignItems: 'start' }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
            <strong>Daftar Penilaian</strong>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{items.length} aset sudah memiliki penilaian/hasil.</div>
          </div>

          {loading ? (
            <div className="empty-state"><span className="spinner" /></div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <Search size={40} opacity={0.25} />
              <p>Belum ada penilaian dari penjual.</p>
            </div>
          ) : (
            <div style={{ display: 'grid' }}>
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  style={{
                    textAlign: 'left',
                    border: 0,
                    borderBottom: '1px solid var(--border)',
                    padding: 14,
                    background: selectedId === item.id ? 'var(--surface-hover)' : 'transparent',
                    color: 'var(--text)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                    <strong>{item.nama}</strong>
                    <span className={`badge ${STATUS_CLASS[item.statusPenilaian] || 'badge-primary'}`}>
                      {STATUS_LABEL[item.statusPenilaian] || item.statusPenilaian}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {item.kategori?.nama} - {item.penjual?.user?.nama || 'Tanpa penjual'}
                  </div>
                  <div style={{ fontSize: 12, marginTop: 6 }}>
                    Limit: <strong>{formatRp(item.hasil?.nilaiLimit)}</strong>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          {detailLoading ? (
            <div className="empty-state"><span className="spinner" /></div>
          ) : !detail ? (
            <div className="empty-state">Pilih aset untuk melihat detail penilaian.</div>
          ) : (
            <>
              <div className="flex-between" style={{ marginBottom: 16, alignItems: 'start' }}>
                <div>
                  <h3 style={{ marginBottom: 4 }}>{detail.aset.nama}</h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {detail.aset.kategori?.nama} - Penjual: {detail.aset.penjual?.user?.nama || '-'}
                  </div>
                </div>
                <span className={`badge ${STATUS_CLASS[detail.aset.statusPenilaian] || 'badge-primary'}`}>
                  {STATUS_LABEL[detail.aset.statusPenilaian] || detail.aset.statusPenilaian}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Harga Pasar</div>
                  <strong>{formatRp(detail.aset.hargaPasar)}</strong>
                  <div style={{ marginTop: 8 }}>
                    <Link to={`/admin/aset/${detail.aset.id}/validasi-pembanding`} className="btn btn-sm btn-outline">
                      <Database size={12} /> Validasi Pembanding
                    </Link>
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Nilai Preferensi</div>
                  <strong>{detail.hasil ? Number(detail.hasil.nilaiPreferensi).toFixed(6) : '-'}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Nilai Limit</div>
                  <strong style={{ color: 'var(--success)' }}>{formatRp(detail.hasil?.nilaiLimit)}</strong>
                </div>
              </div>

              <h4 style={{ fontSize: 14, marginBottom: 10 }}>Nilai Kriteria dan Bobot AHP</h4>
              <div className="table-wrapper" style={{ marginBottom: 16 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Kriteria</th>
                      <th>Tipe</th>
                      <th>Bobot</th>
                      <th>Nilai Seller</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.kriteria.map((item) => (
                      <tr key={item.id}>
                        <td><strong>{item.nama}</strong></td>
                        <td><span className={`badge ${item.tipe === 'benefit' ? 'badge-success' : 'badge-warning'}`}>{item.tipe}</span></td>
                        <td>{item.bobot != null ? `${(Number(item.bobot) * 100).toFixed(2)}%` : '-'}</td>
                        <td>{item.nilai ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {detail.detailNormalisasi && (
                <>
                  <h4 style={{ fontSize: 14, marginBottom: 10 }}>Normalisasi SAW</h4>
                  <div className="table-wrapper" style={{ marginBottom: 16 }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Kriteria</th>
                          <th>Nilai Asli</th>
                          <th>Rij</th>
                          <th>Kontribusi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.detailNormalisasi.map((item) => (
                          <tr key={item.kriteriaId}>
                            <td>{item.namaKriteria}</td>
                            <td>{item.nilaiAsli}</td>
                            <td>{item.nilaiNorm}</td>
                            <td><strong>{item.kontribusi}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Catatan Admin</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={catatan}
                  onChange={(event) => setCatatan(event.target.value)}
                  placeholder="Isi catatan jika meminta revisi atau menolak."
                />
              </div>

              <div className="modal-footer">
                <button className="btn btn-success" onClick={() => handleStatus('DISETUJUI')} disabled={actionLoading || !detail.hasil}>
                  {actionLoading ? <span className="spinner" /> : <><CheckCircle2 size={15} /> Setujui</>}
                </button>
                <button className="btn btn-secondary" onClick={() => handleStatus('PERLU_REVISI')} disabled={actionLoading || !detail.hasil}>
                  Minta Revisi
                </button>
                <button className="btn btn-danger" onClick={() => handleStatus('DITOLAK')} disabled={actionLoading || !detail.hasil}>
                  <XCircle size={15} /> Tolak
                </button>
              </div>

              {detail.auditLog?.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <h4 style={{ fontSize: 14, marginBottom: 8 }}>Audit Penilaian</h4>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {detail.auditLog.slice(0, 5).map((item) => (
                      <div key={item.id} style={{ fontSize: 12, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                        <strong style={{ color: 'var(--text)' }}>{item.aksi}</strong> oleh {item.role} #{item.userId} - {formatDate(item.waktu)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
