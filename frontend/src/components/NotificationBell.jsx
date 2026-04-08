import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { getNotifikasi, markAllNotifikasiRead, markNotifikasiRead } from '../services/api';

const TYPE_COLORS = {
  SELLER_APPROVED: { bg: '#dcfce7', color: '#166534' },
  SELLER_REJECTED: { bg: '#fee2e2', color: '#b91c1c' },
  ASET_SCHEDULED: { bg: '#dbeafe', color: '#1d4ed8' },
  AUCTION_WON: { bg: '#ede9fe', color: '#6d28d9' },
  AUCTION_SOLD: { bg: '#ecfccb', color: '#3f6212' },
  PAYMENT_APPROVED: { bg: '#dcfce7', color: '#166534' },
  PAYMENT_REJECTED: { bg: '#fef3c7', color: '#b45309' },
  BUYER_KYC_APPROVED: { bg: '#dcfce7', color: '#166534' },
  BUYER_KYC_REJECTED: { bg: '#fee2e2', color: '#b91c1c' },
};

const formatRelative = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getNotifikasi();
      setItems(res.data || []);
      setUnreadCount(res.meta?.unreadCount || 0);
    } catch {
      setItems([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const unreadItems = useMemo(() => items.filter((item) => !item.isRead).length, [items]);

  const handleMarkRead = async (id) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
    setUnreadCount((prev) => Math.max(prev - 1, 0));
    try {
      await markNotifikasiRead(id);
    } catch {
      load();
    }
  };

  const handleReadAll = async () => {
    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
    try {
      await markAllNotifikasiRead();
    } catch {
      load();
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="theme-toggle-btn"
        title="Notifikasi"
        style={{ position: 'relative' }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -2,
              minWidth: 18,
              height: 18,
              borderRadius: 999,
              background: 'var(--danger)',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="card"
          style={{
            position: 'absolute',
            top: 44,
            right: 0,
            width: 360,
            padding: 0,
            zIndex: 20,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px 18px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontWeight: 700 }}>Notifikasi</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{unreadItems} belum dibaca</div>
            </div>
            <button type="button" onClick={handleReadAll} className="btn btn-secondary btn-sm" disabled={!unreadItems}>
              <CheckCheck size={14} /> Baca semua
            </button>
          </div>

          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {loading ? (
              <div className="empty-state">Memuat notifikasi...</div>
            ) : items.length === 0 ? (
              <div className="empty-state">Belum ada notifikasi.</div>
            ) : (
              items.map((item) => {
                const tone = TYPE_COLORS[item.tipe] || { bg: 'var(--surface-light)', color: 'var(--text-muted)' };
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (!item.isRead) handleMarkRead(item.id);
                    }}
                    style={{
                      width: '100%',
                      border: 0,
                      background: item.isRead ? 'transparent' : 'var(--surface-light)',
                      textAlign: 'left',
                      padding: '14px 18px',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          padding: '3px 9px',
                          borderRadius: 999,
                          background: tone.bg,
                          color: tone.color,
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.tipe.replaceAll('_', ' ')}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatRelative(item.createdAt)}</span>
                    </div>
                    <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text)' }}>{item.judul}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.pesan}</div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
