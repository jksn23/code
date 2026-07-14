import React, { useEffect, useMemo, useState } from 'react';
import { Users, ShieldCheck, Store, ShoppingBag } from 'lucide-react';
import {
  createUserAdmin,
  deleteUserAdmin,
  getUserAdminById,
  getUsersAdmin,
  updateUserAdmin,
} from '../services/api';
import { getSellerStatusMeta, resolveSellerStatus } from '../utils/sellerVerification';

const ROLE_OPTIONS = ['ADMIN', 'PENJUAL', 'PEMBELI'];
const BUYER_STATUS_OPTIONS = ['UNVERIFIED', 'PENDING', 'APPROVED', 'REJECTED'];
const SELLER_STATUS_OPTIONS = ['PENDING', 'APPROVED', 'REJECTED'];

const formatDate = (value) => value ? new Date(value).toLocaleString('id-ID') : '-';

const roleBadge = (role) => {
  const map = {
    ADMIN: { bg: '#dbeafe', color: '#1d4ed8' },
    PENJUAL: { bg: '#ede9fe', color: '#6d28d9' },
    PEMBELI: { bg: '#dcfce7', color: '#166534' },
  };
  const tone = map[role] || { bg: 'var(--surface-light)', color: 'var(--text-muted)' };
  return <span className="badge" style={{ background: tone.bg, color: tone.color }}>{role}</span>;
};

function UserFormModal({ mode, detail, onClose, onSaved }) {
  const [form, setForm] = useState({
    nama: detail?.nama || '',
    email: detail?.email || '',
    password: '',
    role: detail?.role || 'PEMBELI',
    ktpUrl: detail?.ktpUrl || '',
    buyerVerificationStatus: detail?.buyerVerificationStatus || 'UNVERIFIED',
    buyerVerificationNote: detail?.buyerVerificationNote || '',
    rekeningBank: detail?.penjual?.rekeningBank || '',
    nomorRekening: detail?.penjual?.nomorRekening || '',
    sellerKtpUrl: detail?.penjual?.ktpUrl || '',
    sellerNpwpUrl: detail?.penjual?.npwpUrl || '',
    sellerVerificationStatus: detail?.penjual?.verificationStatus || resolveSellerStatus(detail),
    sellerVerificationNote: detail?.penjual?.verificationNote || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({
      nama: detail?.nama || '',
      email: detail?.email || '',
      password: '',
      role: detail?.role || 'PEMBELI',
      ktpUrl: detail?.ktpUrl || '',
      buyerVerificationStatus: detail?.buyerVerificationStatus || 'UNVERIFIED',
      buyerVerificationNote: detail?.buyerVerificationNote || '',
      rekeningBank: detail?.penjual?.rekeningBank || '',
      nomorRekening: detail?.penjual?.nomorRekening || '',
      sellerKtpUrl: detail?.penjual?.ktpUrl || '',
      sellerNpwpUrl: detail?.penjual?.npwpUrl || '',
      sellerVerificationStatus: detail?.penjual?.verificationStatus || resolveSellerStatus(detail),
      sellerVerificationNote: detail?.penjual?.verificationNote || '',
    });
  }, [detail]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...form };
      if (mode === 'create') {
        await createUserAdmin(payload);
      } else {
        await updateUserAdmin(detail.id, payload);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 720 }}>
        <div className="modal-header">
          <h3>{mode === 'create' ? 'Tambah User Baru' : 'Edit User'}</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Nama Lengkap</label>
              <input className="form-control" value={form.nama} onChange={(e) => setForm((prev) => ({ ...prev, nama: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Password {mode === 'edit' && '(opsional)'}</label>
              <input type="password" className="form-control" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} required={mode === 'create'} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-control" value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}>
                {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">KTP URL Pembeli / Umum</label>
            <input className="form-control" value={form.ktpUrl} onChange={(e) => setForm((prev) => ({ ...prev, ktpUrl: e.target.value }))} placeholder="uploads/ktp/example.jpg" />
          </div>

          {form.role === 'PEMBELI' && (
            <div className="card" style={{ marginBottom: 16, background: 'var(--surface-light)' }}>
              <h4 style={{ marginBottom: 12 }}>Detail Pembeli</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Status KYC</label>
                  <select className="form-control" value={form.buyerVerificationStatus} onChange={(e) => setForm((prev) => ({ ...prev, buyerVerificationStatus: e.target.value }))}>
                    {BUYER_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Catatan KYC</label>
                  <input className="form-control" value={form.buyerVerificationNote} onChange={(e) => setForm((prev) => ({ ...prev, buyerVerificationNote: e.target.value }))} placeholder="Catatan admin untuk pembeli" />
                </div>
              </div>
            </div>
          )}

          {form.role === 'PENJUAL' && (
            <div className="card" style={{ marginBottom: 16, background: 'var(--surface-light)' }}>
              <h4 style={{ marginBottom: 12 }}>Detail Penjual</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">KTP URL Penjual</label>
                  <input className="form-control" value={form.sellerKtpUrl} onChange={(e) => setForm((prev) => ({ ...prev, sellerKtpUrl: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">NPWP URL</label>
                  <input className="form-control" value={form.sellerNpwpUrl} onChange={(e) => setForm((prev) => ({ ...prev, sellerNpwpUrl: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Nama Bank</label>
                  <input className="form-control" value={form.rekeningBank} onChange={(e) => setForm((prev) => ({ ...prev, rekeningBank: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Nomor Rekening</label>
                  <input className="form-control" value={form.nomorRekening} onChange={(e) => setForm((prev) => ({ ...prev, nomorRekening: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Status Seller</label>
                  <select className="form-control" value={form.sellerVerificationStatus} onChange={(e) => setForm((prev) => ({ ...prev, sellerVerificationStatus: e.target.value }))}>
                    {SELLER_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Catatan Seller</label>
                  <input className="form-control" value={form.sellerVerificationNote} onChange={(e) => setForm((prev) => ({ ...prev, sellerVerificationNote: e.target.value }))} placeholder="Catatan admin untuk seller" />
                </div>
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Simpan User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserDetailModal({ detail, onClose, onEdit }) {
  return (
    <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 760 }}>
        <div className="modal-header">
          <h3>Detail User</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card" style={{ background: 'var(--surface-light)' }}>
            <h4 style={{ marginBottom: 12 }}>Profil Utama</h4>
            <div style={{ display: 'grid', gap: 10 }}>
              <div><strong>Nama:</strong> {detail.nama}</div>
              <div><strong>Email:</strong> {detail.email}</div>
              <div><strong>Role:</strong> {detail.role}</div>
              <div><strong>Dibuat:</strong> {formatDate(detail.createdAt)}</div>
              <div><strong>Update:</strong> {formatDate(detail.updatedAt)}</div>
              <div><strong>KTP URL:</strong> {detail.ktpUrl || '-'}</div>
            </div>
          </div>

          <div className="card" style={{ background: 'var(--surface-light)' }}>
            <h4 style={{ marginBottom: 12 }}>Aktivitas</h4>
            <div style={{ display: 'grid', gap: 10 }}>
              <div><strong>Total Penawaran:</strong> {detail._count?.penawaran || 0}</div>
              <div><strong>Lelang Dimenangkan:</strong> {detail._count?.lelangDimenangkan || 0}</div>
              <div><strong>Verifikasi Pembayaran:</strong> {detail._count?.verifiedPayments || 0}</div>
              <div><strong>Buyer Diverifikasi:</strong> {detail._count?.verifiedBuyers || 0}</div>
              <div><strong>Notifikasi:</strong> {detail._count?.notifications || 0}</div>
            </div>
          </div>
        </div>

        {detail.role === 'PENJUAL' && (
          <div className="card" style={{ marginTop: 16 }}>
            <h4 style={{ marginBottom: 12 }}>Detail Penjual</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><strong>Status:</strong> {resolveSellerStatus(detail)}</div>
              <div><strong>Total Aset:</strong> {detail.penjual?._count?.aset || 0}</div>
              <div><strong>Bank:</strong> {detail.penjual?.rekeningBank || '-'}</div>
              <div><strong>No Rekening:</strong> {detail.penjual?.nomorRekening || '-'}</div>
              <div><strong>KTP Seller:</strong> {detail.penjual?.ktpUrl || '-'}</div>
              <div><strong>NPWP:</strong> {detail.penjual?.npwpUrl || '-'}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong>Catatan:</strong> {detail.penjual?.verificationNote || '-'}</div>
            </div>
          </div>
        )}

        {detail.role === 'PEMBELI' && (
          <div className="card" style={{ marginTop: 16 }}>
            <h4 style={{ marginBottom: 12 }}>Detail Pembeli</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><strong>Status KYC:</strong> {detail.buyerVerificationStatus}</div>
              <div><strong>Verified At:</strong> {formatDate(detail.buyerVerifiedAt)}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong>Catatan:</strong> {detail.buyerVerificationNote || '-'}</div>
            </div>
          </div>
        )}

        <div className="card" style={{ marginTop: 16 }}>
          <h4 style={{ marginBottom: 12 }}>Riwayat Singkat</h4>
          {detail.penawaran?.length ? (
            <div style={{ display: 'grid', gap: 8 }}>
              {detail.penawaran.map((item) => (
                <div key={item.id} style={{ paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                  Bid #{item.id} pada {item.lelang?.aset?.nama || '-'} | nominal {item.nominal} | {formatDate(item.createdAt)}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 12 }}>Belum ada riwayat bid.</div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Tutup</button>
          <button type="button" className="btn btn-primary" onClick={onEdit}>Edit User</button>
        </div>
      </div>
    </div>
  );
}

export default function UserManagementPage() {
  const { showAlert, showConfirm } = useModal();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'detail'
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Filter & pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  const load = async (pageTarget = page) => {
    setLoading(true);
    try {
      const res = await getUsersAdmin({
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        page: pageTarget,
        limit: 10,
      });
      setData(res.data || []);
      setMeta(res.meta || { total: 0, totalPages: 1 });
    } catch (e) {
      showAlert(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    setPage(1);
  }, [search, roleFilter, statusFilter]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > meta.totalPages) return;
    setPage(newPage);
    load(newPage);
  };

  const counts = useMemo(() => ({
    total: meta.total || data.length,
    admin: data.filter((item) => item.role === 'ADMIN').length,
    penjual: data.filter((item) => item.role === 'PENJUAL').length,
    pembeli: data.filter((item) => item.role === 'PEMBELI').length,
  }), [data, meta.total]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await getUserAdminById(id);
      setSelectedDetail(res.data);
      setModal('detail');
    } catch (err) {
      showAlert(err.message, 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const openEdit = async (id) => {
    setDetailLoading(true);
    try {
      const res = await getUserAdminById(id);
      setSelectedDetail(res.data);
      setModal('edit');
    } catch (err) {
      showAlert(err.message, 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    const isConfirmed = await showConfirm(`Hapus user "${name}" secara permanen? Data transaksi & relasi terkait akan ikut terhapus.`, {
      title: 'Hapus User',
      type: 'danger',
      confirmText: 'Ya, Hapus User',
    });
    if (!isConfirmed) return;

    setDeletingId(id);
    try {
      await deleteUserAdmin(id);
      showAlert(`User "${name}" berhasil dihapus.`, 'success');
      await load();
    } catch (err) {
      showAlert(err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={24} style={{ color: 'var(--primary)' }} /> Manajemen User
          </h2>
          <p>Admin dapat mengelola seluruh user aktif, melihat detail relasi, dan melakukan CRUD dengan validasi aman.</p>
        </div>
        <button type="button" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => { setSelectedDetail(null); setModal('create'); }}>
          <Plus size={18} /> Tambah User
        </button>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Total User', value: counts.total, accent: '#1d4ed8', icon: <Users size={24} /> },
          { label: 'Admin', value: counts.admin, accent: '#7c3aed', icon: <ShieldCheck size={24} /> },
          { label: 'Penjual', value: counts.penjual, accent: '#ea580c', icon: <Store size={24} /> },
          { label: 'Pembeli', value: counts.pembeli, accent: '#16a34a', icon: <ShoppingBag size={24} /> },
        ].map((item) => (
          <div key={item.label} className="stat-card">
            <div className="stat-icon" style={{ color: item.accent }}>{item.icon}</div>
            <div>
              <div className="stat-label">{item.label}</div>
              <div className="stat-value" style={{ color: item.accent }}>{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr auto', gap: 12 }}>
          <input
            className="form-control"
            placeholder="Cari nama atau email user"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="form-control" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">Semua Role</option>
            {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
          <button type="button" className="btn btn-secondary" onClick={load}>Refresh</button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="empty-state"><span className="spinner" /> Memuat data user...</div>
        ) : data.length === 0 ? (
          <div className="empty-state">Belum ada user pada filter ini.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status Khusus</th>
                  <th>Aktivitas</th>
                  <th>Dibuat</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{item.nama}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.email}</div>
                    </td>
                    <td>{roleBadge(item.role)}</td>
                    <td style={{ fontSize: 13 }}>
                      {item.role === 'PENJUAL' && (() => {
                        const meta = getSellerStatusMeta(resolveSellerStatus(item));
                        return <span className="badge" style={{ background: meta.bg, color: meta.color }}>{meta.shortLabel}</span>;
                      })()}
                      {item.role === 'PEMBELI' && `Buyer ${item.buyerVerificationStatus}`}
                      {item.role === 'ADMIN' && 'Admin aktif'}
                    </td>
                    <td style={{ fontSize: 13 }}>
                      Bid: {item._count?.penawaran || 0} | Notif: {item._count?.notifications || 0}
                    </td>
                    <td style={{ fontSize: 12 }}>{formatDate(item.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => openDetail(item.id)} disabled={detailLoading}>
                          Detail
                        </button>
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => openEdit(item.id)} disabled={detailLoading}>
                          Edit
                        </button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id, item.nama)} disabled={deletingId === item.id}>
                          {deletingId === item.id ? <span className="spinner" /> : 'Hapus'}
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

      {modal === 'create' && (
        <UserFormModal
          mode="create"
          detail={null}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}

      {modal === 'edit' && selectedDetail && (
        <UserFormModal
          mode="edit"
          detail={selectedDetail}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            setSelectedDetail(null);
            load();
          }}
        />
      )}

      {modal === 'detail' && selectedDetail && (
        <UserDetailModal
          detail={selectedDetail}
          onClose={() => setModal(null)}
          onEdit={() => setModal('edit')}
        />
      )}
    </div>
  );
}
