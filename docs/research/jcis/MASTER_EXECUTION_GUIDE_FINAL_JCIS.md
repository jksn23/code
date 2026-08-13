# MASTER EXECUTION GUIDE — FINALISASI JURNAL JCIS SEKALI JALAN
## Sistem Rekomendasi Nilai Limit Aset Lelang Berbasis Group AHP–SAW

Dokumen ini adalah **panduan induk final** untuk AI Agent. Semua pekerjaan di bawah harus dikerjakan dalam satu alur terkontrol sampai menghasilkan paket evidence dan naskah yang siap direvisi final.

Tujuan utamanya bukan sekadar membuat sistem “berjalan”, tetapi memastikan:

1. metode penelitian konsisten;
2. data penelitian tidak berubah;
3. hasil sistem dapat direplikasi;
4. pengujian benar-benar memicu kondisi yang diuji;
5. seluruh bukti dapat diaudit;
6. tabel dan angka jurnal identik dengan sistem final;
7. tidak ada lagi pekerjaan teknis tersembunyi setelah paket selesai.

---

# 0. PERATURAN KERJA YANG TIDAK BOLEH DILANGGAR

AI Agent wajib:

- bekerja pada branch khusus;
- memakai database pengujian terpisah;
- menggunakan dataset final sebagai satu-satunya sumber kebenaran;
- tidak membuat data pakar, praktisi, responden, aset, atau harga baru;
- tidak mengganti angka penelitian agar test lulus;
- tidak memberi status PASS bila kondisi inti tidak terpicu;
- mempertahankan seluruh FAIL dalam laporan;
- menggunakan SHA commit Git lengkap;
- menggunakan nomor build unik;
- menyimpan bukti UI, API, backend, database, dan storage;
- menyamarkan data sensitif;
- menghasilkan laporan akhir dari assertion otomatis.

AI Agent dilarang:

- menggunakan `latest` sebagai commit;
- memakai database produksi;
- memakai fixture sebagai data penelitian;
- menguji test case negatif pada aset `RESEARCH_FINAL`;
- mencampur SAW relatif dan normalisasi skala tetap;
- menganggap HTTP 404 sebagai validasi berhasil;
- memakai screenshot placeholder;
- memakai PNG 1×1;
- memakai screenshot yang sama untuk test case berbeda;
- menyimpan file biner sebagai UTF-8;
- membuat XLSX palsu dari CSV;
- menulis 18/18 PASS jika satu assertion gagal;
- mengisi validasi praktisi dengan data buatan.

---

# 1. KUNCI METODOLOGI FINAL

Gunakan **SAW normalisasi relatif**.

## 1.1. Benefit

\[
r_{ij} = \frac{x_{ij}}{\max_i(x_{ij})}
\]

## 1.2. Cost

\[
r_{ij} = \frac{\min_i(x_{ij})}{x_{ij}}
\]

## 1.3. Preferensi

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
- \(V_i\): nilai preferensi;
- \(HP_i\): median harga pembanding;
- \(NL_i\): rekomendasi nilai limit awal.

## 1.5. Clamp floating-point

```javascript
function clampPreference(value) {
  if (!Number.isFinite(value)) {
    throw new Error("Preference must be finite");
  }

  return Math.min(1, Math.max(0, value));
}
```

Simpan:

```text
rawPreference
safePreference
```

## 1.6. Lifecycle hasil

### Setelah median

```text
hargaReferensiPasar != null
nilaiPreferensi = null
nilaiLimit = null
status = MENUNGGU_PERHITUNGAN_SAW
```

### Setelah SAW

```text
nilaiPreferensi != null
nilaiLimit = nilaiPreferensi × hargaReferensiPasar
status = MENUNGGU_VERIFIKASI
```

---

# 2. DATASET PENELITIAN FINAL

Gunakan hanya:

```text
Group_AHP_Bukti_Autentik_Terverifikasi.xlsx
Data_Pembanding_45_Aset_Lelang_Validasi_Median.xlsx
Lampiran_Analisis_Revisi_JCIS_Final.xlsx
```

Jika salah satu file tidak tersedia:

- hentikan proses utama;
- tandai `BLOCKED`;
- jangan membuat data pengganti.

## 2.1. Sembilan aset

1. Rumah Tipe 45/90
2. Ruko 2 Lantai
3. Tanah Kavling
4. Toyota Avanza 2019
5. Honda Beat 2021
6. Mitsubishi Xpander 2018
7. Laptop Lenovo ThinkPad 2021
8. iPhone 12 128GB
9. Kamera Canon EOS 700D

## 2.2. Median final

| Aset | Median |
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

## 2.3. Komposisi pembanding

```text
jumlah aset = 9
jumlah pembanding per aset = 5
jumlah total = 45
LAYAK = 26
PERLU_TINJAU = 19
```

## 2.4. Scope data

Gunakan field:

```text
dataset_scope = RESEARCH_FINAL
dataset_scope = TEST_FIXTURE
```

Seluruh test case negatif wajib memakai `TEST_FIXTURE`.

---

# 3. PERSIAPAN REPOSITORY

## 3.1. Branch

```bash
git checkout -b research/jcis-master-final
```

## 3.2. Environment

```env
NODE_ENV=test
DATABASE_URL=mysql://USER:PASSWORD@localhost:3306/lelang_jcis_master_final
```

## 3.3. Rekam versi

```bash
git rev-parse HEAD
git branch --show-current
node --version
npm --version
npx prisma -v
mysql --version
```

Simpan ke:

```text
Final_Package_JCIS/01_Source_Version/environment.txt
```

---

# 4. AUDIT DAN SINKRONISASI DATABASE

## 4.1. Pemetaan schema

Buat:

```text
Final_Package_JCIS/02_Data_Import/schema_mapping.md
```

Isi:

| Sumber | Sheet/kolom | Tabel | Kolom | Transformasi | Validasi |
|---|---|---|---|---|---|

## 4.2. Impor bobot Group AHP

Impor:

- kategori;
- kriteria;
- tipe benefit/cost;
- bobot presisi penuh;
- CR individual;
- CR kelompok;
- versi bobot.

Assertion:

```text
jumlah bobot kategori = 1 ± 1e-12
seluruh bobot > 0
CR individual <= 0,10
CR kelompok <= 0,10
```

Dilarang membulatkan bobot menjadi enam desimal di database.

## 4.3. Impor sembilan aset dan skor

Assertion:

```text
jumlah RESEARCH_FINAL = 9
seluruh kriteria terisi
skor dalam rentang valid
tidak ada fixture
```

## 4.4. Impor 45 pembanding

Assertion:

```text
jumlah total = 45
5 pembanding per aset
26 LAYAK
19 PERLU_TINJAU
harga > 0
canonical hash unik
tanggal akses tersedia
```

## 4.5. Validasi median

Median sistem harus sama dengan tabel acuan.

Jika satu median berbeda:

- jangan lanjutkan;
- periksa duplikasi;
- periksa status;
- periksa outlier;
- periksa aturan median;
- periksa kontaminasi fixture.

---

# 5. ISOLASI TEST CASE

Setiap test harus memakai:

```text
setup fixture
→ snapshot before
→ execute
→ assertions
→ snapshot after
→ cleanup
```

Tambahkan:

```text
test_run_id
fixture_id
correlation_id
```

Setelah setiap test:

- hapus fixture;
- pastikan RESEARCH_FINAL tidak berubah;
- validasi hash dataset penelitian.

Buat assertion global:

```text
research_dataset_hash_before = research_dataset_hash_after
```

---

# 6. PERBAIKAN IMPLEMENTASI WAJIB

## 6.1. Total bobot

Input total bobot tidak sama dengan satu:

```text
HTTP 422
code = INVALID_TOTAL_WEIGHT
DB tidak berubah
```

## 6.2. Bobot negatif

```text
HTTP 400/422
code = NEGATIVE_WEIGHT
DB tidak berubah
```

## 6.3. URL canonical duplikat

Canonicalization mencakup:

- tracking query;
- fragment;
- trailing slash;
- hostname case;
- query order.

Expected:

```text
HTTP 409/422
count before = count after
```

## 6.4. Harga negatif dan nol

```text
HTTP 400/422
harga tidak tersimpan
```

## 6.5. Outlier

Gunakan fixture lima harga dengan satu outlier jelas.

Expected:

```text
outliersCount = 1
outliersFlagged = 1
median dihitung dari non-outlier
```

Jangan menggunakan aset penelitian.

## 6.6. Ranking seri

Dua fixture harus memiliki preferensi identik.

Run:

```text
20 kali
```

Expected:

```text
rA != -1
rB != -1
stable = true
stableCount = 20
```

## 6.7. XSS

Uji:

```html
<script>alert("XSS")</script>
<img src=x onerror=alert(1)>
<svg onload=alert(1)>
```

Expected:

- endpoint tidak 404;
- payload tidak dieksekusi;
- `window.alert` tidak terpanggil;
- DOM aman;
- data tampil sebagai teks atau ditolak.

## 6.8. Upload invalid

Uji multipart nyata:

1. `.sh`;
2. `.pdf.exe`;
3. MIME mismatch;
4. fake PDF;
5. oversized;
6. path traversal.

Expected:

| Kondisi | HTTP |
|---|---:|
| tipe tidak didukung | 415 |
| file terlalu besar | 413 |
| request invalid | 400 |

Storage dan database tidak berubah.

## 6.9. URL mati

Mock:

- 404;
- 410;
- timeout;
- 500.

Expected:

| Kondisi | Status |
|---|---|
| 404/410 | TIDAK_VALID |
| timeout/500 | PERLU_TINJAU |

---

# 7. 18 TEST CASE FINAL

Gunakan daftar final berikut:

| ID | Skenario |
|---|---|
| TC-01 | Password salah |
| TC-02 | Akses lintas peran |
| TC-03 | Nilai kriteria kosong |
| TC-04 | Nilai di luar skala |
| TC-05 | Total bobot tidak sama dengan satu |
| TC-06 | URL canonical duplikat |
| TC-07 | Pembanding valid kurang dari tiga |
| TC-08 | Seluruh pembanding pending |
| TC-09 | Harga negatif dan nol |
| TC-10 | Outlier |
| TC-11 | Floating-point >1 |
| TC-12 | Ranking seri |
| TC-13 | Bobot negatif |
| TC-14 | Backend tidak tersedia |
| TC-15 | Rollback transaksi |
| TC-16 | XSS |
| TC-17 | Upload tidak valid |
| TC-18 | URL tidak aktif |

## 7.1. Struktur evidence per TC

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
├── assertions.json
└── result.md
```

## 7.2. Status otomatis

```javascript
const allPassed = Object.values(assertions).every(Boolean);
status = allPassed ? "PASS" : "FAIL";
```

Jangan menyimpan status manual.

---

# 8. SCREENSHOT UI NYATA

Aturan minimum:

```text
width >= 800
height >= 450
```

Screenshot harus menunjukkan:

- halaman;
- input;
- pesan error/sukses;
- hasil;
- timestamp atau build jika memungkinkan.

Validasi:

```text
signature valid
decoder valid
dimensi valid
file size realistis
bukan placeholder
bukan duplicate tidak relevan
```

---

# 9. WORKBOOK INDEPENDEN

Workbook wajib menghitung sendiri.

## Sheet

1. `Bobot_AHP`
2. `Matriks_Keputusan`
3. `Normalisasi_SAW`
4. `Kontribusi`
5. `Preferensi`
6. `Harga_Pembanding`
7. `Nilai_Limit`
8. `Verifikasi_Sistem`

Formula harus merujuk sel, bukan konstanta.

Contoh:

```excel
=Matriks_Keputusan!C2/MAX(Matriks_Keputusan!C$2:C$10)
```

Bukan:

```excel
=4/5
```

Bandingkan:

- sistem;
- workbook;
- selisih;
- toleransi.

Assertion:

```text
preferensi diff <= 1e-12
rupiah diff <= Rp1
9/9 PASS
```

---

# 10. TOPSIS DAN SENSITIVITAS

Gunakan dataset dan bobot yang sama.

## TOPSIS

Hasilkan:

- nilai closeness;
- ranking;
- Spearman dengan SAW.

## Sensitivitas

Gunakan OAT:

```text
−10%
−5%
+5%
+10%
```

Untuk setiap bobot:

- ubah satu bobot;
- renormalisasi;
- hitung ulang;
- simpan ranking;
- hitung Spearman;
- catat rank reversal.

Output:

```text
saw_topsis_comparison.csv
sensitivity_results.csv
```

---

# 11. END-TO-END TIGA KATEGORI

Gunakan satu aset per kategori.

## Alur wajib

```text
login penjual
→ input aset
→ upload dokumen
→ input atribut
→ validasi pembanding
→ median
→ input kriteria
→ SAW
→ preferensi
→ nilai limit
→ verifikasi admin
```

Assertion:

```text
preference != null
nilaiLimit != null
hasil record != null
status akhir sesuai
median = dataset final
```

E2E dijalankan setelah seluruh test case selesai dan database di-reset.

---

# 12. SIKLUS LELANG AKTUAL

Gunakan satu aset hasil E2E.

Alur:

```text
aset diverifikasi
→ lelang dibuat
→ auctionId
→ dua bidder
→ dua bid
→ penutupan
→ winner
```

Evidence wajib:

- request;
- response;
- auction row;
- bid rows;
- user rows tersanitasi;
- backend log;
- screenshot nyata;
- status transition.

Assertion:

```text
auctionId != null
bidId != null
bidder >= 2
bid >= 2
winner = highest valid bid
status = FINISHED
```

---

# 13. UAT

Gunakan data responden nyata.

Dokumentasikan:

- jumlah responden;
- peran;
- pengalaman;
- skenario tugas;
- skor item;
- total;
- rata-rata;
- persentase penerimaan;
- komentar.

Jangan membuat jawaban.

Output:

```text
uat_raw.csv
uat_summary.csv
uat_analysis.md
```

---

# 14. VALIDASI PRAKTISI

AI Agent hanya menyiapkan form.

Kolom:

| Aset | Harga referensi | Nilai limit | Kesesuaian 1–5 | Kewajaran 1–5 | Layak sebagai rekomendasi awal | Komentar |
|---|---:|---:|---:|---:|---|---|

Setelah jawaban nyata tersedia:

- hitung rata-rata;
- hitung diterima;
- hitung revisi;
- hitung ditolak;
- hitung selisih terhadap estimasi praktisi.

Gunakan istilah:

```text
validasi kewajaran dan kegunaan praktis
```

Bukan appraisal formal.

---

# 15. EFISIENSI PROSES

Ukur:

| Aktivitas | Manual | Sistem |
|---|---:|---:|
| Input aset | menit | menit |
| Pemeriksaan pembanding | menit | menit |
| Median | menit | detik |
| SAW | menit | detik |
| Rekomendasi | menit | detik |

Catat:

- waktu mulai;
- waktu selesai;
- error;
- percobaan ulang.

---

# 16. PAKET JURNAL

Struktur:

```text
Final_Package_JCIS/
├── 01_Source_Version/
├── 02_Data_Import/
├── 03_Group_AHP/
├── 04_Comparables/
├── 05_Computational_Verification/
├── 06_Test_Cases/
├── 07_End_to_End/
├── 08_Auction_Cycle/
├── 09_TOPSIS_Sensitivity/
├── 10_UAT/
├── 11_Practitioner_Validation/
├── 12_Efficiency/
├── 13_Journal_Tables/
└── 14_Final_Report/
```

---

# 17. TABEL JURNAL WAJIB

1. Profil pakar.
2. CR individual dan kelompok.
3. Bobot Group AHP.
4. Ringkasan 45 pembanding.
5. Median sembilan aset.
6. Tingkat keyakinan.
7. Matriks keputusan.
8. Hasil SAW.
9. Nilai limit.
10. Sistem vs workbook.
11. SAW vs TOPSIS.
12. Sensitivitas.
13. Hasil 18 test case.
14. E2E tiga kategori.
15. Siklus lelang.
16. UAT.
17. Validasi praktisi.
18. Efisiensi manual vs sistem.

---

# 18. FINAL REPORT

Buat:

```text
FINAL_MASTER_IMPLEMENTATION_AND_TEST_REPORT.md
```

Struktur:

1. Ringkasan;
2. commit dan environment;
3. dataset;
4. Group AHP;
5. implementasi;
6. audit komputasional;
7. 18 test case;
8. E2E;
9. siklus lelang;
10. TOPSIS;
11. sensitivitas;
12. UAT;
13. validasi praktisi;
14. efisiensi;
15. defect tersisa;
16. keterbatasan;
17. keputusan kelayakan jurnal.

---

# 19. GATE FINAL — TIDAK BOLEH ADA PEKERJAAN TERSEMBUNYI

## Gate A — Data

- [ ] 9 aset final;
- [ ] 45 pembanding;
- [ ] 26 layak;
- [ ] 19 perlu tinjau;
- [ ] median cocok;
- [ ] bobot presisi penuh;
- [ ] hash dataset tidak berubah.

## Gate B — Komputasi

- [ ] sistem SAW relatif;
- [ ] workbook independen;
- [ ] 9/9 match;
- [ ] diff preferensi ≤1e-12;
- [ ] diff rupiah ≤Rp1.

## Gate C — Testing

- [ ] 18 test dijalankan;
- [ ] seluruh kondisi inti terpicu;
- [ ] tidak ada HTTP 404 yang dianggap PASS;
- [ ] screenshot nyata;
- [ ] backend log tersedia;
- [ ] DB before-after tersedia;
- [ ] storage evidence tersedia;
- [ ] cleanup fixture berhasil.

## Gate D — Praktik

- [ ] E2E tiga kategori selesai;
- [ ] siklus lelang selesai;
- [ ] auctionId dan bidId tersedia;
- [ ] hasil tidak mencemari dataset.

## Gate E — Penelitian

- [ ] TOPSIS selesai;
- [ ] sensitivitas selesai;
- [ ] UAT tersedia;
- [ ] validasi praktisi tersedia atau dinyatakan belum dilakukan;
- [ ] efisiensi terukur.

## Gate F — Jurnal

- [ ] tabel jurnal lengkap;
- [ ] seluruh angka identik;
- [ ] naskah diperbarui;
- [ ] response reviewer diperbarui;
- [ ] paket evidence disanitasi;
- [ ] ZIP final dapat dibuka;
- [ ] tidak ada secret;
- [ ] tidak ada file rusak.

Pekerjaan hanya boleh dinyatakan **FINAL** apabila seluruh gate yang relevan PASS.

---

# 20. PROMPT UTAMA UNTUK AI AGENT
