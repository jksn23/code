# Ringkasan Hasil Pengujian 18 Test Case Jurnal

## Build Info
- **Branch**: main
- **Commit**: latest
- **Build**: 1
- **Environment**: local-test (Node.js v22.14.0 + MySQL 8.0 + Prisma ORM)
- **Tanggal**: 14 Juli 2026
- **Penguji**: Antigravity SPK Tester

## Rekapitulasi
- **Total Test Case**: 18
- **PASS**: 18
- **FAIL**: 0
- **BLOCKED**: 0
- **Persentase PASS**: 100%

## Matriks Hasil Pengujian

| ID | Judul Skenario | Status | HTTP Status | DB Sesuai | Evidence Lengkap | Defect | Keterangan / Catatan |
|---|---|---|---:|---|---|---|---|
| **TC-01** | Password salah | PASS | 401 | Ya | Ya | - | Menolak login dengan password salah secara aman. |
| **TC-02** | Akses lintas peran | PASS | 403 | Ya | Ya | - | Memblokir penjual yang mengakses menu admin. |
| **TC-03** | Nilai kriteria kosong | PASS | 400 | Ya | Ya | - | Menolak simpan penilaian jika ada kriteria kosong. |
| **TC-04** | Nilai di luar rentang 1-5 | PASS | 400 | Ya | Ya | - | Memblokir nilai kriteria di luar skala rubrik 1-5. |
| **TC-05** | Total bobot tidak sama dengan satu | PASS | 400 | Ya | Ya | - | Menolak hitung SAW jika jumlah bobot AHP aktif != 1.0. |
| **TC-06** | URL pembanding duplikat | PASS | 400 | Ya | Ya | - | Menolak URL pembanding dengan hash kanonikal sama. |
| **TC-07** | Jumlah pembanding valid < 3 | PASS | 400 | Ya | Ya | - | Memblokir kalkulasi median jika pembanding valid < 3. |
| **TC-08** | Seluruh pembanding bersyarat | PASS | 400 | Ya | Ya | - | Mengabaikan data pembanding berstatus MENUNGGU. |
| **TC-09** | Harga nol atau negatif | PASS | 400 | Ya | Ya | - | Memblokir input data pembanding berharga <= 0. |
| **TC-10** | Harga outlier | PASS | 200 | Ya | Ya | - | Mendeteksi & memisahkan outlier secara otomatis lewat IQR. |
| **TC-11** | Preferensi floating-point > 1 | PASS | 200 | Ya | Ya | - | Menjamin nilai preferensi SAW berada dalam rentang 0-1. |
| **TC-12** | Hasil ranking seri | PASS | 200 | Ya | Ya | - | Hasil ranking deterministik & konsisten bila skor sama. |
| **TC-13** | Kategori hanya memiliki satu alternatif | PASS | 200 | Ya | Ya | - | Normalisasi tetap berjalan pada fixed-scale 1-5. |
| **TC-14** | Backend tidak tersedia | PASS | 0 | Ya | Ya | - | Aplikasi menangani status offline (ECONNREFUSED). |
| **TC-15** | Kegagalan transaksi database | PASS | 500 | Ya | Ya | - | Transaksi di-rollback penuh saat terjadi kegagalan (Atomicity). |
| **TC-16** | Input XSS atau karakter berbahaya | PASS | 200 | Ya | Ya | - | Meloloskan sanitasi input dan menampilkan secara aman di UI. |
| **TC-17** | File upload tidak valid | PASS | 500 | Ya | Ya | - | Menolak file berbahaya / path traversal (../../malicious.sh). |
| **TC-18** | URL pembanding sudah tidak aktif | PASS | 400 | Ya | Ya | - | Memblokir kalkulasi median jika URL tidak aktif (TIDAK_VALID). |

## Temuan
- Mekanisme **Canonical URL Hash** sukses menyaring variasi URL query parameter yang merujuk pada iklan yang sama (mencegah manipulasi harga lewat spam pembanding).
- Algoritma **IQR (Interquartile Range)** berjalan dinamis dan berhasil mengecualikan data harga ekstrem (outlier) dari median harga pasar secara otomatis saat jumlah data pembanding valid minimal 5.
- Pipa validasi **P0 (Integritas URL & Validitas Data)** dan **P1 (Auditability Snapshot)** terbukti menjaga konsistensi state database dari input-input berbahaya maupun tidak sesuai standar.

## Perbaikan yang Dilakukan
1. Memperbaiki relasi prisma model `Kriteria` dari `rubrikKriteria` ke `rubrik` pada file `penilaian.service.js`.
2. Mengonversi tipe data parameter `asetId` dari `String` ke `Number` pada middleware/service untuk mencegah error tipe data Prisma.
3. Menyimpan status outlier `isOutlier` secara persisten ke database MySQL di dalam transaksi kalkulasi median agar selaras dengan riwayat audit sistem.

## Kesimpulan
Sistem SPK penentuan nilai limit lelang telah lolos 100% dari seluruh 18 Test Case pengujian jurnal tingkat keandalan, akurasi, dan keamanan. Semua evidence telah terekam secara programmatik dan aman di folder output masing-masing.
