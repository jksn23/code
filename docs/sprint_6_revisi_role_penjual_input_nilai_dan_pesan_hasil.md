# Sprint 6: Revisi Role Penjual pada Input Nilai dan Pesan Hasil

## Ringkasan

Revisi ini menyesuaikan hak akses role `PENJUAL` agar penjual tidak dapat melakukan penilaian aset melalui fitur **Input Nilai**.

Selain itu, pesan kosong pada halaman hasil juga disesuaikan agar lebih netral untuk role selain admin.

## Perubahan yang Dilakukan

### 1. Menu `Input Nilai` dihapus dari role penjual

File: `frontend/src/components/Sidebar.jsx`

Perubahan:
- menu `Input Nilai` sekarang hanya muncul untuk role `ADMIN`
- `Hasil / Ranking` tetap dapat diakses sesuai kebutuhan role yang sudah ada

Tujuan:
- penjual tidak lagi melihat fitur penilaian aset di navigasi

### 2. Route frontend `Input Nilai` dibuat admin-only

File: `frontend/src/App.tsx`

Perubahan:
- route `/input-nilai` dipindahkan dari blok:
  - `ADMIN`, `PENJUAL`
- menjadi hanya:
  - `ADMIN`

Tujuan:
- jika penjual mencoba membuka URL langsung, akses tetap ditolak di level frontend

### 3. Endpoint backend fitur nilai dikunci untuk admin

File: `backend/src/routes/nilai.routes.js`

Perubahan:
- menambahkan middleware:
  - `verifyToken`
  - `verifyAdmin`

Endpoint yang kini admin-only:
- `GET /api/nilai/aset/:aset_id`
- `POST /api/nilai`

Tujuan:
- penjual tidak lagi bisa mengakses logika input nilai lewat API langsung

### 4. Pesan hasil kosong diubah untuk non-admin

File: `frontend/src/pages/HasilPage.jsx`

Perubahan:
- jika role `ADMIN`:
  - tetap menampilkan pesan
  - `Belum ada hasil. Jalankan perhitungan SAW terlebih dahulu.`
- jika role selain `ADMIN`:
  - menampilkan pesan
  - `Data Belum Tersedia`

Tujuan:
- pengguna non-admin tidak melihat instruksi teknis internal yang tidak relevan

## Validasi

Pengujian yang dijalankan:
- `cd backend && node -e "import('./src/routes/nilai.routes.js')..."`
- `cd backend && npm test`
- `cd frontend && npm run build`

Hasil:
- route backend nilai tetap valid
- test backend tetap lulus
- frontend berhasil build

## Dampak

Dengan revisi ini:
- penjual tidak lagi memiliki akses ke fitur penilaian aset
- navigasi, route frontend, dan endpoint backend sudah konsisten
- pesan hasil kosong menjadi lebih sesuai untuk user non-admin
