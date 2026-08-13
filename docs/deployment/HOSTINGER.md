# Deployment Hostinger Business

Arsitektur produksi menggunakan dua website dalam satu paket Hostinger Business:

- `app.e-lelangdigital.my.id`: frontend React/Vite statis dari direktori `frontend`.
- `api.e-lelangdigital.my.id`: backend Node.js/Express dari direktori `backend`.
- MySQL Hostinger: database utama sekaligus antrean pekerjaan scraping.

WebSocket, Redis, dan Chromium tidak diperlukan. Bidding menggunakan REST dengan polling pendek, antrean tersimpan di MySQL, scraping memakai HTTP/Cheerio dengan fallback tautan pencarian/manual, dan PDF dirender oleh PDFKit.

## 1. Database

Database production aktif setelah import dump lokal `db_lelang_spk.sql`:

```text
Nama database: u878272139_elelang_import
User database: u878272139_elelang_import
Website: api.e-lelangdigital.my.id
Host database: auth-db1983.hstgr.io:3306
```

Password dibuat acak, dirotasi setelah import, dan hanya disimpan di server. Empat migrasi Prisma sudah diterapkan dan schema telah diverifikasi tanpa drift. Database lama `u878272139_elelang_prod` tetap dipertahankan sementara sebagai rollback. Pada paket hosting ini proses Node.js harus memakai hostname MySQL Hostinger di atas; koneksi melalui `localhost` ditolak karena identitas user database tidak cocok.

Remote MySQL saat ini mengizinkan host `%`. Pengujian dengan IP publik keluar website tidak dapat dipakai sebagai allowlist karena koneksi database melewati alamat NAT internal Hostinger yang berbeda; membatasi ke IP tersebut membuat health check gagal. Risiko dibatasi dengan database/user khusus aplikasi, password acak kuat, dan kredensial yang hanya tersimpan pada file server berpermission `600`. Tinjau kembali allowlist jika Hostinger menyediakan alamat sumber database yang stabil.

Buat database dan user MySQL melalui hPanel. Jangan simpan password di Git. Setelah Hostinger menampilkan host, port, nama database, user, dan password, susun nilai berikut di environment website backend:

```text
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DATABASE
```

Jika password mengandung karakter khusus seperti `@`, `:`, `/`, `#`, atau `%`, URL-encode bagian password terlebih dahulu. Jalankan migrasi sekali dari terminal aplikasi backend:

```bash
npm run migrate:prod
```

Jangan menjalankan `prisma db push` pada production.

Database lama pada akun Hostinger tidak digunakan oleh deployment ini. Buat database dan user baru khusus aplikasi e-Lelang agar hak akses, backup, dan pemulihan tidak bercampur dengan website lain.

## 2. Environment backend

Konfigurasi production saat ini disimpan pada file server-only berikut dengan permission `600`:

```text
/home/u878272139/domains/api.e-lelangdigital.my.id/.env.production
```

`backend/src/config/load_env.js` membacanya secara sinkron sebelum aplikasi memuat route atau service. File environment berada di luar direktori release, tidak ikut Git/deployment archive, dan tetap tersedia ketika release baru dibuat. Nilai yang dikonfigurasi:

```text
NODE_ENV=production
DATABASE_URL=mysql://u878272139_elelang_import:PASSWORD@auth-db1983.hstgr.io:3306/u878272139_elelang_import
JWT_SECRET=RANDOM_SECRET_MINIMUM_32_BYTES
FRONTEND_URL=https://app.e-lelangdigital.my.id
CORS_ORIGINS=https://app.e-lelangdigital.my.id
UPLOAD_DIR=uploads
SCRAPING_QUEUE_POLL_MS=5000
SCRAPER_TIMEOUT_MS=12000
SCRAPER_USER_AGENT=ELelangComparableBot/1.0
```

Hostinger memasok `PORT` otomatis; jangan mengunci nilai `PORT` production. Buat `JWT_SECRET` baru dan acak, misalnya dengan password generator, minimal 32 byte. Mengganti nilai ini akan membuat token login lama tidak berlaku.

Konfigurasi sebelum perpindahan database dicadangkan pada server sebagai `.env.production.before-local-import-20260813`. Jangan mengembalikan file tersebut kecuali rollback memang diperlukan.

Origin CORS production harus ditulis persis tanpa trailing slash:

```text
CORS_ORIGINS=https://app.e-lelangdigital.my.id
```

Jika browser melaporkan tidak ada `Access-Control-Allow-Origin`, periksa `/health` dan log startup terlebih dahulu. Respons error dari Passenger sebelum Express berjalan memang tidak melewati middleware CORS. Entry point `app.js` sengaja memuat environment tanpa top-level `await` agar kompatibel dengan loader Passenger.

Pengaturan aplikasi Node.js:

```text
Node.js version: 22.x
Root directory: kosong (arsip deployment sudah berisi isi direktori backend)
Build command: npm run build
Start command: npm start
Health check: /health
```

Deployment connector otomatis menjalankan instalasi dependency sebelum `npm run build`. Migrasi production sudah dijalankan. Untuk migrasi berikutnya, jalankan `npm run migrate:prod` satu kali melalui terminal/SSH hPanel setelah environment tersedia, kemudian redeploy atau restart aplikasi Node.js.

Paket Business ini juga menjalankan beberapa aplikasi Node lain pada akun yang sama. Sesudah setiap archive deployment, pastikan `public_html/.htaccess` website API memuat batas thread berikut sebelum aplikasi di-restart:

```apache
SetEnv NODE_OPTIONS "--v8-pool-size=1 --require /home/u878272139/domains/api.e-lelangdigital.my.id/hbuilds/config/preload-timestamp.js"
SetEnv UV_THREADPOOL_SIZE 1
```

Connector dapat membuat ulang `.htaccess`, jadi pengaturan ini perlu diperiksa pada setiap rilis. Tanpanya, Passenger dapat menghabiskan kuota thread akun dan mengembalikan HTTP 503 meskipun build berhasil.

## 3. Environment dan build frontend

Variabel Vite dibaca saat build, bukan saat runtime. Isi sebelum menjalankan build:

```text
VITE_API_URL=https://api.e-lelangdigital.my.id/api
VITE_ASSET_BASE_URL=https://api.e-lelangdigital.my.id
```

Build frontend:

```bash
cd frontend
npm ci
npm run build
```

Publikasikan isi `frontend/dist` ke document root website `app.e-lelangdigital.my.id`. File `.htaccess` hasil build menangani fallback React Router.

## 4. Urutan rilis

1. Push branch `feature/penilaian-penjual` ke GitHub.
2. Deploy isi direktori `backend` ke website `api.e-lelangdigital.my.id`.
3. Isi semua environment backend, jalankan `npm run migrate:prod`, lalu restart/redeploy backend.
4. Pastikan `https://api.e-lelangdigital.my.id/health` memberi `status: ok`.
5. Build frontend menggunakan dua variabel Vite production.
6. Deploy isi `frontend/dist` ke website frontend.
7. Uji login, upload, penilaian penjual, pencarian pembanding, bidding dua browser, dan pembuatan PDF.

Rilis pertama dilakukan melalui arsip connector Hostinger. Untuk rilis berikutnya, repository GitHub dapat dihubungkan melalui hPanel ke branch yang sama agar push/merge menjadi pemicu deployment; environment rahasia tetap hanya disimpan di hPanel dan tidak masuk GitHub.

## 5. DNS eksternal

DNS `e-lelangdigital.my.id` dikelola oleh Cloudflare, bukan oleh akun Hostinger ini. Di hPanel, buka masing-masing website lalu salin IP hosting yang ditampilkan pada panduan koneksi domain. Tambahkan record berikut pada zone Cloudflare:

```text
Type  Name  Target
A     app   IP_HOSTING_DARI_HPANEL
A     api   IP_HOSTING_DARI_HPANEL
```

Gunakan nilai IP persis dari hPanel, jangan menebak dari website lain. Untuk verifikasi awal gunakan mode **DNS only**; aktifkan proxy Cloudflare setelah HTTPS dan health check berhasil. Hapus record A, AAAA, atau CNAME lama yang konflik hanya untuk host `app` dan `api`. Propagasi dapat memerlukan waktu hingga 24 jam.

## 6. Data persisten

Database tetap persisten antar-deployment. Direktori `uploads` harus dipertahankan oleh website backend dan tidak boleh ikut arsip source. Sebelum redeploy, buat backup database dan folder upload melalui hPanel. Untuk skala lebih besar, pindahkan upload ke object storage yang mendukung signed URL.
