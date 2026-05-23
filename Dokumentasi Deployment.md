# Dokumentasi Deployment

Panduan ini menjelaskan deployment aplikasi lelang/SPK dari repository GitHub ke stack berikut:

- Frontend: Vercel
- Backend API + WebSocket: Railway
- Database: Railway MySQL
- Repository GitHub saat ini: `https://github.com/jksn23/code.git`

Project ini terdiri dari dua aplikasi terpisah:

- `frontend`: React + Vite
- `backend`: Node.js + Express + Socket.IO + Prisma + MySQL

Karena frontend dan backend berada dalam satu repository, konfigurasi deployment harus memakai root directory yang berbeda:

- Vercel root directory: `frontend`
- Railway backend root directory: `backend`

## 1. Persiapan Repository GitHub

Pastikan semua file yang dibutuhkan sudah masuk GitHub.

```bash
git status
git add .
git commit -m "prepare deployment documentation"
git push origin main
```

Jika branch utama bukan `main`, sesuaikan dengan branch yang dipakai, misalnya `master`.

File yang tidak boleh di-commit:

- `backend/.env`
- `backend/node_modules`
- `frontend/node_modules`
- `frontend/dist`
- `backend/uploads`, jika berisi file produksi atau dokumen sensitif

File yang harus tetap di-commit:

- `backend/package.json`
- `backend/package-lock.json`
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations`, jika sudah dibuat
- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/vite.config.ts`
- seluruh kode `backend/src` dan `frontend/src`

## 2. Masalah Yang Wajib Diperbaiki Sebelum Deployment

Saat ini beberapa URL masih hardcoded ke localhost. Ini akan membuat aplikasi gagal ketika sudah online.

### 2.1 Frontend API Base URL

File:

```text
frontend/src/services/api.js
```

Saat ini:

```js
baseURL: 'http://localhost:5000/api'
```

Ubah menjadi:

```js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});
```

Nanti di Vercel isi environment variable:

```text
VITE_API_URL=https://nama-backend.up.railway.app/api
```

### 2.2 Frontend Asset Base URL

Beberapa file frontend masih memakai:

```text
http://localhost:5000
```

Contoh file yang perlu dicek:

- `frontend/src/pages/AsetPage.jsx`
- `frontend/src/pages/AdminSellerDetailPage.jsx`
- `frontend/src/pages/BuyerAssetsPage.jsx`
- `frontend/src/pages/BuyerVerificationPage.jsx`
- `frontend/src/pages/BuyerPaymentsPage.jsx`
- `frontend/src/pages/LelangAdminPage.jsx`
- `frontend/src/pages/LelangPublikPage.jsx`
- `frontend/src/pages/LelangRoomPage.jsx`

Buat helper sederhana, misalnya:

```js
const ASSET_BASE_URL = import.meta.env.VITE_ASSET_BASE_URL || 'http://localhost:5000';
```

Lalu ganti pola:

```js
`http://localhost:5000/${item.dokumenUrl}`
```

menjadi:

```js
`${ASSET_BASE_URL}/${item.dokumenUrl}`
```

Nanti di Vercel isi:

```text
VITE_ASSET_BASE_URL=https://nama-backend.up.railway.app
```

### 2.3 Frontend Socket.IO URL

File:

```text
frontend/src/pages/LelangRoomPage.jsx
```

Saat ini:

```js
const socket = io('http://localhost:5000', {
```

Ubah menjadi:

```js
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const socket = io(SOCKET_URL, {
```

Nanti di Vercel isi:

```text
VITE_SOCKET_URL=https://nama-backend.up.railway.app
```

### 2.4 Backend CORS dan Socket.IO Origin

File:

```text
backend/app.js
```

Saat ini CORS hanya mengizinkan:

```js
origin: ['http://localhost:5173', 'http://localhost:5174']
```

Ubah menjadi berbasis environment variable:

```js
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

Untuk Socket.IO:

```js
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});
```

Nanti di Railway isi:

```text
FRONTEND_URL=https://nama-frontend.vercel.app
```

## 3. Deployment Backend ke Railway

### 3.1 Buat Project Railway

1. Buka Railway.
2. Login menggunakan GitHub.
3. Pilih `New Project`.
4. Pilih `Deploy from GitHub repo`.
5. Pilih repository `jksn23/code`.
6. Jika diminta root directory, pilih:

```text
backend
```

Jika Railway tidak otomatis mendeteksi root directory, buka service backend lalu atur di bagian service settings.

### 3.2 Tambahkan MySQL di Railway

1. Di project Railway yang sama, klik `New`.
2. Pilih `Database`.
3. Pilih `MySQL`.
4. Tunggu sampai database selesai dibuat.
5. Buka service backend.
6. Masuk ke tab `Variables`.
7. Tambahkan `DATABASE_URL` dari MySQL Railway.

Railway biasanya menyediakan variable koneksi database yang bisa direferensikan langsung dari service lain. Gunakan connection URL MySQL yang formatnya seperti:

```text
mysql://USER:PASSWORD@HOST:PORT/DATABASE
```

### 3.3 Environment Variables Backend

Tambahkan variables berikut di service backend Railway:

```text
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DATABASE
NODE_ENV=production
JWT_SECRET=isi_dengan_secret_yang_panjang_dan_acak
FRONTEND_URL=https://nama-frontend.vercel.app
```

`PORT` biasanya otomatis disediakan oleh Railway. Karena backend memakai:

```js
const PORT = process.env.PORT || 5000;
```

aplikasi sudah siap membaca port dari Railway.

### 3.4 Build Command Backend

Gunakan:

```bash
npm install && npx prisma generate
```

### 3.5 Start Command Backend

Gunakan:

```bash
npm start
```

Script ini sudah tersedia di `backend/package.json`:

```json
"start": "node app.js"
```

### 3.6 Migrasi Database Prisma

Project ini memakai Prisma, tetapi saat dokumentasi ini dibuat folder `backend/prisma/migrations` belum ada. Untuk deployment produksi yang rapi, buat migration terlebih dahulu di lokal.

Jalankan dari folder `backend`:

```bash
npm install
npx prisma migrate dev --name init
git add prisma/schema.prisma prisma/migrations
git commit -m "add initial prisma migration"
git push origin main
```

Setelah folder `migrations` ada di repository, gunakan pre-deploy command Railway:

```bash
npx prisma migrate deploy
```

Jika Railway tidak menyediakan field khusus pre-deploy, migration bisa dijalankan sementara dari terminal lokal dengan `DATABASE_URL` production. Jalur ini hanya untuk kondisi awal atau demo, bukan kebiasaan produksi.

```bash
cd backend
$env:DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
npx prisma migrate deploy
```

Opsi cepat untuk demo jika belum ingin membuat migration:

```bash
npx prisma db push
```

Catatan: untuk produksi, tetap lebih baik memakai `migrate deploy` karena migration history tercatat dan lebih aman untuk perubahan schema berikutnya.

### 3.7 Seed Data

Jika aplikasi membutuhkan data awal, cek file:

```text
backend/prisma/seed.js
backend/prisma/seedAhp.js
```

Jalankan secara manual setelah database production siap:

```bash
cd backend
$env:DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
node prisma/seed.js
node prisma/seedAhp.js
```

Jangan menjalankan seed berulang tanpa mengecek isi script, karena bisa menyebabkan data duplikat jika script tidak idempotent.

### 3.8 Health Check Backend

Backend punya endpoint:

```text
/health
```

Setelah deploy, buka:

```text
https://nama-backend.up.railway.app/health
```

Hasil yang diharapkan:

```json
{
  "status": "ok",
  "database": "connected"
}
```

Jika database error, periksa:

- `DATABASE_URL`
- MySQL service Railway sudah aktif
- Prisma migration sudah dijalankan
- backend sudah redeploy setelah variable diubah

## 4. Deployment Frontend ke Vercel

### 4.1 Buat Project Vercel

1. Buka Vercel.
2. Login menggunakan GitHub.
3. Pilih `Add New Project`.
4. Import repository `jksn23/code`.
5. Set root directory:

```text
frontend
```

### 4.2 Framework dan Build Settings

Vercel biasanya otomatis mendeteksi Vite.

Gunakan konfigurasi:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 4.3 Environment Variables Frontend

Tambahkan di Vercel Project Settings, bagian Environment Variables:

```text
VITE_API_URL=https://nama-backend.up.railway.app/api
VITE_SOCKET_URL=https://nama-backend.up.railway.app
VITE_ASSET_BASE_URL=https://nama-backend.up.railway.app
```

Pastikan semua variable tersedia untuk environment:

- Production
- Preview, jika ingin preview deploy juga bisa digunakan
- Development, jika memakai Vercel CLI

Vite hanya mengekspos environment variable ke browser jika nama variable diawali `VITE_`.

### 4.4 Deploy Frontend

Klik `Deploy`.

Setelah deploy selesai, Vercel akan memberi domain seperti:

```text
https://nama-frontend.vercel.app
```

Ambil URL tersebut, lalu masukkan ke Railway backend:

```text
FRONTEND_URL=https://nama-frontend.vercel.app
```

Setelah itu redeploy backend Railway.

## 5. Konfigurasi Upload File

Saat ini backend menyimpan upload ke:

```text
backend/uploads
```

Dan backend menyajikannya lewat:

```js
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

Ini bisa berjalan untuk demo jika Railway service memakai persistent volume. Namun untuk deployment yang lebih aman, gunakan cloud storage.

### 5.1 Opsi Demo: Railway Volume

Jika tetap memakai local upload:

1. Buat volume di Railway untuk backend.
2. Mount volume ke path yang konsisten, misalnya:

```text
/app/uploads
```

3. Ubah backend agar membaca upload directory dari env:

```js
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadDir));
```

4. Pastikan konfigurasi Multer juga memakai `UPLOAD_DIR`.

Environment Railway:

```text
UPLOAD_DIR=/app/uploads
```

### 5.2 Opsi Produksi: Cloudinary atau Object Storage

Rekomendasi produksi:

- Cloudinary untuk gambar dan dokumen yang perlu mudah diakses.
- S3-compatible storage untuk penyimpanan file yang lebih umum.

Jika memakai Cloudinary:

1. Buat akun Cloudinary.
2. Ambil `CLOUDINARY_URL`.
3. Tambahkan ke Railway:

```text
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
```

4. Ubah upload controller agar setelah menerima file dari Multer, file dikirim ke Cloudinary, lalu simpan URL Cloudinary ke database.

Dengan cara ini file tidak hilang saat backend redeploy, restart, atau pindah container.

## 6. Urutan Deployment Yang Disarankan

Ikuti urutan ini agar tidak bingung saat konfigurasi URL:

1. Push repository ke GitHub.
2. Deploy backend ke Railway dari folder `backend`.
3. Buat MySQL Railway.
4. Isi `DATABASE_URL`, `NODE_ENV`, dan `JWT_SECRET` di Railway.
5. Jalankan Prisma migration.
6. Buka `/health` dan pastikan database connected.
7. Deploy frontend ke Vercel dari folder `frontend`.
8. Isi `VITE_API_URL`, `VITE_SOCKET_URL`, dan `VITE_ASSET_BASE_URL` di Vercel.
9. Ambil URL frontend Vercel.
10. Isi `FRONTEND_URL` di Railway.
11. Redeploy backend Railway.
12. Test login, dashboard, upload, lelang realtime, dan laporan.

## 7. Checklist Testing Setelah Deploy

### Backend

- Buka `/health`.
- Cek response database `connected`.
- Cek Railway logs tidak ada error Prisma.
- Cek Railway logs tidak ada CORS error.

### Frontend

- Buka URL Vercel.
- Login sebagai admin.
- Login sebagai penjual.
- Login sebagai pembeli.
- Cek halaman dashboard.
- Cek data kategori/kriteria/aset muncul.
- Cek upload dokumen.
- Cek gambar/file upload bisa dibuka.
- Cek bidding realtime di halaman lelang.
- Cek laporan PDF/Excel.

### Realtime Lelang

Test dengan dua browser:

1. Browser pertama login sebagai pembeli A.
2. Browser kedua login sebagai pembeli B.
3. Keduanya buka room lelang yang sama.
4. Submit bid dari salah satu browser.
5. Pastikan bid baru muncul di browser lain tanpa refresh.

Jika gagal:

- Periksa `VITE_SOCKET_URL`.
- Periksa CORS Socket.IO di backend.
- Periksa Railway logs.
- Pastikan backend Railway bukan serverless function, tetapi service Node yang long-running.

## 8. Troubleshooting

### 8.1 Frontend Masih Mengarah ke Localhost

Gejala:

- Request gagal ke `http://localhost:5000`.
- Console browser menunjukkan `ERR_CONNECTION_REFUSED`.

Solusi:

- Cari semua localhost:

```bash
rg "localhost:5000" frontend
```

- Ganti dengan env:

```js
import.meta.env.VITE_API_URL
import.meta.env.VITE_SOCKET_URL
import.meta.env.VITE_ASSET_BASE_URL
```

- Redeploy Vercel setelah env diganti.

### 8.2 CORS Error

Gejala:

```text
Access to XMLHttpRequest has been blocked by CORS policy
```

Solusi:

- Pastikan Railway punya:

```text
FRONTEND_URL=https://nama-frontend.vercel.app
```

- Pastikan `backend/app.js` memakai `allowedOrigins`.
- Redeploy backend.

### 8.3 Database Tidak Connect

Gejala:

```json
{
  "status": "error",
  "database": "disconnected"
}
```

Solusi:

- Cek `DATABASE_URL`.
- Pastikan MySQL Railway aktif.
- Jalankan:

```bash
npx prisma migrate deploy
```

- Jika belum ada migration dan ini hanya demo awal:

```bash
npx prisma db push
```

### 8.4 Prisma Client Error

Gejala:

```text
Prisma Client did not initialize yet
```

Solusi:

- Pastikan build command backend memuat:

```bash
npx prisma generate
```

### 8.5 Upload File Hilang Setelah Redeploy

Penyebab:

- File disimpan di filesystem container.
- Container dapat dibuat ulang saat redeploy.

Solusi:

- Gunakan Railway Volume untuk demo.
- Gunakan Cloudinary atau object storage untuk produksi.

### 8.6 WebSocket Tidak Connect

Gejala:

- Status di UI tetap connecting atau disconnected.
- Bid realtime tidak masuk.

Solusi:

- Pastikan frontend memakai:

```text
VITE_SOCKET_URL=https://nama-backend.up.railway.app
```

- Pastikan backend Socket.IO CORS mengizinkan URL Vercel.
- Cek Railway logs saat browser membuka halaman lelang.

## 9. Catatan Keamanan

Wajib lakukan ini sebelum aplikasi digunakan publik:

- Set `JWT_SECRET` yang kuat di Railway.
- Jangan gunakan fallback secret hardcoded untuk produksi.
- Jangan commit `.env`.
- Jangan expose database credential di frontend.
- Gunakan HTTPS URL dari Railway dan Vercel.
- Batasi CORS hanya ke domain frontend resmi.
- Pindahkan upload KTP, NPWP, bukti bayar, dan dokumen sensitif ke storage yang lebih aman.

## 10. Referensi Resmi

- Railway Deployments: https://docs.railway.com/deploy/deployments
- Railway Start Command: https://docs.railway.com/guides/start-command
- Railway MySQL: https://docs.railway.com/guides/mysql
- Railway Volumes: https://docs.railway.com/develop/volumes
- Vercel Vite: https://vercel.com/docs/frameworks/vite
- Vercel Environment Variables: https://vercel.com/docs/projects/environment-variables
- Prisma Migrate: https://docs.prisma.io/docs/cli/migrate
- Cloudinary Node Upload: https://cloudinary.com/documentation/node_image_and_video_upload

