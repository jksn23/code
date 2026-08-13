import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Plus,
  Folder,
  CheckSquare,
  FileCode,
  FileText,
  Clock,
  Archive,
  Search,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Lock,
  BookOpen,
  UploadCloud,
  FileCheck,
  Filter,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import {
  getADMSRepository,
  uploadADMSDocument,
  verifyADMSDocument,
  getADMSChecklist,
  generateDokumenLelang,
  downloadADMSArchiveZipUrl,
  getADMSActivityLogs,
  getAset,
} from '../services/api';
import { API_URL } from '../config/env';

// Status badge styling helper
const getStatusBadge = (status) => {
  switch (status) {
    case 'APPROVED':
      return <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={12} /> APPROVED</span>;
    case 'PENDING_VERIFICATION':
    case 'UPLOADED':
      return <span className="badge" style={{ background: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid var(--warning)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> PENDING</span>;
    case 'REJECTED':
      return <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><XCircle size={12} /> REJECTED</span>;
    case 'ARCHIVED':
      return <span className="badge" style={{ background: 'var(--surface-light)', color: 'var(--text-muted)', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Archive size={12} /> ARCHIVED</span>;
    default:
      return <span className="badge">{status}</span>;
  }
};

const ADMSPage = () => {
  const { user } = useAuth();
  const { showAlert } = useModal();
  const isAdmin = user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState('repository'); // repository | checklist | template | generator | activity | archive
  const [loading, setLoading] = useState(false);

  // ─── State Repository ────────────────────────────────────────────────────────
  const [docs, setDocs] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    documentType: 'KTP_PENJUAL',
    assetId: '',
    auctionId: '',
    file: null,
  });

  // ─── State Checklist ─────────────────────────────────────────────────────────
  const [asetList, setAsetList] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [checklistData, setChecklistData] = useState(null);
  const [verifyNote, setVerifyNote] = useState('');
  const [selectedDocToVerify, setSelectedDocToVerify] = useState(null);

  // ─── State Generator ─────────────────────────────────────────────────────────
  const [lelangIdGen, setLelangIdGen] = useState('');
  const [docTypeGen, setDocTypeGen] = useState('SURAT_PENETAPAN_LELANG');
  const [formatGen, setFormatGen] = useState('pdf');
  const [generating, setGenerating] = useState(false);

  // ─── State Activity Log ──────────────────────────────────────────────────────
  const [activities, setActivities] = useState([]);

  // ─── State Archive ───────────────────────────────────────────────────────────
  const [archiveLelangId, setArchiveLelangId] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'repository') fetchRepository();
    if (isAdmin && activeTab === 'activity') fetchActivities();
    if (isAdmin && activeTab === 'checklist' && selectedAssetId) fetchChecklist(selectedAssetId);
  }, [activeTab, search, filterType, filterStatus, selectedAssetId, isAdmin]);

  const fetchInitialData = async () => {
    try {
      const asetRes = await getAset();
      const items = asetRes.data || asetRes || [];
      setAsetList(items);
      if (items.length > 0) {
        setSelectedAssetId(String(items[0].id));
      }
    } catch {
      // Ignore
    }
  };

  const fetchRepository = async () => {
    try {
      setLoading(true);
      const res = await getADMSRepository({
        documentType: filterType || undefined,
        status: filterStatus || undefined,
        search: search || undefined,
      });
      setDocs(res.data || []);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchChecklist = async (assetId) => {
    try {
      setLoading(true);
      const res = await getADMSChecklist(assetId);
      setChecklistData(res.data || null);
    } catch {
      setChecklistData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await getADMSActivityLogs();
      setActivities(res.data || []);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadData.file) {
      showAlert('Harap pilih file terlebih dahulu', 'warning');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('documentType', uploadData.documentType);
      if (uploadData.assetId) formData.append('assetId', uploadData.assetId);
      if (uploadData.auctionId) formData.append('auctionId', uploadData.auctionId);

      await uploadADMSDocument(formData);
      showAlert('Dokumen berhasil diunggah', 'success');
      setShowUploadModal(false);
      setUploadData({ documentType: 'KTP_PENJUAL', assetId: '', auctionId: '', file: null });
      fetchRepository();
    } catch (err) {
      showAlert(err.message || 'Gagal mengunggah dokumen', 'error');
    }
  };

  const handleVerify = async (docId, status) => {
    try {
      await verifyADMSDocument(docId, { status, note: verifyNote });
      showAlert(`Dokumen berhasil di-${status.toLowerCase()}`, 'success');
      setSelectedDocToVerify(null);
      setVerifyNote('');
      if (selectedAssetId) fetchChecklist(selectedAssetId);
      fetchRepository();
    } catch (err) {
      showAlert(err.message || 'Gagal merubah status verifikasi', 'error');
    }
  };

  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    if (!lelangIdGen) {
      showAlert('Masukkan ID Lelang', 'warning');
      return;
    }
    try {
      setGenerating(true);
      await generateDokumenLelang(lelangIdGen, docTypeGen, formatGen);
      showAlert(`Dokumen ${docTypeGen} (${formatGen.toUpperCase()}) berhasil digenerate!`, 'success');
      if (activeTab === 'repository') fetchRepository();
    } catch (err) {
      showAlert(err.message || 'Gagal generate dokumen', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const tabsConfig = isAdmin
    ? [
        { id: 'repository', label: 'Repository Dokumen', icon: <Folder size={16} /> },
        { id: 'checklist', label: 'Checklist & Verifikasi', icon: <CheckSquare size={16} /> },
        { id: 'template', label: 'Template Management', icon: <FileCode size={16} /> },
        { id: 'generator', label: 'Document Generator', icon: <FileText size={16} /> },
        { id: 'activity', label: 'Activity Log', icon: <Clock size={16} /> },
        { id: 'archive', label: 'Digital Archive', icon: <Archive size={16} /> },
      ]
    : [
        { id: 'repository', label: 'Dokumen Saya', icon: <Folder size={16} /> },
      ];

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FolderOpen size={24} style={{ color: 'var(--primary)' }} />
            {isAdmin ? 'Auction Document Management System (ADMS)' : 'Dokumen Lelang Saya'}
          </h2>
          <p>
            {isAdmin
              ? 'Modul administrasi digital terintegrasi untuk pengelolaan, verifikasi, otomatisasi, & pengarsipan berkas lelang.'
              : 'Daftar seluruh dokumen persyaratan aset dan berkas lelang yang telah Anda unggah melalui form pengajuan.'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Plus size={18} /> Unggah Dokumen Baru
          </button>
        )}
      </div>

      {/* Theme-Integrated Tab Bar (Only show tabs if more than 1 tab) */}
      {tabsConfig.length > 1 && (
        <div style={{
          display: 'flex',
          gap: 8,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 6,
          marginBottom: 24,
          overflowX: 'auto',
        }}>
          {tabsConfig.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  flex: 1,
                  minWidth: 140,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justify: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive ? 'var(--primary-bg)' : 'transparent',
                  color: isActive ? 'var(--primary-text)' : 'var(--text-muted)',
                  transition: 'var(--transition)',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.icon}
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ─── TAB 1: REPOSITORY ───────────────────────────────────────────────── */}
      {activeTab === 'repository' && (
        <div className="card">
          {/* Filters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Cari nama file..."
                className="form-control"
                style={{ paddingLeft: 38 }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="form-control"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">-- Semua Tipe Dokumen --</option>
              <option value="KTP_PENJUAL">KTP Penjual</option>
              <option value="NPWP_PENJUAL">NPWP Penjual</option>
              <option value="SURAT_PERMOHONAN_LELANG">Surat Permohonan Lelang</option>
              <option value="SURAT_PERNYATAAN">Surat Pernyataan</option>
              <option value="DOKUMEN_KEPEMILIKAN">Dokumen Kepemilikan</option>
              <option value="FOTO_ASET">Foto Aset</option>
              <option value="BUKTI_PENGUMUMAN">Bukti Pengumuman</option>
              <option value="SURAT_PENETAPAN_LELANG">Surat Penetapan Lelang</option>
              <option value="NOTA_PEMBAYARAN">Nota Pembayaran</option>
              <option value="BERITA_ACARA">Berita Acara</option>
            </select>
            <select
              className="form-control"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">-- Semua Status --</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          {/* Table */}
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Dokumen &amp; Versi</th>
                  <th>Tipe</th>
                  <th>Uploader / Owner</th>
                  <th>Ukuran &amp; Format</th>
                  <th>Status Badge</th>
                  <th>Tanggal Upload</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 24 }}>Memuat data repository...</td></tr>
                ) : docs.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Tidak ada dokumen di repository.</td></tr>
                ) : (
                  docs.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FileText size={16} style={{ color: 'var(--primary)' }} />
                          {doc.originalFileName || doc.fileName}
                          <span className="badge badge-primary">v{doc.version}</span>
                        </div>
                        {doc.aset && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Aset: {doc.aset.nama}</div>}
                        {doc.status === 'REJECTED' && doc.verificationNote && (
                          <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4, background: 'var(--danger-bg)', padding: '2px 8px', borderRadius: 4, width: 'fit-content' }}>
                            Catatan Penolakan: {doc.verificationNote}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--surface-light)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>
                          {doc.documentType}
                        </span>
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {doc.uploader?.nama || 'Sistem'}
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{doc.uploader?.role}</div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : '-'}
                        <div>{doc.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}</div>
                      </td>
                      <td>{getStatusBadge(doc.status)}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(doc.createdAt).toLocaleDateString('id-ID')}
                      </td>
                      <td>
                        <a
                          href={`${API_URL}/${doc.storagePath}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                          <Download size={14} /> Unduh
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 2: CHECKLIST & VERIFICATION ──────────────────────────────────── */}
      {activeTab === 'checklist' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {/* Asset Selector */}
          <div className="card" style={{ height: 'fit-content' }}>
            <h3 style={{ marginBottom: 16, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={18} /> Pilih Aset Pengajuan
            </h3>
            <div className="form-group">
              <label className="form-label">Pilih Aset:</label>
              <select
                className="form-control"
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
              >
                {asetList.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{a.id}] {a.nama}
                  </option>
                ))}
              </select>
            </div>

            {checklistData && (
              <div style={{ marginTop: 24, padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--surface-light)', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: 14, marginBottom: 12 }}>Ringkasan Kelengkapan</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                  <span>Kelengkapan Dokumen:</span>
                  <span style={{ fontWeight: 600, color: checklistData.isComplete ? 'var(--success)' : 'var(--danger)' }}>
                    {checklistData.isComplete ? '100% Lengkap' : 'Belum Lengkap'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 16 }}>
                  <span>Status Persetujuan:</span>
                  <span style={{ fontWeight: 600, color: checklistData.allApproved ? 'var(--success)' : 'var(--warning)' }}>
                    {checklistData.allApproved ? '100% Approved' : 'Perlu Verifikasi'}
                  </span>
                </div>

                {/* Hard Guard Button */}
                <button
                  className={`btn ${checklistData.canApproveAuction ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  onClick={() => showAlert('Seluruh dokumen lelang lengkap dan disetujui secara resmi!', 'success')}
                  disabled={!checklistData.canApproveAuction}
                >
                  {checklistData.canApproveAuction ? (
                    <><CheckCircle2 size={16} /> Verifikasi &amp; Setujui Lelang</>
                  ) : (
                    <><Lock size={16} /> Belum Dapat Diverifikasi</>
                  )}
                </button>
                {!checklistData.canApproveAuction && (
                  <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 8, textAlign: 'center' }}>
                    Tombol verifikasi dinonaktifkan sampai seluruh 7 dokumen wajib statusnya <strong>APPROVED</strong>.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Checklist Items Grid */}
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckSquare size={18} /> Checklist Dokumen Wajib Lelang
            </h3>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 32 }}>Memuat checklist dokumen...</div>
            ) : !checklistData ? (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Pilih aset untuk melihat checklist.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {checklistData.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 16,
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      background: 'var(--surface2)',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {item.isApproved ? (
                        <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
                      ) : (
                        <AlertTriangle size={20} style={{ color: 'var(--warning)' }} />
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {item.document ? `File: ${item.document.fileName} (v${item.document.version})` : 'Dokumen belum diunggah'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                      {getStatusBadge(item.status)}

                      {item.document && (
                        <>
                          <a
                            href={`${API_URL}/${item.document.storagePath}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <Eye size={14} /> Lihat
                          </a>

                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleVerify(item.document.id, 'APPROVED')}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setSelectedDocToVerify(item.document)}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 3: TEMPLATE MANAGEMENT ───────────────────────────────────────── */}
      {activeTab === 'template' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          <div className="card">
            <h3 style={{ marginBottom: 16, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <UploadCloud size={18} /> Upload Custom Template (.DOCX)
            </h3>
            <form onSubmit={(e) => { e.preventDefault(); showAlert('Template DOCX berhasil diperbarui!', 'success'); }}>
              <div className="form-group">
                <label className="form-label">Tipe Dokumen Template:</label>
                <select className="form-control">
                  <option value="SURAT_PENETAPAN_LELANG">Surat Penetapan Lelang</option>
                  <option value="BERITA_ACARA">Berita Acara Lelang</option>
                  <option value="NOTA_PEMBAYARAN">Nota Pembayaran Kemenangan</option>
                  <option value="RINGKASAN_HASIL_LELANG">Ringkasan Hasil Lelang</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">File Template (.docx):</label>
                <input type="file" accept=".docx" className="form-control" required />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Unggah Template Custom</button>
            </form>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={18} /> Referensi Placeholder Template Engine
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Gunakan variabel placeholder berikut di dalam file Word (.docx) Anda:</p>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Placeholder</th>
                    <th>Keterangan Data</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td><code>&#123;&#123;nomor_surat&#125;&#125;</code></td><td>Nomor Invoice / Surat Resmi</td></tr>
                  <tr><td><code>&#123;&#123;nama_penjual&#125;&#125;</code></td><td>Nama Lengkap Penjual</td></tr>
                  <tr><td><code>&#123;&#123;nama_aset&#125;&#125;</code></td><td>Nama Barang / Aset</td></tr>
                  <tr><td><code>&#123;&#123;nilai_limit&#125;&#125;</code></td><td>Nilai Limit Hasil SPK AHP-SAW</td></tr>
                  <tr><td><code>&#123;&#123;nama_pemenang&#125;&#125;</code></td><td>Pemenang Bidding Lelang</td></tr>
                  <tr><td><code>&#123;&#123;harga_terjual&#125;&#125;</code></td><td>Nominal Harga Winning Bid</td></tr>
                  <tr><td><code>&#123;&#123;total_pembayaran&#125;&#125;</code></td><td>Total + Biaya Admin 2.5%</td></tr>
                  <tr><td><code>&#123;&#123;deadline_pelunasan&#125;&#125;</code></td><td>Batas Waktu Pelunasan Pembeli</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: DOCUMENT GENERATOR ────────────────────────────────────────── */}
      {activeTab === 'generator' && (
        <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
          <h3 style={{ marginBottom: 16, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} /> Multi-Format Document Generator
          </h3>
          <form onSubmit={handleGenerateSubmit}>
            <div className="form-group">
              <label className="form-label">ID Lelang:</label>
              <input
                type="number"
                placeholder="Masukkan ID Lelang (contoh: 1)"
                className="form-control"
                value={lelangIdGen}
                onChange={(e) => setLelangIdGen(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Jenis Dokumen Sistem:</label>
              <select
                className="form-control"
                value={docTypeGen}
                onChange={(e) => setDocTypeGen(e.target.value)}
              >
                <option value="SURAT_PENETAPAN_LELANG">Surat Penetapan Lelang</option>
                <option value="BERITA_ACARA">Berita Acara Lelang</option>
                <option value="NOTA_PEMBAYARAN">Nota Pembayaran (Invoice Pemenang)</option>
                <option value="RINGKASAN_HASIL_LELANG">Ringkasan Hasil Lelang &amp; SPK</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Format Output:</label>
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                  <input
                    type="radio"
                    name="format"
                    checked={formatGen === 'pdf'}
                    onChange={() => setFormatGen('pdf')}
                  />
                  <span>PDF (Server Render)</span>
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                  <input
                    type="radio"
                    name="format"
                    checked={formatGen === 'docx'}
                    onChange={() => setFormatGen('docx')}
                  />
                  <span>DOCX (Word Document)</span>
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} disabled={generating}>
              {generating ? 'Memproses...' : <><Zap size={16} /> Generate Dokumen Sekarang</>}
            </button>
          </form>
        </div>
      )}

      {/* ─── TAB 5: ACTIVITY LOG ──────────────────────────────────────────────── */}
      {activeTab === 'activity' && (
        <div className="card">
          <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} /> Audit Trail Timeline Aktivitas Dokumen
          </h3>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Aksi</th>
                  <th>Nama Dokumen</th>
                  <th>Aktor</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((act) => (
                  <tr key={act.id}>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(act.createdAt).toLocaleString('id-ID')}</td>
                    <td>
                      <span className="badge badge-primary">{act.action}</span>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{act.document?.fileName || '-'}</td>
                    <td style={{ fontSize: 13 }}>{act.actor?.nama} ({act.actor?.role})</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{act.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 6: DIGITAL ARCHIVE ───────────────────────────────────────────── */}
      {activeTab === 'archive' && (
        <div className="card" style={{ maxWidth: 540, margin: '0 auto', textAlign: 'center' }}>
          <Archive size={36} style={{ color: 'var(--primary)', margin: '0 auto 12px auto' }} />
          <h3 style={{ marginBottom: 8 }}>Digital Archive &amp; Download ZIP</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
            Unduh seluruh berkas administrasi lelang (dokumen terupload, dokumen digenerate, &amp; ringkasan teks) dalam 1 paket bundel ZIP.
          </p>

          <div className="form-group">
            <input
              type="number"
              placeholder="Masukkan ID Lelang Selesai (contoh: 1)"
              className="form-control"
              style={{ textAlign: 'center' }}
              value={archiveLelangId}
              onChange={(e) => setArchiveLelangId(e.target.value)}
            />
          </div>

          <a
            href={archiveLelangId ? downloadADMSArchiveZipUrl(archiveLelangId) : '#'}
            target="_blank"
            rel="noreferrer"
            className={`btn btn-primary ${!archiveLelangId ? 'disabled' : ''}`}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px 24px', fontSize: 15 }}
          >
            <Download size={18} /> Download Paket ZIP Arsip
          </a>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 500 }}>
            <h3 style={{ marginBottom: 16 }}>Unggah Dokumen Baru ke Repository</h3>
            <form onSubmit={handleUploadSubmit}>
              <div className="form-group">
                <label className="form-label">Tipe Dokumen:</label>
                <select
                  className="form-control"
                  value={uploadData.documentType}
                  onChange={(e) => setUploadData({ ...uploadData, documentType: e.target.value })}
                >
                  <option value="KTP_PENJUAL">KTP Penjual</option>
                  <option value="NPWP_PENJUAL">NPWP Penjual</option>
                  <option value="SURAT_PERMOHONAN_LELANG">Surat Permohonan Lelang</option>
                  <option value="SURAT_PERNYATAAN">Surat Pernyataan</option>
                  <option value="DOKUMEN_KEPEMILIKAN">Dokumen Kepemilikan (BPKB/STNK/Sertifikat)</option>
                  <option value="FOTO_ASET">Foto Aset</option>
                  <option value="BUKTI_PENGUMUMAN">Bukti Pengumuman Lelang</option>
                  <option value="BUKTI_PEMBAYARAN">Bukti Pembayaran Pembeli</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Tautkan dengan ID Aset (Opsional):</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="ID Aset (misal: 1)"
                  value={uploadData.assetId}
                  onChange={(e) => setUploadData({ ...uploadData, assetId: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Pilih Berkas File:</label>
                <input
                  type="file"
                  className="form-control"
                  onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Unggah Dokumen</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verification Reject Note Modal */}
      {selectedDocToVerify && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 500 }}>
            <h3 style={{ marginBottom: 8, color: 'var(--danger)' }}>Penolakan Dokumen</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Berikan alasan penolakan dokumen agar penjual dapat melakukan re-upload versi baru.</p>
            <textarea
              className="form-control"
              style={{ minHeight: 100 }}
              placeholder="Contoh: Foto KTP buram, tidak terbaca..."
              value={verifyNote}
              onChange={(e) => setVerifyNote(e.target.value)}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button className="btn btn-secondary" onClick={() => setSelectedDocToVerify(null)}>Batal</button>
              <button
                className="btn btn-danger"
                onClick={() => handleVerify(selectedDocToVerify.id, 'REJECTED')}
              >
                Kirim Penolakan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ADMSPage;
