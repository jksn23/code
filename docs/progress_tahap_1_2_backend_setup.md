# 📋 Progress Tahap 1 & 2: Setup Backend & API CRUD

**Tanggal:** 2026-04-06  
**Status:** ✅ SELESAI

---

## 🎯 Tujuan
- Setup workspace backend (Prisma, Express, struktur folder)
- Membuat semua endpoint CRUD dasar

---

## ✅ Yang Dikerjakan

### 1. Migrasi Prisma dari Frontend ke Backend
- `prisma` & `@prisma/client` dihapus dari `frontend/package.json`
- `prisma` & `@prisma/client` diinstall di `backend/package.json`
- `npx prisma init --datasource-provider mysql` dijalankan di backend

### 2. Schema Database (Prisma v7)
File: `backend/prisma/schema.prisma`

> **Catatan Prisma v7**: Datasource URL dikonfigurasi di `prisma.config.ts` (bukan di schema.prisma)

| Model | Tabel | Field Utama |
|---|---|---|
| `Kategori` | `kategori` | id, nama (UNIQUE) |
| `Kriteria` | `kriteria` | id, kategori_id (FK), nama, tipe (benefit/cost) |
| `Aset` | `aset` | id, nama, kategori_id (FK), harga_pasar |
| `NilaiAset` | `nilai_aset` | id, aset_id (FK), kriteria_id (FK), nilai — UNIQUE(aset+kriteria) |
| `BobotAHP` | `bobot_ahp` | id, kriteria_id (FK), bobot, cr |
| `Hasil` | `hasil` | id, aset_id (FK), nilai_preferensi, nilai_limit |

**Relasi**: Semua relasi menggunakan `onDelete: Cascade`

### 3. Konfigurasi Backend
- `backend/.env` → DATABASE_URL, PORT=5000
- `backend/package.json` → type: "module", scripts dev/start/migrate/generate
- `backend/app.js` → Express server dengan middleware CORS, JSON parser, health check endpoint

### 4. Struktur Folder Backend
```
backend/
├── app.js                  ← Entry point Express
├── .env                    ← Konfigurasi DB & PORT
├── prisma/
│   ├── schema.prisma       ← Skema database final
│   └── migrations/         ← (diisi setelah migrate)
├── prisma.config.ts        ← Konfigurasi Prisma v7
└── src/
    ├── models/
    │   └── prisma.client.js    ← Singleton Prisma Client
    ├── controllers/
    │   ├── kategori.controller.js
    │   ├── kriteria.controller.js
    │   ├── aset.controller.js
    │   ├── nilai.controller.js
    │   └── spk.controller.js
    ├── routes/
    │   ├── kategori.routes.js
    │   ├── kriteria.routes.js
    │   ├── aset.routes.js
    │   ├── nilai.routes.js
    │   └── spk.routes.js
    ├── services/
    │   ├── ahp.service.js
    │   └── saw.service.js
    └── tests/
        └── test_algoritma.js
```

### 5. API Endpoints
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/health` | Health check server + DB |
| GET | `/api/kategori` | Ambil semua kategori |
| POST | `/api/kategori` | Tambah kategori |
| PUT | `/api/kategori/:id` | Update kategori |
| DELETE | `/api/kategori/:id` | Hapus kategori (cascade) |
| GET | `/api/kriteria?kategori_id=X` | **Kriteria dinamis** per kategori |
| POST | `/api/kriteria` | Tambah kriteria |
| PUT | `/api/kriteria/:id` | Update kriteria |
| DELETE | `/api/kriteria/:id` | Hapus kriteria |
| GET | `/api/aset?kategori_id=X` | Ambil aset per kategori |
| POST | `/api/aset` | Tambah aset + harga_pasar |
| PUT | `/api/aset/:id` | Update aset |
| DELETE | `/api/aset/:id` | Hapus aset |
| GET | `/api/nilai/aset/:id` | Ambil nilai aset |
| POST | `/api/nilai` | Input nilai aset (bulk upsert) |
| POST | `/api/spk/hitung-ahp` | Eksekusi AHP |
| POST | `/api/spk/hitung-saw` | Eksekusi SAW |
| GET | `/api/spk/hasil/:kategori_id` | Ambil hasil ranking |

---

## 🧪 Hasil Test

### Test: Database Setup & Migrasi
- **Perintah**: `npx prisma db push` (karena `prisma migrate dev` mengalami error pada DB kosong)
- **Hasil**: ✅ `Your database is now in sync with your Prisma schema.`

### Test: Prisma Client Generate
- **Perintah**: `npx prisma generate`
- **Hasil**: ✅ `Generated Prisma Client (v5.22.0)`

### Test: Health Check Endpoint
- **URL**: `GET http://localhost:5000/health`
- **Hasil**: ✅ `{"status":"ok","database":"connected"}`

### Test: CRUD Endpoints
- **POST** `/api/kategori` → ✅ Kategori "Tanah & Bangunan" berhasil dibuat
- **POST** `/api/kriteria` → ✅ Kriteria "Luas Tanah" (benefit) berhasil dibuat
- **GET** `/api/kategori` → ✅ Data berhasil diambil

---

## ⚠️ Catatan Fix Error

### Error 1: `prisma migrate dev` gagal
**Error**: `Table 'db_lelang_spk._prisma_migrations' doesn't exist in engine`  
**Penyebab**: Prisma v7 yang terinstall di frontend dipindahkan ke backend, tapi Prisma v7 menggunakan arsitektur baru yang tidak kompatibel.  
**Solusi**:
1. Downgrade ke **Prisma v5** (stabil): `npm install prisma@5 @prisma/client@5`
2. Tambahkan `url = env("DATABASE_URL")` kembali ke `datasource db` di schema.prisma
3. Gunakan **`prisma db push`** untuk sync schema ke database (lebih cocok untuk development)
4. Jalankan `prisma generate` untuk buat client

### Error 2: `PrismaClientConstructorValidationError`
**Penyebab**: Prisma v7 membutuhkan setup engine yang berbeda (Wasm-based)  
**Solusi**: Sudah teratasi dengan downgrade ke Prisma v5

---

## 📦 Dependencies Final
| Package | Versi | Lokasi | Fungsi |
|---|---|---|---|
| `express` | ^5.2.1 | Backend | HTTP framework |
| `@prisma/client` | **v5.22.0** | Backend | ORM client |
| `prisma` | **v5.22.0** | Backend (dev) | ORM CLI |
| `cors` | ^2.8.6 | Backend | CORS middleware |
| `dotenv` | ^17.4.1 | Backend | Env variables |
| `mysql2` | ^3.20.0 | Backend | MySQL driver |
| `nodemon` | ^3.1.14 | Backend (dev) | Hot reload |
