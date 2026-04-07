import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

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
        <h2>📢 Daftar Lelang</h2>
        <p>Ikuti lelang secara real-time. Satu antrian, satu objek — bergantian sesuai jadwal.</p>
      </div>

      {loading ? (
        <div className="empty-state"><span className="spinner" /></div>
      ) : (
        <>
          {/* ===== LIVE NOW ===== */}
          {live ? (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 16 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 0 3px rgba(239,68,68,0.3)', display:'inline-block', animation: 'pulse 1.5s infinite' }} />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#ef4444' }}>SEDANG BERLANGSUNG</h3>
              </div>

              <div className="card" style={{ padding: 0, overflow: 'hidden', border: '2px solid #ef4444' }}>
                {live.aset?.dokumenUrl ? (
                  <img src={`http://localhost:5000/${live.aset.dokumenUrl}`} alt="Aset" style={{ width: '100%', height: 260, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: 200, backgroundColor: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🏷️</div>
                )}
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>{live.aset?.kategori?.nama}</div>
                      <h2 style={{ margin: 0, fontSize: 24 }}>{live.aset?.nama}</h2>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Nilai Limit: <strong style={{ color: '#10b981' }}>{formatRp(live.aset?.hasil?.[0]?.nilaiLimit)}</strong></div>
                    </div>
                    {/* Live Countdown */}
                    <div style={{ textAlign: 'center', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 20px' }}>
                      <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>SISA WAKTU</div>
                      <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'monospace', color: '#ef4444' }}>
                        {calcCountdown(live.waktuTutup) || 'HABIS'}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 20 }}>
                    <Link to={`/lelang/${live.id}`} className="btn btn-primary" style={{ padding: '12px 32px', fontSize: 16, fontWeight: 700, display: 'inline-block' }}>
                      🔨 Ikut Bidding Sekarang
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px', marginBottom: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
              <h3 style={{ margin: 0 }}>Tidak Ada Lelang Berlangsung Saat Ini</h3>
              <p style={{ color: 'var(--text-muted)' }}>Cek antrian di bawah untuk mengetahui jadwal selanjutnya.</p>
            </div>
          )}

          {/* ===== UP NEXT QUEUE ===== */}
          {upcoming.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-muted)' }}>⏭ ANTREAN BERIKUTNYA ({upcoming.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {upcoming.map((item, idx) => {
                  const countdown = calcCountdown(item.waktuBuka);
                  return (
                    <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {idx + 2}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 16 }}>{item.aset?.nama}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.aset?.kategori?.nama} · Nilai Limit: {formatRp(item.aset?.hasil?.[0]?.nilaiLimit)}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Mulai dalam</div>
                        <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary)' }}>{countdown || '-'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(item.waktuBuka).toLocaleString('id-ID')}</div>
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
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-muted)' }}>✅ SELESAI ({finished.length})</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {finished.map(item => (
                  <div key={item.id} className="card" style={{ opacity: 0.7 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{item.aset?.kategori?.nama}</div>
                    <div style={{ fontWeight: 700 }}>{item.aset?.nama}</div>
                    <div style={{ marginTop: 8 }}>
                      <span style={{ background: '#dbeafe', color: '#2563eb', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>SELESAI</span>
                    </div>
                    <Link to={`/lelang/${item.id}`} style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: 'var(--primary)' }}>Lihat Hasil →</Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.length === 0 && !loading && (
            <div className="empty-state"><p>Belum ada lelang yang terdaftar.</p></div>
          )}
        </>
      )}
    </div>
  );
}
