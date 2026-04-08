# Sprint 4: Hardening Lelang dan KYC Pembeli

## Ringkasan

Sprint 4 berfokus pada dua area:

1. Hardening operasional modul lelang, terutama jadwal dan koneksi room bidding.
2. Menambahkan KYC pembeli agar bidding hanya dapat dilakukan akun pembeli yang sudah diverifikasi.

## Implementasi Backend

### 1. KYC pembeli di model `User`

File: `backend/prisma/schema.prisma`

Perubahan:
- Menambahkan enum `BuyerVerificationStatus`
  - `UNVERIFIED`
  - `PENDING`
  - `APPROVED`
  - `REJECTED`
- Menambahkan field baru pada `users`:
  - `buyer_verification_status`
  - `buyer_verification_note`
  - `buyer_verified_at`
  - `buyer_verified_by`

Tujuan:
- Menyimpan status KYC pembeli secara formal.
- Menyimpan catatan review admin dan jejak verifikator.

### 2. Register dan profile pembeli diperluas

File: `backend/src/controllers/auth.controller.js`

Perubahan:
- Saat pembeli register dengan KTP, status awal di-set ke `PENDING`
- Payload login dan profile sekarang memuat:
  - `buyerVerificationStatus`
  - `buyerVerificationNote`
  - `buyerVerifiedAt`

Tujuan:
- Frontend bisa tahu apakah pembeli boleh bidding atau belum.

### 3. Panel review pembeli untuk admin

File: `backend/src/controllers/pembeli.controller.js`  
File: `backend/src/routes/pembeli.routes.js`

Endpoint baru:
- `GET /api/pembeli`
- `GET /api/pembeli/:id`
- `PUT /api/pembeli/:id/verifikasi`

Perilaku:
- admin dapat melihat daftar pembeli
- admin dapat review status KYC
- admin dapat approve/reject KYC pembeli
- reject wajib menyertakan catatan
- pembeli menerima notifikasi hasil review

### 4. Bidding dikunci untuk pembeli yang belum KYC

File: `backend/app.js`

Perubahan pada socket `submit_bid`:
- hanya role `PEMBELI` yang boleh bid
- status KYC pembeli harus `APPROVED`
- jika tidak, server menolak bid dengan pesan yang eksplisit

Tujuan:
- pembatasan tidak hanya di UI, tetapi benar-benar ditegakkan di backend realtime.

### 5. Hardening lifecycle lelang

File: `backend/src/controllers/lelang.controller.js`

Perubahan:
- Menambahkan `syncLelangLifecycle`
- Lelang `PENDING` dapat otomatis berubah menjadi `ACTIVE` saat waktu buka tercapai
- Lelang `ACTIVE`/`PENDING` otomatis ditutup menjadi `FINISHED` saat melewati waktu tutup
- Pemenang ditetapkan saat lelang ditutup
- notifikasi winner/seller dikirim saat lelang selesai

Tujuan:
- status lelang lebih konsisten terhadap waktu aktual
- mengurangi risiko data lelang tertinggal di status yang salah

### 6. Hardening penjadwalan admin

File: `backend/src/controllers/aset.controller.js`

Perubahan:
- validasi `waktuBuka` tidak boleh di masa lalu
- validasi durasi harus positif
- perhitungan slot antrean diubah menjadi berbasis overlap jadwal aktual
- response penjadwalan mengembalikan informasi posisi antrean

Tujuan:
- admin mendapat jadwal yang lebih aman
- sistem menghindari bentrok slot antar lelang aktif/pending

## Implementasi Frontend

### 1. Halaman verifikasi pembeli

File: `frontend/src/pages/BuyerVerificationPage.jsx`

Fitur:
- daftar pembeli
- filter status KYC
- preview KTP
- input catatan admin
- tombol approve / reject KYC

Halaman ini dihubungkan ke route admin baru:
- `/pembeli-verifikasi`

### 2. Sidebar admin diperluas

File: `frontend/src/components/Sidebar.jsx`

Perubahan:
- menambahkan menu `Verifikasi Pembeli`
- tetap mempertahankan akses admin ke verifikasi seller dan manajemen lelang

### 3. Room lelang lebih tahan gangguan koneksi

File: `frontend/src/pages/LelangRoomPage.jsx`

Perubahan:
- menambahkan indikator koneksi socket:
  - connected
  - connecting
  - reconnecting
  - disconnected
  - error
- auto join ulang room setelah reconnect
- refresh data lelang setelah reconnect
- menampilkan status sinkronisasi data

Tujuan:
- user tidak kehilangan konteks saat koneksi realtime putus sementara

### 4. Bid form menghormati status KYC

File: `frontend/src/pages/LelangRoomPage.jsx`

Perubahan:
- jika pembeli belum `APPROVED`, form bid dinonaktifkan
- menampilkan alert bahwa bidding masih dikunci
- quick bid juga ikut dinonaktifkan

### 5. Jadwal lelang admin lebih informatif

File: `frontend/src/pages/LelangAdminPage.jsx`

Perubahan:
- validasi waktu buka tidak boleh masa lalu
- validasi durasi wajib valid
- menampilkan estimasi:
  - posisi antrean
  - waktu mulai aktual
  - waktu tutup aktual

Tujuan:
- admin mendapatkan feedback sebelum menerbitkan lelang
- risiko input jadwal yang tidak logis berkurang

### 6. Informasi KYC saat registrasi pembeli

File: `frontend/src/pages/auth/RegisterPage.jsx`

Perubahan:
- menambahkan keterangan bahwa akun pembeli tetap bisa login, tetapi bidding baru aktif setelah KYC disetujui admin

## Validasi Sprint 4

Pengujian yang dijalankan:
- `cd backend && npm test`
- `cd backend && node -e "import('./src/controllers/pembeli.controller.js')..."`
- `cd backend && node --input-type=module` untuk query uji field `buyerVerificationStatus` dan model `notifikasi`
- `cd backend && npx prisma db push --accept-data-loss`
- `cd backend && npx prisma generate`
- `cd frontend && npm run build`

Catatan:
- `prisma generate` sempat gagal saat backend dev server masih berjalan karena file engine Prisma di Windows terkunci.
- Setelah proses backend dihentikan, generate berhasil dan backend dinyalakan kembali.

## Dampak Sprint 4

Dengan sprint ini:
- bidding benar-benar terkunci untuk pembeli yang belum lolos KYC
- admin punya panel operasional untuk review identitas pembeli
- room lelang lebih robust terhadap reconnect
- penjadwalan lelang lebih aman dan lebih jelas sebelum diterbitkan
