import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import api, { konfirmasiTerimaBarang, getNextLelang } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CurrencyInput from '../components/CurrencyInput';
import { SOCKET_URL, assetUrl } from '../config/env.js';

const formatRp = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
}).format(value || 0);

const QUICK_BIDS = [
  { label: '+500 Rb', value: 500000 },
  { label: '+1 Jt', value: 1000000 },
  { label: '+5 Jt', value: 5000000 },
  { label: '+10 Jt', value: 10000000 },
];

export default function LelangRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lelang, setLelang] = useState(null);
  const [bids, setBids] = useState([]);
  const [nominal, setNominal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState('');
  const [isClosed, setIsClosed] = useState(false);
  const [konfirmLoading, setKonfirmLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [nextLelang, setNextLelang] = useState(null);
  const [nextCountdown, setNextCountdown] = useState('');
  const [socketStatus, setSocketStatus] = useState('connecting');
  const [syncMessage, setSyncMessage] = useState('');

  const socketRef = useRef(null);
  const hasTriggeredEnd = useRef(false);
  const currentIdRef = useRef(id);

  useEffect(() => {
    currentIdRef.current = id;
    hasTriggeredEnd.current = false;
    setSocketStatus('connecting');
    setSyncMessage('');
  }, [id]);

  const loadLelang = useCallback(async () => {
    try {
      const res = await api.get(`/lelang/${currentIdRef.current}`);
      const data = res.data;
      setLelang(data);
      setBids(data.penawaran || []);
      setError('');
      setSyncMessage(`Data sinkron ${new Date().toLocaleTimeString('id-ID')}`);
      if (data.status === 'FINISHED') {
        setIsClosed(true);
      } else {
        setIsClosed(false);
      }
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNextLelang = useCallback(async (lelangId) => {
    try {
      const res = await getNextLelang(lelangId);
      const next = res.data;
      setNextLelang(next || null);
      return next || null;
    } catch {
      return null;
    }
  }, []);

  const handleTimerEnd = useCallback(async () => {
    setIsClosed(true);
    setTransitioning(true);
    await loadLelang();

    const next = await fetchNextLelang(currentIdRef.current);
    if (next) {
      setTimeout(() => navigate(`/lelang/${next.id}`), 3500);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setTimeout(() => navigate(`/lelang/summary?date=${today}`), 4000);
    }
  }, [fetchNextLelang, loadLelang, navigate]);

  useEffect(() => {
    loadLelang();

    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', async () => {
      setSocketStatus('connected');
      socket.emit('join_lelang', currentIdRef.current);
      await loadLelang();
    });

    socket.on('disconnect', () => {
      setSocketStatus('disconnected');
    });

    socket.on('connect_error', () => {
      setSocketStatus('error');
    });

    socket.io.on('reconnect_attempt', () => {
      setSocketStatus('reconnecting');
    });

    socket.io.on('reconnect', async () => {
      setSocketStatus('connected');
      socket.emit('join_lelang', currentIdRef.current);
      await loadLelang();
    });

    socket.on('new_bid', (newBid) => {
      setBids((prev) => [newBid, ...prev].sort((a, b) => Number(b.nominal) - Number(a.nominal)));
    });

    return () => {
      socket.disconnect();
    };
  }, [id, loadLelang]);

  useEffect(() => {
    if (!lelang || isClosed) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(lelang.waktuTutup).getTime();
      const distance = end - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft('WAKTU HABIS');
        if (!hasTriggeredEnd.current) {
          hasTriggeredEnd.current = true;
          handleTimerEnd();
        }
      } else {
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lelang, isClosed, handleTimerEnd]);

  useEffect(() => {
    if (!nextLelang || !transitioning) return;
    let count = 3;
    setNextCountdown('3');
    const interval = setInterval(() => {
      count -= 1;
      setNextCountdown(String(count));
      if (count <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [nextLelang, transitioning]);

  const handleBid = (event) => {
    event.preventDefault();
    if (!user) return alert('Anda harus login untuk bidding');
    if (user.role === 'ADMIN') return alert('Admin tidak bisa bidding');
    if (user.role === 'PENJUAL') return alert('Penjual tidak bisa bidding');
    if (user.buyerVerificationStatus !== 'APPROVED') {
      return alert('Akun pembeli Anda belum lolos verifikasi KYC. Bidding dikunci sampai admin menyetujui identitas Anda.');
    }
    if (socketStatus !== 'connected') {
      return alert('Koneksi realtime belum stabil. Tunggu sampai room kembali terhubung.');
    }
    if (isClosed) return alert('Lelang sudah ditutup');
    if (!nominal || nominal <= 0) return alert('Masukkan nominal yang valid');

    socketRef.current.emit('submit_bid', { lelangId: id, userId: user.id, nominal }, (response) => {
      if (!response.success) {
        alert(response.message);
      } else {
        setNominal(0);
      }
    });
  };

  const handleQuickBid = (increment) => {
    const highest = bids.length > 0 ? Number(bids[0].nominal) : 0;
    const limit = Number(lelang?.aset?.hasil?.[0]?.nilaiLimit || 0);
    setNominal(Math.max(highest, limit) + increment);
  };

  const handleKonfirmasiBarang = async () => {
    if (!window.confirm('Konfirmasi bahwa barang sudah Anda terima?')) return;
    setKonfirmLoading(true);
    try {
      await konfirmasiTerimaBarang(id);
      alert('Konfirmasi penerimaan barang berhasil.');
      loadLelang();
    } catch (err) {
      alert(err.message);
    } finally {
      setKonfirmLoading(false);
    }
  };

  if (loading) return <div className="spinner" style={{ margin: '100px auto' }} />;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!lelang) return <div>Data tidak ditemukan</div>;

  const highestBid = bids.length > 0 ? bids[0] : null;
  const isWinner = isClosed && (lelang.pemenangId === user?.id || highestBid?.userId === user?.id);
  const isPaid = lelang.statusPembayaran === 'LUNAS';
  const isReceived = lelang.statusBarang === 'DITERIMA';
  const buyerBlocked = user?.role === 'PEMBELI' && user?.buyerVerificationStatus !== 'APPROVED';

  return (
    <>
      {lelang.aset.dokumenUrl && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundImage: `url(${assetUrl(lelang.aset.dokumenUrl)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(20px)',
              zIndex: -2,
              transform: 'scale(1.1)',
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'var(--bg)',
              opacity: 0.85,
              zIndex: -1,
            }}
          />
        </>
      )}
      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap', position: 'relative' }}>
        <div style={{ flex: '1 1 600px' }}>
        <div className="card" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status koneksi room</div>
            <div style={{ fontWeight: 700 }}>
              {socketStatus === 'connected' && '🟢 Connected'}
              {socketStatus === 'connecting' && '🟡 Connecting'}
              {socketStatus === 'reconnecting' && '🟠 Reconnecting'}
              {socketStatus === 'disconnected' && '🔴 Disconnected'}
              {socketStatus === 'error' && '🔴 Error'}
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{syncMessage || 'Menunggu sinkronisasi data'}</div>
        </div>

        {buyerBlocked && (
          <div className="alert alert-danger">
            Bidding dikunci karena status KYC pembeli Anda masih <strong>{user?.buyerVerificationStatus}</strong>. Tunggu verifikasi admin sebelum ikut menawar.
          </div>
        )}

        {isClosed && (
          <div
            className="card"
            style={{
              marginBottom: 32,
              padding: 0,
              overflow: 'hidden',
              border: isWinner ? '1px solid var(--success)' : '1px solid var(--border)',
              background: isWinner ? 'var(--success-bg)' : 'var(--surface-light)',
            }}
          >
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{isWinner ? '🎉' : '🏁'}</div>
              <h2 style={{ color: 'var(--text)', fontSize: 24, margin: 0, fontWeight: 700, letterSpacing: '1px' }}>LELANG DITUTUP</h2>
              {highestBid ? (
                <>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 12, marginBottom: 4, fontWeight: 600 }}>Dimenangkan Oleh:</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>
                    {lelang.pemenang?.nama || highestBid.user?.nama || '—'}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginTop: 8, display: 'inline-block', borderBottom: '2px solid var(--border)' }}>
                    {formatRp(highestBid.nominal)}
                  </div>

                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
                    <div className={`badge ${isPaid ? 'badge-success' : 'badge-warning'}`} style={{ padding: '8px 16px', fontSize: 12 }}>
                      STATUS PEMBAYARAN: {isPaid ? 'LUNAS' : lelang.statusPembayaran}
                    </div>
                    {isPaid && (
                      <div className={`badge ${isReceived ? 'badge-success' : 'badge-primary'}`} style={{ padding: '8px 16px', fontSize: 12 }}>
                        STATUS BARANG: {isReceived ? 'DITERIMA' : 'DALAM PROSES'}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p style={{ color: 'var(--text-muted)', marginTop: 24 }}>Tidak ada partisipan penawar.</p>
              )}
            </div>

            {isWinner && highestBid && (
              <div style={{ background: 'var(--surface)', padding: '24px', borderTop: '1px solid var(--border)' }}>
                {!isPaid && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                    Menunggu verifikasi pembayaran oleh admin.
                  </div>
                )}
                {isPaid && !isReceived && (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 14 }}>
                      Barang sedang dikirim. Konfirmasi jika telah Anda terima dengan aman.
                    </p>
                    <button onClick={handleKonfirmasiBarang} disabled={konfirmLoading} className="btn btn-primary" style={{ padding: '12px 24px', width: 'auto' }}>
                      {konfirmLoading ? 'Memproses...' : '📦 Ya, Barang Diterima'}
                    </button>
                  </div>
                )}
                {isPaid && isReceived && (
                  <div style={{ textAlign: 'center', color: 'var(--success)', fontWeight: 600, fontSize: 14 }}>
                    ✅ Transaksi selesai sepenuhnya.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {lelang.aset.dokumenUrl && (
            <div style={{ borderBottom: '1px solid var(--border)' }}>
              <img src={assetUrl(lelang.aset.dokumenUrl)} alt="Aset" style={{ width: '100%', height: 320, objectFit: 'cover' }} />
            </div>
          )}
          <div style={{ padding: 32 }}>
            <span className="badge badge-primary">{lelang.aset.kategori?.nama}</span>
            <h2 style={{ fontSize: 28, marginTop: 16, marginBottom: 8, fontWeight: 700 }}>{lelang.aset.nama}</h2>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, fontWeight: 500 }}>
              Dirilis Oleh: <span style={{ color: 'var(--text)' }}>{lelang.aset.penjual?.user?.nama}</span>
            </div>
            <div style={{ padding: 16, background: 'var(--surface-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <h4 style={{ margin: 0, marginBottom: 8, fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Detail & Deskripsi</h4>
              <p style={{ margin: 0, lineHeight: 1.6, fontSize: 14, color: 'var(--text)' }}>{lelang.aset.deskripsi || 'Tidak ada spesifikasi yang disertakan pada aset ini.'}</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: '1 1 340px', position: 'sticky', top: 32 }}>
        <div className="card" style={{ border: isClosed ? '1px solid var(--border)' : '1px solid var(--primary-light)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Sisa Waktu Bidding</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: isClosed ? 'var(--text-muted)' : 'var(--danger)', fontFamily: 'monospace', marginTop: 4 }}>
              {timeLeft || '-- : -- : --'}
            </div>
            {transitioning && nextLelang && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                Beralih ke lelang berikutnya dalam {nextCountdown} detik.
              </div>
            )}
          </div>

          <div style={{ padding: 16, background: 'var(--surface-light)', borderRadius: 'var(--radius-md)', marginBottom: 16, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Harga Awal Lelang</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-muted)' }}>
              {formatRp(lelang.aset.hasil?.[0]?.nilaiLimit || 0)}
            </div>
          </div>

          <div style={{ padding: 16, background: 'var(--success-bg)', borderRadius: 'var(--radius-md)', marginBottom: 24, border: '1px solid rgba(52,211,153,0.3)' }}>
            <div style={{ fontSize: 12, color: 'var(--success)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>Tertinggi Saat Ini</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>
              {highestBid ? formatRp(highestBid.nominal) : 'Belum Ada Penawaran'}
            </div>
            {highestBid && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Pemegang: <strong>{highestBid.user?.nama}</strong></div>}
          </div>

          {!isClosed && user?.role === 'PEMBELI' && (
            <form onSubmit={handleBid}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>Tawaran Cepat (+):</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {QUICK_BIDS.map(({ label, value }) => (
                    <button key={value} type="button" className="btn btn-secondary btn-sm" onClick={() => handleQuickBid(value)} disabled={buyerBlocked || socketStatus !== 'connected'}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>Nilai Penawaran Anda:</div>
                <CurrencyInput
                  value={nominal}
                  onChange={(value) => setNominal(value)}
                  style={{ fontSize: 18, fontWeight: '600', textAlign: 'center', height: 48, background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 600 }}
                disabled={buyerBlocked || socketStatus !== 'connected'}
              >
                {buyerBlocked ? 'KYC Belum Disetujui' : socketStatus !== 'connected' ? 'Menunggu Koneksi' : 'AJUKAN PENAWARAN'}
              </button>
            </form>
          )}

          {!user && (
            <div style={{ textAlign: 'center', padding: 20, background: 'var(--surface-light)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: 13, margin: 0, marginBottom: 12, color: 'var(--text-muted)' }}>Anda membutuhkan akun untuk mengikuti lelang ini.</p>
              <Link to="/login" className="btn btn-secondary">Sign In Disini</Link>
            </div>
          )}

          {user?.role === 'PENJUAL' && (
            <div className="alert alert-secondary" style={{ textAlign: 'center', margin: 0, padding: 12 }}>
              Pemantauan aset publik
            </div>
          )}
        </div>

        <div className="card" style={{ marginTop: 24, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Log Aktivitas ({bids.length})</h4>
          </div>

          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {bids.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Belum ada riwayat tawaran...</p>
            ) : (
              bids.map((bid, index) => (
                <div key={bid.id || index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 28, height: 28, background: index === 0 ? 'var(--success-bg)' : 'var(--surface-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: index === 0 ? 'var(--success)' : 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>
                      {index + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: index === 0 ? 'var(--text)' : 'var(--text-muted)' }}>{bid.user?.nama || bid.userId}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(bid.createdAt).toLocaleTimeString('id-ID')}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: index === 0 ? 'var(--success)' : 'var(--text)' }}>{formatRp(bid.nominal)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
