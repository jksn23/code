# 🔨 SPK Lelang Online — AHP & SAW

**Sistem Pendukung Keputusan** untuk menentukan nilai limit aset lelang menggunakan metode **AHP** (Analytical Hierarchy Process) dan **SAW** (Simple Additive Weighting).

---

## 🏗️ Stack Teknologi

| Layer | Teknologi |
|---|---|
| Frontend | React (Vite + TypeScript) |
| Backend | Node.js + Express 5 |
| Database | MySQL |
| ORM | Prisma v7 |
| HTTP Client | Axios |

---

## 🚀 Cara Menjalankan

### 1. Prasyarat
- Node.js >= 18
- MySQL Server (XAMPP atau standalone)
- Database `db_lelang_spk` sudah dibuat

### 2. Konfigurasi Backend
Edit `backend/.env` sesuai kredensial MySQL Anda:
```env
DATABASE_URL="mysql://root:PASSWORD@localhost:3306/db_lelang_spk"
PORT=5000
```

### 3. Migrasi Database
```bash
cd backend
npx prisma migrate dev --name init_spk_schema
npx prisma generate
```

### 4. Jalankan Backend
```bash
cd backend
npm run dev
# API berjalan di http://localhost:5000
```

### 5. Jalankan Frontend
```bash
cd frontend
npm run dev
# App berjalan di http://localhost:5173
```

---

## 📂 Struktur Project

```
code/
├── backend/
│   ├── app.js                  ← Entry point Express
│   ├── .env                    ← Konfigurasi
│   ├── prisma/
│   │   └── schema.prisma       ← Skema database
│   └── src/
│       ├── controllers/        ← CRUD + SPK handlers
│       ├── routes/             ← Express routes
│       ├── services/
│       │   ├── ahp.service.js  ← Algoritma AHP
│       │   └── saw.service.js  ← Algoritma SAW
│       ├── models/             ← Prisma client
│       └── tests/              ← Test algoritma
├── frontend/
│   └── src/
│       ├── pages/              ← Semua halaman UI
│       ├── components/         ← Sidebar dll.
│       └── services/api.js     ← Axios service
└── docs/                       ← Dokumentasi progress
```

---

## 🧮 Alur Sistem

```
1. Admin login → Dashboard
2. Input Kategori (Tanah & Bangunan / Kendaraan / Elektronik)
3. Input Kriteria per kategori (benefit/cost)
4. Input Aset + Harga Pasar
5. Input Nilai Kriteria tiap aset
6. Hitung AHP → Matriks Pairwise → Validasi CR < 0.1 → Bobot
7. Hitung SAW → Normalisasi → Nilai Preferensi → Nilai Limit (Rp)
8. Lihat Hasil Ranking
```

---

## 🧪 Test Algoritma (tanpa database)

```bash
cd backend
node src/tests/test_algoritma.js
```

Output yang diharapkan:
```
✅ TEST 1 PASSED (AHP konsisten)
✅ TEST 2 PASSED (CR terdeteksi > 0.1, sistem STOP)
✅ TEST 3 PASSED (SAW 2 aset)
✅ SEMUA TEST SELESAI
```

---

## 📖 Dokumentasi Progress

| File | Isi |
|---|---|
| `docs/progress_tahap_1_2_backend_setup.md` | Setup backend, Prisma, CRUD API |
| `docs/progress_tahap_3_4_algoritma_spk.md` | Implementasi & test AHP + SAW |
| `docs/progress_tahap_5_6_frontend.md` | Frontend React, halaman, design |
