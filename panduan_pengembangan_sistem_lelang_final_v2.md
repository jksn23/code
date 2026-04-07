# 📘 PANDUAN PENGEMBANGAN SISTEM (VERSI FINAL & LENGKAP)
## Sistem Pendukung Keputusan Penentuan Nilai Aset dan Sistem Lelang Online

---

# 🎯 1. DESKRIPSI SISTEM
Sistem ini merupakan Sistem Pendukung Keputusan (SPK) berbasis web untuk:
1. Menentukan nilai limit aset (SPK AHP-SAW)
2. Menjalankan proses lelang online

Kategori:
- Tanah & Bangunan
- Kendaraan
- Elektronik

---

# 👥 2. AKTOR SISTEM
1. Admin / Pejabat Lelang
2. Penjual
3. Pembeli

---

# 🔄 3. USER FLOW SISTEM (LENGKAP)

---

## 🟢 A. FLOW PENJUAL

1. Registrasi akun
2. Login ke sistem
3. Mengisi data identitas:
   - KTP
   - NPWP
4. Menginput data aset:
   - Nama aset
   - Kategori
   - Deskripsi
   - Upload dokumen
5. Sistem melakukan SPK:
   - Input nilai kriteria
   - Hitung AHP
   - Hitung SAW
6. Sistem menghasilkan nilai limit
7. Penjual mengajukan lelang
8. Menunggu verifikasi admin
9. Aset masuk ke jadwal lelang

---

## 🔵 B. FLOW ADMIN (PEJABAT LELANG)

1. Login sistem
2. Verifikasi data penjual
3. Verifikasi dokumen aset
4. Menentukan jadwal lelang
5. Mengelola kategori & kriteria
6. Mengawasi proses SPK
7. Monitoring proses lelang
8. Validasi pembayaran
9. Generate laporan

---

## 🟡 C. FLOW PEMBELI

1. Registrasi akun
2. Login sistem
3. Melihat daftar lelang
4. Memilih aset
5. Melakukan bidding (penawaran harga)
6. Sistem mencatat penawaran
7. Jika menang:
   - menerima notifikasi
   - melakukan pembayaran
   - upload bukti pembayaran
8. Konfirmasi penerimaan barang

---

## 🔥 D. FLOW PROSES LELANG

1. Lelang dibuka (timer aktif)
2. Pembeli melakukan bidding
3. Sistem mencatat semua penawaran
4. Saat waktu habis:
   - pemenang = penawaran tertinggi
5. Sistem generate invoice
6. Pembayaran dilakukan
7. Verifikasi admin
8. Barang diserahkan

---

## 🧠 E. FLOW SPK (AHP–SAW)

1. Input nilai kriteria
2. Input matriks pairwise AHP
3. Hitung bobot (AHP)
4. Hitung Consistency Ratio (CR)
   - jika CR > 0.1 → ulangi input
5. Normalisasi SAW
6. Hitung nilai preferensi
7. Konversi nilai limit:
   Nilai Limit = Preferensi × Harga Pasar
8. Tampilkan hasil

---

# 🗄️ 4. STRUKTUR DATABASE (RINGKAS)

- users
- penjual
- pembeli
- kategori
- kriteria
- aset
- nilai_aset
- bobot_ahp
- lelang
- penawaran
- transaksi
- hasil

---

# 🧮 5. RUMUS SPK

## AHP
- Normalisasi
- Eigen vector
- Consistency Ratio (CR < 0.1)

## SAW
- Benefit: X / max
- Cost: min / X
- Vi = Σ(Wj × Rij)

---

# 🤖 6. PROMPT AI FINAL

"""
Bangun sistem lelang online + SPK AHP-SAW dengan:

Aktor:
- Admin
- Penjual
- Pembeli

Fitur:
- CRUD kategori, kriteria, aset
- SPK AHP-SAW
- Kriteria dinamis per kategori
- Lelang online (bidding, timer)
- Penentuan pemenang otomatis
- Pembayaran & verifikasi

SPK:
- AHP (CR < 0.1)
- SAW
- Nilai limit = preferensi × harga pasar

Gunakan:
- React
- Node.js
- MySQL (Prisma)

Pisahkan service AHP & SAW.
Gunakan REST API.
"""

---

# ✅ SELESAI
Dokumen ini adalah blueprint final lengkap sistem.
