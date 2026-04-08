# Sprint 7: Revisi Registrasi, Filter Aset, dan Pembayaran Pembeli

## Tujuan

Sprint ini berfokus pada penyempurnaan alur pengguna di sisi frontend dan pemanfaatan flow pembayaran yang sudah dibuat sebelumnya. Cakupan utama:

1. Menambahkan notifikasi sukses registrasi dan validasi form registrasi.
2. Menambahkan panduan yang lebih jelas pada halaman input nilai.
3. Menambahkan filter status aset terjual dan belum terjual di halaman-halaman yang menampilkan daftar aset.
4. Menambahkan menu `Aset Saya` pada role pembeli.
5. Menambahkan menu `Pembayaran` pada role pembeli dengan flow upload bukti bayar yang sudah ada.

## Implementation Plan

### 1. Registrasi dan Validasi Form

- Tambahkan validasi per field pada halaman registrasi pembeli dan penjual.
- Tampilkan pesan error yang spesifik di bawah input.
- Setelah registrasi berhasil, redirect ke login dengan pesan `Registrasi Berhasil, Silahkan Login`.

### 2. Panduan Input Nilai

- Tambahkan blok panduan pada halaman input nilai.
- Jelaskan urutan pengisian nilai aset per kategori.
- Jelaskan bahwa bobot kriteria diatur pada proses AHP, bukan pada form nilai aset.

### 3. Filter Status Aset

- Tambahkan filter cepat `Semua`, `Terjual`, dan `Belum Terjual`.
- Terapkan pada halaman data aset utama.
- Terapkan juga pada area lain yang menampilkan daftar aset agar perilaku konsisten.

### 4. Menu Aset Pembeli

- Sediakan halaman baru untuk daftar aset yang dimenangkan pembeli.
- Tampilkan detail harga menang, profit, invoice, status pembayaran, dan status penerimaan barang.
- Gunakan modal detail agar pembeli bisa melihat data lengkap tanpa pindah konteks.

### 5. Menu Pembayaran Pembeli

- Sediakan halaman khusus pembayaran pembeli.
- Tampilkan hanya aset yang masih butuh tindakan pembayaran.
- Gunakan flow invoice dan upload bukti bayar yang sudah tersedia pada backend.

## Implementasi yang Dibuat

### Frontend

- `frontend/src/pages/auth/RegisterPage.jsx`
  - Menambahkan validasi field nama, email, password, KTP, NPWP, bank, dan nomor rekening.
  - Menambahkan error inline pada setiap field.
  - Menambahkan redirect ke login dengan pesan sukses registrasi.

- `frontend/src/pages/auth/LoginPage.jsx`
  - Menampilkan pesan `Registrasi Berhasil, Silahkan Login` setelah redirect dari registrasi.

- `frontend/src/pages/InputNilaiPage.jsx`
  - Menambahkan card panduan pengisian nilai.
  - Menambahkan penjelasan bobot kriteria agar user tidak salah memahami alur.

- `frontend/src/pages/AsetPage.jsx`
  - Menambahkan filter status aset `Semua`, `Terjual`, dan `Belum Terjual`.

- `frontend/src/pages/LaporanPage.jsx`
  - Menambahkan filter status aset pada tab laporan aset.

- `frontend/src/pages/AdminSellerDetailPage.jsx`
  - Menambahkan filter status aset pada daftar aset milik penjual.

- `frontend/src/pages/BuyerAssetsPage.jsx`
  - Menambahkan halaman baru untuk aset yang dimenangkan pembeli.
  - Menampilkan detail invoice, harga menang, profit, status pembayaran, dan status barang.
  - Menambahkan aksi konfirmasi aset diterima.

- `frontend/src/pages/BuyerPaymentsPage.jsx`
  - Menambahkan halaman baru untuk daftar pembayaran pembeli.
  - Menghubungkan tombol bayar dengan flow invoice dan upload bukti pembayaran.

- `frontend/src/components/Sidebar.jsx`
  - Menambahkan menu `Aset Saya` dan `Pembayaran` untuk role pembeli.

- `frontend/src/App.tsx`
  - Menambahkan route buyer untuk halaman aset dan pembayaran.

- `frontend/src/index.css`
  - Menambahkan gaya `field-error` untuk validasi form.

### Backend

- `backend/src/controllers/lelang.controller.js`
  - Menambahkan endpoint data aset milik pembeli.
  - Menambahkan endpoint daftar pembayaran pembeli.
  - Menyusun ringkasan data invoice, transaksi, dan progres aset untuk buyer.

- `backend/src/routes/lelang.routes.js`
  - Menambahkan route buyer:
    - `GET /api/lelang/pemenang/aset-saya`
    - `GET /api/lelang/pemenang/pembayaran`

- `frontend/src/services/api.js`
  - Menambahkan service:
    - `getBuyerOwnedAssets`
    - `getBuyerPendingPayments`
    - `getLelangSayaMenang`

## Dampak Fungsional

- User sekarang mendapat feedback sukses yang jelas setelah registrasi.
- Error input registrasi menjadi lebih mudah dipahami tanpa menunggu submit gagal dari backend.
- Admin memiliki panduan yang lebih jelas saat mengisi nilai aset.
- Seluruh area utama yang menampilkan daftar aset kini punya filter status terjual dan belum terjual.
- Pembeli bisa melihat aset yang dimenangkannya secara terstruktur.
- Pembeli bisa membayar aset lelang melalui menu khusus tanpa harus mencari dari room lelang.

## Verifikasi

Verifikasi yang dijalankan:

- `cd frontend && npm run build`
- `cd backend && npm test`
- `cd backend && node -e "import('./src/routes/lelang.routes.js')..."`

Hasil:

- Build frontend berhasil.
- Test backend berhasil.
- Import route backend berhasil.

Catatan:

- Build frontend masih menampilkan warning ukuran bundle besar dari Vite, tetapi proses build tetap sukses.
