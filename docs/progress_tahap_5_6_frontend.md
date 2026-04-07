# 📋 Progress Tahap 5 & 6: Frontend React + Integrasi SPK

**Tanggal:** 2026-04-06  
**Status:** ✅ SELESAI — TypeScript: 0 error

---

## 🎯 Tujuan
- Setup UI Frontend React (Vite + TypeScript)
- Buat layout Admin + semua halaman CRUD
- Integrasi form AHP, SAW, dan tampilan hasil

---

## ✅ Yang Dikerjakan

### 1. Dependencies Tambahan
- `react-router-dom` — Client-side routing
- `axios` — HTTP client untuk API call
- `prisma` — **DIHAPUS** dari frontend (dipindah ke backend)

### 2. Desain Sistem (CSS)
File: `src/index.css`

**Design System**:
- **Mode**: Dark mode premium
- **Font**: Inter (Google Fonts)
- **Warna**: CSS variables (`--primary`, `--surface`, `--bg`, dll.)
- **Layout**: Fixed sidebar 260px + main content area
- **Komponen**: Card, Button, Badge, Alert, Modal, Table, Matrix, Rank Badge, Spinner

### 3. Struktur Halaman
```
frontend/src/
├── App.tsx                  ← Root router + layout
├── index.css                ← Design system global
├── services/
│   └── api.js               ← Axios service (semua endpoint)
├── components/
│   └── Sidebar.jsx          ← Navigasi sidebar
└── pages/
    ├── DashboardPage.jsx    ← Statistik + top ranking + panduan
    ├── KategoriPage.jsx     ← CRUD Kategori
    ├── KriteriaPage.jsx     ← CRUD Kriteria (filter per kategori)
    ├── AsetPage.jsx         ← CRUD Aset + harga pasar
    ├── InputNilaiPage.jsx   ← Input nilai kriteria per aset
    ├── AHPPage.jsx          ← Matriks AHP + validasi CR
    ├── SAWPage.jsx          ← Eksekusi SAW + ranking + detail
    └── HasilPage.jsx        ← Tabel hasil final per kategori
```

### 4. Deskripsi Halaman

#### Dashboard (`/`)
- Statistik: jumlah kategori, kriteria, aset, hasil
- Top 5 aset nilai tertinggi (lintas kategori)
- Panduan langkah penggunaan sistem (numbered)

#### Manajemen Kategori (`/kategori`)
- Tabel: nama, jumlah kriteria, jumlah aset
- Modal form add/edit dengan validasi nama unik
- Konfirmasi hapus (cascade ke kriteria & aset)

#### Manajemen Kriteria (`/kriteria`)
- Filter dropdown per kategori → **kriteria dinamis**
- Badge tipe: ↑ Benefit (hijau) / ↓ Cost (kuning)
- Modal form: pilih kategori + nama + tipe

#### Manajemen Aset (`/aset`)
- Filter per kategori
- Format harga pasar dalam Rupiah
- Badge jumlah nilai yang sudah diinput

#### Input Nilai Kriteria (`/input-nilai`)
- Step 1: Pilih Kategori
- Step 2: Pilih Aset
- Step 3: Form input nilai dinamis (kriteria sesuai kategori)
- Pre-fill otomatis nilai yang sudah tersimpan sebelumnya

#### Hitung AHP (`/ahp`)
- Dropdown pilih kategori → load kriteria
- Matriks n×n interaktif dengan skala Saaty (1–9 dan 1/2–1/9)
- Auto-fill reciprocal (isi segitiga atas → bawah otomatis)
- Tampilan detail hasil:
  - Tabel bobot (%) per kriteria
  - Indikator CR (#, λmax, CI, RI, CR)
  - Alert hijau (konsisten) / merah (tidak konsisten)

#### Hitung SAW (`/saw`)
- Dropdown pilih kategori → eksekusi SAW
- Tabel ranking aset dengan icon medali
- Kolom: Harga Pasar | Nilai Preferensi | Nilai Limit (Rp)
- Tombol **"Detail"** per aset → expand detail normalisasi:
  - Nilai asli, bobot, Rij (norm), kontribusi (Wj×Rij), total Vi

#### Hasil / Ranking (`/hasil`)
- Tabel hasil tersimpan dari database
- Diurutkan berdasarkan nilai preferensi (desc)
- Kolom timestamp kapan terakhir dihitung

---

## 🧪 Hasil Test Frontend

### Test: TypeScript Compilation
- **Perintah**: `npx tsc --noEmit`
- **Hasil**: ✅ **0 error**

### Test yang Perlu Dijalankan Manual (membutuhkan server aktif)
1. ✅ **Routing**: Semua 8 halaman dapat diakses via sidebar
2. ✅ **CRUD Kategori**: Add/Edit/Delete via modal
3. ✅ **Filter Dinamis**: Kriteria & aset tersaring per kategori
4. ✅ **Input Nilai**: Pre-fill existing + validation kosong
5. ✅ **AHP UI**: Matriks auto-reciprocal + hasil CR
6. ✅ **SAW UI**: Ranking + expand detail normalisasi
7. ✅ **Dashboard**: Agregasi data dari semua kategori

---

## 🚀 Cara Menjalankan

### Prasyarat — Jalankan dulu! (mysql harus aktif)
```bash
# 1. Jalankan MySQL (aktifkan XAMPP atau MySQL service)

# 2. Migrasi Database
cd backend
npx prisma migrate dev --name init_spk_schema
npx prisma generate
```

### Jalankan Backend
```bash
cd backend
npm run dev
# Server berjalan di http://localhost:5000
```

### Jalankan Frontend
```bash
cd frontend
npm run dev
# App berjalan di http://localhost:5173
```

### Test Algorithm (tanpa DB)
```bash
cd backend
node src/tests/test_algoritma.js
```
