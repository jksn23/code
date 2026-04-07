import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSemuaPenjual } from '../services/api.js';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export default function PenjualPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'verified'

  const load = async () => {
    setLoading(true);
    try {
      const res = await getSemuaPenjual();
      setData(res.data);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = data.filter((item) => {
    if (filter === 'pending') return !item.isVerified;
    if (filter === 'verified') return item.isVerified;
    return true;
  });

  const pendingCount = data.filter((d) => !d.isVerified).length;
  const verifiedCount = data.filter((d) => d.isVerified).length;

  return (
    <div>
      <div className="page-header">
        <h2>🧑‍💼 Verifikasi Penjual</h2>
        <p>Kelola dan verifikasi dokumen KTP & NPWP pengguna yang mendaftar sebagai penjual</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Penjual', count: data.length, color: '#6366f1', icon: '👥' },
          { label: 'Menunggu Verifikasi', count: pendingCount, color: '#f59e0b', icon: '⏳' },
          { label: 'Sudah Terverifikasi', count: verifiedCount, color: '#10b981', icon: '✅' },
        ].map((s) => (
          <div key={s.label} style={{
            flex: 1, minWidth: 160,
            padding: '16px 20px',
            background: 'var(--surface)',
            borderRadius: 12,
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{ fontSize: 28 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { key: 'all', label: `Semua (${data.length})` },
          { key: 'pending', label: `⏳ Menunggu (${pendingCount})` },
          { key: 'verified', label: `✅ Terverifikasi (${verifiedCount})` },
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
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
            <p>
              {filter === 'pending'
                ? 'Tidak ada penjual yang menunggu verifikasi.'
                : 'Belum ada data penjual.'}
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
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
                {filtered.map((item, i) => (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td><strong>{item.user?.nama}</strong></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{item.user?.email}</td>
                    <td style={{ fontSize: 13 }}>{formatDate(item.user?.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: 11, padding: '3px 8px', borderRadius: 6,
                          background: item.ktpUrl ? '#dcfce7' : '#fee2e2',
                          color: item.ktpUrl ? '#16a34a' : '#dc2626',
                          fontWeight: 600,
                        }}>
                          {item.ktpUrl ? '✓ KTP' : '✗ KTP'}
                        </span>
                        <span style={{
                          fontSize: 11, padding: '3px 8px', borderRadius: 6,
                          background: item.npwpUrl ? '#dcfce7' : '#fee2e2',
                          color: item.npwpUrl ? '#16a34a' : '#dc2626',
                          fontWeight: 600,
                        }}>
                          {item.npwpUrl ? '✓ NPWP' : '✗ NPWP'}
                        </span>
                      </div>
                    </td>
                    <td>
                      {item.isVerified ? (
                        <span className="badge" style={{ background: '#dcfce7', color: '#16a34a', fontSize: 12 }}>
                          ✅ Terverifikasi
                        </span>
                      ) : (
                        <span className="badge" style={{ background: '#fef3c7', color: '#92400e', fontSize: 12 }}>
                          ⏳ Menunggu
                        </span>
                      )}
                    </td>
                    <td>
                      <Link
                        to={`/penjual/${item.id}`}
                        className="btn btn-sm btn-primary"
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        🔍 Lihat Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
