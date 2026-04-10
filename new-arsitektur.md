# INSTRUKSI SISTEM: REFACTOR ARSITEKTUR SPK (AHP & SAW)

## 1. TUJUAN UTAMA
Lakukan refactoring pada sistem pendukung keputusan (SPK) saat ini. 
- Pindahkan seluruh proses perhitungan AHP (Pairwise Comparison, CI, CR) menjadi eksklusif hanya untuk ADMIN Website, jadi ada tambahan role, yaitu admin website (dilakukan sekali untuk mencari bobot).
- Hapus fitur AHP dari sisi User (Penjual).
- Gunakan metode SAW untuk perhitungan preferensi dan limit di sisi User berdasarkan bobot yang telah disimpan oleh Admin.

## 2. REFACTOR DATABASE (STEP 1)
Buat atau perbarui migrasi database untuk tabel-tabel berikut:
- `tabel_kriteria`: id_kriteria, nama_kriteria, kategori_id, tipe (benefit/cost)
- `tabel_pairwise_ahp`: id, kriteria_1, kriteria_2, nilai, kategori_id
- `tabel_bobot_ahp`: id, kriteria_id, bobot, kategori_id
- `tabel_nilai_aset`: id, aset_id, kriteria_id, nilai

## 3. MODUL ADMIN (AHP ENGINE - STEP 2 & 3)
Buat antarmuka dan logika backend untuk Admin:
- **Input:** Admin memilih kategori dan memasukkan nilai perbandingan berpasangan (Pairwise Comparison).
- **Proses:** Sistem menghitung matriks normalisasi, eigen vector, Consistency Index (CI), dan Consistency Ratio (CR).
- **Validasi:** - Jika CR <= 0.1, simpan hasil bobot ke `tabel_bobot_ahp`.
  - Jika CR > 0.1, tolak penyimpanan dan minta Admin memperbaiki input.

## 4. MODUL USER (SAW ENGINE - STEP 4, 5 & 6)
- **UI/UX:** Hapus matriks AHP dan perhitungan CR dari halaman User. User HANYA menginput nilai kriteria (menggunakan dropdown skala 1-5).
- **Proses SAW:**
  1. Tarik bobot kriteria dari `tabel_bobot_ahp` berdasarkan kategori_id.
  2. Tarik nilai input user dari `tabel_nilai_aset`.
  3. Lakukan normalisasi matriks:
     - Untuk kriteria Benefit: R_ij = X_ij / max(X_ij)
     - Untuk kriteria Cost: R_ij = min(X_ij) / X_ij
  4. Hitung Nilai Preferensi (V_i) = Sum(w_j * R_ij).
  5. Hitung Nilai Limit = V_i * Harga Pasar.

## 5. FLOW APLIKASI
- **Admin Controller:** Mengelola Kategori, Kriteria, Input AHP, dan menyimpan Bobot.
- **Aset Controller (User):** Menangani input aset dari penjual, mengambil bobot AHP yang sudah ada, menjalankan algoritma SAW, dan menghasilkan nilai limit.