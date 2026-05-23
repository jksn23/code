import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { assetUrl } from '../config/env.js';

const formatRp = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v || 0);

export default function LelangPublikPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);
  const [, forceUpdate] = useState(0); // trigger timer re-render

  const load = async () => {
    try {
      const res = await api.get('/lelang');
      setData(res.data || []);
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Poll every 30s to pick up new auction changes
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  // UI re-render every second for countdown timers
  useEffect(() => {
    timerRef.current = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const now = new Date();

  // Sort: waktuBuka ascending so queue shows in order
  const sorted = [...data].sort((a, b) => new Date(a.waktuBuka) - new Date(b.waktuBuka));

  // Find the currently LIVE auction (first one where now is within its window)
  const live = sorted.find(a => {
    const buka = new Date(a.waktuBuka);
    const tutup = new Date(a.waktuTutup);
    return now >= buka && now <= tutup && a.status === 'ACTIVE';
  });

  // Upcoming auctions (not yet started)
  const upcoming = sorted.filter(a => {
    const buka = new Date(a.waktuBuka);
    return now < buka && a.status === 'ACTIVE';
  });

  // Finished auctions
  const finished = sorted.filter(a => a.status === 'FINISHED' || new Date(a.waktuTutup) < now);

  const calcCountdown = (targetDate) => {
    const diff = new Date(targetDate).getTime() - now.getTime();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  return (
    <div>
      <div className="page-header">
        <h2>📢 Katalog Lelang Terbuka</h2>
        <p>Akses aset eksklusif dalam antarmuka murni bebas gangguan.</p>
      </div>

      {loading ? (
        <div className="empty-state" style={{ marginTop: '100px' }}><span className="spinner" /></div>
      ) : (
        <>
          {/* ===== LIVE NOW ===== */}
          {live ? (
            <div style={{ marginBottom: 40 }}>
              <div style={{ display:'flex', alignItems:'center', gap: 12, marginBottom: 16 }}>
                <span className="badge badge-danger">SEDANG BERLANGSUNG</span>
              </div>

              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 300px' }}>
                    {live.aset?.dokumenUrl ? (
                      <img src={assetUrl(live.aset.dokumenUrl)} alt="Aset" style={{ width: '100%', height: '100%', minHeight: 280, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', minHeight: 280, backgroundColor: 'var(--surface-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>💎</div>
                    )}
                  </div>
                  <div style={{ flex: '2 1 400px', padding: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div>
                        <div className="badge badge-primary" style={{ marginBottom: 12 }}>{live.aset?.kategori?.nama}</div>
                        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>{live.aset?.nama}</h2>
                        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>Harga Evaluasi SPK: <strong style={{ color: 'var(--text)' }}>{formatRp(live.aset?.hasil?.[0]?.nilaiLimit)}</strong></div>
                      </div>
                      
                      <div style={{ marginTop: 'auto', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Berakhir Dalam</div>
                          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'monospace', color: 'var(--danger)', marginTop: 4 }}>
                            {calcCountdown(live.waktuTutup) || 'SELESAI'}
                          </div>
                        </div>
                        <Link to={`/lelang/${live.id}`} className="btn btn-primary" style={{ padding: '12px 32px', fontSize: 15, fontWeight: 600 }}>
                          Masuk Arena Bidding &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px', marginBottom: 32, border: '1px dashed var(--border)', background: 'transparent', boxShadow: 'none' }}>
              <h3 style={{ margin: 0, fontSize: 20, color: 'var(--text-muted)' }}>Tidak Ada Lelang Sedang Berlangsung</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 14 }}>Silakan pantau jadwal antrean di bawah.</p>
            </div>
          )}

          {/* ===== UP NEXT QUEUE ===== */}
          {upcoming.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Antrean Berikutnya ({upcoming.length})</h3>
              <div style={{ display: 'grid', gap: 12 }}>
                {upcoming.map((item, idx) => {
                  const countdown = calcCountdown(item.waktuBuka);
                  return (
                    <div key={item.id} className="card" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14, color: 'var(--text-muted)', flexShrink: 0 }}>
                          {idx + 2}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{item.aset?.nama}</div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}><span className="badge badge-primary">{item.aset?.kategori?.nama}</span> &nbsp;&nbsp;Limit Dasar: <strong>{formatRp(item.aset?.hasil?.[0]?.nilaiLimit)}</strong></div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Mulai dalam</div>
                        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary)' }}>{countdown || '-'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== FINISHED ===== */}
          {finished.length > 0 && (
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Selesai ({finished.length})</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {finished.map(item => (
                  <div key={item.id} className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{item.aset?.kategori?.nama}</div>
                      <div className="badge badge-success">Selesai</div>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>{item.aset?.nama}</div>
                    <Link to={`/lelang/${item.id}`} style={{ display: 'inline-flex', alignItems: 'center', fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
                      Lihat Hasil Rekap &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.length === 0 && !loading && (
            <div className="empty-state"><p>Tidak ada data katalog saat ini.</p></div>
          )}
        </>
      )}
    </div>
  );
}
