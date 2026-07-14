import axios from 'axios';
import { API_URL } from '../config/env.js';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle error global
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || 'Terjadi kesalahan pada server';
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    const apiError = new Error(message);
    apiError.status = error.response?.status;
    apiError.details = error.response?.data;
    return Promise.reject(apiError);
  }
);

// ====== AUTH ======
export const login = (data) => api.post('/auth/login', data);
export const registerPembeli = (formData) => api.post('/auth/register/pembeli', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const registerPenjual = (formData) => api.post('/auth/register/penjual', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getProfile = () => api.get('/auth/profile');
export const getDashboardSummary = () => api.get('/dashboard/summary');
export const getNotifikasi = () => api.get('/notifikasi');
export const markNotifikasiRead = (id) => api.put(`/notifikasi/${id}/read`);
export const markAllNotifikasiRead = () => api.put('/notifikasi/read-all');
export const getUsersAdmin = (params) => api.get('/users', { params });
export const getUserAdminById = (id) => api.get(`/users/${id}`);
export const createUserAdmin = (data) => api.post('/users', data);
export const updateUserAdmin = (id, data) => api.put(`/users/${id}`, data);
export const deleteUserAdmin = (id) => api.delete(`/users/${id}`);

// ====== KATEGORI ======
export const getKategori = () => api.get('/kategori');
export const getKategoriById = (id) => api.get(`/kategori/${id}`);
export const createKategori = (data) => api.post('/kategori', data);
export const updateKategori = (id, data) => api.put(`/kategori/${id}`, data);
export const deleteKategori = (id) => api.delete(`/kategori/${id}`);

// ====== KRITERIA ======
export const getKriteria = (kategori_id) =>
  api.get('/kriteria', { params: kategori_id ? { kategori_id } : {} });
export const createKriteria = (data) => api.post('/kriteria', data);
export const updateKriteria = (id, data) => api.put(`/kriteria/${id}`, data);
export const deleteKriteria = (id) => api.delete(`/kriteria/${id}`);

// ====== ASET ======
export const getAset = (kategori_id) =>
  api.get('/aset', { params: { ...(kategori_id && { kategori_id }) } });
export const getAsetById = (id) => api.get(`/aset/${id}`);
export const createAset = (formData) => api.post('/aset', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const createAsetProperty = (formData) => api.post('/aset/property', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const createAssetVehicle = (formData) => api.post('/aset/vehicle', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const createAssetElectronic = (formData) => api.post('/aset/electronic', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateAset = (id, data) => api.put(`/aset/${id}`, data);
export const deleteAset = (id) => api.delete(`/aset/${id}`);

// ====== PENJUAL & LELANG ======
export const getSemuaPenjual = () => api.get('/penjual');
export const getPenjualById = (id) => api.get(`/penjual/${id}`);
export const verifikasiPenjual = (id, data) => api.put(`/penjual/${id}/verify`, data);
export const resubmitSellerDocuments = (formData) => api.put('/penjual/me/documents', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getSemuaPembeli = () => api.get('/pembeli');
export const getPembeliById = (id) => api.get(`/pembeli/${id}`);
export const verifikasiPembeli = (id, data) => api.put(`/pembeli/${id}/verifikasi`, data);
export const ajukanLelang = (asetId) => api.put(`/aset/${asetId}/ajukan`);
export const createLelangAndApprove = (asetId, data) => api.post(`/aset/${asetId}/verifikasi-lelang`, data);

export const verifyProperty = (asetId) => api.post(`/aset/${asetId}/verify-property`);
export const verifyVehicle = (asetId) => api.post(`/aset/${asetId}/verify-vehicle`);
export const verifyElectronic = (asetId) => api.post(`/aset/${asetId}/verify-electronic`);

export const getLelangSelesaiAdmin = () => api.get('/lelang/admin/selesai');
export const verifikasiPembayaranLelang = (id) => api.put(`/lelang/${id}/pembayaran`);
export const konfirmasiTerimaBarang = (id) => api.put(`/lelang/${id}/terima-barang`);
export const getNextLelang = (currentId) => api.get(`/lelang/next/${currentId}`);
export const getLelangSummary = (date) => api.get(`/lelang/summary/${date}`);
export const getBuyerOwnedAssets = () => api.get('/lelang/pemenang/aset-saya');
export const getBuyerPendingPayments = () => api.get('/lelang/pemenang/pembayaran');
export const getLelangSayaMenang = () => api.get('/lelang/pemenang/saya');
export const getInvoiceLelang = (id) => api.get(`/lelang/${id}/invoice`);
export const uploadBuktiPembayaranLelang = (id, formData) => api.post(`/lelang/${id}/upload-bukti`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const tolakPembayaranLelang = (id, data) => api.put(`/lelang/${id}/pembayaran/tolak`, data);

// ====== NILAI ASET ======
export const getNilaiAset = (aset_id) => api.get(`/nilai/aset/${aset_id}`);
export const inputNilaiAset = (data) => api.post('/nilai', data);

// ====== PENILAIAN ASET SELLER ======
export const getSellerAsetKriteria = (asetId) => api.get(`/seller/aset/${asetId}/kriteria`);
export const saveSellerNilaiKriteria = (asetId, data) => api.put(`/seller/aset/${asetId}/nilai-kriteria`, data);
export const createSellerNilaiKriteria = (asetId, data) => api.post(`/seller/aset/${asetId}/nilai-kriteria`, data);
export const hitungSellerAsetSAW = (asetId) => api.post(`/seller/aset/${asetId}/hitung-saw`);
export const getSellerHasilPenilaian = (asetId) => api.get(`/seller/aset/${asetId}/hasil-penilaian`);

// ====== VALIDASI PENILAIAN ADMIN ======
export const getAdminPenilaianAset = () => api.get('/admin/penilaian-aset');
export const getAdminPenilaianAsetDetail = (asetId) => api.get(`/admin/penilaian-aset/${asetId}`);
export const updateAdminStatusPenilaian = (asetId, data) => api.patch(`/admin/penilaian-aset/${asetId}/status`, data);

// ====== SPK ======
export const hitungSAW = (data) => api.post('/spk/hitung-saw', data);
export const getHasil = (kategori_id) => api.get(`/spk/hasil/${kategori_id}`);

// ====== QUICK BIDS ======
export const getQuickBids = (auctionId) => api.get('/quick-bids', { params: { auctionId } });
export const saveQuickBids = (data) => api.post('/quick-bids', data);

// ====== LAPORAN ======
export const getLaporanAset = () => api.get('/laporan/aset');
export const getLaporanLelang = () => api.get('/laporan/lelang');
export const getLaporanTransaksi = () => api.get('/laporan/transaksi');

// ====== PENGATURAN SISTEM ======
export const getSettingsSummary = () => api.get('/settings/summary');
export const importSettingsData = (data) => api.post('/settings/import', data);
export const purgeSettingsModule = (module, data) => api.post(`/settings/purge/${module}`, data);
export const resetSettingsData = (data) => api.post('/settings/reset', data);

export const getPembandingByAset = (asetId) => api.get(`/pembanding/aset/${asetId}`);
export const searchPembanding = (asetId) => api.post(`/pembanding/aset/${asetId}/search`);
export const getScrapingJobStatus = (asetId, jobId) => api.get(`/pembanding/aset/${asetId}/job-status/${jobId}`);
export const addManualPembanding = (asetId, data) => api.post(`/pembanding/aset/${asetId}/manual`, data);
export const hitungMedianPembanding = (asetId) => api.post(`/pembanding/aset/${asetId}/hitung-median`);
export const selectPembanding = (id, data) => api.patch(`/pembanding/${id}/select`, data);
export const validasiPembanding = (id, data) => api.patch(`/pembanding/${id}/validasi`, data);


// ====== DOKUMEN & ADMS ======
export const generateDokumenLelang = (lelangId, tipe, format = 'pdf') =>
  api.post(`/dokumen/${lelangId}/generate`, { tipe, format });
export const getDokumenLelang = (lelangId) => api.get(`/dokumen/${lelangId}`);
export const downloadDokumenUrl = (lelangId, dokumenId) =>
  `${API_URL}/dokumen/${lelangId}/${dokumenId}/download`;

export const uploadADMSDocument = (formData) => api.post('/dokumen/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getADMSRepository = (params) => api.get('/dokumen/repository', { params });
export const getADMSChecklist = (assetId) => api.get(`/dokumen/checklist/asset/${assetId}`);
export const verifyADMSDocument = (id, data) => api.patch(`/dokumen/${id}/verify`, data);
export const downloadADMSArchiveZipUrl = (lelangId) => `${API_URL}/dokumen/${lelangId}/archive/zip`;
export const getADMSActivityLogs = () => api.get('/dokumen/activity-log');

export default api;


