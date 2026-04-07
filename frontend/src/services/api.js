import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
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
    return Promise.reject(new Error(message));
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
export const updateAset = (id, data) => api.put(`/aset/${id}`, data);
export const deleteAset = (id) => api.delete(`/aset/${id}`);

// ====== PENJUAL & LELANG ======
export const getSemuaPenjual = () => api.get('/penjual');
export const getPenjualById = (id) => api.get(`/penjual/${id}`);
export const verifikasiPenjual = (id, isVerified) => api.put(`/penjual/${id}/verify`, { isVerified });
export const approvePenjual = (id, data = {}) => api.put(`/penjual/${id}/approve`, data);
export const rejectPenjual = (id, data) => api.put(`/penjual/${id}/reject`, data);
export const reuploadDokumenPenjual = (formData) => api.put('/penjual/me/reupload-dokumen', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const ajukanLelang = (asetId) => api.put(`/aset/${asetId}/ajukan`);
export const createLelangAndApprove = (asetId, data) => api.post(`/aset/${asetId}/verifikasi-lelang`, data);
export const getLelangSelesaiAdmin = () => api.get('/lelang/admin/selesai');
export const getRiwayatPembayaranPembeli = () => api.get('/lelang/pemenang/saya');
export const getInvoiceLelang = (id) => api.get(`/lelang/${id}/invoice`);
export const uploadBuktiPembayaranLelang = (id, formData) => api.post(`/lelang/${id}/upload-bukti`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const verifikasiPembayaranLelang = (id, data = {}) => api.put(`/lelang/${id}/pembayaran/verifikasi`, data);
export const tolakPembayaranLelang = (id, data) => api.put(`/lelang/${id}/pembayaran/tolak`, data);
export const konfirmasiTerimaBarang = (id) => api.put(`/lelang/${id}/terima-barang`);
export const getNextLelang = (currentId) => api.get(`/lelang/next/${currentId}`);
export const getLelangSummary = (date) => api.get(`/lelang/summary/${date}`);


// ====== NILAI ASET ======
export const getNilaiAset = (aset_id) => api.get(`/nilai/aset/${aset_id}`);
export const inputNilaiAset = (data) => api.post('/nilai', data);

// ====== SPK ======
export const hitungAHP = (data) => api.post('/spk/hitung-ahp', data);
export const hitungSAW = (data) => api.post('/spk/hitung-saw', data);
export const getHasil = (kategori_id) => api.get(`/spk/hasil/${kategori_id}`);

// ====== LAPORAN ======
export const getLaporanAset = () => api.get('/laporan/aset');
export const getLaporanLelang = () => api.get('/laporan/lelang');
export const getLaporanTransaksi = () => api.get('/laporan/transaksi');

export default api;
