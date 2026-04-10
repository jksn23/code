# 🤖 MASTER SYSTEM INSTRUCTION & DEVELOPMENT ROADMAP
**Project:** Sistem Computer Based Test (CBT) Tryout CPNS dengan Deteksi Tab & Socket.io
**Client:** PT Karya Edukasi
**Role AI:** Senior Backend & Fullstack Developer

## 📌 INSTRUKSI UTAMA UNTUK AI AGENT
Sebagai AI Assistant, tugas Anda adalah menulis kode, menguji, dan memastikan logika bisnis berjalan sesuai dokumen ini. 
**ATURAN WAJIB (DO NOT IGNORE):**
1. **Fokus pada Roadmap:** Jangan melompat ke Fase berikutnya sebelum Fase saat ini selesai dan lulus *testing*.
2. **Tech Stack Tetap:** Hanya gunakan **Node.js, Express.js, PostgreSQL (pg/pg-promise/Prisma), dan Socket.io**. Jangan gunakan MongoDB atau MySQL.
3. **Logika State:** Jangan pernah menghapus atau mengubah nama tabel/kolom yang sudah ditetapkan di dokumen ini tanpa izin.
4. **Validasi & Laporan:** Setiap kali Anda selesai menulis kode untuk sebuah Step, Anda **WAJIB** memberikan instruksi cara melakukan *testing* (menggunakan Postman/Insomnia/cURL atau *Unit Test*) sebelum bertanya "Apakah kita bisa lanjut ke langkah berikutnya?".

---

## 🏗️ 1. ARCHITECTURE & TECH STACK (RECOMMENDED)

### A. Backend & API (Core & Real-time)
* **Runtime:** `Node.js`
* **Framework:** `Express.js`
* **Real-time Engine:** `Socket.io` (Sangat stabil untuk *broadcast* peringatan *tab-switching* ke klien).
* **Database ORM:** `Prisma` (Sangat direkomendasikan! Prisma membuat penulisan kueri PostgreSQL di Node.js menjadi sangat rapi, aman dari SQL Injection, dan memiliki fitur *auto-completion* yang sangat membantu AI saat *coding*).

### B. Database
* **Relational Database:** `PostgreSQL` (Gunakan relasi standar untuk pengguna dan ujian, serta fitur `JSONB` untuk keluwesan menyimpan format opsi jawaban dan rekaman jawaban peserta).

### C. Frontend (User Interface)
* **Framework:** `React.js` (Bisa menggunakan *Vite* atau *Next.js*). 
  * *Alasan:* Mengelola aplikasi ujian dengan HTML/JS murni sangat rawan *bug*. React sangat tangguh dalam mengatur *state* yang kompleks secara bersamaan (misal: *timer* mundur, sinkronisasi *Socket.io*, dan melacak soal mana yang sedang aktif).
* **Styling:** `Tailwind CSS` (Mempercepat pembuatan desain UI yang responsif dan rapi tanpa perlu menulis file CSS yang panjang).
* **State Management:** `Zustand` atau `React Context` (Untuk menyimpan sisa waktu ujian dan jawaban sementara agar tidak hilang saat komponen me-render ulang).

### D. Security & Authentication
* **Auth:** `JSON Web Token (JWT)` dipadukan dengan `bcrypt` untuk *hashing password*.
* **Security Middleware:** * `Helmet.js`: Menutup celah keamanan HTTP *headers*.
  * `express-rate-limit`: Mencegah peserta melakukan *spamming* atau serangan DDoS ringan (D-DoS) pada *endpoint* pendaftaran atau pengumpulan ujian.

### E. Deployment (Saran Infrastruktur)
* **Database Cloud:** `Neon.tech` atau `Supabase` (Layanan hosting PostgreSQL gratis yang sangat cepat).
* **Backend Hosting:** `Render.com` atau `Railway.app` (Mendukung WebSockets dengan sangat baik dibanding Vercel).
* **Frontend Hosting:** `Vercel` atau `Netlify`.

---

## 🗄️ 2. DATABASE SCHEMA (POSTGRESQL)
AI harus mengikuti struktur skema tabel relasional berikut (beserta tipe datanya):

1. **`users`**: `id` (UUID, PK), `nama_lengkap` (VARCHAR), `email` (VARCHAR, UNIQUE), `password` (VARCHAR, BCRYPT), `role` (VARCHAR: 'admin'/'peserta'), `created_at` (TIMESTAMP).
2. **`exams`**: `id` (UUID, PK), `judul_tryout` (VARCHAR), `durasi_menit` (INT), `waktu_mulai` (TIMESTAMP), `waktu_selesai` (TIMESTAMP). *(Note: Tidak ada limit pelanggaran).*
3. **`questions`**: `id` (UUID, PK), `exam_id` (UUID, FK), `kategori` (VARCHAR: 'TWK'/'TIU'/'TKP'), `teks_soal` (TEXT), `opsi_jawaban` (JSONB - *format array of objects*), `kunci_jawaban` (VARCHAR). 
   * ⚠️ **SECURITY WARNING:** `kunci_jawaban` **HANYA** boleh diakses melalui endpoint Admin. Jangan pernah menyertakan kolom ini di *response body* saat endpoint dipanggil oleh `role: peserta` (misalnya pada endpoint `GET /api/exam/questions`).
4. **`exam_sessions`**: `id` (UUID, PK), `user_id` (UUID, FK), `exam_id` (UUID, FK), `waktu_mulai` (TIMESTAMP), `status` (VARCHAR: 'ongoing'/'submitted'), `skor_twk` (INT), `skor_tiu` (INT), `skor_tkp` (INT), `total_skor` (INT), `jumlah_pelanggaran` (INT DEFAULT 0), `jawaban_peserta` (JSONB).
5. **`violation_logs`**: `id` (UUID, PK), `session_id` (UUID, FK), `waktu_pelanggaran` (TIMESTAMP), `jenis_pelanggaran` (VARCHAR: 'tab_switched'), `peringatan_ke` (INT).

---

## 🧠 3. CORE BUSINESS LOGIC (LOGIKA WAJIB)

### A. Sistem Penilaian (Skoring CPNS)
* **TIU & TWK:** Jawaban benar = 5 poin, salah/kosong = 0 poin.
* **TKP:** Tidak ada jawaban salah. Setiap opsi jawaban (A/B/C/D/E) memiliki bobot poin 1 sampai 5. Kosong = 0 poin.

### B. Anti-Cheat Engine (Visibility API + Socket.io)
*Sistem hanya memberikan peringatan dan mencatat log, tanpa melakukan Force Submit.*
1. Klien (*browser* peserta) mendeteksi `document.addEventListener("visibilitychange")`.
2. Jika *tab* disembunyikan (*hidden*), klien melakukan `socket.emit('tab_violation', { session_id })`.
3. Server menerima *event* tersebut, lalu melakukan dua hal secara paralel di *database*:
   * Menambahkan `jumlah_pelanggaran` + 1 di tabel `exam_sessions`.
   * Melakukan *insert* baris baru ke tabel `violation_logs` untuk mencatat waktu persis (timestamp) pelanggaran terjadi.
4. Server melakukan `socket.emit('show_warning', { total_pelanggaran })` kembali ke klien.
5. Klien menerima *event* peringatan dan memunculkan *pop-up/alert* di layar peserta ("Peringatan ke-X: Anda terdeteksi meninggalkan halaman ujian!"). Ujian tetap bisa dilanjutkan.

---

## 🛤️ 4. DEVELOPMENT ROADMAP & TESTING PROTOCOL

*Kepada AI: Kerjakan tahap demi tahap. Lakukan checklist (✅) secara internal. Tanyakan kepada User (Developer) tahap mana yang ingin dikerjakan saat ini.*

### 🛠️ PHASE 1: Project Setup & Database
- [ ] **Step 1.1:** Inisialisasi `package.json`, *install dependencies* (express, pg, socket.io, bcrypt, jsonwebtoken, dotenv, cors).
- [ ] **Step 1.2:** Setup koneksi database PostgreSQL di `db.js` atau `prisma`.
- [ ] **Step 1.3:** Buat skema migrasi tabel (DDL queries) untuk ke-5 tabel di atas.
- 🧪 **AI Testing Protocol:** Berikan *script* SQL untuk User masukkan ke DBeaver/pgAdmin. Berikan *script node* sederhana untuk tes ping ke koneksi *database*.

### 🔐 PHASE 2: Auth & Middleware
- [ ] **Step 2.1:** Buat *endpoint* `POST /api/auth/register` (hash password) & `POST /api/auth/login` (generate JWT).
- [ ] **Step 2.2:** Buat *middleware* `verifyToken` dan `isAdmin` untuk proteksi *route*.
- 🧪 **AI Testing Protocol:** Berikan JSON contoh untuk di-*paste* ke Postman/cURL untuk mendaftarkan akun admin dan akun peserta, serta cara menguji penolakan akses tanpa token.

### 📝 PHASE 3: Admin Dashboard (CRUD)
- [ ] **Step 3.1:** API CRUD untuk *Exams* (Tabel `exams`).
- [ ] **Step 3.2:** API untuk menambahkan soal (*Questions*) menggunakan JSONB (termasuk validasi struktur poin untuk soal TKP).
- [ ] **Step 3.3:** API untuk memanggil daftar peserta yang terdaftar pada ujian tertentu.
- 🧪 **AI Testing Protocol:** Buatkan Postman Collection JSON atau perintah cURL untuk melakukan *Insert* 1 paket ujian dan *Insert* 2 contoh soal (1 TIU, 1 TKP) beserta validasinya.

### ⏱️ PHASE 4: Exam Core Logic (Peserta)
- [ ] **Step 4.1:** API `POST /api/exam/start` -> Generate `exam_sessions` dengan status `ongoing`.
- [ ] **Step 4.2:** API `GET /api/exam/questions` -> Ambil soal *tryout* (tanpa membocorkan `kunci_jawaban` ke *frontend*).
- [ ] **Step 4.3:** API `POST /api/exam/save-answer` -> Simpan jawaban sementara ke kolom `jawaban_peserta` (JSONB) di tabel session.
- [ ] **Step 4.4:** API `POST /api/exam/finish` -> Kalkulasi skor (TIU, TWK, TKP), ubah status menjadi `submitted`.
- 🧪 **AI Testing Protocol:** Berikan alur *testing* simulasi peserta menjawab 2 soal dan periksa apakah kalkulasi skor berjalan benar di PostgreSQL.

### 🚨 PHASE 5: Web Socket & Anti-Cheat Engine
- [ ] **Step 5.1:** Inisialisasi *Socket.io server* dan tempelkan pada *Express server*.
- [ ] **Step 5.2:** Buat *listener* `tab_violation` di *backend*.
- [ ] **Step 5.3:** Tulis fungsi penambahan log pelanggaran di database.
- [ ] **Step 5.4:** Buat file `client.html` sederhana berisi *script* murni JavaScript (`document.addEventListener("visibilitychange")`) dan *Socket.io client* untuk membuktikan *trigger* berjalan dan *alert* muncul.
- 🧪 **AI Testing Protocol:** Instruksikan *user* (developer) untuk membuka `client.html` di browser, pindah ke *tab* lain, dan periksa *console backend* apakah log pelanggaran masuk dan peringatan tereksekusi.