# Sprint 2: Reject Verifikasi Penjual dan Revisi Dokumen

## Ringkasan

Sprint 2 mengubah alur verifikasi penjual dari model boolean sederhana menjadi alur review yang memiliki status, catatan admin, dan siklus revisi dokumen. Admin sekarang dapat menyetujui akun penjual atau menolak sambil meminta revisi. Penjual yang diminta revisi dapat mengunggah ulang dokumen dari halaman tunggu verifikasi.

## Implementasi Backend

### 1. Perubahan skema verifikasi penjual

File: `backend/prisma/schema.prisma`

Perubahan:
- Menambahkan enum `SellerVerificationStatus` dengan nilai:
  - `PENDING`
  - `APPROVED`
  - `REJECTED`
  - `REVISION_REQUESTED`
- Menambahkan field baru pada tabel `penjual`:
  - `verification_status`
  - `verification_note`
  - `verified_at`
  - `verified_by`
  - `revision_count`
- Menambahkan relasi `verifiedSellers` pada model `User` untuk mencatat admin yang memverifikasi penjual.

Tujuan:
- Menyimpan status review secara eksplisit.
- Menyimpan alasan penolakan atau catatan revisi.
- Menyimpan jejak siapa admin yang melakukan verifikasi.

### 2. Perubahan payload autentikasi dan profil

File: `backend/src/controllers/auth.controller.js`

Perubahan:
- Menambahkan helper `buildUserPayload`.
- Saat login, data user kini memuat:
  - `verificationStatus`
  - `verificationNote`
  - `verifiedAt`
  - `revisionCount`
  - `rekeningBank`
  - `nomorRekening`
- Endpoint profile sekarang mengembalikan `userSummary` agar frontend bisa refresh status verifikasi terbaru.

Tujuan:
- Frontend dapat mengetahui status verifikasi seller tanpa perlu menebak dari boolean `isVerified`.
- Status pada halaman tunggu seller bisa berubah sesuai review admin terbaru.

### 3. Endpoint verifikasi seller yang lebih lengkap

File: `backend/src/controllers/penjual.controller.js`  
File: `backend/src/routes/penjual.routes.js`

Endpoint baru:
- `PUT /penjual/:id/approve`
- `PUT /penjual/:id/reject`
- `PUT /penjual/me/reupload-dokumen`

Perilaku:
- `approve`:
  - status menjadi `APPROVED`
  - `isVerified = true`
  - menyimpan catatan approval
  - menyimpan waktu verifikasi dan admin verifier
- `reject`:
  - status menjadi `REVISION_REQUESTED`
  - `isVerified = false`
  - catatan admin wajib diisi
  - menyimpan waktu verifikasi dan admin verifier
- `reupload-dokumen`:
  - hanya bisa dipakai seller
  - menerima upload ulang `ktp_file` dan `npwp_file`
  - dapat memperbarui bank dan nomor rekening
  - reset status menjadi `PENDING`
  - membersihkan catatan/verifikator sebelumnya
  - menambah `revision_count`

Kompatibilitas:
- Endpoint lama `PUT /penjual/:id/verify` tetap dipertahankan sebagai wrapper agar integrasi lama tidak langsung rusak.

### 4. Proteksi seller yang belum disetujui

File: `backend/src/controllers/aset.controller.js`

Perubahan:
- Seller hanya boleh membuat aset dan mengajukan lelang jika `verificationStatus === 'APPROVED'`.

Tujuan:
- Seller yang masih pending atau sedang revisi tidak bisa masuk ke proses bisnis inti sebelum lolos review admin.

## Implementasi Frontend

### 1. API service baru

File: `frontend/src/services/api.js`

Method baru:
- `approvePenjual`
- `rejectPenjual`
- `reuploadDokumenPenjual`

### 2. Status verifikasi seller selalu sinkron

File: `frontend/src/context/AuthContext.jsx`

Perubahan:
- Menambahkan `refreshProfile`.
- Saat token tersedia, frontend mengambil ulang profil dari backend.
- Data `userData` disimpan ulang ke `localStorage` agar status seller selalu konsisten setelah review admin atau reupload dokumen.

### 3. Guard seller berbasis status

File: `frontend/src/App.tsx`

Perubahan:
- Seller diarahkan ke halaman tunggu jika `verificationStatus !== 'APPROVED'`.

### 4. Admin dapat approve atau minta revisi

File: `frontend/src/pages/PenjualPage.jsx`  
File: `frontend/src/pages/AdminSellerDetailPage.jsx`

Perubahan:
- Daftar seller admin kini menampilkan status verifikasi berbasis enum.
- Admin dapat memfilter seller:
  - semua
  - pending
  - perlu revisi
  - approved
- Detail seller menampilkan:
  - status verifikasi
  - catatan admin
  - jumlah revisi
  - admin verifier
  - waktu review
- Admin memiliki 2 aksi utama:
  - setujui akun
  - tolak dan minta revisi

### 5. Seller dapat unggah ulang dokumen

File: `frontend/src/pages/SellerWaitingPage.jsx`

Perubahan:
- Halaman tunggu sekarang menampilkan beberapa status:
  - menunggu verifikasi
  - perlu revisi
  - ditolak
- Jika status `REVISION_REQUESTED` atau `REJECTED`, seller dapat:
  - melihat catatan admin
  - melihat jumlah revisi
  - mengisi ulang data rekening
  - upload ulang KTP
  - upload ulang NPWP
  - mengirim ulang dokumen
- Tersedia tombol `Refresh Status` untuk sinkronisasi data terbaru dari backend.

## Validasi Implementasi

Pengujian yang dijalankan:
- `cd backend && npm test` -> berhasil
- `cd backend && node -e "import('./src/routes/penjual.routes.js')..."` -> berhasil
- `cd frontend && npm run build` -> berhasil
- `cd backend && npx prisma db push --accept-data-loss` -> berhasil

Catatan:
- `npx prisma generate` sempat terkena error `EPERM` pada file engine Prisma di Windows karena file sedang terkunci proses lain. Sinkronisasi skema database tetap berhasil melalui `db push`, tetapi bila perlu generate ulang sebaiknya pastikan proses backend/node yang memakai Prisma sudah ditutup lebih dulu.

## Dampak Sprint 2

Dengan sprint ini, sistem tidak lagi berhenti pada status seller "verified / not verified". Admin sekarang bisa memberikan umpan balik yang operasional, dan seller memiliki jalur pemulihan yang jelas melalui revisi dokumen tanpa perlu registrasi ulang.

Sprint ini juga menjadi fondasi untuk sprint berikutnya seperti:
- dashboard seller yang lebih personal
- notifikasi status verifikasi
- audit trail review admin
- SLA review dokumen
