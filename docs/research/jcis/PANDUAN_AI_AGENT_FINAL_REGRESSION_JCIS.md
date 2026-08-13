# PANDUAN EKSEKUSI AI AGENT
## Finalisasi Implementasi, Pengujian, dan Evidence Jurnal JCIS

Dokumen ini digunakan untuk memerintahkan AI Agent melakukan perbaikan terakhir pada sistem lelang berbasis Group AHP–SAW, menjalankan ulang pengujian, serta menghasilkan data dan evidence yang sah untuk artikel jurnal JCIS.

Fokus utama:

1. mengunci satu metode normalisasi;
2. menyelaraskan sistem, workbook, TOPSIS, sensitivitas, dan naskah;
3. melakukan audit komputasional independen;
4. menguji ulang test case yang belum sah;
5. melengkapi evidence parsial;
6. menyelesaikan end-to-end tiga kategori;
7. menyelesaikan satu siklus lelang aktual;
8. memperbaiki screenshot dan tingkat keyakinan;
9. menghasilkan laporan berdasarkan assertion otomatis.

---

# 1. Keputusan Metodologis Final

Gunakan **SAW dengan normalisasi relatif**, sesuai naskah jurnal.

## 1.1. Normalisasi benefit

\[
r_{ij} = \frac{x_{ij}}{\max_i(x_{ij})}
\]

## 1.2. Normalisasi cost

\[
r_{ij} = \frac{\min_i(x_{ij})}{x_{ij}}
\]

## 1.3. Nilai preferensi

\[
V_i = \sum_{j=1}^{n} w_j r_{ij}
\]

## 1.4. Nilai limit

\[
NL_i = V_i \times HP_i
\]

Keterangan:

- \(x_{ij}\): nilai alternatif ke-\(i\) pada kriteria ke-\(j\);
- \(r_{ij}\): nilai normalisasi;
- \(w_j\): bobot Group AHP;
- \(V_i\): nilai preferensi SAW;
- \(HP_i\): median harga pembanding;
- \(NL_i\): rekomendasi nilai limit awal.

AI Agent dilarang menggunakan normalisasi skala tetap 1–5 pada hasil final.

---

# 2. Prinsip Kerja Wajib

AI Agent wajib:

- bekerja pada branch khusus;
- menggunakan database pengujian terpisah;
- memakai dataset penelitian final;
- tidak membuat data pakar, praktisi, responden, atau harga baru;
- tidak mengubah angka agar pengujian lulus;
- tidak memberi status PASS bila assertion gagal;
- menyimpan seluruh bukti mentah;
- menggunakan SHA commit Git lengkap;
- menyamarkan data sensitif;
- menghasilkan laporan dari hasil assertion otomatis.

AI Agent dilarang:

- memakai `latest` sebagai commit;
- menggunakan fixture lama sebagai data penelitian;
- memasukkan `Aset Tunggal Jurnal` ke audit sembilan aset;
- mencampur SAW relatif dan skala tetap;
- menulis PASS hanya karena endpoint merespons;
- menganggap HTTP 404 sebagai validasi berhasil;
- menggunakan screenshot yang sama untuk test case berbeda;
- menyimpan file PNG sebagai UTF-8;
- membuat XLSX palsu dari CSV.

---

# 3. Repository dan Environment

## 3.1. Buat branch

```bash
git checkout -b research/jcis-final-regression
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
Final_Evidence_V3/01_Source_Version/environment.txt
```

## 3.3. Gunakan database pengujian

Contoh:

```env
NODE_ENV=test
DATABASE_URL=mysql://USER:PASSWORD@localhost:3306/lelang_jcis_final_regression
```

Jangan gunakan database produksi.

---

# 4. Sumber Data Penelitian

Gunakan hanya:

```text
Group_AHP_Bukti_Autentik_Terverifikasi.xlsx
Data_Pembanding_45_Aset_Lelang_Validasi_Median.xlsx
Lampiran_Analisis_Revisi_JCIS_Final.xlsx
```

Apabila salah satu file tidak tersedia:

- hentikan impor;
- tandai `BLOCKED`;
- laporkan file yang hilang;
- jangan membuat data pengganti.

---

# 5. Sinkronisasi Sistem, Workbook, TOPSIS, Sensitivitas, dan Naskah

AI Agent harus memastikan komponen berikut memakai data dan metode yang sama:

| Komponen | Wajib konsisten |
|---|---|
| Backend | Normalisasi relatif |
| Frontend | Menampilkan hasil backend |
| Workbook | Formula SAW relatif |
| TOPSIS | Dataset dan bobot sama |
| Sensitivitas | Bobot dan alternatif sama |
| Naskah | Persamaan, tabel, dan hasil sama |
| Evidence | Angka identik dengan sistem final |

## 5.1. Validasi sembilan aset

Hanya sembilan aset berikut:

1. Rumah Tipe 45/90
2. Ruko 2 Lantai
3. Tanah Kavling
4. Toyota Avanza 2019
5. Honda Beat 2021
6. Mitsubishi Xpander 2018
7. Laptop Lenovo ThinkPad 2021
8. iPhone 12 128GB
9. Kamera Canon EOS 700D

## 5.2. Median acuan

| Aset | Median |
|---|---:|
| Rumah Tipe 45/90 | Rp690.000.000 |
| Ruko 2 Lantai | Rp1.800.000.000 |
| Tanah Kavling | Rp250.000.000 |
| Toyota Avanza 2019 | Rp150.000.000 |
| Honda Beat 2021 | Rp12.900.000 |
| Mitsubishi Xpander 2018 | Rp179.000.000 |
| ThinkPad 2021 | Rp5.850.000 |
| iPhone 12 128GB | Rp5.800.000 |
| Canon EOS 700D | Rp3.300.000 |

Jika median tidak cocok, jangan lanjutkan.

---

# 6. Audit Sistem–Workbook yang Benar-Benar Independen

Workbook harus memiliki formula aktif, bukan angka hardcoded.

## 6.1. Sheet minimal

1. `Bobot_AHP`
2. `Matriks_Keputusan`
3. `Normalisasi_SAW`
4. `Kontribusi_Kriteria`
5. `Preferensi`
6. `Harga_Pembanding`
7. `Nilai_Limit`
8. `Verifikasi_Sistem`

## 6.2. Data yang dibandingkan per aset

- nilai mentah;
- nilai normalisasi;
- kontribusi setiap kriteria;
- preferensi sistem;
- preferensi workbook;
- selisih absolut;
- median sistem;
- median workbook;
- nilai limit sistem;
- nilai limit workbook;
- selisih nilai limit;
- status.

## 6.3. Toleransi

```text
preferensi <= 1e-12
nilai rupiah <= Rp1
```

## 6.4. Output

```text
Final_Evidence_V3/03_Computational_Verification/
├── audit_9_assets.csv
├── audit_9_assets.xlsx
├── audit_9_assets.json
├── workbook_formula_reference.txt
└── verification_summary.md
```

Assertion:

```text
jumlah aset = 9
seluruh aset PASS
tidak ada fixture
```

---

# 7. Uji Ulang Test Case yang Belum Sah

## TC-05 — Total bobot tidak sama dengan satu

### Setup

Kirim bobot total:

```text
1,5
```

### Expected

```text
HTTP 422
code = INVALID_TOTAL_WEIGHT
database tidak berubah
UI menampilkan pesan validasi
```

HTTP 404 adalah FAIL.

---

## TC-06 — URL canonical duplikat

### Setup

1. simpan satu URL valid;
2. ambil snapshot database;
3. kirim URL yang sama dengan parameter tracking berbeda.

### Expected

```text
canonical count before = 1
canonical count after = 1
HTTP 409 atau 422
duplicate rejected = true
```

---

## TC-09 — Harga negatif

### Input

```text
harga = -100000
```

### Expected

```text
HTTP 400/422
data tidak tersimpan
UI menampilkan pesan
```

Tambahkan satu pengujian harga nol.

---

## TC-11 — Clamp floating-point

### Fixture

Buat jalur yang menghasilkan:

```text
rawPreference = 1.0000000000000002
```

### Expected

```text
safePreference = 1
storedPreference = 1
nilaiLimit <= hargaReferensi
```

`undefined` adalah FAIL.

---

## TC-12 — Ranking seri

### Fixture

Dua aset harus memiliki preferensi identik.

### Eksekusi

Jalankan 20 kali.

### Expected

```text
dua nilai identik
stable = true
stableCount = 20
```

Aturan:

- tampilkan peringkat bersama; atau
- gunakan tie-breaker eksplisit.

---

## TC-13 — Bobot negatif

### Input

```text
bobot = -0,1
```

### Expected

```text
HTTP 400/422
bobot ditolak
database tidak berubah
```

HTTP 404 adalah FAIL.

---

## TC-16 — XSS

### Payload

```html
<script>alert("XSS")</script>
<img src=x onerror=alert(1)>
<svg onload=alert(1)>
```

### Expected

- endpoint menerima/menolak sesuai kebijakan;
- payload tidak dieksekusi;
- `window.alert` tidak terpanggil;
- DOM menampilkan teks aman;
- tidak ada executable node;
- database dan UI konsisten.

HTTP 404 adalah FAIL.

---

# 8. Lengkapi Test Case Parsial

## TC-15 — Rollback transaksi

Wajib memuat:

- endpoint;
- record target;
- transaction start;
- insert/update sementara;
- fault injection;
- rollback;
- database sebelum dan sesudah;
- status aset sebelum dan sesudah;
- correlation ID.

Assertion:

```text
DB before = DB after
record hasil tidak ada
status aset tidak berubah
```

---

## TC-17 — Upload tidak valid

Uji multipart nyata:

1. `.sh`;
2. `.pdf.exe`;
3. MIME mismatch;
4. fake PDF;
5. file terlalu besar;
6. path traversal.

Assertion:

- 400/413/415;
- database tidak berubah;
- storage tidak berubah;
- temp file dibersihkan.

---

## TC-18 — URL tidak aktif

Gunakan mock:

- 404;
- 410;
- timeout;
- 500.

Expected:

| Kondisi | Status |
|---|---|
| 404 | TIDAK_VALID |
| 410 | TIDAK_VALID |
| timeout | PERLU_TINJAU |
| 500 | PERLU_TINJAU |

Simpan:

- lastCheckedAt;
- lastHttpStatus;
- retryCount;
- validationReason.

---

# 9. End-to-End Tiga Kategori

Jalankan satu aset untuk setiap kategori:

- Tanah dan Bangunan;
- Kendaraan;
- Elektronik.

## Alur wajib

```text
login penjual
→ input aset
→ upload dokumen
→ input atribut kategori
→ validasi pembanding
→ hitung median
→ input nilai kriteria
→ hitung SAW
→ nilai preferensi terisi
→ nilai limit terisi
→ admin memverifikasi
```

## Assertion

```text
preference != null
nilaiLimit != null
hasil database != null
status akhir sesuai
```

Metadata PASS hanya boleh diberikan jika seluruh assertion terpenuhi.

## Evidence

```text
06_End_to_End/<CATEGORY>/
├── metadata.json
├── ui_step_01.png
├── ui_step_02.png
├── ...
├── request.json
├── response.json
├── backend.log
├── db_before.json
├── db_after.json
└── result.md
```

---

# 10. Siklus Lelang Aktual

Gunakan satu aset hasil E2E.

## Alur

```text
aset diverifikasi
→ lelang dibuat
→ auctionId terbentuk
→ jadwal aktif
→ dua pembeli terverifikasi
→ bid pertama
→ bid kedua
→ lelang ditutup
→ pemenang ditentukan
```

## Data wajib

- assetId;
- auctionId;
- bidId;
- userId peserta;
- nilai limit;
- harga pembukaan;
- jumlah bidder;
- jumlah penawaran;
- harga tertinggi;
- pemenang;
- waktu mulai;
- waktu selesai;
- status akhir.

Assertion:

```text
auctionId != null
jumlah bidder >= 2
jumlah bid >= 2
winner sesuai bid tertinggi valid
```

Screenshot rusak adalah FAIL.

---

# 11. Regenerasi Screenshot

## Aturan file biner

- gunakan `copyFile`;
- jangan membaca PNG sebagai UTF-8;
- jangan melakukan regex pada file gambar;
- sanitasi hanya file teks.

## Validasi

Setiap screenshot harus:

- signature PNG valid;
- dapat dibuka;
- memiliki ukuran;
- menampilkan skenario yang sesuai;
- unik untuk test case terkait.

## Output

```text
image_validation.csv
```

Kolom:

```text
file
signature_valid
decoder_valid
width
height
sha256
duplicate_group
status
```

---

# 12. Fungsi Tingkat Keyakinan

Gunakan satu fungsi saja.

Contoh:

```javascript
function determineConfidence({
  acceptedCount,
  conditionalCount,
  rangeToMedianRatio
}) {
  if (acceptedCount < 2) {
    return "RENDAH";
  }

  if (acceptedCount >= 3 && rangeToMedianRatio <= 0.30) {
    return "TINGGI";
  }

  if (acceptedCount >= 2 && rangeToMedianRatio <= 0.50) {
    return "SEDANG";
  }

  return "RENDAH";
}
```

AI Agent harus:

- menyimpan alasan;
- menggunakan fungsi yang sama pada backend, laporan, dan E2E;
- memastikan Avanza, ThinkPad, Honda Beat, dan aset lain tidak memiliki status berbeda antarfile.

Output:

```text
comparison_confidence_summary.csv
```

---

# 13. Laporan Berdasarkan Assertion Otomatis

Laporan tidak boleh memberi PASS hanya karena:

- response tersedia;
- file ada;
- endpoint menjawab 404;
- screenshot tersedia.

## Status

### PASS

Semua assertion terpenuhi.

### FAIL

Minimal satu assertion gagal.

### BLOCKED

Dependensi tidak tersedia.

### INCOMPLETE

Evidence tidak lengkap.

## Generator laporan

Setiap test case harus memiliki:

```json
{
  "testCaseId": "TC-05",
  "expectedHttp": 422,
  "actualHttp": 422,
  "assertions": {
    "httpMatch": true,
    "databaseUnchanged": true,
    "uiMessageShown": true
  },
  "status": "PASS"
}
```

Status akhir dihitung otomatis:

```javascript
const allPassed = Object.values(assertions).every(Boolean);
status = allPassed ? "PASS" : "FAIL";
```

---

# 14. Struktur Evidence Akhir

```text
Final_Evidence_V3/
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

# 15. Tabel Jurnal yang Harus Dihasilkan

1. CR individual dan kelompok;
2. bobot Group AHP;
3. ringkasan 45 pembanding;
4. median sembilan aset;
5. tingkat keyakinan;
6. hasil SAW;
7. nilai limit;
8. sistem vs workbook;
9. SAW vs TOPSIS;
10. sensitivitas;
11. hasil 18 test case;
12. E2E tiga kategori;
13. siklus lelang;
14. UAT.

Simpan:

```text
tabel_jurnal.md
tabel_jurnal.xlsx
```

XLSX harus valid dan dapat dibuka ulang.

---

# 16. Definition of Done

Pekerjaan selesai hanya jika:

- [ ] SAW relatif digunakan;
- [ ] sistem dan workbook konsisten;
- [ ] audit sembilan aset independen;
- [ ] seluruh sembilan aset PASS;
- [ ] TC-05, 06, 09, 11, 12, 13, 16 diuji ulang;
- [ ] TC-15, 17, 18 lengkap;
- [ ] 18 test case dihitung dari assertion;
- [ ] E2E tiga kategori menghasilkan preferensi dan nilai limit;
- [ ] siklus lelang menghasilkan auctionId dan bidId;
- [ ] seluruh screenshot valid dan unik;
- [ ] tingkat keyakinan konsisten;
- [ ] commit SHA lengkap;
- [ ] evidence telah disanitasi;
- [ ] laporan akhir dan tabel jurnal tersedia.

---

# 17. Prompt Utama untuk AI Agent

```text
Pelajari seluruh repository dan evidence V2. Kerjakan pada branch research/jcis-final-regression dan database pengujian terpisah.

Tetapkan SAW normalisasi relatif sebagai metode final. Gunakan rumus benefit x/max, cost min/x, preferensi Σ(w×r), dan nilai limit preferensi×median. Hapus penggunaan normalisasi skala tetap dari hasil final.

Selaraskan backend, frontend, workbook, TOPSIS, sensitivitas, dan naskah. Gunakan sembilan aset dan 45 data pembanding final. Jangan memasukkan fixture ke hasil utama.

Buat workbook independen dengan formula aktif. Bandingkan nilai normalisasi, kontribusi kriteria, preferensi, median, dan nilai limit antara sistem dan workbook. Gunakan toleransi 1e-12 dan Rp1.

Uji ulang TC-05, TC-06, TC-09, TC-11, TC-12, TC-13, dan TC-16. Lengkapi TC-15, TC-17, dan TC-18. HTTP 404 tidak boleh dianggap PASS.

Jalankan E2E tiga kategori sampai preference, nilaiLimit, dan record hasil tidak null. Jalankan satu siklus lelang aktual sampai auctionId, bidId, bidder, harga akhir, dan pemenang terbentuk.

Regenerasi screenshot sebagai file biner yang valid dan unik. Terapkan satu fungsi tingkat keyakinan. Buat laporan berdasarkan assertion otomatis.

Gunakan SHA commit Git lengkap dan build unik. Sanitasi data sensitif tanpa merusak file biner.

Hasilkan Final_Evidence_V3, FINAL_IMPLEMENTATION_AND_TEST_REPORT_V3.md, test_case_summary.csv, audit_9_assets.xlsx, comparison_confidence_summary.csv, end_to_end_summary.csv, auction_cycle_summary.csv, tabel_jurnal.md, dan tabel_jurnal.xlsx.

Jangan menyembunyikan kegagalan. Jangan memberi PASS apabila assertion atau evidence belum lengkap.
```
