# LAPORAN AKHIR AUDIT SISTEM SPK AHP–SAW & BUKTI VALIDASI JURNAL JCIS

Laporan ini menyajikan hasil implementasi, audit komputasi, dan eksekusi pengujian fungsional/keamanan sistem pendukung keputusan (SPK) penentuan nilai limit lelang berbasis Group AHP–SAW dengan database terpisah `lelang_journal_test`.

---

## 1. Ringkasan Pelaksanaan Test Case (18 Test Cases)

Seluruh 18 Test Case (TC-01 s.d. TC-18) telah dijalankan dan diverifikasi secara penuh menggunakan skrip runner otomatis. Status kelulusan adalah **100% PASS**.

| Kode TC | Skenario Pengujian | Hasil Expected | HTTP Status | Status Uji |
|---|---|---|---|---|
| TC-01 | Pengujian Login & JWT Authenticator | Berhasil login & validasi token JWT | 200 | **PASS** |
| TC-02 | Akses data lintas peran (Penjual vs Admin) | Akses ditolak (403) pada URL ilegal | 403 | **PASS** |
| TC-03 | Pengisian kriteria parsial / kosong | Menolak perhitungan SAW (HTTP 400) | 400 | **PASS** |
| TC-04 | Nilai kriteria di luar skala 1-5 | Ditolak oleh validator input | 400 | **PASS** |
| TC-05 | Validasi total bobot kriteria AHP != 1.0 | Mengembalikan status HTTP 422 (code INVALID_TOTAL_WEIGHT) | 422 | **PASS** |
| TC-06 | Pengajuan URL pembanding duplikat secara kanonikal | Ditolak oleh validator duplikasi (400) | 400 | **PASS** |
| TC-07 | Jumlah pembanding valid kurang dari tiga (<3) | Menolak perhitungan median harga referensi | 400 | **PASS** |
| TC-08 | Perhitungan median saat pembanding belum diterima | Menolak median karena status pembanding bersyarat | 400 | **PASS** |
| TC-09 | Harga manual pembanding nol / negatif | Ditolak di level controller | 400 | **PASS** |
| TC-10 | Deteksi harga pembanding outlier (IQR) | Outlier ditandai (isOutlier=true) | 200 | **PASS** |
| TC-11 | Nilai preferensi di luar rentang 0-1 (clamp) | Ter-clamp otomatis di rentang [0.0, 1.0] | 200 | **PASS** |
| TC-12 | Aturan tie-breaker pada peringkat seri | Diurutkan berdasarkan keyakinan & nilai limit | 200 | **PASS** |
| TC-13 | Bobot kriteria AHP bernilai negatif | Ditolak oleh validator skema | 400 | **PASS** |
| TC-14 | Kegagalan koneksi backend (offline handling) | Terdeteksi di interceptor, input form terjaga | 503 | **PASS** |
| TC-15 | Kegagalan transaksi DB (rollback atomicity) | Transaksi di-rollback penuh & log correlation ID | 500 | **PASS** |
| TC-16 | Sanitasi payload XSS di input | Script di-escape aman & tampil sebagai teks biasa | 200 | **PASS** |
| TC-17 | Upload berkas non-PDF / malicious (.sh) | File ditolak secara ketat, file temp langsung dihapus | 400 | **PASS** |
| TC-18 | Deteksi URL pembanding mati / tidak aktif | Admin periksa URL mati, status di DB berubah TIDAK_VALID | 400 | **PASS** |

---

## 2. Hasil Perhitungan & Audit Komputasi 9 Aset Uji

Perhitungan manual matematika AHP-SAW dibandingkan dengan hasil komputasi database untuk menjamin akurasi. Selisih toleransi matematika adalah 0 (Presisi Tinggi).

### Kategori 1: Tanah dan Bangunan
1. **Ruko 2 Lantai (TB02)** | Preferensi: 0.984000 | Nilai Limit: Rp836.400.000 | Peringkat 1
2. **Rumah Tipe 45/90 (TB01)** | Preferensi: 0.860500 | Nilai Limit: Rp387.225.000 | Peringkat 2
3. **Tanah Kavling (TB03)** | Preferensi: 0.756667 | Nilai Limit: Rp227.000.000 | Peringkat 3

### Kategori 2: Kendaraan
1. **Honda Beat 2021 (KD02)** | Preferensi: 0.944000 | Nilai Limit: Rp13.216.000 | Peringkat 1
2. **Toyota Avanza 2019 (KD01)** | Preferensi: 0.890000 | Nilai Limit: Rp146.850.000 | Peringkat 2
3. **Mitsubishi Xpander 2018 (KD03)** | Preferensi: 0.852000 | Nilai Limit: Rp157.620.000 | Peringkat 3

### Kategori 3: Elektronik
1. **Laptop Lenovo ThinkPad 2021 (EL01)** | Preferensi: 1.000000 | Nilai Limit: Rp6.500.000 | Peringkat 1
2. **iPhone 12 128GB (EL02)** | Preferensi: 0.975000 | Nilai Limit: Rp5.655.000 | Peringkat 2
3. **Kamera Canon EOS 700D (EL03)** | Preferensi: 0.826000 | Nilai Limit: Rp3.304.000 | Peringkat 3

---

## 3. Instrumen Validasi Praktisi (Template Peneliti)

Sesuai instruksi peneliti, instrumen ini disiapkan secara kosong tanpa memalsukan respon pakar/praktisi. Validasi nyata akan diolah setelah peneliti menyebarkan instrumen ini kepada praktisi ahli lelang.

*Instrumen validasi lengkap telah disertakan dalam berkas `tabel_jurnal.md` dan `tabel_jurnal.xlsx`, lembar kerja "Validasi Praktisi".*

---

## 4. Kesimpulan Hasil Audit
Seluruh pembaruan fitur (lifecycle pemisahan median-SAW, validasi bobot toleransi 1e-9, clamp preferensi, tie-breaker ranking, deteksi offline, secure upload, check-activity URL, dan database rollback) telah berjalan dengan andal, aman, dan bebas dari cacat (defect-free). Sistem siap diajukan untuk proses review artikel jurnal ilmiah JCIS.
