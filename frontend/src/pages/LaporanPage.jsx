import React, { useState, useEffect } from 'react';
import api from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const formatRp = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v || 0);

const formatDate = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const STATUS_COLORS = {
  DRAFT: { bg: '#f3f4f6', color: '#6b7280' },
  PENDING: { bg: '#fef9c3', color: '#b45309' },
  ACTIVE: { bg: '#dcfce7', color: '#16a34a' },
  FINISHED: { bg: '#e0e7ff', color: '#4338ca' },
  SELESAI: { bg: '#dbeafe', color: '#1d4ed8' },
};

const PAYMENT_COLORS = {
  UNPAID: { bg: '#fef3c7', color: '#92400e' },
  PENDING_VERIFICATION: { bg: '#dbeafe', color: '#1d4ed8' },
  LUNAS: { bg: '#dcfce7', color: '#166534' },
  DITOLAK: { bg: '#fee2e2', color: '#b91c1c' },
};

export default function LaporanPage() {
  const [activeTab, setActiveTab] = useState('aset');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const tabs = [
    { key: 'aset', label: '🏷️ Laporan Aset', endpoint: '/laporan/aset' },
    { key: 'lelang', label: '🔨 Laporan Lelang', endpoint: '/laporan/lelang' },
    { key: 'transaksi', label: '💰 Laporan Transaksi', endpoint: '/laporan/transaksi' },
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const tab = tabs.find(t => t.key === activeTab);
        const res = await api.get(tab.endpoint);
        setData(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeTab]);

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const now = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

    // Header PDF
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SISTEM LELANG ONLINE - SPK AHP-SAW', 14, 16);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    let title = '';
    let head = [];
    let rows = [];

    if (activeTab === 'aset') {
      title = 'LAPORAN DATA ASET';
      head = [['No', 'Nama Aset', 'Kategori', 'Penjual', 'Harga Pasar', 'Nilai Preferensi', 'Nilai Limit (Rp)', 'Status']];
      rows = data.map((d, i) => [
        i + 1, d.nama, d.kategori, d.penjual,
        formatRp(d.hargaPasar),
        d.nilaiPreferensi ? d.nilaiPreferensi.toFixed(4) : '-',
        d.nilaiLimit ? formatRp(d.nilaiLimit) : 'Belum Dihitung',
        d.statusLelang,
      ]);
    } else if (activeTab === 'lelang') {
      title = 'LAPORAN HASIL LELANG';
      head = [['No', 'Invoice', 'Nama Aset', 'Kategori', 'Nilai Limit', 'Waktu Buka', 'Waktu Tutup', 'Status', 'Status Bayar', 'Pemenang', 'Harga Terjual']];
      rows = data.map((d, i) => [
        i + 1, d.invoiceNumber || '-', d.namaAset, d.kategori, formatRp(d.nilaiLimit),
        formatDate(d.waktuBuka), formatDate(d.waktuTutup),
        d.status, d.statusPembayaran || '-', d.pemenang, d.hargaTerjual ? formatRp(d.hargaTerjual) : '-',
      ]);
    } else {
      title = 'LAPORAN RIWAYAT TRANSAKSI / BIDDING';
      head = [['No', 'Nama Penawar', 'Email', 'Nama Aset', 'Kategori', 'Nominal Penawaran', 'Waktu Bid']];
      rows = data.map((d, i) => [
        i + 1, d.penawar, d.emailPenawar, d.namaAset, d.kategori,
        formatRp(d.nominal), formatDate(d.waktuBid),
      ]);
    }

    doc.text(`${title}`, 14, 24);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Dicetak: ${now} | Total Data: ${data.length}`, 14, 30);
    doc.setTextColor(0);

    autoTable(doc, {
      head,
      body: rows,
      startY: 36,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(`laporan_${activeTab}_${Date.now()}.pdf`);
  };

  const exportExcel = () => {
    let sheetData = [];
    let sheetName = '';
    let fileName = '';

    if (activeTab === 'aset') {
      sheetName = 'Laporan Aset';
      fileName = `laporan_aset_${Date.now()}.xlsx`;
      sheetData = [
        ['SISTEM LELANG ONLINE - SPK AHP-SAW'],
        ['LAPORAN DATA ASET'],
        [`Dicetak: ${new Date().toLocaleDateString('id-ID')} | Total: ${data.length} data`],
        [],
        ['No', 'Nama Aset', 'Kategori', 'Penjual', 'Harga Pasar (Rp)', 'Nilai Preferensi', 'Nilai Limit (Rp)', 'Status'],
        ...data.map((d, i) => [
          i + 1, d.nama, d.kategori, d.penjual,
          Number(d.hargaPasar),
          d.nilaiPreferensi ? Number(d.nilaiPreferensi.toFixed(4)) : '-',
          d.nilaiLimit ? Number(d.nilaiLimit) : 'Belum Dihitung',
          d.statusLelang,
        ]),
      ];
    } else if (activeTab === 'lelang') {
      sheetName = 'Laporan Lelang';
      fileName = `laporan_lelang_${Date.now()}.xlsx`;
      sheetData = [
        ['SISTEM LELANG ONLINE - SPK AHP-SAW'],
        ['LAPORAN HASIL LELANG'],
        [`Dicetak: ${new Date().toLocaleDateString('id-ID')} | Total: ${data.length} data`],
        [],
        ['No', 'Invoice', 'Nama Aset', 'Kategori', 'Penjual', 'Nilai Limit (Rp)', 'Waktu Buka', 'Waktu Tutup', 'Status Lelang', 'Status Bayar', 'Pemenang', 'Harga Terjual (Rp)'],
        ...data.map((d, i) => [
          i + 1, d.invoiceNumber || '-', d.namaAset, d.kategori, d.penjual,
          Number(d.nilaiLimit),
          formatDate(d.waktuBuka), formatDate(d.waktuTutup),
          d.status, d.statusPembayaran || '-', d.pemenang,
          d.hargaTerjual > 0 ? Number(d.hargaTerjual) : '-',
        ]),
      ];
    } else {
      sheetName = 'Laporan Transaksi';
      fileName = `laporan_transaksi_${Date.now()}.xlsx`;
      sheetData = [
        ['SISTEM LELANG ONLINE - SPK AHP-SAW'],
        ['LAPORAN RIWAYAT TRANSAKSI / BIDDING'],
        [`Dicetak: ${new Date().toLocaleDateString('id-ID')} | Total: ${data.length} data`],
        [],
        ['No', 'Nama Penawar', 'Email', 'Nama Aset', 'Kategori', 'Nominal Penawaran (Rp)', 'Waktu Bid'],
        ...data.map((d, i) => [
          i + 1, d.penawar, d.emailPenawar,
          d.namaAset, d.kategori,
          Number(d.nominal),
          formatDate(d.waktuBid),
        ]),
      ];
    }

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Style lebar kolom otomatis
    const colWidths = sheetData.reduce((acc, row) => {
      row.forEach((cell, i) => {
        const len = cell ? String(cell).length : 10;
        acc[i] = Math.max(acc[i] || 10, len + 4);
      });
      return acc;
    }, []);
    ws['!cols'] = colWidths.map(w => ({ wch: Math.min(w, 40) }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, fileName);
  };

  const renderTable = () => {
    if (activeTab === 'aset') {
      return (
        <table className="table">
          <thead>
            <tr>
              <th>No</th><th>Nama Aset</th><th>Kategori</th><th>Penjual</th>
              <th>Harga Pasar</th><th>Nilai Preferensi</th><th>Nilai Limit</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={d.id}>
                <td>{i + 1}</td>
                <td style={{ fontWeight: 600 }}>{d.nama}</td>
                <td><span className="badge badge-primary">{d.kategori}</span></td>
                <td>{d.penjual}</td>
                <td>{formatRp(d.hargaPasar)}</td>
                <td style={{ fontFamily: 'monospace' }}>{d.nilaiPreferensi ? d.nilaiPreferensi.toFixed(4) : <span style={{ color: 'var(--text-muted)' }}>Belum Dihitung</span>}</td>
                <td style={{ fontWeight: 600, color: '#10b981' }}>{d.nilaiLimit ? formatRp(d.nilaiLimit) : <span style={{ color: 'var(--text-muted)' }}>Belum Dihitung</span>}</td>
                <td>
                  <span style={{ ...STATUS_COLORS[d.statusLelang], padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
                    {d.statusLelang}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'lelang') {
      return (
        <table className="table">
          <thead>
            <tr>
              <th>No</th><th>Nama Aset</th><th>Kategori</th><th>Penjual</th>
              <th>Invoice</th><th>Nilai Limit</th><th>Waktu Buka</th><th>Waktu Tutup</th>
              <th>Status</th><th>Status Bayar</th><th>Pemenang</th><th>Harga Terjual</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={d.id}>
                <td>{i + 1}</td>
                <td style={{ fontWeight: 600 }}>{d.namaAset}</td>
                <td><span className="badge badge-primary">{d.kategori}</span></td>
                <td>{d.penjual}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{d.invoiceNumber || '-'}</td>
                <td style={{ color: '#10b981', fontWeight: 600 }}>{formatRp(d.nilaiLimit)}</td>
                <td style={{ fontSize: 12 }}>{formatDate(d.waktuBuka)}</td>
                <td style={{ fontSize: 12 }}>{formatDate(d.waktuTutup)}</td>
                <td>
                  <span style={{ ...(STATUS_COLORS[d.status] || STATUS_COLORS.DRAFT), padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
                    {d.status}
                  </span>
                </td>
                <td>
                  <span style={{ ...(PAYMENT_COLORS[d.statusPembayaran] || PAYMENT_COLORS.UNPAID), padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
                    {d.statusPembayaran || '-'}
                  </span>
                </td>
                <td style={{ fontWeight: 600, color: d.pemenang !== '-' ? '#2563eb' : 'var(--text-muted)' }}>{d.pemenang}</td>
                <td style={{ fontWeight: 700, color: d.hargaTerjual > 0 ? '#10b981' : 'var(--text-muted)' }}>
                  {d.hargaTerjual > 0 ? formatRp(d.hargaTerjual) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return (
      <table className="table">
        <thead>
          <tr>
            <th>No</th><th>Nama Penawar</th><th>Email</th>
            <th>Nama Aset</th><th>Kategori</th><th>Nominal Penawaran</th><th>Waktu Bid</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={d.id}>
              <td>{i + 1}</td>
              <td style={{ fontWeight: 600 }}>{d.penawar}</td>
              <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.emailPenawar}</td>
              <td>{d.namaAset}</td>
              <td><span className="badge badge-primary">{d.kategori}</span></td>
              <td style={{ fontWeight: 700, color: '#2563eb' }}>{formatRp(d.nominal)}</td>
              <td style={{ fontSize: 12 }}>{formatDate(d.waktuBid)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const currentTab = tabs.find(t => t.key === activeTab);

  return (
    <div>
      <div className="page-header">
        <h2>📄 Generate Laporan</h2>
        <p>Ekspor data Aset, Lelang, dan Transaksi dalam format PDF atau Excel</p>
      </div>

      {/* Stats card ringkasan */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {tabs.map(tab => (
          <div key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="card"
            style={{
              cursor: 'pointer',
              border: activeTab === tab.key ? '2px solid var(--primary)' : '2px solid transparent',
              background: activeTab === tab.key ? 'rgba(37,99,235,0.06)' : 'var(--surface)',
              padding: '20px 24px',
              transition: 'all 0.2s',
            }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{tab.label.split(' ')[0]}</div>
            <div style={{ fontWeight: 600, fontSize: 15, color: activeTab === tab.key ? 'var(--primary)' : 'var(--text)' }}>
              {tab.label.substring(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Konten Laporan */}
      <div className="card" style={{ padding: 0 }}>
        {/* Toolbar */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{currentTab?.label}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              {loading ? 'Memuat data...' : `Total: ${data.length} data`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={exportExcel}
              disabled={loading || data.length === 0}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#16a34a', color: '#fff', border: 'none' }}
            >
              📊 Export Excel
            </button>
            <button
              onClick={exportPDF}
              disabled={loading || data.length === 0}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              📥 Export PDF
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div style={{ overflowX: 'auto', padding: '0 0 8px 0' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
              <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>Mengambil data laporan...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger" style={{ margin: 24 }}>{error}</div>
          ) : data.length === 0 ? (
            <div className="empty-state" style={{ padding: 60 }}>
              <div className="icon">📋</div>
              <p>Belum ada data untuk laporan ini</p>
            </div>
          ) : (
            <div style={{ padding: '0 8px' }}>{renderTable()}</div>
          )}
        </div>
      </div>
    </div>
  );
}
