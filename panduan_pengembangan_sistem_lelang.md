# 📘 Panduan Pengembangan Sistem
## Sistem Pendukung Keputusan Penentuan Nilai Aset dan Sistem Lelang Online

---

## 🎯 1. Deskripsi Sistem
Sistem ini merupakan Sistem Pendukung Keputusan (SPK) berbasis web yang digunakan untuk menentukan nilai limit aset lelang menggunakan metode AHP (Analytical Hierarchy Process) dan SAW (Simple Additive Weighting).

Kategori objek:
- Tanah & Bangunan
- Kendaraan
- Elektronik

---

## 🧠 2. Arsitektur Sistem
- Frontend: React.js (Vite)
- Backend: Node.js + Express
- Database: MySQL
- ORM: Prisma (opsional)

---

## 🗄️ 3. Struktur Database

### Tabel kategori
- id_kategori (PK)
- nama_kategori

### Tabel kriteria
- id_kriteria (PK)
- id_kategori (FK)
- nama_kriteria
- tipe (benefit/cost)

### Tabel aset
- id_aset (PK)
- nama_aset
- id_kategori (FK)
- deskripsi

### Tabel nilai_aset
- id_nilai (PK)
- id_aset (FK)
- id_kriteria (FK)
- nilai

### Tabel bobot_ahp
- id_bobot (PK)
- id_kriteria (FK)
- bobot

### Tabel hasil
- id_hasil (PK)
- id_aset (FK)
- nilai_preferensi
- nilai_limit

---

## 🔧 4. Fitur Sistem

### Fitur Utama
- Login Admin
- CRUD Kategori
- CRUD Kriteria
- Input Data Aset
- Input Nilai Kriteria
- Perhitungan AHP
- Perhitungan SAW
- Hasil Nilai Limit

---

## 🔄 5. User Flow

1. Admin login
2. Admin memilih kategori
3. Admin input data aset
4. Admin input nilai kriteria
5. Sistem menghitung AHP (bobot)
6. Sistem menghitung SAW
7. Sistem menampilkan hasil nilai limit

---

## 🧮 6. Algoritma

### AHP
1. Input pairwise comparison
2. Normalisasi matriks
3. Hitung eigen vector
4. Hitung konsistensi

### SAW
Normalisasi:
- Benefit: Rij = Xij / max(Xj)
- Cost: Rij = min(Xj) / Xij

Nilai akhir:
Vi = Σ (Wj * Rij)

---

## 💻 7. Struktur Project

### Backend (Node.js)
- /controllers
- /routes
- /services (logic AHP-SAW)
- /models
- app.js

### Frontend (React)
- /pages
- /components
- /services (API)
- App.jsx

---

## 🤖 8. Prompt AI Agent

Gunakan prompt berikut untuk AI:

"""
Buatkan aplikasi web fullstack menggunakan:
- Frontend: React (Vite)
- Backend: Node.js + Express
- Database: MySQL

Fitur:
- CRUD kategori, kriteria, aset
- Input nilai kriteria
- Implementasi metode AHP untuk bobot
- Implementasi metode SAW untuk perhitungan nilai preferensi
- Output nilai limit aset

Gunakan struktur database sesuai dokumentasi.
Buat API RESTful.
Buat UI sederhana namun fungsional.
Pisahkan logic AHP dan SAW dalam service terpisah.
"""

---

## 🚀 8. Catatan Penting
- Gunakan validasi input
- Pisahkan logic bisnis dan controller
- Pastikan hasil perhitungan transparan

---

## 📌 Selesai
Panduan ini dapat langsung digunakan untuk pengembangan sistem dan implementasi menggunakan AI agent.
