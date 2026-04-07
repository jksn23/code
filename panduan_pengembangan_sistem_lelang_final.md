# 📘 PANDUAN PENGEMBANGAN SISTEM (VERSI FINAL & LENGKAP)
## Sistem Pendukung Keputusan Penentuan Nilai Aset dan Sistem Lelang Online

---

# 🎯 1. DESKRIPSI SISTEM
Sistem ini merupakan Sistem Pendukung Keputusan (SPK) berbasis web untuk menentukan nilai limit aset lelang menggunakan metode:
- AHP (Analytical Hierarchy Process) → pembobotan
- SAW (Simple Additive Weighting) → perankingan

Kategori:
1. Tanah & Bangunan
2. Kendaraan
3. Elektronik

---

# 🧠 2. ARSITEKTUR SISTEM
- Frontend: React (Vite)
- Backend: Node.js + Express
- Database: MySQL
- ORM: Prisma

---

# 🗄️ 3. STRUKTUR DATABASE (FINAL)

## kategori
- id
- nama

## kriteria
- id
- kategori_id
- nama
- tipe (benefit/cost)

## aset
- id
- nama
- kategori_id
- harga_pasar

## nilai_aset
- id
- aset_id
- kriteria_id
- nilai

## bobot_ahp
- id
- kriteria_id
- bobot

## hasil
- id
- aset_id
- nilai_preferensi
- nilai_limit

---

# 🔥 4. FITUR WAJIB SISTEM

## Core
- CRUD kategori
- CRUD kriteria
- CRUD aset
- Input nilai kriteria

## SPK
- AHP (pairwise comparison)
- Validasi Consistency Ratio (CR < 0.1)
- SAW (normalisasi & ranking)
- Konversi nilai limit (Rp)

## Tambahan WAJIB
- Kriteria dinamis berdasarkan kategori
- Transparansi perhitungan
- Validasi input

---

# 🔄 5. USER FLOW

1. Login Admin
2. Pilih kategori
3. Input aset
4. Input nilai kriteria (dinamis)
5. Input matriks AHP
6. Hitung AHP
7. Validasi CR
8. Hitung SAW
9. Tampilkan hasil (nilai limit)

---

# 🧮 6. RUMUS AHP

Normalisasi:
Nij = aij / jumlah kolom

Bobot:
Wi = rata-rata baris

Consistency Ratio:
CR = CI / RI

CI = (λmax - n) / (n - 1)

Jika CR < 0.1 → valid

---

# 🧮 7. RUMUS SAW

## Normalisasi
Benefit:
Rij = Xij / max(Xj)

Cost:
Rij = min(Xj) / Xij

## Nilai Preferensi
Vi = Σ (Wj * Rij)

## Nilai Limit
Nilai Limit = Vi × Harga Pasar

---

# ⚠️ 8. LOGIKA WAJIB SISTEM

- Kriteria harus sesuai kategori
- SAW hanya menggunakan kriteria kategori terkait
- Jika CR > 0.1 → proses dihentikan
- Semua hasil harus transparan

---

# 💻 9. STRUKTUR PROJECT

## Backend
- controllers
- routes
- services (AHP, SAW)
- models

## Frontend
- pages
- components
- services (API)

---

# 🔌 10. API ENDPOINT

GET /kategori
GET /kriteria?kategori_id=1
POST /aset
POST /nilai
POST /hitung-ahp
POST /hitung-saw

---

# 🤖 11. PROMPT FINAL UNTUK AI AGENT

Gunakan prompt ini:

"""
Bangun sistem web fullstack dengan:
Frontend: React (Vite)
Backend: Node.js + Express
Database: MySQL (Prisma)

Implementasikan:

1. CRUD kategori, kriteria, aset
2. Kriteria dinamis berdasarkan kategori
3. Input nilai kriteria
4. AHP:
   - pairwise comparison
   - normalisasi
   - eigen vector
   - consistency ratio (CR < 0.1)
5. SAW:
   - normalisasi benefit & cost
   - perankingan
6. Konversi nilai preferensi menjadi nilai limit (Rp)
7. Tampilkan semua proses secara transparan

Pisahkan logic ke dalam service.
Gunakan REST API.
Buat UI sederhana.
"""

---

# 🚀 12. CATATAN AKHIR

Sistem harus:
- Transparan
- Valid secara matematis
- Konsisten dengan kategori
- Mudah diuji saat sidang

---

# ✅ SELESAI
Dokumen ini adalah blueprint final untuk pengembangan sistem.
