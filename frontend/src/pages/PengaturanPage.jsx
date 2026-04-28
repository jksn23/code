import React, { useMemo, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  AlertTriangle,
  Database,
  Download,
  FileSpreadsheet,
  RefreshCw,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  getSettingsSummary,
  importSettingsData,
  purgeSettingsModule,
  resetSettingsData,
} from '../services/api.js';

const CONFIRM_TEXT = 'HAPUS DATA';

const IMPORT_TARGETS = [
  {
    value: 'kategori',
    label: 'Kategori',
    columns: ['nama'],
    sample: [{ nama: 'Tanah & Bangunan' }],
  },
  {
    value: 'kriteria',
    label: 'Kriteria',
    columns: ['kategori', 'nama', 'tipe', 'bobot'],
    sample: [{ kategori: 'Tanah & Bangunan', nama: 'Lokasi', tipe: 'benefit', bobot: 0.25 }],
  },
  {
    value: 'aset',
    label: 'Aset',
    columns: ['kategori', 'nama', 'harga_pasar', 'deskripsi', 'email_penjual'],
    sample: [{
      kategori: 'Tanah & Bangunan',
      nama: 'Rumah Kavling A1',
      harga_pasar: 250000000,
      deskripsi: 'Aset contoh',
      email_penjual: '',
    }],
  },
  {
    value: 'nilai_aset',
    label: 'Nilai Aset',
    columns: ['aset', 'kategori', 'kriteria', 'nilai'],
    sample: [{ aset: 'Rumah Kavling A1', kategori: 'Tanah & Bangunan', kriteria: 'Lokasi', nilai: 85 }],
  },
];

const DATA_ROWS = [
  { key: 'kategori', label: 'Kategori' },
  { key: 'kriteria', label: 'Kriteria' },
  { key: 'bobotAHP', label: 'Bobot AHP' },
  { key: 'aset', label: 'Aset' },
  { key: 'nilaiAset', label: 'Nilai Aset' },
  { key: 'hasil', label: 'Hasil SPK' },
  { key: 'lelang', label: 'Lelang' },
  { key: 'penawaran', label: 'Penawaran' },
  { key: 'notifikasi', label: 'Notifikasi' },
  { key: 'admin', label: 'Admin' },
  { key: 'penjual', label: 'Penjual' },
  { key: 'pembeli', label: 'Pembeli' },
  { key: 'usersNonAdmin', label: 'User Non-Admin' },
  { key: 'totalUsers', label: 'Total User' },
];

const DELETE_MODULES = [
  {
    module: 'kategori',
    label: 'Kategori',
    countKey: 'kategori',
    impact: 'Kriteria, aset, nilai, hasil, lelang, dan penawaran terkait ikut terhapus.',
  },
  {
    module: 'kriteria',
    label: 'Kriteria',
    countKey: 'kriteria',
    impact: 'Nilai aset, bobot AHP, dan hasil SPK ikut dibersihkan.',
  },
  {
    module: 'aset',
    label: 'Data Aset',
    countKey: 'aset',
    impact: 'Nilai, hasil SPK, lelang, dan penawaran pada aset ikut terhapus.',
  },
  {
    module: 'nilai',
    label: 'Data Nilai & SPK',
    countKey: 'nilaiAset',
    impact: 'Nilai aset, bobot AHP, dan hasil ranking dihapus.',
  },
  {
    module: 'lelang',
    label: 'Lelang & Penawaran',
    countKey: 'lelang',
    impact: 'Riwayat lelang dan penawaran dihapus. Status aset dikembalikan ke draft.',
  },
  {
    module: 'pembeli',
    label: 'Pembeli',
    countKey: 'pembeli',
    impact: 'Akun pembeli dan data terkaitnya dihapus.',
  },
  {
    module: 'penjual',
    label: 'Penjual',
    countKey: 'penjual',
    impact: 'Akun penjual dihapus. Aset penjual akan dilepas dari profil penjual.',
  },
  {
    module: 'users_non_admin',
    label: 'User Non-Admin',
    countKey: 'usersNonAdmin',
    impact: 'Semua akun pembeli dan penjual dihapus. Admin tetap disimpan.',
  },
  {
    module: 'notifikasi',
    label: 'Notifikasi',
    countKey: 'notifikasi',
    impact: 'Seluruh notifikasi user dihapus.',
  },
];

const formatNumber = (value) => new Intl.NumberFormat('id-ID').format(Number(value || 0));

const getTarget = (value) => IMPORT_TARGETS.find((item) => item.value === value) || IMPORT_TARGETS[0];

function ConfirmModal({ action, confirmText, loading, onConfirmText, onClose, onSubmit }) {
  const canSubmit = confirmText === CONFIRM_TEXT;

  return (
    <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: 18 }}>{action.type === 'reset' ? 'Reset Semua Data' : `Hapus ${action.label}`}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Aksi ini tidak dapat dibatalkan.
            </p>
          </div>
          <button type="button" className="theme-toggle-btn" onClick={onClose} disabled={loading}>
            <X size={16} />
          </button>
        </div>

        <div className="alert alert-danger" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>{action.impact}</span>
        </div>

        <div className="form-group">
          <label className="form-label">Ketik {CONFIRM_TEXT}</label>
          <input
            className="form-control"
            value={confirmText}
            onChange={(event) => onConfirmText(event.target.value)}
            placeholder={CONFIRM_TEXT}
            autoFocus
          />
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Batal
          </button>
          <button type="button" className="btn btn-danger" onClick={onSubmit} disabled={!canSubmit || loading}>
            {loading ? <span className="spinner" /> : <><Trash2 size={15} /> Lanjutkan</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PengaturanPage() {
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [importTarget, setImportTarget] = useState('kategori');
  const [importRows, setImportRows] = useState([]);
  const [importFileName, setImportFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const counts = summary?.counts || {};
  const selectedTarget = useMemo(() => getTarget(importTarget), [importTarget]);
  const previewHeaders = useMemo(() => Object.keys(importRows[0] || {}), [importRows]);

  const loadSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await getSettingsSummary();
      setSummary(res.data);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const handleDownloadTemplate = () => {
    const target = getTarget(importTarget);
    const worksheet = XLSX.utils.json_to_sheet(target.sample, { header: target.columns });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, target.label);
    XLSX.writeFile(workbook, `template-${target.value}.xlsx`);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAlert(null);
    setImportErrors([]);
    setImportFileName(file.name);

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const workbook = XLSX.read(loadEvent.target.result, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
        const cleanedRows = rows.filter((row) =>
          Object.values(row).some((value) => String(value || '').trim() !== '')
        );

        setImportRows(cleanedRows);
        if (cleanedRows.length === 0) {
          setAlert({ type: 'danger', message: 'File tidak memiliki baris data' });
        }
      } catch (err) {
        setImportRows([]);
        setImportFileName('');
        setAlert({ type: 'danger', message: 'File import tidak dapat dibaca' });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (importRows.length === 0) {
      setAlert({ type: 'danger', message: 'Pilih file import terlebih dahulu' });
      return;
    }

    setImporting(true);
    setAlert(null);
    setImportErrors([]);

    try {
      const res = await importSettingsData({ target: importTarget, rows: importRows });
      const result = res.data || {};
      setAlert({
        type: 'success',
        message: `Import berhasil. Baru: ${formatNumber(result.created)}, diperbarui: ${formatNumber(result.updated)}.`,
      });
      setImportRows([]);
      setImportFileName('');
      await loadSummary();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
      setImportErrors(err.details?.errors || []);
    } finally {
      setImporting(false);
    }
  };

  const openConfirm = (action) => {
    setConfirmAction(action);
    setConfirmText('');
    setAlert(null);
  };

  const handleConfirmedAction = async () => {
    if (!confirmAction) return;

    setDeleting(true);
    setAlert(null);

    try {
      if (confirmAction.type === 'reset') {
        await resetSettingsData({ confirmText });
        setAlert({ type: 'success', message: 'Reset data sistem berhasil.' });
      } else {
        await purgeSettingsModule(confirmAction.module, { confirmText });
        setAlert({ type: 'success', message: `Data ${confirmAction.label} berhasil dihapus.` });
      }

      setConfirmAction(null);
      setConfirmText('');
      await loadSummary();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2>Pengaturan Sistem</h2>
          <p>Kelola import, penghapusan data kolektif, dan reset data operasional.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={loadSummary} disabled={summaryLoading}>
          {summaryLoading ? <span className="spinner" /> : <RefreshCw size={15} />}
          Refresh
        </button>
      </div>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.message}</div>}

      <div className="stats-grid">
        {[
          { label: 'Kategori', value: counts.kategori, icon: <Database size={23} />, color: '#1d4ed8' },
          { label: 'Aset', value: counts.aset, icon: <Database size={23} />, color: '#16a34a' },
          { label: 'Lelang', value: counts.lelang, icon: <Database size={23} />, color: '#b45309' },
          { label: 'User', value: counts.totalUsers, icon: <Database size={23} />, color: '#7c3aed' },
        ].map((item) => (
          <div className="stat-card" key={item.label}>
            <div className="stat-icon" style={{ color: item.color }}>{item.icon}</div>
            <div>
              <div className="stat-label">{item.label}</div>
              <div className="stat-value" style={{ color: item.color }}>
                {summaryLoading ? '-' : formatNumber(item.value)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 20, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 16 }}>Ringkasan Data</h3>
        </div>
        <div className="table-wrapper" style={{ border: 0, borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Jumlah</th>
                <th>Data</th>
                <th>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.ceil(DATA_ROWS.length / 2) }).map((_, index) => {
                const left = DATA_ROWS[index * 2];
                const right = DATA_ROWS[index * 2 + 1];
                return (
                  <tr key={left.key}>
                    <td>{left.label}</td>
                    <td><strong>{summaryLoading ? '-' : formatNumber(counts[left.key])}</strong></td>
                    <td>{right?.label || ''}</td>
                    <td>{right ? <strong>{summaryLoading ? '-' : formatNumber(counts[right.key])}</strong> : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: 16, marginBottom: 4 }}>Import Data</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Format yang didukung: XLSX, XLS, CSV.
            </p>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleDownloadTemplate}>
            <Download size={14} /> Template {selectedTarget.label}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Target Import</label>
            <select
              className="form-control"
              value={importTarget}
              onChange={(event) => {
                setImportTarget(event.target.value);
                setImportRows([]);
                setImportFileName('');
                setImportErrors([]);
              }}
            >
              {IMPORT_TARGETS.map((target) => (
                <option key={target.value} value={target.value}>{target.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">File</label>
            <input className="form-control" type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
          </div>

          <button type="button" className="btn btn-primary" onClick={handleImport} disabled={importing || importRows.length === 0}>
            {importing ? <span className="spinner" /> : <Upload size={15} />}
            Import
          </button>
        </div>

        {importFileName && (
          <div className="alert alert-info" style={{ marginTop: 16, marginBottom: 0 }}>
            <FileSpreadsheet size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            {importFileName} - {formatNumber(importRows.length)} baris
          </div>
        )}

        {importRows.length > 0 && (
          <div className="table-wrapper" style={{ marginTop: 16 }}>
            <table className="table">
              <thead>
                <tr>
                  {previewHeaders.map((header) => <th key={header}>{header}</th>)}
                </tr>
              </thead>
              <tbody>
                {importRows.slice(0, 5).map((row, index) => (
                  <tr key={`${importFileName}-${index}`}>
                    {previewHeaders.map((header) => <td key={header}>{String(row[header] ?? '')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {importErrors.length > 0 && (
          <div className="alert alert-danger" style={{ marginTop: 16, marginBottom: 0 }}>
            <strong>Data tidak valid:</strong>
            <div style={{ marginTop: 8, display: 'grid', gap: 4 }}>
              {importErrors.slice(0, 8).map((item) => (
                <div key={`${item.row}-${item.message}`}>Baris {item.row}: {item.message}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 18 }}>
          <h3 style={{ fontSize: 16, marginBottom: 4 }}>Penghapusan Kolektif</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Semua aksi memakai transaksi database.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {DELETE_MODULES.map((item) => (
            <div
              key={item.module}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 16,
                display: 'grid',
                gap: 12,
                alignContent: 'space-between',
                background: 'var(--surface)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <strong>{item.label}</strong>
                  <span className="badge badge-primary">{formatNumber(counts[item.countKey])}</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{item.impact}</p>
              </div>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => openConfirm({ ...item, type: 'purge' })}>
                <Trash2 size={14} /> Hapus Data
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ borderColor: 'rgba(251, 113, 133, 0.45)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: 16, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} color="var(--danger)" /> Reset Semua Data
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Admin yang sedang login tetap disimpan.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => openConfirm({
              type: 'reset',
              label: 'Semua Data',
              impact: 'Semua data operasional, master data, user non-admin, lelang, penawaran, nilai, dan notifikasi akan dihapus. Admin aktif tetap disimpan.',
            })}
          >
            <RotateCcw size={15} /> Reset Sistem
          </button>
        </div>
      </div>

      {confirmAction && (
        <ConfirmModal
          action={confirmAction}
          confirmText={confirmText}
          loading={deleting}
          onConfirmText={setConfirmText}
          onClose={() => !deleting && setConfirmAction(null)}
          onSubmit={handleConfirmedAction}
        />
      )}
    </div>
  );
}
