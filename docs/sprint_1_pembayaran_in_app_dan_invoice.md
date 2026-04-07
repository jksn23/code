# Sprint 1: Pembayaran In-App dan Invoice
*Tanggal implementasi: 7 April 2026*

Dokumen ini mencatat implementasi kode Sprint 1 berdasarkan planning pada `docs/planning_pengembangan_selanjutnya.md`.

## Tujuan Sprint

Menyelesaikan alur pasca-lelang agar:
- pemenang lelang dapat melihat dan mengunduh invoice dari sistem
- pemenang dapat upload bukti pembayaran langsung di sistem
- admin dapat meninjau bukti pembayaran dari sistem
- admin dapat memverifikasi atau menolak pembayaran dengan catatan
- status pembayaran tampil konsisten pada room lelang, dashboard pembeli, halaman admin, ringkasan, dan laporan

## Implementasi yang Dibuat

## 1. Backend pembayaran dan invoice

### Endpoint baru/aktif yang dipakai
- `GET /api/lelang/:id/invoice`
- `POST /api/lelang/:id/upload-bukti`
- `PUT /api/lelang/:id/pembayaran/verifikasi`
- `PUT /api/lelang/:id/pembayaran/tolak`
- `GET /api/lelang/pemenang/saya`

### Logic yang ditambahkan
- invoice number dibuat otomatis saat lelang selesai dan memiliki pemenang
- invoice menyimpan metadata:
  - nomor invoice
  - tanggal generate
  - jatuh tempo pembayaran
- upload bukti pembayaran hanya boleh dilakukan oleh pemenang lelang
- verifikasi dan penolakan pembayaran hanya boleh dilakukan admin
- status pembayaran sekarang memakai state operasional:
  - `UNPAID`
  - `PENDING_VERIFICATION`
  - `LUNAS`
  - `DITOLAK`

### File backend yang terlibat
- `backend/src/controllers/lelang.controller.js`
- `backend/src/controllers/laporan.controller.js`
- `backend/src/routes/lelang.routes.js`
- `backend/src/middleware/upload.middleware.js`
- `backend/prisma/schema.prisma`

## 2. Frontend buyer flow

### Room lelang pemenang
Pada `frontend/src/pages/LelangRoomPage.jsx` sudah ditambahkan:
- panel invoice di area pemenang
- tombol `Unduh Invoice`
- upload bukti pembayaran in-app
- tampilan status pembayaran baru
- tampilan catatan penolakan jika bukti ditolak admin
- tombol lihat bukti yang sudah diupload

### Dashboard pembeli
Pada `frontend/src/pages/DashboardPage.jsx` sudah ditambahkan:
- ringkasan jumlah lelang yang dimenangkan
- jumlah pembayaran yang masih perlu tindakan
- jumlah pembayaran menunggu verifikasi
- jumlah pembayaran yang sudah lunas
- tabel riwayat pembayaran lelang pembeli dengan tombol masuk ke room lelang

## 3. Frontend admin flow

Pada `frontend/src/pages/LelangAdminPage.jsx` sudah diubah:
- flow WhatsApp tidak lagi menjadi jalur utama verifikasi
- admin dapat membuka review pembayaran
- admin dapat melihat detail invoice
- admin dapat membuka bukti pembayaran
- admin dapat memberi catatan
- admin dapat menekan `Verifikasi Lunas`
- admin dapat menekan `Tolak Bukti`

## 4. Invoice PDF

Ditambahkan util baru:
- `frontend/src/utils/invoice.js`

Fungsi yang dibuat:
- generate PDF invoice dari data backend
- menampilkan:
  - nomor invoice
  - tanggal terbit
  - jatuh tempo
  - data aset
  - data pemenang
  - rekening tujuan transfer
  - total tagihan
  - status pembayaran

## 5. Tampilan status pembayaran lintas halaman

Status pembayaran baru sudah diintegrasikan pada:
- `frontend/src/pages/LelangRoomPage.jsx`
- `frontend/src/pages/LelangAdminPage.jsx`
- `frontend/src/pages/DashboardPage.jsx`
- `frontend/src/pages/AuctionSummaryPage.jsx`
- `frontend/src/pages/LaporanPage.jsx`

## 6. Laporan

Pada `frontend/src/pages/LaporanPage.jsx` dan `backend/src/controllers/laporan.controller.js` sudah diperluas:
- laporan lelang sekarang membawa nomor invoice
- laporan lelang sekarang membawa status pembayaran
- export PDF dan Excel ikut menampilkan informasi invoice dan status bayar

## Verifikasi yang Sudah Dilakukan

### 1. Generate Prisma Client
Perintah:
```bash
cd backend
npx prisma generate
```

Hasil:
- berhasil

### 2. Build frontend
Perintah:
```bash
cd frontend
npm run build
```

Hasil:
- berhasil build production
- ada warning ukuran bundle besar, tetapi build tetap sukses

### 3. Test backend algoritma
Perintah:
```bash
cd backend
npm test
```

Hasil:
- seluruh test algoritma AHP dan SAW lulus

### 4. Sanity check import controller lelang
Dilakukan import file controller lelang secara langsung untuk memastikan modul backend hasil refactor tetap valid.

Hasil:
- berhasil

## Catatan Penting

### 1. Sinkronisasi database
Karena Sprint 1 menambah field pembayaran dan invoice pada skema Prisma, database perlu disinkronkan.

Jalankan salah satu:
```bash
cd backend
npx prisma db push
```

atau jika ingin membuat migration:
```bash
cd backend
npx prisma migrate dev --name sprint_1_pembayaran_invoice
```

### 2. Upload bukti pembayaran
File bukti pembayaran disimpan melalui field:
- `bukti_bayar`

dan diarahkan ke folder upload pembayaran melalui middleware upload.

## Hasil Sprint 1

Sprint 1 berhasil mengubah alur pembayaran dari:
- konfirmasi manual via WhatsApp

menjadi:
- invoice sistem
- upload bukti transfer di aplikasi
- review dan keputusan admin di aplikasi
- status pembayaran yang terdokumentasi

## Saran Lanjutan

Setelah Sprint 1 ini, prioritas paling logis adalah:
1. Sprint 2: reject verifikasi penjual + re-upload dokumen
2. penyempurnaan notifikasi agar perubahan status pembayaran muncul otomatis ke user
