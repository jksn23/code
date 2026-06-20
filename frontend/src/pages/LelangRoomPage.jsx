import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import api, { konfirmasiTerimaBarang, getNextLelang, getQuickBids, saveQuickBids } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CurrencyInput from '../components/CurrencyInput';
import { SOCKET_URL, assetUrl } from '../config/env.js';

const formatRp = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
}).format(value || 0);
const formatDate = (value) => value ? new Date(value).toLocaleString('id-ID') : '-';
const formatDuration = (seconds) => {
  const total = Number(seconds);
  if (!Number.isFinite(total) || total <= 0) return '-';
  if (total % 60 === 0) return `${total} detik (${total / 60} menit)`;
  return `${total} detik`;
};

const formatCountdown = (distance) => {
  const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((distance % (1000 * 60)) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};


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
  const [quickBidPresets, setQuickBidPresets] = useState(null);
  const [showQuickBidSettings, setShowQuickBidSettings] = useState(false);
  const [qbForm, setQbForm] = useState({ quickBid1: '', quickBid2: '', quickBid3: '' });
  const [qbSaving, setQbSaving] = useState(false);

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
      const start = new Date(lelang.waktuBuka).getTime();
      const end = new Date(lelang.waktuTutup).getTime();
      if (lelang.status === 'PENDING' && now >= start && now < end) {
        loadLelang();
        return;
      }
      const waitingToStart = now < start;
      const target = waitingToStart ? start : end;
      const distance = target - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft('WAKTU HABIS');
        if (waitingToStart) {
          loadLelang();
        } else if (!hasTriggeredEnd.current) {
          hasTriggeredEnd.current = true;
          handleTimerEnd();
        }
      } else {
        setTimeLeft(formatCountdown(distance));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lelang, isClosed, handleTimerEnd, loadLelang]);

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
    if (!canBid) return alert(isNotStarted ? 'Lelang belum dibuka. Tunggu sampai waktu mulai.' : 'Lelang belum aktif atau sudah ditutup.');
    if (!nominal || nominal <= 0) return alert('Masukkan nominal yang valid');

    socketRef.current.emit('submit_bid', { lelangId: id, userId: user.id, nominal }, (response) => {
      if (!response.success) {
        alert(response.message);
      } else {
        setNominal(0);
      }
    });
  };

  const handleQuickBid = (presetValue) => {
    const val = Number(presetValue);
    setNominal(val);
    
    if (!user) return alert('Anda harus login untuk melakukan penawaran');
    if (buyerBlocked) return alert('Akun Anda belum diverifikasi atau diblokir.');
    if (!canBid) return alert(isNotStarted ? 'Lelang belum dibuka. Tunggu sampai waktu mulai.' : 'Lelang belum aktif atau sudah ditutup.');
    if (!val || val <= 0) return alert('Nominal quick bid tidak valid');

    socketRef.current.emit('submit_bid', { lelangId: id, userId: user.id, nominal: val }, (response) => {
      if (!response.success) {
        alert(response.message);
      } else {
        setNominal(0);
      }
    });
  };

  const loadQuickBids = useCallback(async () => {
    if (!user || user.role !== 'PEMBELI') return;
    try {
      const res = await getQuickBids(id);
      if (res.data) {
        setQuickBidPresets(res.data);
        setQbForm({ quickBid1: res.data.quickBid1, quickBid2: res.data.quickBid2, quickBid3: res.data.quickBid3 });
      }
    } catch { /* ignore */ }
  }, [id, user]);

  useEffect(() => { loadQuickBids(); }, [loadQuickBids]);

  const handleSaveQuickBids = async () => {
    if (!qbForm.quickBid1 || !qbForm.quickBid2 || !qbForm.quickBid3) return alert('Isi ketiga nominal Quick Bid');
    setQbSaving(true);
    try {
      await saveQuickBids({ auctionId: Number(id), quickBid1: qbForm.quickBid1, quickBid2: qbForm.quickBid2, quickBid3: qbForm.quickBid3 });
      await loadQuickBids();
      setShowQuickBidSettings(false);
    } catch (err) { alert(err.message); }
    finally { setQbSaving(false); }
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

  const nowMs = Date.now();
  const startsAt = new Date(lelang.waktuBuka).getTime();
  const endsAt = new Date(lelang.waktuTutup).getTime();
  const isNotStarted = !isClosed && Number.isFinite(startsAt) && nowMs < startsAt;
  const canBid = !isClosed && !isNotStarted && lelang.status === 'ACTIVE' && Number.isFinite(endsAt) && nowMs <= endsAt;
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

        {isNotStarted && (
          <div className="alert alert-secondary">
            Lelang sudah dijadwalkan dan akan dibuka pada <strong>{formatDate(lelang.waktuBuka)}</strong>. Bidding aktif otomatis setelah waktu mulai.
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
            <div style={{ marginTop: 16, padding: 16, background: 'var(--surface-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <h4 style={{ margin: 0, marginBottom: 12, fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Informasi Lelang</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, fontSize: 13 }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Status</div>
                  <strong>{isNotStarted ? 'DIJADWALKAN' : lelang.status}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Waktu Buka</div>
                  <strong>{formatDate(lelang.waktuBuka)}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Waktu Tutup</div>
                  <strong>{formatDate(lelang.waktuTutup)}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Durasi</div>
                  <strong>{formatDuration(lelang.durasiMenit)}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Harga Pasar</div>
                  <strong>{formatRp(lelang.aset.hargaPasar)}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Nilai Limit</div>
                  <strong>{formatRp(lelang.aset.hasil?.[0]?.nilaiLimit || 0)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: '1 1 340px', position: 'sticky', top: 32 }}>
        <div className="card" style={{ border: isClosed ? '1px solid var(--border)' : '1px solid var(--primary-light)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
              {isNotStarted ? 'Mulai Dalam' : 'Sisa Waktu Bidding'}
            </div>
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
            <div style={{ marginBottom: 24 }}>
              {isNotStarted && (
                <div style={{ padding: 16, background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', marginBottom: 16, border: '1px solid var(--primary)', color: 'var(--primary-dark)' }}>
                  <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>⚡ Persiapan Sebelum Lelang</div>
                  <div style={{ fontSize: 13, marginBottom: 12 }}>
                    Lelang belum dimulai. Anda dapat mengatur nominal <strong>Quick Bid</strong> sekarang agar bisa melakukan penawaran dengan satu klik saat lelang sudah berjalan.
                  </div>
                </div>
              )}
              
              <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginBottom: 16, background: 'var(--surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>⚡ Quick Bid (Preset)</div>
                  <button type="button" className="btn btn-secondary btn-sm" style={{ fontSize: 11, padding: '4px 12px' }} onClick={() => setShowQuickBidSettings(true)}>⚙️ Atur Preset</button>
                </div>
                {quickBidPresets ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[quickBidPresets.quickBid1, quickBidPresets.quickBid2, quickBidPresets.quickBid3].map((val, idx) => (
                      <button key={idx} type="button" className="btn btn-secondary btn-sm" style={{ fontSize: 13, fontWeight: 600, padding: '8px 4px' }}
                        onClick={() => handleQuickBid(val)} disabled={buyerBlocked || socketStatus !== 'connected' || !canBid}>
                        {formatRp(val)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: 12, background: 'var(--surface-light)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                    Belum ada preset. Klik <strong>⚙️ Atur Preset</strong> untuk menyimpan 3 nominal jagoan Anda.
                  </div>
                )}
              </div>

              <form onSubmit={handleBid}>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>Atau Masukkan Penawaran Manual:</div>
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
                  disabled={buyerBlocked || socketStatus !== 'connected' || !canBid}
                >
                  {buyerBlocked ? 'KYC Belum Disetujui' : isNotStarted ? 'Lelang Belum Dibuka' : socketStatus !== 'connected' ? 'Menunggu Koneksi' : canBid ? 'AJUKAN PENAWARAN MANUAL' : 'Bidding Tidak Aktif'}
                </button>
              </form>
            </div>
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

      {/* Quick Bid Settings Modal */}
      {showQuickBidSettings && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowQuickBidSettings(false)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>⚡ Atur Quick Bid</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowQuickBidSettings(false)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              Simpan 3 nominal preset yang bisa Anda klik langsung saat bidding. Nominal harus di atas nilai limit.
            </p>
            <div className="form-group">
              <label className="form-label">Quick Bid 1 (Rp)</label>
              <CurrencyInput value={qbForm.quickBid1} onChange={(v) => setQbForm({ ...qbForm, quickBid1: v })} placeholder="Contoh: 105.000.000" />
            </div>
            <div className="form-group">
              <label className="form-label">Quick Bid 2 (Rp)</label>
              <CurrencyInput value={qbForm.quickBid2} onChange={(v) => setQbForm({ ...qbForm, quickBid2: v })} placeholder="Contoh: 110.000.000" />
            </div>
            <div className="form-group">
              <label className="form-label">Quick Bid 3 (Rp)</label>
              <CurrencyInput value={qbForm.quickBid3} onChange={(v) => setQbForm({ ...qbForm, quickBid3: v })} placeholder="Contoh: 115.000.000" />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowQuickBidSettings(false)}>Batal</button>
              <button type="button" className="btn btn-primary" onClick={handleSaveQuickBids} disabled={qbSaving}>
                {qbSaving ? <span className="spinner" /> : '💾 Simpan Quick Bid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
