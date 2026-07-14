import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSemuaPenjual } from '../services/api.js';
import { getSellerStatusMeta, resolveSellerStatus } from '../utils/sellerVerification.js';
import { useModal } from '../context/ModalContext';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export default function PenjualPage() {
  const { showAlert } = useModal();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getSemuaPenjual();
      setData(res.data);
    } catch (e) {
      showAlert(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = data.filter((item) => {
    const status = resolveSellerStatus(item);
    if (filter === 'pending') return status === 'PENDING';
    if (filter === 'approved') return status === 'APPROVED';
    if (filter === 'rejected') return status === 'REJECTED';
    return true;
  });

  const pendingCount = data.filter((item) => resolveSellerStatus(item) === 'PENDING').length;
  const approvedCount = data.filter((item) => resolveSellerStatus(item) === 'APPROVED').length;
  const rejectedCount = data.filter((item) => resolveSellerStatus(item) === 'REJECTED').length;

  return (
    <div>
      <div className="page-header">
        <h2>Verifikasi Penjual</h2>
        <p>Kelola dokumen seller, status approval, dan catatan revisi dari admin.</p>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Penjual', count: data.length, color: '#6366f1' },
          { label: 'Menunggu Review', count: pendingCount, color: '#f59e0b' },
          { label: 'Terverifikasi', count: approvedCount, color: '#10b981' },
          { label: 'Perlu Revisi', count: rejectedCount, color: '#dc2626' },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              flex: 1,
              minWidth: 160,
              padding: '16px 20px',
              background: 'var(--surface)',
              borderRadius: 12,
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.count}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: `Semua (${data.length})` },
          { key: 'pending', label: `Pending (${pendingCount})` },
          { key: 'approved', label: `Approved (${approvedCount})` },
          { key: 'rejected', label: `Revisi (${rejectedCount})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`btn btn-sm ${filter === tab.key ? 'btn-primary' : 'btn-secondary'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="empty-state"><span className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>Tidak ada seller pada filter ini.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Tanggal Daftar</th>
                  <th>Dokumen</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const meta = getSellerStatusMeta(resolveSellerStatus(item));
                  return (
                    <tr key={item.id}>
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td><strong>{item.user?.nama}</strong></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{item.user?.email}</td>
                      <td style={{ fontSize: 13 }}>{formatDate(item.user?.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: 11,
                              padding: '3px 8px',
                              borderRadius: 6,
                              background: item.ktpUrl ? '#dcfce7' : '#fee2e2',
                              color: item.ktpUrl ? '#16a34a' : '#dc2626',
                              fontWeight: 600,
                            }}
                          >
                            {item.ktpUrl ? 'KTP' : 'KTP kosong'}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              padding: '3px 8px',
                              borderRadius: 6,
                              background: item.npwpUrl ? '#dcfce7' : '#fee2e2',
                              color: item.npwpUrl ? '#16a34a' : '#dc2626',
                              fontWeight: 600,
                            }}
                          >
                            {item.npwpUrl ? 'NPWP' : 'NPWP kosong'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: meta.bg, color: meta.color, fontSize: 12 }}>
                          {meta.label}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/penjual/${item.id}`}
                          className="btn btn-sm btn-primary"
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          Lihat Detail
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
