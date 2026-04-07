import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api, {
  konfirmasiTerimaBarang,
  getNextLelang,
  getInvoiceLelang,
  uploadBuktiPembayaranLelang,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import CurrencyInput from '../components/CurrencyInput';
import { downloadInvoicePdf } from '../utils/invoice';

const formatRp = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v || 0);

const formatDateTime = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const QUICK_BIDS = [
  { label: '+500 Rb', value: 500000 },
  { label: '+1 Jt', value: 1000000 },
  { label: '+5 Jt', value: 5000000 },
  { label: '+10 Jt', value: 10000000 },
];

const PAYMENT_STATUS_META = {
  UNPAID: { label: 'Belum Upload Bukti', accent: '#f59e0b', bg: 'rgba(245,158,11,0.3)', icon: '⏳' },
  PENDING_VERIFICATION: { label: 'Menunggu Verifikasi', accent: '#60a5fa', bg: 'rgba(59,130,246,0.25)', icon: '🧾' },
  LUNAS: { label: 'Lunas', accent: '#10b981', bg: 'rgba(16,185,129,0.3)', icon: '✅' },
  DITOLAK: { label: 'Bukti Ditolak', accent: '#f87171', bg: 'rgba(239,68,68,0.28)', icon: '❌' },
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
  const [invoice, setInvoice] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [paymentFile, setPaymentFile] = useState(null);
  const [paymentUploading, setPaymentUploading] = useState(false);

  const socketRef = useRef(null);
  const hasTriggeredEnd = useRef(false);
  const currentIdRef = useRef(id);

  useEffect(() => {
    currentIdRef.current = id;
    hasTriggeredEnd.current = false;
    setInvoice(null);
    setPaymentFile(null);
  }, [id]);

  const loadLelang = useCallback(async () => {
    try {
      const res = await api.get(`/lelang/${currentIdRef.current}`);
      const data = res.data;
      setLelang(data);
      setBids(data.penawaran || []);
      if (data.status === 'FINISHED') {
        setIsClosed(true);
      }
      return data;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInvoice = useCallback(async () => {
    setInvoiceLoading(true);
    try {
      const res = await getInvoiceLelang(currentIdRef.current);
      setInvoice(res.data);
      return res.data;
    } catch {
      setInvoice(null);
      return null;
    } finally {
      setInvoiceLoading(false);
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

    const currentId = currentIdRef.current;
    const next = await fetchNextLelang(currentId);

    if (next) {
      setTimeout(() => {
        navigate(`/lelang/${next.id}`);
      }, 3500);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setTimeout(() => {
        navigate(`/lelang/summary?date=${today}`);
      }, 4000);
    }
  }, [loadLelang, fetchNextLelang, navigate]);

  useEffect(() => {
    loadLelang();
    socketRef.current = io('http://localhost:5000');
    socketRef.current.on('connect', () => {
      socketRef.current.emit('join_lelang', id);
    });
    socketRef.current.on('new_bid', (newBid) => {
      setBids((prev) => [newBid, ...prev].sort((a, b) => Number(b.nominal) - Number(a.nominal)));
    });
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
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
    const tick = setInterval(() => {
      count -= 1;
      setNextCountdown(String(count));
      if (count <= 0) clearInterval(tick);
    }, 1000);
    return () => clearInterval(tick);
  }, [nextLelang, transitioning]);

  useEffect(() => {
    if (!lelang || lelang.status !== 'FINISHED' || !user) return;
    if (user.role === 'ADMIN' || lelang.pemenangId === user.id) {
      fetchInvoice();
    }
  }, [lelang, user, fetchInvoice]);

  const handleBid = (e) => {
    e.preventDefault();
    if (!user) return alert('Anda harus login untuk bidding');
    if (user.role === 'ADMIN') return alert('Admin tidak bisa bidding');
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
    const base = Math.max(highest, limit);
    setNominal(base + increment);
  };

  const handleKonfirmasiBarang = async () => {
    if (!window.confirm('Konfirmasi bahwa barang sudah Anda terima?')) return;
    setKonfirmLoading(true);
    try {
      await konfirmasiTerimaBarang(id);
      alert('Konfirmasi penerimaan barang berhasil');
      await loadLelang();
    } catch (err) {
      alert(err.message);
    } finally {
      setKonfirmLoading(false);
    }
  };

  const handleUploadBukti = async (e) => {
    e.preventDefault();
    if (!paymentFile) return alert('Pilih file bukti pembayaran terlebih dahulu');

    setPaymentUploading(true);
    try {
      const formData = new FormData();
      formData.append('bukti_bayar', paymentFile);
      await uploadBuktiPembayaranLelang(id, formData);
      alert('Bukti pembayaran berhasil diunggah dan menunggu verifikasi admin');
      setPaymentFile(null);
      await Promise.all([loadLelang(), fetchInvoice()]);
    } catch (err) {
      alert(err.message);
    } finally {
      setPaymentUploading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    const invoiceData = invoice || (await fetchInvoice());
    if (!invoiceData) return alert('Invoice belum tersedia');
    downloadInvoicePdf(invoiceData);
  };

  if (loading) return <div className="spinner" style={{ margin: '100px auto' }} />;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!lelang) return <div>Data tidak ditemukan</div>;

  const highestBid = bids.length > 0 ? bids[0] : null;
  const isWinner = isClosed && lelang.pemenangId === user?.id;
  const paymentMeta = PAYMENT_STATUS_META[lelang.statusPembayaran] || PAYMENT_STATUS_META.UNPAID;
  const isPaid = lelang.statusPembayaran === 'LUNAS';
  const isRejected = lelang.statusPembayaran === 'DITOLAK';
  const isWaitingVerification = lelang.statusPembayaran === 'PENDING_VERIFICATION';
  const isReceived = lelang.statusBarang === 'DITERIMA';

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      <div style={{ flex: 2 }}>
        {isClosed && (
          <div
            style={{
              marginBottom: 24,
              borderRadius: 16,
              overflow: 'hidden',
              background: isWinner
                ? 'linear-gradient(135deg, #065f46 0%, #047857 50%, #10b981 100%)'
                : 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ padding: '28px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🏁</div>
              <h2 style={{ color: '#fff', fontSize: 28, margin: 0, fontWeight: 800 }}>LELANG DITUTUP</h2>
              {highestBid ? (
                <>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, marginTop: 8, marginBottom: 16 }}>
                    Pemenang:
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#fef3c7' }}>
                    🏆 {lelang.pemenang?.nama || highestBid.user?.nama || '-'}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginTop: 8, letterSpacing: 1 }}>
                    {formatRp(highestBid.nominal)}
                  </div>

                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
                    <div
                      style={{
                        background: paymentMeta.bg,
                        border: `1px solid ${paymentMeta.accent}`,
                        borderRadius: 99,
                        padding: '8px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{paymentMeta.icon}</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>PEMBAYARAN</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{paymentMeta.label}</div>
                      </div>
                    </div>
                    {isPaid && (
                      <div
                        style={{
                          background: isReceived ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)',
                          border: `1px solid ${isReceived ? '#10b981' : '#6366f1'}`,
                          borderRadius: 99,
                          padding: '8px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span style={{ fontSize: 20 }}>{isReceived ? '📦' : '🚚'}</span>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>STATUS BARANG</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                            {isReceived ? 'DITERIMA' : 'DALAM PROSES'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 12 }}>Tidak ada penawaran masuk.</p>
              )}
            </div>

            {isWinner && highestBid && (
              <div style={{ background: 'rgba(0,0,0,0.35)', padding: '24px 32px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fef08a', marginBottom: 12, textAlign: 'center' }}>
                  🎉 SELAMAT! ANDA PEMENANG LELANG INI
                </div>

                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>INVOICE</div>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>
                        {invoiceLoading ? 'Memuat invoice...' : invoice?.invoiceNumber || 'Belum tersedia'}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>
                        Jatuh tempo: {invoice ? formatDateTime(invoice.paymentDueDate) : '-'}
                      </div>
                    </div>
                    <button className="btn btn-secondary" onClick={handleDownloadInvoice} disabled={invoiceLoading}>
                      🧾 Unduh Invoice
                    </button>
                  </div>

                  {invoice && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 16 }}>
                      <div style={{ padding: 12, borderRadius: 10, background: 'rgba(15,23,42,0.35)' }}>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>Nominal Tagihan</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
                          {formatRp(invoice.transaksi?.nominalMenang)}
                        </div>
                      </div>
                      <div style={{ padding: 12, borderRadius: 10, background: 'rgba(15,23,42,0.35)' }}>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>Transfer Ke</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{invoice.penjual?.rekeningBank}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{invoice.penjual?.nomorRekening}</div>
                      </div>
                    </div>
                  )}
                </div>

                {!isPaid && !isWaitingVerification && (
                  <div style={{ textAlign: 'center' }}>
                    {isRejected && (
                      <div
                        style={{
                          marginBottom: 16,
                          background: 'rgba(239,68,68,0.15)',
                          border: '1px solid rgba(248,113,113,0.45)',
                          borderRadius: 12,
                          padding: 14,
                          color: '#fecaca',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Bukti pembayaran ditolak admin</div>
                        <div style={{ fontSize: 14 }}>{lelang.catatanPembayaran || 'Silakan unggah ulang bukti pembayaran yang valid.'}</div>
                      </div>
                    )}

                    <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 16, fontSize: 15 }}>
                      Unduh invoice lalu unggah bukti transfer langsung di sistem.
                    </p>

                    <form onSubmit={handleUploadBukti}>
                      <div
                        style={{
                          border: '1px dashed rgba(255,255,255,0.3)',
                          borderRadius: 12,
                          padding: 16,
                          marginBottom: 14,
                          background: 'rgba(15,23,42,0.2)',
                        }}
                      >
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          className="form-control"
                          onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                        />
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 8 }}>
                          Format yang didukung: JPG, PNG, PDF. Maksimal 5 MB.
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ padding: '12px 28px', fontWeight: 700, fontSize: 16 }}
                        disabled={paymentUploading || invoiceLoading}
                      >
                        {paymentUploading ? 'Mengunggah...' : '📤 Upload Bukti Pembayaran'}
                      </button>
                    </form>
                  </div>
                )}

                {isWaitingVerification && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#bfdbfe', fontWeight: 700, fontSize: 18, marginBottom: 10 }}>
                      🧾 Bukti pembayaran sudah diunggah
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 12, fontSize: 14 }}>
                      Admin sedang memeriksa bukti pembayaran Anda.
                    </p>
                    {lelang.buktiBayarUrl && (
                      <a
                        href={`http://localhost:5000/${lelang.buktiBayarUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary"
                      >
                        Lihat Bukti yang Diupload
                      </a>
                    )}
                  </div>
                )}

                {isPaid && !isReceived && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#86efac', fontWeight: 700, fontSize: 18, marginBottom: 10 }}>
                      ✅ Pembayaran sudah diverifikasi
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 16, fontSize: 14 }}>
                      Setelah barang tiba, tekan tombol di bawah untuk konfirmasi penerimaan.
                    </p>
                    <button
                      onClick={handleKonfirmasiBarang}
                      disabled={konfirmLoading}
                      style={{
                        padding: '12px 28px',
                        background: '#6366f1',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: 16,
                        cursor: 'pointer',
                      }}
                    >
                      {konfirmLoading ? 'Memproses...' : '📦 Konfirmasi Barang Diterima'}
                    </button>
                  </div>
                )}

                {isPaid && isReceived && (
                  <div style={{ textAlign: 'center', color: '#86efac', fontWeight: 700, fontSize: 18 }}>
                    ✅ Transaksi selesai. Terima kasih telah berpartisipasi!
                  </div>
                )}
              </div>
            )}

            {transitioning && (
              <div style={{ background: 'rgba(0,0,0,0.45)', padding: '20px 32px', borderTop: '1px solid rgba(255,255,255,0.15)', textAlign: 'center' }}>
                {nextLelang ? (
                  <>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 4 }}>
                      BERPINDAH KE LELANG BERIKUTNYA DALAM
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: 52, fontWeight: 800, color: '#fef08a', lineHeight: 1 }}>
                      {nextCountdown}
                    </div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginTop: 8 }}>
                      ➡️ {nextLelang.aset?.nama}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Semua lelang dalam sesi ini telah selesai</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>
                      Mengarahkan ke halaman ringkasan sesi...
                    </div>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        border: '3px solid rgba(255,255,255,0.25)',
                        borderTopColor: '#fff',
                        animation: 'spin 0.8s linear infinite',
                        margin: '14px auto 0',
                      }}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {lelang.aset.dokumenUrl && (
            <img src={`http://localhost:5000/${lelang.aset.dokumenUrl}`} alt="Aset" style={{ width: '100%', height: 300, objectFit: 'cover' }} />
          )}
          <div style={{ padding: 24 }}>
            <span className="badge badge-primary">{lelang.aset.kategori?.nama}</span>
            <h2 style={{ fontSize: 26, marginTop: 10, marginBottom: 6 }}>{lelang.aset.nama}</h2>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>Oleh: {lelang.aset.penjual?.user?.nama}</div>
            <div style={{ padding: 16, background: 'var(--bg)', borderRadius: 8 }}>
              <h4 style={{ margin: 0, marginBottom: 6 }}>Deskripsi Aset:</h4>
              <p style={{ margin: 0, lineHeight: 1.6 }}>{lelang.aset.deskripsi || 'Tidak ada deskripsi'}</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, position: 'sticky', top: 20 }}>
        <div className="card" style={{ borderTop: `4px solid ${isClosed ? 'var(--text-muted)' : 'var(--primary)'}` }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sisa Waktu Lelang</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: isClosed ? 'var(--text-muted)' : '#ef4444', fontFamily: 'monospace' }}>
              {timeLeft || '-- : -- : --'}
            </div>
          </div>

          <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Nilai Limit (Dasar)</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>
              {formatRp(lelang.aset.hasil?.[0]?.nilaiLimit || 0)}
            </div>
          </div>

          <div style={{ padding: 14, background: '#dcfce3', borderRadius: 8, marginBottom: 20, border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: 11, color: '#166534', marginBottom: 2 }}>Penawaran Tertinggi Saat Ini</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#16a34a' }}>
              {highestBid ? formatRp(highestBid.nominal) : 'Belum Ada'}
            </div>
            {highestBid && <div style={{ fontSize: 12, color: '#166534', marginTop: 2 }}>Oleh: {highestBid.user?.nama}</div>}
          </div>

          {!isClosed && user?.role === 'PEMBELI' && (
            <form onSubmit={handleBid}>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Shortcut Penawaran Cepat:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {QUICK_BIDS.map(({ label, value }) => (
                    <button
                      key={value}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleQuickBid(value)}
                      style={{ fontSize: 13, fontWeight: 600, padding: '8px 4px' }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Atau masukkan manual:</div>
                <CurrencyInput
                  value={nominal}
                  onChange={(v) => setNominal(v)}
                  style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'right' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 14, fontSize: 16, fontWeight: 700 }}>
                Kirim Penawaran 🔨
              </button>
            </form>
          )}

          {!user && (
            <div style={{ textAlign: 'center', padding: 16, background: 'var(--bg)', borderRadius: 8 }}>
              <p style={{ fontSize: 14, margin: 0, marginBottom: 8 }}>Login untuk mengikuti bidding</p>
              <Link to="/login" className="btn btn-primary btn-sm">Login Pembeli</Link>
            </div>
          )}
          {user?.role === 'PENJUAL' && (
            <div className="alert alert-info" style={{ textAlign: 'center' }}>Mode Penjual: hanya dapat melihat jalannya lelang</div>
          )}
        </div>

        <div className="card" style={{ marginTop: 20 }}>
          <h4 style={{ margin: 0, marginBottom: 14 }}>Riwayat Penawaran ({bids.length})</h4>
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {bids.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Belum ada histori.</p>
            ) : (
              bids.map((bid, index) => (
                <div
                  key={bid.id || index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{bid.user?.nama || bid.userId}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(bid.createdAt).toLocaleTimeString('id-ID')}
                    </div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: index === 0 ? '#10b981' : 'var(--text)' }}>{formatRp(bid.nominal)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
