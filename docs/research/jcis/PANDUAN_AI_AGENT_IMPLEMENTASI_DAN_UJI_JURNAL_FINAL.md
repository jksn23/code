# PANDUAN AI AGENT
## Implementasi dan Praktik Uji Coba untuk Data Jurnal JCIS

Dokumen ini menjadi instruksi operasional tunggal bagi AI Agent untuk menyelesaikan implementasi, pengujian, pengumpulan data, dan penyusunan evidence penelitian sistem rekomendasi nilai limit aset lelang berbasis Group AHP–SAW.

Fokus pekerjaan bukan menambah fitur baru, melainkan menghasilkan data yang konsisten, dapat direplikasi, dan dapat dipertanggungjawabkan pada artikel jurnal.

---

# 1. Tujuan akhir

AI Agent harus menghasilkan satu paket yang membuktikan bahwa:

1. dataset penelitian tidak berubah selama pengujian;
2. bobot Group AHP valid dan digunakan dengan presisi yang sesuai;
3. perhitungan SAW pada sistem cocok dengan workbook independen;
4. 18 test case benar-benar memicu kondisi yang diuji;
5. tiga kategori aset berhasil diproses secara end-to-end;
6. satu siklus lelang aktual berhasil dijalankan;
7. TOPSIS dan sensitivitas dapat direplikasi;
8. UAT menggunakan data responden nyata;
9. validasi praktisi memakai data nyata atau dinyatakan BLOCKED;
10. seluruh evidence aman dan siap digunakan dalam jurnal.

---

# 2. Aturan yang tidak boleh dilanggar

AI Agent wajib:

- bekerja pada branch khusus;
- menggunakan database pengujian terpisah;
- memakai dataset final sebagai sumber kebenaran;
- memisahkan data penelitian dan data fixture;
- menyimpan seluruh kegagalan secara jujur;
- menggunakan SHA commit lengkap dan nomor build unik;
- menyimpan evidence UI, API, backend, database, dan storage;
- menghitung status PASS dari assertion otomatis;
- menyamarkan seluruh data sensitif sebelum membuat ZIP.

AI Agent dilarang:

- menggunakan database produksi;
- mengubah data penelitian agar test lulus;
- menggunakan aset penelitian untuk test negatif;
- membuat data pakar, responden, praktisi, atau harga baru;
- menganggap HTTP 404 sebagai PASS;
- menganggap response tersedia sebagai bukti test berhasil;
- menggunakan screenshot dashboard rekap sebagai bukti UI;
- menggunakan screenshot placeholder atau 1×1;
- membuat XLSX palsu dari CSV;
- menyimpan JWT, password, secret, email pribadi, rekening, KTP, NPWP, atau path lokal;
- menyatakan 18/18 PASS jika satu assertion inti gagal.

---

# 3. Metode final

Gunakan SAW normalisasi relatif.

## Benefit

\[
r_{ij} = \frac{x_{ij}}{\max_i(x_{ij})}
\]

## Cost

\[
r_{ij} = \frac{\min_i(x_{ij})}{x_{ij}}
\]

## Preferensi

\[
V_i = \sum_{j=1}^{n} w_j r_{ij}
\]

## Nilai limit

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

Gunakan clamp:

```javascript
function clampPreference(value) {
  if (!Number.isFinite(value)) {
    throw new Error("Preference must be finite");
  }
  return Math.min(1, Math.max(0, value));
}
```

Simpan `rawPreference` dan `safePreference`.

---

# 4. Dataset penelitian final

Gunakan hanya:

```text
Group_AHP_Bukti_Autentik_Terverifikasi.xlsx
Data_Pembanding_45_Aset_Lelang_Validasi_Median.xlsx
Lampiran_Analisis_Revisi_JCIS_Final.xlsx
```

Apabila salah satu tidak tersedia, hentikan proses dan tandai BLOCKED. Jangan membuat data pengganti.

## Sembilan aset

1. Rumah Tipe 45/90
2. Ruko 2 Lantai
3. Tanah Kavling
4. Toyota Avanza 2019
5. Honda Beat 2021
6. Mitsubishi Xpander 2018
7. Laptop Lenovo ThinkPad 2021
8. iPhone 12 128GB
9. Kamera Canon EOS 700D

## Median acuan

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

## Komposisi pembanding

```text
jumlah aset = 9
jumlah pembanding per aset = 5
jumlah total = 45
LAYAK = 26
PERLU_TINJAU = 19
```

---

# 5. Pemisahan data penelitian dan fixture

Gunakan:

```text
dataset_scope = RESEARCH_FINAL
dataset_scope = TEST_FIXTURE
```

Seluruh test negatif wajib memakai `TEST_FIXTURE`.

Jangan menggunakan Rumah, ThinkPad, Avanza, atau aset penelitian lain untuk pengujian outlier, clamp, ranking seri, rollback, XSS, dan upload invalid.

Hitung:

```text
research_dataset_hash_before
research_dataset_hash_after
```

Expected:

```text
research_dataset_hash_before = research_dataset_hash_after
```

Jika berbeda, seluruh regression run dinyatakan FAIL.

---

# 6. Repository dan environment

Buat branch:

```bash
git checkout -b research/jcis-final-journal-data
```

Gunakan database terpisah:

```env
NODE_ENV=test
DATABASE_URL=mysql://USER:PASSWORD@localhost:3306/lelang_jcis_final_test
```

Rekam:

```bash
git rev-parse HEAD
git branch --show-current
node --version
npm --version
npx prisma -v
mysql --version
```

Simpan pada:

```text
Final_Journal_Evidence/01_Source_Version/environment.txt
```

Jangan menyimpan password database pada paket akhir.

---

# 7. Impor dan validasi data

## Group AHP

Impor:

- kategori;
- nama kriteria;
- benefit/cost;
- bobot presisi penuh;
- CR individual;
- CR kelompok;
- versi bobot.

Assertion:

```text
jumlah bobot per kategori = 1 ± toleransi
seluruh bobot > 0
CR individual <= 0,10
CR kelompok <= 0,10
```

Jangan menyimpan bobot hanya enam desimal apabila naskah mengklaim toleransi \(10^{-12}\).

## Sembilan aset

Assertion:

```text
jumlah RESEARCH_FINAL = 9
seluruh skor terisi
tidak ada fixture
tidak ada nama duplikat
```

## Pembanding

Assertion:

```text
jumlah total = 45
5 data per aset
26 LAYAK
19 PERLU_TINJAU
harga > 0
canonical hash unik
tanggal akses tersedia
```

## Median

Bandingkan median database dengan tabel acuan. Jika satu median berbeda, hentikan audit komputasi dan telusuri duplikasi, status, outlier, atau kontaminasi fixture.

---

# 8. Workbook independen

Workbook harus menghitung sendiri, bukan berisi angka hardcoded.

## Sheet wajib

1. `Bobot_AHP`
2. `Matriks_Keputusan`
3. `Normalisasi_SAW`
4. `Kontribusi_Kriteria`
5. `Preferensi`
6. `Harga_Pembanding`
7. `Nilai_Limit`
8. `Verifikasi_Sistem`

Formula harus merujuk sel.

Contoh benar:

```excel
=Matriks_Keputusan!C2/MAX(Matriks_Keputusan!C$2:C$10)
```

Contoh tidak boleh:

```excel
=4/5
```

Tabel verifikasi:

| Aset | Pref. sistem | Pref. workbook | Selisih | Limit sistem | Limit workbook | Selisih | Status |
|---|---:|---:|---:|---:|---:|---:|---|

Gunakan toleransi sesuai kemampuan aktual sistem. Apabila sistem hanya menyimpan enam desimal, tingkatkan presisi atau ubah klaim naskah. Jangan mengklaim \(10^{-12}\) bila implementasi hanya mencapai \(10^{-6}\).

---

# 9. Daftar 18 test case

| ID | Skenario |
|---|---|
| TC-01 | Password salah |
| TC-02 | Akses lintas peran |
| TC-03 | Nilai kriteria kosong |
| TC-04 | Nilai di luar rentang 1–5 |
| TC-05 | Total bobot tidak sama dengan satu |
| TC-06 | URL canonical duplikat |
| TC-07 | Pembanding valid kurang dari tiga |
| TC-08 | Seluruh pembanding pending |
| TC-09 | Harga negatif dan nol |
| TC-10 | Harga outlier |
| TC-11 | Floating-point melebihi satu |
| TC-12 | Ranking seri |
| TC-13 | Bobot negatif |
| TC-14 | Backend tidak tersedia |
| TC-15 | Rollback transaksi |
| TC-16 | XSS |
| TC-17 | Upload tidak valid |
| TC-18 | URL tidak aktif |

---

# 10. Kondisi lulus test case

## TC-01

```text
HTTP 401
login gagal
token tidak dibuat
DB tidak berubah
UI menampilkan pesan
```

## TC-02

Uji penjual ke endpoint admin, pembeli ke endpoint penjual, dan user A ke aset user B.

```text
HTTP 403
data tidak bocor
DB tidak berubah
```

## TC-03

Gunakan fixture dengan status yang mengizinkan input nilai.

```text
HTTP 400/422
error karena nilai kosong
bukan karena status aset
DB tidak berubah
```

## TC-04

Uji nilai `0`, `6`, `2,5`, dan `"abc"`.

```text
HTTP 400/422
error karena skala
bukan karena status aset
```

## TC-05

```text
total bobot = 1,5
HTTP 422
code = INVALID_TOTAL_WEIGHT
DB tidak berubah
```

## TC-06

Simpan satu URL, ambil snapshot canonical count, lalu kirim URL ekuivalen dengan tracking berbeda.

```text
HTTP 409/422
canonical count before = 1
canonical count after = 1
```

## TC-07

```text
jumlah valid < 3
median = null
nilai limit = null
confidence = TIDAK_CUKUP
```

## TC-08

Gunakan minimal tiga data `MENUNGGU/PERLU_TINJAU` dan nol `DITERIMA`.

```text
eligible = 0
median = null
nilaiLimit = null
```

## TC-09

Uji `-100000` dan `0`.

```text
HTTP 400/422
kedua input ditolak
DB tidak berubah
```

## TC-10

Gunakan fixture lima harga dengan satu outlier jelas.

```text
outliersCount = 1
outliersFlagged = 1
median dihitung dari non-outlier
```

## TC-11

Gunakan:

```text
rawPreference = 1.0000000000000002
```

Expected:

```text
safePreference = 1
storedPreference = 1
nilaiLimit <= hargaReferensi
```

Nilai `0,999999` tidak memenuhi skenario.

## TC-12

Buat dua aset fixture dengan preferensi identik dan jalankan 20 kali.

```text
aset A ditemukan
aset B ditemukan
preferensi A = preferensi B
stable = true
stableCount = 20
```

Gunakan peringkat bersama atau tie-breaker eksplisit.

## TC-13

```text
bobot = -0,1
HTTP 400/422
code = NEGATIVE_WEIGHT
DB tidak berubah
```

Error karena nilai aset kosong adalah FAIL.

## TC-14

Dari frontend: isi form, matikan backend, lalu simpan.

Expected:

- frontend tidak crash;
- tidak menampilkan sukses;
- pesan layanan tidak tersedia tampil;
- input tetap ada bila memungkinkan;
- tombol coba lagi tersedia.

## TC-15

```text
transaction start
→ insert hasil
→ update aset
→ fault injection
→ rollback
```

Expected:

```text
record hasil tidak ada
status aset tidak berubah
DB before = DB after
correlation ID tersedia
backend log tersedia
```

## TC-16

Payload:

```html
<script>alert("XSS")</script>
<img src=x onerror=alert(1)>
<svg onload=alert(1)>
```

Expected:

- endpoint bukan 404;
- payload tidak dieksekusi;
- `window.alert` tidak terpanggil;
- DOM aman;
- data tampil sebagai teks atau ditolak.

## TC-17

Uji multipart nyata:

1. `.sh`;
2. `.pdf.exe`;
3. MIME mismatch;
4. PDF palsu;
5. file terlalu besar;
6. path traversal.

| Kondisi | HTTP |
|---|---:|
| tipe tidak didukung | 415 |
| file terlalu besar | 413 |
| request tidak valid | 400 |

Database dan storage tidak berubah.

## TC-18

Mock 404, 410, timeout, dan 500.

| Kondisi | Status |
|---|---|
| 404/410 | TIDAK_VALID |
| timeout/500 | PERLU_TINJAU |

Simpan transisi database sebelum dan sesudah.

---

# 11. Evidence per test case

```text
TC-XX/
├── metadata.json
├── request.json
├── response.json
├── assertions.json
├── ui.png
├── network.json
├── backend.log
├── db_before.json
├── db_after.json
├── storage_before.txt
├── storage_after.txt
└── result.md
```

Jika storage tidak relevan, isi:

```text
NOT_APPLICABLE: test case tidak menggunakan file storage.
```

---

# 12. Screenshot UI nyata

Screenshot harus:

```text
width >= 800
height >= 450
```

Screenshot wajib menampilkan halaman sistem, input, pesan validasi, hasil, dan test case terkait. Jangan menggunakan dashboard rekap, placeholder, atau gambar yang sama untuk skenario berbeda tanpa alasan.

---

# 13. End-to-end tiga kategori

Jalankan satu aset untuk:

1. Tanah dan Bangunan;
2. Kendaraan;
3. Elektronik.

Alur wajib:

```text
login penjual
→ input aset
→ upload dokumen
→ input atribut kategori
→ validasi pembanding
→ hitung median
→ input nilai kriteria
→ hitung SAW
→ preferensi terisi
→ nilai limit terisi
→ admin memverifikasi
```

Ringkasan:

| Kategori | Asset ID | Pembanding | Median | Preferensi | Nilai limit | Confidence | Status |
|---|---:|---:|---:|---:|---:|---|---|

Assertion:

```text
median = dataset final
preference != null
nilaiLimit != null
hasil record != null
status akhir sesuai
```

Jalankan E2E setelah seluruh test selesai dan database di-reset ke baseline.

---

# 14. Siklus lelang aktual

Gunakan satu aset hasil E2E.

```text
aset diverifikasi
→ lelang dibuat
→ auctionId terbentuk
→ dua pembeli terverifikasi
→ bid pertama
→ bid kedua
→ lelang ditutup
→ pemenang ditentukan
```

Data wajib:

```text
asset_id
auction_id
bid_id_1
bid_id_2
bidder_1
bidder_2
nilai_limit
harga_pembukaan
minimal_increment
harga_bid_1
harga_bid_2
harga_akhir
pemenang
waktu_mulai
waktu_selesai
status
```

Assertion:

```text
auctionId != null
bidder >= 2
bid >= 2
winner = highest valid bid
status = FINISHED
```

---

# 15. TOPSIS

Gunakan dataset dan bobot yang sama dengan SAW.

| Kategori | Aset | Skor SAW | Rank SAW | Closeness TOPSIS | Rank TOPSIS | Selisih |
|---|---|---:|---:|---:|---:|---:|

Hitung Spearman per kategori.

Klaim yang aman:

```text
SAW dan TOPSIS menghasilkan urutan peringkat yang konsisten pada dataset penelitian.
```

Jangan menyatakan SAW lebih akurat hanya karena ranking sama.

---

# 16. Sensitivitas

Gunakan OAT:

```text
−10%
−5%
+5%
+10%
```

Untuk setiap kriteria:

1. ubah satu bobot;
2. renormalisasi seluruh bobot;
3. hitung ulang preferensi;
4. hitung ranking;
5. hitung Spearman;
6. catat rank reversal;
7. catat gap peringkat pertama dan kedua.

Output:

```text
kategori
kriteria
delta
bobot_awal
bobot_setelah_renormalisasi
preferensi_setiap_aset
ranking
spearman
rank_reversal
gap_teratas
```

---

# 17. UAT

Gunakan data responden nyata:

```text
15 responden
10 pernyataan
skor total = 645/750
rata-rata = 4,30
penerimaan = 86%
```

Data mentah:

| Responden | Peran | P1 | P2 | ... | P10 | Total |
|---|---|---:|---:|---:|---:|---:|

Jelaskan komposisi responden, tugas yang dilakukan, dan apakah mereka memakai sistem langsung. Jangan mengganti UAT 15 responden dengan data tiga responden.

---

# 18. Validasi praktisi

AI Agent hanya boleh membuat formulir, mengimpor jawaban nyata, dan menghitung hasil. AI Agent tidak boleh membuat jawaban praktisi.

| Aset | Harga referensi | Nilai limit | Kesesuaian 1–5 | Kewajaran 1–5 | Layak | Komentar |
|---|---:|---:|---:|---:|---|---|

Simpan kode validator, profesi/jabatan, tanggal, jawaban individual, dan persetujuan penggunaan data.

Gunakan istilah:

```text
validasi kewajaran dan kegunaan praktis
```

Apabila jawaban nyata belum tersedia:

```text
STATUS = BLOCKED
ALASAN = Jawaban praktisi nyata belum diterima.
```

---

# 19. Pengukuran efisiensi

| Aktivitas | Manual | Sistem |
|---|---:|---:|
| Input aset | menit | menit |
| Validasi pembanding | menit | menit |
| Perhitungan median | menit | detik |
| Perhitungan SAW | menit | detik |
| Pembuatan rekomendasi | menit | detik |

Simpan:

```text
started_at
finished_at
duration_ms
tester
device
build
run_number
```

Lakukan minimal tiga pengulangan dan gunakan rata-rata.

---

# 20. Struktur paket akhir

```text
Final_Journal_Evidence/
├── 01_Source_Version/
├── 02_Data_Import/
├── 03_Group_AHP/
├── 04_Comparables/
├── 05_Computational_Verification/
├── 06_Test_Cases/
├── 07_End_to_End/
├── 08_Auction_Cycle/
├── 09_TOPSIS/
├── 10_Sensitivity/
├── 11_UAT/
├── 12_Practitioner_Validation/
├── 13_Efficiency/
├── 14_Journal_Tables/
└── 15_Final_Report/
```

---

# 21. Tabel jurnal yang harus dihasilkan

1. Profil pakar.
2. CR individual dan kelompok.
3. Bobot Group AHP.
4. Ringkasan 45 pembanding.
5. Median sembilan aset.
6. Tingkat keyakinan.
7. Matriks keputusan.
8. Normalisasi SAW.
9. Nilai preferensi.
10. Nilai limit.
11. Sistem vs workbook.
12. SAW vs TOPSIS.
13. Sensitivitas.
14. Hasil 18 test case.
15. E2E tiga kategori.
16. Siklus lelang.
17. UAT.
18. Validasi praktisi.
19. Efisiensi manual vs sistem.

---

# 22. Metadata

```json
{
  "testCaseId": "TC-01",
  "title": "Password salah",
  "executedAt": "ISO-8601",
  "timezone": "Asia/Makassar",
  "tester": "AI Agent",
  "branch": "research/jcis-final-journal-data",
  "commitHash": "FULL_40_CHARACTER_SHA",
  "buildNumber": "JCIS-FINAL-YYYYMMDD-HHMM",
  "status": "PASS|FAIL|BLOCKED|INCOMPLETE"
}
```

---

# 23. Status otomatis

```javascript
const allPassed = Object.values(assertions).every(Boolean);
const status = allPassed ? "PASS" : "FAIL";
```

Gunakan:

- `PASS`: seluruh assertion terpenuhi;
- `FAIL`: minimal satu assertion gagal;
- `BLOCKED`: dependensi atau data nyata belum tersedia;
- `INCOMPLETE`: evidence belum lengkap.

---

# 24. Sanitasi

Redaksi:

```text
JWT
password
database URL
email pribadi
rekening
KTP
NPWP
secret
path lokal
URL dokumen pribadi
```

Gunakan:

```text
[REDACTED_JWT]
[REDACTED_DATABASE_URL]
[REDACTED_EMAIL]
[REDACTED_ACCOUNT]
[REDACTED_SECRET]
```

File gambar dan XLSX harus diproses sebagai biner. Setelah sanitasi, validasi JSON, CSV, PNG, XLSX, dan SHA-256 seluruh file.

---

# 25. Gate penyelesaian

## Gate A — Data

- [ ] sembilan aset final;
- [ ] 45 pembanding;
- [ ] 26 layak;
- [ ] 19 perlu tinjau;
- [ ] median cocok;
- [ ] bobot presisi penuh;
- [ ] hash dataset sebelum dan sesudah sama.

## Gate B — Komputasi

- [ ] SAW relatif;
- [ ] workbook independen;
- [ ] formula aktif;
- [ ] tepat sembilan aset;
- [ ] seluruh aset match;
- [ ] toleransi sesuai kemampuan sistem.

## Gate C — Testing

- [ ] 18 test dijalankan;
- [ ] kondisi inti terpicu;
- [ ] screenshot nyata;
- [ ] backend log tersedia;
- [ ] DB before-after tersedia;
- [ ] storage evidence tersedia;
- [ ] fixture dibersihkan.

## Gate D — Praktik

- [ ] E2E tiga kategori selesai;
- [ ] siklus lelang selesai;
- [ ] auctionId dan bidId tersedia;
- [ ] dataset penelitian tidak berubah.

## Gate E — Evaluasi

- [ ] TOPSIS lengkap;
- [ ] sensitivitas lengkap;
- [ ] UAT 15 responden tersedia;
- [ ] validasi praktisi nyata tersedia atau BLOCKED;
- [ ] efisiensi diukur.

## Gate F — Paket jurnal

- [ ] seluruh tabel tersedia;
- [ ] seluruh angka konsisten;
- [ ] naskah dapat diperbarui;
- [ ] response reviewer dapat diperbarui;
- [ ] ZIP dapat dibuka;
- [ ] tidak ada secret;
- [ ] tidak ada file rusak.

AI Agent hanya boleh menulis `FINAL` jika seluruh gate yang relevan PASS.

---

# 26. Output wajib

```text
Final_Journal_Evidence/
FINAL_IMPLEMENTATION_AND_RESEARCH_REPORT.md
test_case_summary.csv
audit_9_assets.xlsx
comparison_confidence_summary.csv
saw_topsis_comparison.csv
sensitivity_results.csv
end_to_end_summary.csv
auction_cycle_summary.csv
uat_raw.csv
uat_summary.csv
practitioner_validation_summary.csv
efficiency_summary.csv
tabel_jurnal.md
tabel_jurnal.xlsx
Final_Journal_Evidence_Sanitized.zip
```

---

# 27. Prompt utama untuk AI Agent
