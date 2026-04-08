# Sprint 5: Manajemen User Admin

## Ringkasan

Sprint ini menambahkan fitur **management user oleh admin** agar admin dapat mengontrol seluruh user aktif di sistem melalui modul CRUD yang lebih terstruktur.

Admin sekarang dapat:
- melihat daftar semua user
- memfilter user berdasarkan role
- mencari user berdasarkan nama atau email
- melihat detail lengkap user
- menambah user baru
- mengedit data user
- menghapus user dengan validasi aman

## Implementasi Backend

### 1. Endpoint admin user management

File: `backend/src/controllers/user.controller.js`  
File: `backend/src/routes/user.routes.js`  
File: `backend/app.js`

Endpoint baru:
- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`

Seluruh endpoint ini diproteksi dengan:
- `verifyToken`
- `verifyAdmin`

### 2. Fitur list user

Endpoint:
- `GET /api/users`

Mendukung:
- filter `role`
- pencarian `q` berdasarkan nama atau email

Data yang dikembalikan mencakup:
- profil dasar user
- role user
- status KYC pembeli
- data seller bila role `PENJUAL`
- count aktivitas:
  - penawaran
  - lelang dimenangkan
  - verifikasi pembayaran
  - notifikasi
  - buyer yang pernah diverifikasi

### 3. Detail user lengkap

Endpoint:
- `GET /api/users/:id`

Detail yang ditampilkan:
- data profil utama
- data seller jika ada
- status KYC pembeli
- riwayat bid singkat
- notifikasi terbaru
- summary aktivitas

### 4. Tambah user oleh admin

Endpoint:
- `POST /api/users`

Admin dapat membuat user baru dengan role:
- `ADMIN`
- `PENJUAL`
- `PEMBELI`

Field penting yang didukung:
- `nama`
- `email`
- `password`
- `role`
- `ktpUrl`
- `buyerVerificationStatus`
- `buyerVerificationNote`
- `rekeningBank`
- `nomorRekening`
- `sellerKtpUrl`
- `sellerNpwpUrl`
- `isSellerVerified`

Jika role `PENJUAL`, sistem otomatis membuat relasi data `penjual`.

### 5. Edit user oleh admin

Endpoint:
- `PUT /api/users/:id`

Admin dapat mengubah:
- nama
- email
- password
- role
- detail KYC pembeli
- detail seller

Validasi penting:
- email harus unik
- admin tidak dapat menurunkan role akunnya sendiri
- perubahan role diblokir jika user sudah punya histori bisnis yang membuat perpindahan role berisiko

### 6. Delete user oleh admin

Endpoint:
- `DELETE /api/users/:id`

Validasi keamanan:
- admin tidak dapat menghapus dirinya sendiri
- admin terakhir tidak boleh dihapus
- user tidak dapat dihapus jika:
  - seller masih punya aset
  - user punya histori bid
  - user punya histori menang lelang
  - user tercatat sebagai verifikator penting

Tujuan validasi ini:
- mencegah kerusakan integritas data sistem
- menghindari hilangnya histori transaksi penting

## Implementasi Frontend

### 1. Halaman manajemen user

File: `frontend/src/pages/UserManagementPage.jsx`

Fitur utama:
- tabel daftar user
- card statistik per role
- filter role
- pencarian nama/email
- tombol:
  - detail
  - edit
  - hapus
  - tambah user

### 2. Modal create/edit user

Masih di:
- `frontend/src/pages/UserManagementPage.jsx`

Form mendukung:
- profil dasar user
- role user
- password
- KTP URL
- detail buyer
- detail seller

Form juga menyesuaikan field berdasarkan role yang dipilih.

### 3. Modal detail user

Detail yang ditampilkan:
- profil user
- ringkasan aktivitas
- detail seller jika role `PENJUAL`
- detail buyer jika role `PEMBELI`
- riwayat bid singkat

### 4. Service API frontend

File: `frontend/src/services/api.js`

Method baru:
- `getUsersAdmin`
- `getUserAdminById`
- `createUserAdmin`
- `updateUserAdmin`
- `deleteUserAdmin`

### 5. Routing dan navigasi

File: `frontend/src/App.tsx`  
File: `frontend/src/components/Sidebar.jsx`

Perubahan:
- route admin baru:
  - `/users-admin`
- menu sidebar baru:
  - `Data User`

## Validasi Implementasi

Pengujian yang dijalankan:
- `cd backend && node -e "import('./src/routes/user.routes.js')..."`
- `cd backend && npm test`
- `cd frontend && npm run build`

Hasil:
- route/controller user berhasil diimport
- backend test existing tetap lulus
- frontend berhasil build

## Catatan Desain

Fitur ini sengaja dibuat dengan pendekatan **aman terhadap data operasional**.

Karena sistem sudah memiliki:
- histori bid
- histori pemenang lelang
- data seller
- jejak verifikasi admin

maka operasi update role dan delete user tidak dibuat bebas tanpa batas. Validasi pembatas ditambahkan agar admin tidak secara tidak sengaja merusak data transaksi dan audit sistem.

## Dampak Sprint

Dengan sprint ini, admin memiliki pusat kontrol user yang jauh lebih lengkap dan operasional, tanpa harus mengelola user secara manual langsung dari database.
