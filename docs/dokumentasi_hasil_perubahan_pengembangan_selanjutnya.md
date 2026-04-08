# Dokumentasi Hasil Perubahan Pengembangan Selanjutnya
*Tanggal: 8 April 2026*

Dokumen ini merangkum implementasi yang telah dilakukan berdasarkan `implementasi_plan_pengembangan_selanjutnya.md`.

Fokus perubahan mencakup:
- refinement verifikasi penjual
- alur revisi dokumen penjual
- pengayaan dashboard KPI
- hardening lifecycle lelang

---

## 1. Ringkasan Hasil Implementasi

Perubahan yang berhasil diimplementasikan:

1. **Verifikasi penjual dipindahkan dari boolean sederhana ke status terstruktur**
   Sebelumnya seller masih bergantung pada `isVerified`. Sekarang sistem sudah disiapkan untuk memakai `verificationStatus`, `verificationNote`, `verifiedAt`, dan `verifiedBy`.

2. **Admin dapat approve/reject seller dengan catatan**
   Halaman detail seller sekarang mendukung aksi approval dan rejection berbasis `action`, bukan lagi boolean.

3. **Seller yang ditolak dapat mengunggah ulang dokumen**
   Seller kini memiliki alur revisi dokumen dari halaman waiting page.

4. **Dashboard diperkaya sesuai role**
   Admin, seller, dan pembeli sekarang memiliki KPI yang lebih relevan terhadap pekerjaan masing-masing.

5. **Lifecycle lelang dibuat lebih stabil**
   Backend sekarang memiliki sinkronisasi lifecycle lelang secara periodik agar perubahan status tidak hanya bergantung pada request user.

---

## 2. Detail Perubahan per Area

## A. Perubahan Database / Prisma

File utama:
- [backend/prisma/schema.prisma](c:\Users\McCrazy\Documents\kampus\TA\code\backend\prisma\schema.prisma)

Perubahan yang dilakukan:
- Menambahkan enum `SellerVerificationStatus`
- Menambahkan field baru pada model `Penjual`:
  - `verificationStatus`
  - `verificationNote`
  - `verifiedAt`
  - `verifiedBy`
- Menambahkan relasi verifier seller ke model `User`

Catatan:
- Field lama `isVerified` masih dipertahankan sementara untuk kompatibilitas transisi.
- Runtime aplikasi sudah mulai membaca status baru melalui helper utilitas.

---

## B. Refactor Verifikasi Penjual

File utama:
- [backend/src/controllers/auth.controller.js](c:\Users\McCrazy\Documents\kampus\TA\code\backend\src\controllers\auth.controller.js)
- [backend/src/controllers/penjual.controller.js](c:\Users\McCrazy\Documents\kampus\TA\code\backend\src\controllers\penjual.controller.js)
- [backend/src/routes/penjual.routes.js](c:\Users\McCrazy\Documents\kampus\TA\code\backend\src\routes\penjual.routes.js)
- [backend/src/utils/seller-verification.util.js](c:\Users\McCrazy\Documents\kampus\TA\code\backend\src\utils\seller-verification.util.js)

Perubahan yang dilakukan:
- Menambahkan helper backend untuk:
  - menentukan status seller aktif
  - fallback dari data lama
  - menjaga kompatibilitas `isVerified`
- Payload auth/profile seller sekarang memuat:
  - `sellerVerificationStatus`
  - `sellerVerificationNote`
  - `sellerVerifiedAt`
  - data rekening seller
- Proses registrasi seller sekarang menginisialisasi status seller ke `PENDING`
- Endpoint verifikasi seller diubah agar menerima:
  - `action: approve`
  - `action: reject`
  - `note`

Aturan bisnis baru:
- `approve` akan mengaktifkan seller
- `reject` wajib memiliki catatan
- notifikasi seller approval/rejection dikirim otomatis

---

## C. Revisi Dokumen Seller

File utama:
- [backend/src/controllers/penjual.controller.js](c:\Users\McCrazy\Documents\kampus\TA\code\backend\src\controllers\penjual.controller.js)
- [backend/src/routes/penjual.routes.js](c:\Users\McCrazy\Documents\kampus\TA\code\backend\src\routes\penjual.routes.js)
- [frontend/src/services/api.js](c:\Users\McCrazy\Documents\kampus\TA\code\frontend\src\services\api.js)
- [frontend/src/pages/SellerWaitingPage.jsx](c:\Users\McCrazy\Documents\kampus\TA\code\frontend\src\pages\SellerWaitingPage.jsx)

Perubahan yang dilakukan:
- Menambahkan endpoint `PUT /api/penjual/me/documents`
- Endpoint menerima:
  - upload ulang `ktp_file`
  - upload ulang `npwp_file`
  - update `rekeningBank`
  - update `nomorRekening`
- Setelah seller mengirim ulang dokumen:
  - status seller kembali ke `PENDING`
  - seller menunggu review admin ulang
  - admin mendapat notifikasi bahwa seller memperbarui dokumen

Perubahan UI:
- `SellerWaitingPage` sekarang membedakan kondisi:
  - `PENDING`
  - `REJECTED`
- Jika seller ditolak:
  - catatan admin ditampilkan
  - form upload ulang dokumen muncul

---

## D. Guard Akses Seller

File utama:
- [frontend/src/App.tsx](c:\Users\McCrazy\Documents\kampus\TA\code\frontend\src\App.tsx)
- [backend/src/controllers/aset.controller.js](c:\Users\McCrazy\Documents\kampus\TA\code\backend\src\controllers\aset.controller.js)
- [frontend/src/utils/sellerVerification.js](c:\Users\McCrazy\Documents\kampus\TA\code\frontend\src\utils\sellerVerification.js)

Perubahan yang dilakukan:
- Guard routing seller di frontend sekarang tidak lagi membaca `user.isVerified` secara langsung
- Guard sudah memakai resolver status seller
- Backend juga mengunci:
  - input aset seller
  - pengajuan lelang seller
  jika seller belum `APPROVED`

Tujuan perubahan:
- menyatukan sumber kebenaran verifikasi seller
- mencegah seller yang masih pending/rejected mengakses fitur seller aktif

---

## E. Dashboard KPI dan Personalisasi

File utama:
- [backend/src/controllers/dashboard.controller.js](c:\Users\McCrazy\Documents\kampus\TA\code\backend\src\controllers\dashboard.controller.js)
- [frontend/src/pages/DashboardPage.jsx](c:\Users\McCrazy\Documents\kampus\TA\code\frontend\src\pages\DashboardPage.jsx)

Perubahan untuk Admin:
- menambahkan KPI:
  - seller pending
  - buyer KYC pending
  - aset pending
  - lelang aktif
  - pembayaran pending
  - pendapatan

Perubahan untuk Seller:
- menambahkan KPI:
  - total aset
  - pending review
  - aktif lelang
  - aset terjual
  - hasil penjualan
- status seller pada panel profil sekarang membaca status enum

Perubahan untuk Pembeli:
- menambahkan KPI:
  - lelang diikuti
  - lelang dimenangkan
  - pembayaran pending
  - barang belum konfirmasi
  - lelang segera dimulai
- menambahkan highlight lelang yang sedang/akan diikuti pembeli

---

## F. Admin Seller Detail

File utama:
- [frontend/src/pages/AdminSellerDetailPage.jsx](c:\Users\McCrazy\Documents\kampus\TA\code\frontend\src\pages\AdminSellerDetailPage.jsx)

Perubahan yang dilakukan:
- status seller sekarang ditampilkan sebagai badge berbasis enum
- admin dapat menulis catatan verifikasi
- admin dapat:
  - menyetujui seller
  - menolak seller dan meminta revisi
- catatan verifikasi terakhir ditampilkan di halaman

---

## G. Halaman Penjual dan Manajemen User

File utama:
- [frontend/src/pages/PenjualPage.jsx](c:\Users\McCrazy\Documents\kampus\TA\code\frontend\src\pages\PenjualPage.jsx)
- [frontend/src/pages/UserManagementPage.jsx](c:\Users\McCrazy\Documents\kampus\TA\code\frontend\src\pages\UserManagementPage.jsx)
- [backend/src/controllers/user.controller.js](c:\Users\McCrazy\Documents\kampus\TA\code\backend\src\controllers\user.controller.js)

Perubahan yang dilakukan:
- daftar seller sekarang memakai filter:
  - `PENDING`
  - `APPROVED`
  - `REJECTED`
- badge seller pada tabel dan detail user admin disesuaikan ke status baru
- admin dapat mengatur status seller dari halaman manajemen user
- respons backend user admin sekarang menyertakan data seller verification yang lebih lengkap

---

## H. Hardening Lifecycle Lelang

File utama:
- [backend/src/controllers/lelang.controller.js](c:\Users\McCrazy\Documents\kampus\TA\code\backend\src\controllers\lelang.controller.js)
- [backend/app.js](c:\Users\McCrazy\Documents\kampus\TA\code\backend\app.js)

Perubahan yang dilakukan:
- Menambahkan `syncAuctionLifecycleBatch()`
- Menambahkan proteksi sinkronisasi paralel dengan flag internal
- Mengubah sebagian transisi lifecycle menjadi lebih aman menggunakan `updateMany`
- Menambahkan scheduler periodik setiap 15 detik pada startup server
- Menjalankan sinkronisasi awal saat server menyala

Tujuan perubahan:
- lelang dapat aktif/selesai otomatis tanpa menunggu user membuka halaman tertentu
- mengurangi ketergantungan status lelang pada traffic user
- menurunkan risiko notifikasi ganda saat transisi terjadi bersamaan

---

## 3. File Baru yang Ditambahkan

Berikut file baru utama yang ditambahkan:
- [backend/src/utils/seller-verification.util.js](c:\Users\McCrazy\Documents\kampus\TA\code\backend\src\utils\seller-verification.util.js)
- [frontend/src/utils/sellerVerification.js](c:\Users\McCrazy\Documents\kampus\TA\code\frontend\src\utils\sellerVerification.js)
- [docs/dokumentasi_hasil_perubahan_pengembangan_selanjutnya.md](c:\Users\McCrazy\Documents\kampus\TA\code\docs\dokumentasi_hasil_perubahan_pengembangan_selanjutnya.md)

---

## 4. Hasil Verifikasi Implementasi

Verifikasi yang berhasil dijalankan:

### Backend
- Import modul controller utama berhasil
- Test algoritma backend berhasil lewat

Command yang berhasil:
```bash
cd backend
npm test
```

### Frontend
- Build production frontend berhasil

Command yang berhasil:
```bash
cd frontend
npm run build
```

---

## 5. Kendala yang Ditemukan

### Prisma Generate gagal karena file lock

Command:
```bash
cd backend
npm run generate
```

Hasil:
- gagal dengan error `EPERM`
- file engine Prisma terkunci pada:
  `node_modules/.prisma/client/query_engine-windows.dll.node`

Kemungkinan penyebab:
- masih ada proses backend/dev server/nodemon/node yang sedang menggunakan Prisma client

Dampak:
- skema baru sudah diperbarui di file Prisma
- tetapi Prisma Client belum tergenerate ulang pada sesi ini
- migrasi / sinkronisasi database belum dijalankan

---

## 6. Tindak Lanjut yang Masih Perlu Dilakukan

Langkah berikutnya yang disarankan:

1. Hentikan proses backend/node yang sedang mengunci engine Prisma
2. Jalankan:
```bash
cd backend
npm run generate
npm run db:push
```

Atau jika memakai migrasi:
```bash
cd backend
npm run migrate -- --name seller_verification_refactor
```

3. Uji ulang alur end-to-end:
- login seller
- reject seller dengan catatan
- seller upload ulang dokumen
- seller kembali ke status pending
- approve seller
- seller bisa input aset dan ajukan lelang
- lifecycle lelang otomatis berubah tanpa traffic user

---

## 7. Kesimpulan

Implementasi pengembangan lanjutan sudah berhasil diterapkan pada level kode aplikasi, terutama untuk:
- status verifikasi seller
- revisi dokumen seller
- dashboard KPI
- scheduler lifecycle lelang

Bagian yang belum selesai hanya tahap regenerasi Prisma client dan sinkronisasi database karena terhalang file lock pada engine Prisma. Setelah blocker itu dibersihkan, sistem sudah siap dilanjutkan ke pengujian end-to-end dan finalisasi migrasi database.
