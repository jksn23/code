# PANDUAN EKSEKUSI AI AGENT — FINALISASI DATA DAN EVIDENCE JURNAL JCIS

## Tujuan

Panduan ini digunakan untuk memerintahkan AI Agent melakukan sinkronisasi dataset penelitian final, memperbaiki pengujian, menjalankan ulang verifikasi komputasional, menghasilkan evidence mentah yang dapat diaudit, serta membuat tabel hasil yang siap dimasukkan ke artikel jurnal JCIS.

Fokus pekerjaan adalah **reproduksibilitas dan konsistensi data**, bukan penambahan fitur baru.

---

# 1. Prinsip Kerja Wajib

AI Agent wajib:

1. bekerja pada branch khusus;
2. menggunakan database pengujian terpisah;
3. menggunakan dataset penelitian final sebagai satu-satunya sumber kebenaran;
4. tidak membuat data pakar, praktisi, responden, aset, atau harga baru;
5. tidak mengganti angka penelitian untuk membuat pengujian lulus;
6. tidak menandai `PASS` jika kondisi inti belum benar-benar terpicu;
7. mempertahankan seluruh kegagalan dalam laporan;
8. menyimpan SHA commit Git lengkap;
9. menyimpan bukti UI, API, backend, database, dan storage;
10. menyamarkan seluruh data sensitif sebelum membuat ZIP akhir.

AI Agent dilarang:

- menggunakan fixture lama yang berbeda dari dataset penelitian;
- memasukkan `Aset Tunggal Jurnal` dalam audit sembilan aset;
- memakai nilai `latest` sebagai commit;
- menyimpan file PNG melalui proses baca/tulis UTF-8;
- mengganti ekstensi CSV menjadi `.xlsx`;
- mengisi validasi praktisi dengan data buatan;
- menggunakan database produksi.

---

# 2. Sumber Data Final

Gunakan sumber data berikut sebagai acuan:

```text
Group_AHP_Bukti_Autentik_Terverifikasi.xlsx
Data_Pembanding_45_Aset_Lelang_Validasi_Median.xlsx
Lampiran_Analisis_Revisi_JCIS_Final.xlsx
```

Apabila salah satu file tidak tersedia pada workspace:

1. jangan membuat data pengganti;
2. tandai pekerjaan sebagai `BLOCKED`;
3. sebutkan file yang hilang pada laporan;
4. hentikan proses impor dataset utama.

## 2.1. Sembilan aset penelitian

Audit hanya boleh memuat sembilan aset:

1. Rumah Tipe 45/90
2. Ruko 2 Lantai
3. Tanah Kavling
4. Toyota Avanza 2019
5. Honda Beat 2021
6. Mitsubishi Xpander 2018
7. Laptop Lenovo ThinkPad 2021
8. iPhone 12 128GB
9. Kamera Canon EOS 700D

Aset uji tambahan, seperti `Aset Tunggal Jurnal`, hanya boleh dipakai pada test case khusus dan tidak boleh masuk ke tabel hasil utama.

## 2.2. Nilai median acuan

Gunakan nilai berikut sebagai pemeriksaan awal setelah impor:

| Aset | Median acuan |
|---|---:|
| Rumah Tipe 45/90 | Rp690.000.000 |
| Ruko 2 Lantai | Rp1.800.000.000 |
| Tanah Kavling | Rp250.000.000 |
| Toyota Avanza 2019 | Rp150.000.000 |
| Honda Beat 2021 | Rp12.900.000 |
| Mitsubishi Xpander 2018 | Rp179.000.000 |
| Laptop Lenovo ThinkPad 2021 | Rp5.850.000 |
| iPhone 12 128GB | Rp5.800.000 |
| Kamera Canon EOS 700D | Rp3.300.000 |

Apabila hasil impor tidak menghasilkan nilai tersebut:

- jangan melanjutkan audit komputasional;
- buat laporan perbedaan;
- periksa status data diterima/bersyarat;
- periksa duplikasi;
- periksa outlier;
- periksa aturan median;
- periksa pemetaan aset dan kategori.

---

# 3. Persiapan Repository

## 3.1. Buat branch

```bash
git checkout -b research/jcis-final-evidence-v2
```

## 3.2. Catat versi awal

```bash
git rev-parse HEAD
git branch --show-current
node --version
npm --version
npx prisma -v
```

Simpan ke:

```text
Final_Evidence_V2/01_Source_Version/environment.txt
```

## 3.3. Gunakan database terpisah

Contoh:

```env
NODE_ENV=test
DATABASE_URL=mysql://USER:PASSWORD@localhost:3306/lelang_jcis_final_test
```

Sebelum impor:

```text
backup database test
reset database test
jalankan migration
jalankan seed minimum akun dan kategori
```

Jangan menjalankan reset pada database produksi.

---

# 4. Tahap A — Audit Schema dan Pemetaan Data

Sebelum menulis skrip impor, AI Agent harus menemukan:

- tabel kategori;
- tabel kriteria;
- tabel bobot AHP;
- tabel aset;
- tabel nilai aset;
- tabel pembanding;
- tabel hasil;
- tabel lelang;
- tabel penawaran;
- enum status validasi;
- enum status aset;
- relasi foreign key;
- constraint unik URL/canonical hash.

Buat dokumen:

```text
Final_Evidence_V2/02_Data_Import/schema_mapping.md
```

Format:

| Data sumber | Sheet/kolom | Tabel tujuan | Kolom tujuan | Transformasi | Validasi |
|---|---|---|---|---|---|

Jangan mengimpor sebelum pemetaan lengkap.

---

# 5. Tahap B — Impor Bobot Group AHP Final

## 5.1. Data yang diimpor

Impor:

- kategori;
- nama kriteria;
- tipe benefit/cost;
- bobot kelompok presisi penuh;
- CR individual;
- CR kelompok;
- versi bobot;
- tanggal sumber.

## 5.2. Validasi

Untuk setiap kategori:

```text
jumlah bobot = 1 ± 1e-9
seluruh bobot > 0
CR individual <= 0,10
CR kelompok <= 0,10
```

## 5.3. Pencegahan duplikasi

Gunakan kombinasi unik:

```text
category_id + criterion_id + weight_version
```

Skrip impor harus idempotent.

## 5.4. Output

```text
Final_Evidence_V2/02_Data_Import/ahp_import_log.json
Final_Evidence_V2/02_Data_Import/ahp_weight_summary.csv
```

---

# 6. Tahap C — Impor Sembilan Aset dan Skor Final

## 6.1. Hanya sembilan aset

Bersihkan atau pisahkan seluruh fixture yang bukan aset penelitian.

Gunakan flag:

```text
dataset_scope = RESEARCH_FINAL
```

Aset tambahan:

```text
dataset_scope = TEST_FIXTURE
```

Query audit utama wajib menggunakan:

```sql
WHERE dataset_scope = 'RESEARCH_FINAL'
```

## 6.2. Data yang diimpor

Untuk setiap aset:

- nama aset;
- kategori;
- skor seluruh kriteria;
- tipe kriteria;
- nilai mentah;
- sumber nilai;
- versi dataset.

## 6.3. Validasi

- jumlah aset penelitian = 9;
- tidak ada nama aset duplikat;
- seluruh kriteria wajib terisi;
- skor berada pada rentang valid;
- kategori sesuai;
- tidak ada `Aset Tunggal Jurnal`.

## 6.4. Output

```text
Final_Evidence_V2/02_Data_Import/asset_import_log.json
Final_Evidence_V2/02_Data_Import/asset_score_summary.csv
```

---

# 7. Tahap D — Impor 45 Data Pembanding Final

## 7.1. Kriteria jumlah

Assertion:

```text
jumlah aset = 9
jumlah pembanding per aset = 5
jumlah keseluruhan = 45
```

## 7.2. Kolom minimal

- ID sumber;
- aset target;
- judul listing;
- URL detail;
- canonical URL;
- canonical hash;
- harga;
- lokasi;
- spesifikasi;
- status diterima/bersyarat;
- skor kesesuaian;
- alasan status;
- tanggal akses;
- sumber marketplace;
- status URL;
- apakah digunakan dalam median.

## 7.3. Validasi wajib

```text
jumlah diterima = 26
jumlah diterima bersyarat = 19
jumlah total = 45
```

Periksa:

- URL tidak kosong;
- canonical hash unik;
- harga > 0;
- tanggal akses tersedia;
- setiap aset memiliki lima pembanding;
- tidak ada duplikasi lintas aset tanpa alasan.

## 7.4. Rekalkulasi median

Setelah impor:

1. hitung median menggunakan aturan penelitian;
2. bandingkan dengan tabel acuan;
3. hasil harus sama untuk sembilan aset.

## 7.5. Output

```text
Final_Evidence_V2/02_Data_Import/comparable_import_log.json
Final_Evidence_V2/02_Data_Import/comparable_summary.csv
Final_Evidence_V2/02_Data_Import/median_validation.csv
```

---

# 8. Tahap E — Perbaiki Skrip Audit Honda Beat

Masalah lama:

```text
0,944 × Rp14.000.000
```

pernah dibandingkan dengan hasil manual yang salah satu digit.

Skrip audit manual wajib memakai formula yang sama:

```javascript
const manualLimit = safePreference * referencePrice;
```

Jangan mengetik nilai manual secara hardcoded.

## Assertion

```text
manualLimit = systemLimit ± Rp1
```

Gunakan nilai dataset final Honda Beat:

```text
harga referensi final = Rp12.900.000
```

Simpan:

- raw preference;
- safe preference;
- system limit;
- manual limit;
- absolute difference;
- status.

---

# 9. Tahap F — Audit Ulang Sembilan Aset

Untuk setiap aset ekspor:

- kategori;
- bobot;
- nilai mentah;
- normalisasi;
- kontribusi per kriteria;
- nilai preferensi mentah;
- nilai preferensi setelah clamp;
- harga referensi;
- nilai limit sistem;
- nilai limit workbook;
- selisih;
- ranking;
- tingkat keyakinan.

## Toleransi

```text
preferensi = 1e-12
nilai rupiah = Rp1
```

## Assertion

```text
jumlah baris audit = 9
tidak ada fixture
seluruh aset PASS
maksimum selisih preferensi <= 1e-12
```

## Output

```text
Final_Evidence_V2/03_Computational_Verification/audit_9_assets.json
Final_Evidence_V2/03_Computational_Verification/audit_9_assets.csv
Final_Evidence_V2/03_Computational_Verification/audit_9_assets.xlsx
```

---

# 10. Tahap G — Uji Ulang Test Case Bermasalah

## TC-06 — URL duplikat

### Setup

1. buat satu record pembanding valid;
2. ambil snapshot setelah record pertama tersimpan;
3. kirim URL ekuivalen dengan parameter tracking berbeda.

### Assertion

```text
canonical count before = 1
canonical count after = 1
duplicate request ditolak
HTTP = 409 atau 422
```

### Evidence

- request pertama;
- response pertama;
- request duplikat;
- response duplikat;
- DB before duplicate;
- DB after duplicate;
- canonical URL/hash.

---

## TC-08 — Seluruh pembanding bersyarat

### Fixture

Minimal tiga record:

```text
status = MENUNGGU/PERLU_TINJAU
DITERIMA = 0
```

### Assertion

```text
jumlahTotal >= 3
jumlahEligible = 0
median = null
tingkatKeyakinan = TIDAK_CUKUP
nilaiLimit = null
```

---

## TC-11 — Floating-point > 1

### Fixture

Buat jalur pengujian yang benar-benar menghasilkan:

```text
rawPreference = 1.0000000000000002
```

### Assertion

```text
safePreference = 1
storedPreference = 1
nilaiLimit <= hargaReferensi
```

Pastikan status aset mengizinkan perhitungan.

---

## TC-12 — Ranking seri

### Fixture

Dua aset harus menghasilkan preferensi identik.

### Pengujian

Jalankan endpoint 20 kali.

### Assertion

```text
dua aset memiliki preferensi sama
peringkat seri atau tie-breaker eksplisit
urutan stabil 20/20
```

Simpan aturan ranking pada kode dan dokumentasi.

---

## TC-15 — Rollback transaksi

### Setup

Gunakan aset dengan status yang valid untuk transaksi.

### Fault injection

```javascript
if (NODE_ENV === "test" && forceRollback) {
  throw new Error("FAULT_INJECTION_TC15");
}
```

### Assertion

```text
transaksi benar-benar dimulai
insert/update sementara terjadi
fault injection terpanggil
rollback terjadi
DB before = DB after
tidak ada record hasil
status aset tidak berubah
```

Simpan correlation ID.

---

## TC-17 — Upload tidak valid

Kirim multipart nyata untuk:

1. `.sh`;
2. `.pdf.exe`;
3. PDF palsu;
4. MIME tidak sesuai;
5. file terlalu besar;
6. path traversal.

### Assertion

- 400/413/415;
- database tidak berubah;
- storage tidak berubah;
- temporary file dibersihkan;
- nama path server tidak bocor.

---

## TC-18 — URL tidak aktif

### Setup

Record awal:

```text
status = AKTIF
canonical URL sesuai source URL
```

### Mock

- 404;
- 410;
- timeout;
- 500.

### Assertion

```text
status awal = AKTIF
status akhir 404/410 = TIDAK_VALID
timeout/500 = PERLU_TINJAU atau retry
lastCheckedAt terisi
lastHttpStatus terisi
canonical URL/hash tetap konsisten
data tidak digunakan dalam median
```

---

# 11. Tahap H — Lengkapi Evidence Test Case yang Hilang

Tambahkan evidence lengkap untuk:

- TC-01;
- TC-02;
- TC-03;
- TC-04;
- TC-09;
- TC-13;
- TC-14;
- TC-16.

Setiap folder wajib berisi:

```text
TC-XX/
├── metadata.json
├── request.json
├── response.json
├── ui.png
├── network.json
├── backend.log
├── db_before.json
├── db_after.json
├── storage_before.txt
├── storage_after.txt
└── result.md
```

Apabila suatu bukti tidak relevan, isi file dengan alasan:

```text
NOT_APPLICABLE: test case tidak menggunakan file storage.
```

Jangan menghilangkan file tanpa penjelasan.

---

# 12. Tahap I — Perbaiki Ekspor Screenshot

Masalah lama: PNG rusak karena dibaca sebagai teks UTF-8.

## Aturan

- jangan gunakan `readFile(path, "utf8")` untuk file biner;
- gunakan `copyFile`;
- gunakan `readFile` tanpa encoding;
- jangan melakukan regex redaction pada file gambar;
- sanitasi hanya JSON, CSV, TXT, MD, dan LOG.

## Validasi

Setiap PNG harus:

- memiliki signature `89 50 4E 47`;
- dapat dibuka dengan image decoder;
- memiliki ukuran > 0;
- menampilkan test case yang sesuai;
- tidak identik dengan test case lain kecuali memang relevan.

Buat:

```text
Final_Evidence_V2/04_Test_Cases/image_validation.csv
```

Kolom:

```text
file
signature_valid
decoder_valid
width
height
sha256
status
```

---

# 13. Tahap J — Perbaiki Generator Ringkasan

Generator harus membaca field metadata yang benar.

Contoh metadata:

```json
{
  "testCaseId": "TC-01",
  "title": "Password salah",
  "expectedResult": "Login ditolak",
  "actualResult": "HTTP 401",
  "validationType": "API_UI_DATABASE",
  "status": "PASS"
}
```

Output `test_case_summary.csv` wajib memiliki:

```text
test_case_id
title
expected_result
actual_result
expected_http
actual_http
ui_status
api_status
database_status
storage_status
final_status
evidence_path
notes
```

Tidak boleh ada nilai `undefined`.

---

# 14. Tahap K — Hasilkan XLSX Asli

File `.xlsx` harus berupa ZIP Open XML valid.

Gunakan library spreadsheet yang tersedia, misalnya:

- ExcelJS;
- SheetJS;
- library lain yang benar-benar menghasilkan XLSX.

Jangan:

- menulis CSV lalu mengganti ekstensi menjadi `.xlsx`.

## Workbook minimal

Sheet:

1. `Ringkasan_Test_Case`
2. `Audit_9_Aset`
3. `Bobot_AHP`
4. `Data_Pembanding`
5. `Tingkat_Keyakinan`
6. `End_to_End`
7. `Siklus_Lelang`
8. `Metadata`

Validasi dengan membuka ulang workbook melalui library.

---

# 15. Tahap L — Pengujian End-to-End

Jalankan satu aset nyata dari dataset final untuk setiap kategori:

- Tanah dan Bangunan;
- Kendaraan;
- Elektronik.

## Alur

```text
penjual login
→ input aset
→ upload dokumen
→ input atribut
→ data pembanding tersedia
→ median dihitung
→ nilai kriteria tersimpan
→ SAW dihitung
→ nilai limit tampil
→ admin memverifikasi
```

## Data wajib

- asset ID;
- category ID;
- jumlah kriteria;
- jumlah pembanding;
- median;
- preferensi;
- nilai limit;
- tingkat keyakinan;
- status akhir;
- waktu eksekusi.

## Evidence mentah

Simpan per kategori:

```text
06_End_to_End/<CATEGORY>/
```

dengan UI, API, log, DB, dan storage.

Ringkasan tanpa evidence mentah tidak boleh dinyatakan PASS.

---

# 16. Tahap M — Satu Siklus Lelang Terintegrasi

Gunakan satu aset hasil E2E.

## Alur

```text
aset diverifikasi
→ lelang dibuat
→ jadwal aktif
→ dua atau lebih pembeli terverifikasi
→ penawaran masuk
→ lelang ditutup
→ pemenang ditentukan
→ hasil disimpan
```

## Data wajib

- asset ID;
- auction ID;
- nilai limit;
- harga pembukaan;
- jumlah bidder;
- jumlah penawaran;
- harga penawaran tertinggi;
- pemenang;
- waktu mulai;
- waktu selesai;
- status akhir.

## Assertion

- harga penawaran tidak di bawah aturan minimum;
- peserta tidak sah ditolak;
- pemenang adalah penawaran tertinggi yang valid;
- status lelang final konsisten;
- transaksi database konsisten.

---

# 17. Tahap N — Tingkat Keyakinan Pembanding

Hitung tingkat keyakinan untuk sembilan aset berdasarkan:

- jumlah diterima;
- jumlah bersyarat;
- rentang/median;
- homogenitas spesifikasi;
- status URL.

Gunakan aturan yang telah disetujui penelitian.

Output:

```text
comparison_confidence_summary.csv
```

Kolom:

```text
asset
accepted_count
conditional_count
total_count
min_price
max_price
median
range_to_median_ratio
confidence_level
confidence_reason
```

Jangan menghasilkan `TIDAK_CUKUP` apabila 45 data final telah terimpor benar.

---

# 18. Tahap O — SHA Commit dan Build Final

Setelah semua pengujian selesai:

```bash
git status
git add .
git commit -m "Finalize JCIS research dataset and evidence"
git rev-parse HEAD
```

Gunakan SHA lengkap 40 karakter.

Buat nomor build:

```text
JCIS-FINAL-YYYYMMDD-HHMM
```

Simpan pada setiap metadata test case.

Dilarang menggunakan:

```text
latest
main-current
newest
```

---

# 19. Tahap P — Sanitasi Evidence

Sanitasi hanya file teks.

Redaksi:

```text
JWT
password
email pribadi
nomor rekening
KTP/NPWP
secret
path lokal
URL dokumen pribadi
stack trace sensitif
```

Gunakan:

```text
[REDACTED_JWT]
[REDACTED_EMAIL]
[REDACTED_ACCOUNT]
[REDACTED_SECRET]
```

File biner harus disalin tanpa diubah.

Setelah sanitasi:

- validasi seluruh JSON;
- validasi seluruh CSV;
- validasi seluruh PNG;
- validasi XLSX;
- hitung SHA-256 seluruh file.

---

# 20. Struktur Folder Akhir

```text
Final_Evidence_V2/
├── 01_Source_Version/
├── 02_Data_Import/
├── 03_Computational_Verification/
├── 04_Test_Cases/
├── 05_Comparison_Confidence/
├── 06_End_to_End/
├── 07_Auction_Cycle/
├── 08_UAT/
├── 09_Sensitivity/
├── 10_Practitioner_Validation/
└── 11_Journal_Output/
```

---

# 21. Tabel yang Harus Dihasilkan untuk Jurnal

AI Agent harus menghasilkan:

1. tabel CR individual dan kelompok;
2. tabel bobot Group AHP;
3. tabel ringkasan 45 pembanding;
4. tabel median sembilan aset;
5. tabel tingkat keyakinan pembanding;
6. tabel hasil SAW dan nilai limit;
7. tabel verifikasi aplikasi vs workbook;
8. tabel SAW vs TOPSIS;
9. tabel sensitivitas;
10. tabel 18 test case;
11. tabel E2E tiga kategori;
12. tabel siklus lelang;
13. tabel UAT;
14. template validasi praktisi.

Simpan:

```text
Final_Evidence_V2/11_Journal_Output/tabel_jurnal.md
Final_Evidence_V2/11_Journal_Output/tabel_jurnal.xlsx
```

---

# 22. Definition of Done

Pekerjaan dinyatakan selesai hanya jika:

- [ ] 45 pembanding final terimpor;
- [ ] jumlah diterima = 26;
- [ ] jumlah bersyarat = 19;
- [ ] median sembilan aset sama dengan acuan;
- [ ] bobot Group AHP final terimpor;
- [ ] sembilan aset dan skor final terimpor;
- [ ] `Aset Tunggal Jurnal` tidak masuk audit utama;
- [ ] audit Honda Beat benar;
- [ ] audit sembilan aset berjumlah tepat sembilan;
- [ ] seluruh audit komputasional PASS;
- [ ] TC-06, 08, 11, 12, 15, 17, 18 diuji ulang secara sah;
- [ ] TC-01–04, 09, 13, 14, 16 memiliki evidence lengkap;
- [ ] seluruh PNG valid;
- [ ] generator ringkasan tidak menghasilkan `undefined`;
- [ ] XLSX dapat dibuka ulang;
- [ ] tiga E2E memiliki evidence mentah;
- [ ] satu siklus lelang memiliki evidence mentah;
- [ ] tingkat keyakinan sembilan aset tersedia;
- [ ] seluruh metadata memakai SHA commit lengkap;
- [ ] evidence telah disanitasi;
- [ ] laporan akhir tersedia.

---
