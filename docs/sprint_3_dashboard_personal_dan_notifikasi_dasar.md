# Sprint 3: Dashboard Personal dan Notifikasi Dasar

## Ringkasan

Sprint 3 menambahkan dua fondasi utama untuk pengalaman pengguna harian:

1. Dashboard yang dipersonalisasi berdasarkan role `ADMIN`, `PENJUAL`, dan `PEMBELI`.
2. Sistem notifikasi in-app dasar untuk status penting sistem.

Implementasi dilakukan di backend dan frontend sekaligus agar data ringkasan dan notifikasi dapat langsung dikonsumsi oleh UI.

## Implementasi Backend

### 1. Model notifikasi baru

File: `backend/prisma/schema.prisma`

Perubahan:
- Menambahkan model `Notifikasi`
- Field utama:
  - `userId`
  - `judul`
  - `pesan`
  - `tipe`
  - `isRead`
  - `referenceType`
  - `referenceId`

Tujuan:
- Menyediakan entitas notifikasi yang bisa dipakai lintas modul.
- Menyimpan status baca agar notifikasi dapat ditandai selesai dibaca.

### 2. Utility notifikasi

File: `backend/src/utils/notification.util.js`

Fungsi baru:
- `createNotification`
- `createNotifications`

Tujuan:
- Menyatukan pola pembuatan notifikasi agar trigger di controller tetap ringkas.

### 3. Endpoint notifikasi

File: `backend/src/controllers/notifikasi.controller.js`  
File: `backend/src/routes/notifikasi.routes.js`

Endpoint:
- `GET /api/notifikasi`
- `PUT /api/notifikasi/:id/read`
- `PUT /api/notifikasi/read-all`

Perilaku:
- Mengambil maksimal 30 notifikasi terbaru milik user login
- Mengembalikan `unreadCount`
- Mendukung baca satu notifikasi
- Mendukung baca semua notifikasi

### 4. Dashboard summary per role

File: `backend/src/controllers/dashboard.controller.js`  
File: `backend/src/routes/dashboard.routes.js`

Endpoint:
- `GET /api/dashboard/summary`

Ringkasan per role:

#### Admin
- total seller pending verifikasi
- total lelang aktif/pending
- total pembayaran pending verifikasi
- total lelang selesai
- total pendapatan dari lelang selesai
- daftar seller pending terbaru
- daftar lelang selesai terbaru

#### Penjual
- total aset
- aset pending verifikasi lelang
- aset aktif lelang
- aset terjual
- daftar aset terbaru
- informasi rekening seller

#### Pembeli
- jumlah lelang yang diikuti
- jumlah lelang dimenangkan
- jumlah pembayaran pending
- jumlah barang yang belum dikonfirmasi diterima
- daftar kemenangan terbaru
- info status KYC pembeli

### 5. Trigger notifikasi awal

Perubahan trigger notifikasi ditambahkan pada:

#### Verifikasi seller
File: `backend/src/controllers/penjual.controller.js`

Trigger:
- seller approved
- seller rejected

#### Penjadwalan lelang admin
File: `backend/src/controllers/aset.controller.js`

Trigger:
- seller mendapat notifikasi saat aset dijadwalkan masuk lelang

#### Penyelesaian lelang
File: `backend/src/controllers/lelang.controller.js`

Trigger:
- pemenang mendapat notifikasi menang lelang
- seller mendapat notifikasi asetnya memiliki pemenang

#### Verifikasi pembayaran
File: `backend/src/controllers/lelang.controller.js`

Trigger:
- pembeli mendapat notifikasi saat pembayaran diverifikasi
- pembeli mendapat notifikasi saat bukti pembayaran ditolak

## Implementasi Frontend

### 1. Bell notifikasi di sidebar

File: `frontend/src/components/NotificationBell.jsx`  
File: `frontend/src/components/Sidebar.jsx`

Perubahan:
- Menambahkan ikon lonceng pada sidebar
- Menampilkan badge jumlah notifikasi belum dibaca
- Menampilkan panel dropdown notifikasi
- Mendukung:
  - baca satu notifikasi
  - baca semua notifikasi

### 2. Dashboard personal per role

File: `frontend/src/pages/DashboardPage.jsx`

Perubahan:
- Dashboard lama diganti dengan dashboard dinamis berdasarkan role user
- Admin, Penjual, dan Pembeli sekarang melihat KPI yang berbeda
- Dashboard juga menampilkan highlight ringkas yang relevan untuk role masing-masing

### 3. Sinkronisasi profil user

File: `frontend/src/context/AuthContext.jsx`

Perubahan:
- Menambahkan `refreshProfile`
- Menyimpan `userSummary` hasil backend
- Membuat data status user selalu lebih mutakhir, termasuk:
  - `isVerified` seller
  - `buyerVerificationStatus`
  - `buyerVerificationNote`

### 4. Service API baru

File: `frontend/src/services/api.js`

Method baru:
- `getDashboardSummary`
- `getNotifikasi`
- `markNotifikasiRead`
- `markAllNotifikasiRead`

## Validasi Sprint 3

Pengujian yang dijalankan:
- `cd backend && node -e "import('./src/routes/notifikasi.routes.js')..."`
- `cd backend && node -e "import('./src/controllers/dashboard.controller.js')..."`
- `cd frontend && npm run build`

Hasil:
- seluruh route/controller baru dapat diimport
- frontend berhasil build

## Dampak Sprint 3

Dengan sprint ini:
- user tidak perlu membuka banyak halaman hanya untuk mengetahui status penting
- tiap role langsung melihat KPI yang relevan saat login
- notifikasi status sistem sudah tersedia sebagai dasar untuk pengembangan notifikasi realtime berikutnya
