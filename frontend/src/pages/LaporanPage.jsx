import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { downloadRowsAsExcel } from '../utils/excel';
import { Tag, Megaphone, FileText } from 'lucide-react';

const formatRp = (value) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const STATUS_COLORS = {
  DRAFT: { bg: '#f3f4f6', color: '#6b7280' },
  PENDING: { bg: '#fef9c3', color: '#b45309' },
  ACTIVE: { bg: '#dcfce7', color: '#16a34a' },
  FINISHED: { bg: '#e0e7ff', color: '#4338ca' },
  SELESAI: { bg: '#dbeafe', color: '#1d4ed8' },
};

export default function LaporanPage() {
  const [activeTab, setActiveTab] = useState('aset');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [asetStatusFilter, setAsetStatusFilter] = useState('all');

  const tabs = [
    { key: 'aset', label: 'Laporan Aset', icon: <Tag size={28} />, endpoint: '/laporan/aset' },
    { key: 'lelang', label: 'Laporan Lelang', icon: <Megaphone size={28} />, endpoint: '/laporan/lelang' },
    { key: 'transaksi', label: 'Laporan Transaksi', icon: <FileText size={28} />, endpoint: '/laporan/transaksi' },
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const tab = tabs.find((item) => item.key === activeTab);
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

  const filteredData = useMemo(() => {
    if (activeTab !== 'aset') return data;
    return data.filter((item) => {
      if (asetStatusFilter === 'sold') return item.statusLelang === 'FINISHED';
      if (asetStatusFilter === 'unsold') return item.statusLelang !== 'FINISHED';
      return true;
    });
  }, [activeTab, asetStatusFilter, data]);

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const now = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

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
      rows = filteredData.map((item, index) => [
        index + 1,
        item.nama,
        item.kategori,
        item.penjual,
        formatRp(item.hargaPasar),
        item.nilaiPreferensi ? item.nilaiPreferensi.toFixed(4) : '-',
        item.nilaiLimit ? formatRp(item.nilaiLimit) : 'Belum Dihitung',
        item.statusLelang,
      ]);
    } else if (activeTab === 'lelang') {
      title = 'LAPORAN HASIL LELANG';
      head = [['No', 'Nama Aset', 'Kategori', 'Nilai Limit', 'Waktu Buka', 'Waktu Tutup', 'Status', 'Pemenang', 'Harga Terjual']];
      rows = filteredData.map((item, index) => [
        index + 1,
        item.namaAset,
        item.kategori,
        formatRp(item.nilaiLimit),
        formatDate(item.waktuBuka),
        formatDate(item.waktuTutup),
        item.status,
        item.pemenang,
        item.hargaTerjual ? formatRp(item.hargaTerjual) : '-',
      ]);
    } else {
      title = 'LAPORAN RIWAYAT TRANSAKSI / BIDDING';
      head = [['No', 'Nama Penawar', 'Email', 'Nama Aset', 'Kategori', 'Nominal Penawaran', 'Waktu Bid']];
      rows = filteredData.map((item, index) => [
        index + 1,
        item.penawar,
        item.emailPenawar,
        item.namaAset,
        item.kategori,
        formatRp(item.nominal),
        formatDate(item.waktuBid),
      ]);
    }

    doc.text(title, 14, 24);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Dicetak: ${now} | Total Data: ${filteredData.length}`, 14, 30);
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

  const exportExcel = async () => {
    let sheetData = [];
    let sheetName = '';
    let fileName = '';

    if (activeTab === 'aset') {
      sheetName = 'Laporan Aset';
      fileName = `laporan_aset_${Date.now()}.xlsx`;
      sheetData = [
        ['SISTEM LELANG ONLINE - SPK AHP-SAW'],
        ['LAPORAN DATA ASET'],
        [`Dicetak: ${new Date().toLocaleDateString('id-ID')} | Total: ${filteredData.length} data`],
        [],
        ['No', 'Nama Aset', 'Kategori', 'Penjual', 'Harga Pasar (Rp)', 'Nilai Preferensi', 'Nilai Limit (Rp)', 'Status'],
        ...filteredData.map((item, index) => [
          index + 1,
          item.nama,
          item.kategori,
          item.penjual,
          Number(item.hargaPasar),
          item.nilaiPreferensi ? Number(item.nilaiPreferensi.toFixed(4)) : '-',
          item.nilaiLimit ? Number(item.nilaiLimit) : 'Belum Dihitung',
          item.statusLelang,
        ]),
      ];
    } else if (activeTab === 'lelang') {
      sheetName = 'Laporan Lelang';
      fileName = `laporan_lelang_${Date.now()}.xlsx`;
      sheetData = [
        ['SISTEM LELANG ONLINE - SPK AHP-SAW'],
        ['LAPORAN HASIL LELANG'],
        [`Dicetak: ${new Date().toLocaleDateString('id-ID')} | Total: ${filteredData.length} data`],
        [],
        ['No', 'Nama Aset', 'Kategori', 'Penjual', 'Nilai Limit (Rp)', 'Waktu Buka', 'Waktu Tutup', 'Status', 'Pemenang', 'Harga Terjual (Rp)'],
        ...filteredData.map((item, index) => [
          index + 1,
          item.namaAset,
          item.kategori,
          item.penjual,
          Number(item.nilaiLimit),
          formatDate(item.waktuBuka),
          formatDate(item.waktuTutup),
          item.status,
          item.pemenang,
          item.hargaTerjual > 0 ? Number(item.hargaTerjual) : '-',
        ]),
      ];
    } else {
      sheetName = 'Laporan Transaksi';
      fileName = `laporan_transaksi_${Date.now()}.xlsx`;
      sheetData = [
        ['SISTEM LELANG ONLINE - SPK AHP-SAW'],
        ['LAPORAN RIWAYAT TRANSAKSI / BIDDING'],
        [`Dicetak: ${new Date().toLocaleDateString('id-ID')} | Total: ${filteredData.length} data`],
        [],
        ['No', 'Nama Penawar', 'Email', 'Nama Aset', 'Kategori', 'Nominal Penawaran (Rp)', 'Waktu Bid'],
        ...filteredData.map((item, index) => [
          index + 1,
          item.penawar,
          item.emailPenawar,
          item.namaAset,
          item.kategori,
          Number(item.nominal),
          formatDate(item.waktuBid),
        ]),
      ];
    }

    await downloadRowsAsExcel(sheetData, sheetName, fileName);
  };

  const renderTable = () => {
    if (activeTab === 'aset') {
      return (
        <table className="table">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Aset</th>
              <th>Kategori</th>
              <th>Penjual</th>
              <th>Harga Pasar</th>
              <th>Nilai Preferensi</th>
              <th>Nilai Limit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td style={{ fontWeight: 600 }}>{item.nama}</td>
                <td><span className="badge badge-primary">{item.kategori}</span></td>
                <td>{item.penjual}</td>
                <td>{formatRp(item.hargaPasar)}</td>
                <td style={{ fontFamily: 'monospace' }}>
                  {item.nilaiPreferensi ? item.nilaiPreferensi.toFixed(4) : <span style={{ color: 'var(--text-muted)' }}>Belum Dihitung</span>}
                </td>
                <td style={{ fontWeight: 600, color: '#10b981' }}>
                  {item.nilaiLimit ? formatRp(item.nilaiLimit) : <span style={{ color: 'var(--text-muted)' }}>Belum Dihitung</span>}
                </td>
                <td>
                  <span style={{ ...(STATUS_COLORS[item.statusLelang] || STATUS_COLORS.DRAFT), padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
                    {item.statusLelang}
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
              <th>No</th>
              <th>Nama Aset</th>
              <th>Kategori</th>
              <th>Penjual</th>
              <th>Nilai Limit</th>
              <th>Waktu Buka</th>
              <th>Waktu Tutup</th>
              <th>Status</th>
              <th>Pemenang</th>
              <th>Harga Terjual</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td style={{ fontWeight: 600 }}>{item.namaAset}</td>
                <td><span className="badge badge-primary">{item.kategori}</span></td>
                <td>{item.penjual}</td>
                <td style={{ color: '#10b981', fontWeight: 600 }}>{formatRp(item.nilaiLimit)}</td>
                <td style={{ fontSize: 12 }}>{formatDate(item.waktuBuka)}</td>
                <td style={{ fontSize: 12 }}>{formatDate(item.waktuTutup)}</td>
                <td>
                  <span style={{ ...(STATUS_COLORS[item.status] || STATUS_COLORS.DRAFT), padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
                    {item.status}
                  </span>
                </td>
                <td style={{ fontWeight: 600, color: item.pemenang !== '-' ? '#2563eb' : 'var(--text-muted)' }}>{item.pemenang}</td>
                <td style={{ fontWeight: 700, color: item.hargaTerjual > 0 ? '#10b981' : 'var(--text-muted)' }}>
                  {item.hargaTerjual > 0 ? formatRp(item.hargaTerjual) : '-'}
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
            <th>No</th>
            <th>Nama Penawar</th>
            <th>Email</th>
            <th>Nama Aset</th>
            <th>Kategori</th>
            <th>Nominal Penawaran</th>
            <th>Waktu Bid</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item, index) => (
            <tr key={item.id}>
              <td>{index + 1}</td>
              <td style={{ fontWeight: 600 }}>{item.penawar}</td>
              <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.emailPenawar}</td>
              <td>{item.namaAset}</td>
              <td><span className="badge badge-primary">{item.kategori}</span></td>
              <td style={{ fontWeight: 700, color: '#2563eb' }}>{formatRp(item.nominal)}</td>
              <td style={{ fontSize: 12 }}>{formatDate(item.waktuBid)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const currentTab = tabs.find((item) => item.key === activeTab);

  return (
    <div>
      <div className="page-header">
        <h2>Generate Laporan</h2>
        <p>Ekspor data aset, lelang, dan transaksi dalam format PDF atau Excel</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {tabs.map((tab) => (
          <div
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="card"
            style={{
              cursor: 'pointer',
              border: activeTab === tab.key ? '2px solid var(--primary)' : '2px solid transparent',
              background: activeTab === tab.key ? 'rgba(37,99,235,0.06)' : 'var(--surface)',
              padding: '20px 24px',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>{tab.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 15, color: activeTab === tab.key ? 'var(--primary)' : 'var(--text)' }}>
              {tab.label}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{currentTab?.label}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              {loading ? 'Memuat data...' : `Total: ${filteredData.length} data`}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {activeTab === 'aset' && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { key: 'all', label: 'Semua' },
                  { key: 'sold', label: 'Terjual' },
                  { key: 'unsold', label: 'Belum Terjual' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`btn btn-sm ${asetStatusFilter === item.key ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setAsetStatusFilter(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={exportExcel}
              disabled={loading || filteredData.length === 0}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#16a34a', color: '#fff', border: 'none' }}
            >
              Export Excel
            </button>
            <button
              onClick={exportPDF}
              disabled={loading || filteredData.length === 0}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              Export PDF
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto', padding: '0 0 8px 0' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
              <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>Mengambil data laporan...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger" style={{ margin: 24 }}>{error}</div>
          ) : filteredData.length === 0 ? (
            <div className="empty-state" style={{ padding: 60 }}>
              <div style={{ marginBottom: 12 }}><FileText size={48} opacity={0.3} /></div>
              <p>Belum ada data untuk filter ini</p>
            </div>
          ) : (
            <div style={{ padding: '0 8px' }}>{renderTable()}</div>
          )}
        </div>
      </div>
    </div>
  );
}
