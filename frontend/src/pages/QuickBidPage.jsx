import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import CurrencyInput from '../components/CurrencyInput';
import { assetUrl } from '../config/env.js';

const formatRp = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v || 0);

export default function QuickBidPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick Bid modal state
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [qbForm, setQbForm] = useState({ quickBid1: 0, quickBid2: 0, quickBid3: 0 });
  const [qbSaving, setQbSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/lelang');
      const now = new Date();
      // Filter for upcoming or active auctions
      const valid = (res.data || []).filter(a => {
        const tutup = new Date(a.waktuTutup);
        return tutup > now && ['PENDING', 'ACTIVE'].includes(a.status);
      });
      setData(valid);
    } catch (e) {
      // silent error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openSettings = async (auction) => {
    setSelectedAuction(auction);
    setQbForm({ quickBid1: 0, quickBid2: 0, quickBid3: 0 });
    try {
      // Get existing presets if any
      const res = await api.get(`/quick-bids?auctionId=${auction.id}`);
      if (res.data?.data) {
        setQbForm({
          quickBid1: res.data.data.quickBid1,
          quickBid2: res.data.data.quickBid2,
          quickBid3: res.data.data.quickBid3,
        });
      }
    } catch (e) {
      // ignore
    }
  };

  const handleSaveQuickBids = async () => {
    if (!qbForm.quickBid1 || !qbForm.quickBid2 || !qbForm.quickBid3) {
      return alert('Mohon isi ketiga nominal Quick Bid.');
    }
    setQbSaving(true);
    try {
      await api.post('/quick-bids', {
        auctionId: selectedAuction.id,
        quickBid1: qbForm.quickBid1,
        quickBid2: qbForm.quickBid2,
        quickBid3: qbForm.quickBid3,
      });
      alert('Quick Bid berhasil disimpan!');
      setSelectedAuction(null);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setQbSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>⚡ Preset Quick Bid</h2>
        <p>Persiapkan nominal penawaran jagoan Anda sebelum lelang dimulai. Memungkinkan bidding satu klik (One-Click Bidding).</p>
      </div>

      {loading ? (
        <div className="empty-state"><span className="spinner" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {data.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              Tidak ada jadwal lelang mendatang.
            </div>
          ) : (
            data.map(item => (
              <div key={item.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 160, background: 'var(--surface-light)', position: 'relative' }}>
                  {item.aset?.dokumenUrl ? (
                    <img src={assetUrl(item.aset.dokumenUrl)} alt={item.aset.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>💎</div>
                  )}
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <span className="badge badge-primary">{item.status === 'PENDING' ? 'Mendatang' : 'Sedang Berjalan'}</span>
                  </div>
                </div>
                <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Nilai Limit: {formatRp(item.aset?.hasil?.[0]?.nilaiLimit)}
                  </div>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: 18 }}>{item.aset?.nama}</h3>
                  <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => openSettings(item)}>
                      ⚙️ Atur Preset
                    </button>
                    <Link to={`/lelang/${item.id}`} className="btn btn-primary" style={{ padding: '0 16px' }}>
                      Ruang &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selectedAuction && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedAuction(null)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <h3 style={{ margin: '0 0 16px 0' }}>⚙️ Atur Quick Bid</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              Atur 3 nilai jagoan Anda untuk aset <strong>{selectedAuction.aset?.nama}</strong>. Nominal ini akan muncul sebagai tombol instan di dalam ruang lelang.
            </p>
            
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Preset 1 (Terendah)</label>
              <CurrencyInput
                value={qbForm.quickBid1}
                onChange={(v) => setQbForm({ ...qbForm, quickBid1: v })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface-light)' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Preset 2 (Menengah)</label>
              <CurrencyInput
                value={qbForm.quickBid2}
                onChange={(v) => setQbForm({ ...qbForm, quickBid2: v })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface-light)' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label>Preset 3 (Tertinggi)</label>
              <CurrencyInput
                value={qbForm.quickBid3}
                onChange={(v) => setQbForm({ ...qbForm, quickBid3: v })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface-light)' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setSelectedAuction(null)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSaveQuickBids} disabled={qbSaving}>
                {qbSaving ? 'Menyimpan...' : 'Simpan Preset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
