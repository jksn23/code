# Laporan Pengujian 18 Test Case Jurnal & Walkthrough Hasil

Kami telah sukses mengimplementasikan pengujian programmatik dan mengeksekusi ke-18 skenario uji negatif, batas, dan keamanan sesuai panduan jurnal. Semua pengujian menghasilkan status **PASS** (100% lolos).

---

## 1. Perubahan & Perbaikan Kode Utama
Selama proses integrasi dan pengujian, kami mendeteksi dan memperbaiki beberapa bug minor pada backend:
1. **Relasi Kriteria ke Rubrik**:
   - Memperbaiki `kriteria.rubrikKriteria` menjadi `kriteria.rubrik` pada [penilaian.service.js](file:///c:/Users/McCrazy/Documents/kampus/TA/code/backend/src/services/penilaian.service.js) karena skema Prisma mendefinisikan relasinya sebagai `rubrik`.
2. **Tipe Data Parameter `asetId`**:
   - Mengonversi `asetId` dari `String` ke `Number` di awal fungsi `calculateAndPersistSAWForAset` agar query Prisma tidak melemparkan error type mismatch.
3. **Persistensi Status Outlier**:
   - Memperbarui controller `hitungMedian` di [pembanding.controller.js](file:///c:/Users/McCrazy/Documents/kampus/TA/code/backend/src/controllers/pembanding.controller.js) agar menandai status `isOutlier` secara langsung pada rekaman `dataPembanding` di database untuk mendukung keterlacakan audit data.

---

## 2. Struktur Evidence Hasil Pengujian
Seluruh berkas bukti (evidence) pengujian disimpan secara rapi di dalam folder khusus [Paket_Pengujian_Jurnal_18_Test_Case](file:///c:/Users/McCrazy/Documents/kampus/TA/code/Paket_Pengujian_Jurnal_18_Test_Case):

```
Paket_Pengujian_Jurnal_18_Test_Case/
├── RINGKASAN_HASIL.md           <-- Laporan ringkas keberhasilan 100%
├── TC-01/
│   ├── metadata.json            <-- Informasi pengujian, tanggal, tester, & status
│   ├── TC-01_api_request.json   <-- Payload request API
│   ├── TC-01_api_response.json  <-- Payload response API
│   ├── TC-01_http_status.txt    <-- Kode HTTP response (e.g., 401)
│   ├── TC-01_backend.log        <-- Potongan log dari combined.log
│   ├── TC-01_db_before.txt      <-- Keadaan database sebelum uji
│   ├── TC-01_db_after.txt       <-- Keadaan database setelah uji
│   └── execution_notes.md       <-- Catatan detail eksekusi
├── ...
└── TC-18/
```

Setiap folder skenario uji (TC-01 s.d TC-18) telah diisi lengkap dengan bukti-bukti di atas.

---

## 3. Cara Pengujian Ulang (Retest)
Jika Anda ingin memicu eksekusi ulang seluruh test case secara otomatis:
1. Pastikan database MySQL berjalan.
2. Jalankan perintah berikut di PowerShell (direktori `backend`):
   ```powershell
   node scripts/run_jurnal_tests.js
   ```
3. Skrip akan secara otomatis:
   - Menghubungkan atau menyalakan backend port 5001.
   - Melakukan setup dan pembersihan pre-test data uji temp.
   - Menjalankan 18 test case satu per satu.
   - Menyimpan seluruh berkas evidence ke direktori target.
   - Melakukan cleanup data uji dari database.

---

## 4. Kesimpulan Rekapitulasi
Semua skenario pengujian keandalan SPK penentuan nilai limit lelang dari jurnal telah disimulasikan secara programmatik dan dinyatakan **Lolos (PASS)** tanpa merusak integritas database ataupun mengotori data lelang produksi.
