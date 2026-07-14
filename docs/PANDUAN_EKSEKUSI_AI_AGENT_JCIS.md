# PANDUAN EKSEKUSI AI AGENT
## Implementasi, Pengujian, dan Pengumpulan Data Sistem untuk Kebutuhan Artikel Jurnal JCIS

**Tujuan utama:**  
Memperbaiki implementasi sistem, menjalankan pengujian yang dapat direplikasi, serta menghasilkan data dan bukti yang sah untuk artikel jurnal mengenai Sistem Pendukung Keputusan rekomendasi nilai limit aset lelang berbasis Group AHP–SAW.

---

# 1. Peran AI Agent

AI Agent bertindak sebagai:

- software engineer;
- test engineer;
- data validation engineer;
- research reproducibility assistant;
- technical documentation assistant.

AI Agent **tidak boleh**:

- membuat atau memalsukan data pakar, responden, penilai, atau praktisi;
- mengubah data penelitian tanpa dokumentasi;
- menghapus kegagalan pengujian agar laporan terlihat lulus;
- menulis status `PASS` apabila assertion belum terpenuhi;
- menggunakan data produksi yang mengandung data pribadi;
- menyimpan JWT, password, secret, KTP, NPWP, rekening, atau data pribadi dalam paket evidence;
- mengubah formula penelitian tanpa membuat catatan perubahan dan meminta persetujuan peneliti.

---

# 2. Hasil Akhir yang Wajib Dihasilkan

AI Agent harus menghasilkan:

1. source code yang telah diperbaiki;
2. commit Git final yang dapat direproduksi;
3. 18 test case negatif dan batas yang benar-benar dijalankan;
4. pengujian end-to-end untuk tiga kategori aset;
5. satu siklus lelang terintegrasi;
6. audit sembilan hasil perhitungan aset;
7. data tingkat keyakinan pembanding;
8. bukti UI, API, log backend, database, dan storage;
9. ringkasan hasil dalam CSV dan XLSX;
10. laporan teknis dalam Markdown;
11. tabel siap dimasukkan ke jurnal;
12. paket evidence yang telah disanitasi.

---

# 3. Aturan Kerja Repository

## 3.2. Catat kondisi awal

Simpan:

```bash
git rev-parse HEAD
git branch --show-current
node --version
npm --version
npx prisma -v
mysql --version
```

Masukkan hasil ke:

```text
Final_Evidence/01_Source_Version/environment.txt
```

## 3.3. Gunakan database pengujian

Gunakan database terpisah, misalnya:

```env
DATABASE_URL=mysql://USER:PASSWORD@localhost:3306/lelang_journal_test
NODE_ENV=test
```

Dilarang memakai database produksi.

## 3.4. Gunakan akun uji

Buat akun khusus:

```text
admin.test@example.local
seller.test@example.local
buyer.test@example.local
```

Gunakan password uji yang tidak dipakai pada sistem nyata.

---

# 4. Tahap 1 — Audit Awal Sistem

AI Agent harus memeriksa:

- struktur frontend;
- struktur backend;
- schema Prisma;
- endpoint autentikasi;
- endpoint role;
- endpoint aset;
- endpoint data pembanding;
- endpoint AHP/SAW;
- endpoint perhitungan median;
- endpoint upload;
- endpoint lelang;
- transaksi database;
- error handler;
- middleware validasi;
- mekanisme output encoding;
- log backend.

Buat laporan:

```text
Final_Evidence/01_Source_Version/code_audit.md
```

Laporan harus mencantumkan:

| Komponen | Lokasi file | Kondisi | Risiko | Tindakan |
|---|---|---|---|---|

---

# 5. Tahap 2 — Perbaikan Implementasi Wajib

## 5.1. TC-05 — Total bobot tidak sama dengan satu

### Masalah

Kesalahan bobot sebelumnya menghasilkan HTTP 500.

### Implementasi

Validasi total bobot sebelum transaksi:

```javascript
const totalWeight = weights.reduce((sum, item) => sum + Number(item.weight), 0);
const tolerance = 1e-9;

if (Math.abs(totalWeight - 1) > tolerance) {
  return res.status(422).json({
    success: false,
    code: "INVALID_TOTAL_WEIGHT",
    message: "Total bobot harus sama dengan 1.",
    totalWeight
  });
}
```

### Assertion

- HTTP 422;
- tidak ada perubahan database;
- pesan validasi tampil di UI;
- log backend memakai level `warn`, bukan `error`.

---

## 5.2. TC-08 — Seluruh pembanding bersyarat

### Fixture

Buat minimal tiga pembanding:

```text
status = MENUNGGU atau PERLU_TINJAU
jumlah diterima = 0
```

### Hasil wajib

```json
{
  "jumlahTotal": 3,
  "jumlahEligible": 0,
  "median": null,
  "tingkatKeyakinan": "TIDAK_CUKUP",
  "rekomendasiNilaiLimit": null
}
```

Sistem tidak boleh menghitung median dari data yang seluruhnya belum diterima.

---

## 5.3. TC-11 — Floating-point melebihi satu

### Implementasi

```javascript
function clampPreference(value) {
  if (!Number.isFinite(value)) {
    throw new Error("Preference must be finite.");
  }

  return Math.min(1, Math.max(0, value));
}
```

Simpan dua nilai pada log pengujian:

```text
rawPreference
safePreference
```

### Fixture

```text
rawPreference = 1.0000000000000002
```

### Assertion

```text
safePreference = 1
nilaiLimit <= hargaReferensiPasar
```

---

## 5.4. TC-14 — Backend tidak tersedia

Frontend harus:

- menangkap network error;
- tidak crash;
- tidak menampilkan notifikasi sukses;
- menampilkan pesan layanan tidak tersedia;
- mempertahankan input form selama halaman tidak dimuat ulang;
- menyediakan tombol coba lagi.

Contoh:

```typescript
try {
  await api.post("/assets", payload);
} catch (error) {
  if (!error.response) {
    showError("Layanan sedang tidak tersedia. Data belum tersimpan.");
    return;
  }

  throw error;
}
```

---

## 5.5. TC-15 — Rollback transaksi database

Buat test-only fault injection:

```javascript
await prisma.$transaction(async (tx) => {
  const result = await tx.hasil.create({
    data: resultPayload
  });

  await tx.aset.update({
    where: { id: assetId },
    data: { status: "MENUNGGU_VERIFIKASI" }
  });

  if (process.env.NODE_ENV === "test" && forceRollback) {
    throw new Error("FAULT_INJECTION_TC15");
  }

  return result;
});
```

### Assertion

- record `hasil` tidak terbentuk;
- status aset tidak berubah;
- log mencatat transaction start;
- log mencatat fault injection;
- log mencatat rollback;
- response tidak membocorkan stack trace;
- gunakan correlation ID.

---

## 5.6. TC-17 — File upload tidak valid

Lakukan multipart upload nyata untuk:

1. `malicious.sh`;
2. `document.pdf.exe`;
3. `fake.pdf` dengan isi bukan PDF;
4. file melebihi batas ukuran;
5. MIME tidak sesuai;
6. nama `../../malicious.sh`.

### Validasi server

- whitelist ekstensi;
- whitelist MIME;
- validasi magic bytes bila memungkinkan;
- gunakan nama file acak;
- jangan memakai nama asli sebagai path penyimpanan;
- bersihkan file temporary ketika gagal.

### HTTP

- 400 untuk request tidak valid;
- 413 untuk ukuran terlalu besar;
- 415 untuk tipe media tidak didukung.

---

# 6. Tahap 3 — Penguatan Test Case Lain

## TC-02 — Akses lintas peran

Uji minimal:

- penjual mengakses endpoint admin;
- pembeli mengakses endpoint penjual;
- pengguna A mengakses aset pengguna B;
- pengguna biasa mengubah ID pada URL;
- endpoint backend tetap menolak walaupun UI dimanipulasi.

## TC-06 — URL pembanding duplikat

Canonicalization harus menghapus:

- parameter tracking;
- fragment;
- trailing slash;
- perbedaan huruf besar/kecil pada host;
- parameter urutan berbeda.

Assertion:

```text
jumlah canonical hash sebelum = 1
jumlah canonical hash sesudah = 1
```

## TC-10 — Harga outlier

Pisahkan lifecycle:

```text
setelah median:
hargaReferensiPasar != null
nilaiPreferensi = null
nilaiLimit = null
status = MENUNGGU_PERHITUNGAN_SAW
```

```text
setelah SAW:
nilaiPreferensi != null
nilaiLimit = nilaiPreferensi × hargaReferensiPasar
```

## TC-12 — Ranking seri

Jalankan endpoint minimal 20 kali.

Gunakan aturan:

```text
peringkat bersama
```

atau tie-breaker eksplisit:

1. preferensi;
2. tingkat keyakinan;
3. nilai limit;
4. ID.

## TC-16 — XSS

Uji payload:

```html
<script>alert("XSS")</script>
<img src=x onerror=alert(1)>
<svg onload=alert(1)>
```

Assertion:

- `window.alert` tidak dipanggil;
- payload tampil sebagai teks;
- tidak ada node executable;
- frontend tidak menggunakan `dangerouslySetInnerHTML`;
- CSP dicatat bila tersedia.

## TC-18 — URL tidak aktif

Gunakan mock server untuk:

- 404;
- 410;
- timeout;
- 500.

Simpan:

```text
lastCheckedAt
lastHttpStatus
retryCount
validationStatus
validationReason
```

---

# 7. Tahap 4 — Implementasi Tingkat Keyakinan Pembanding

Tambahkan fungsi:

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

Untuk data yang tidak memenuhi minimum:

```text
TIDAK_CUKUP
```

Keluaran sistem harus memuat:

```text
harga referensi
nilai limit awal
jumlah diterima
jumlah bersyarat
rentang harga
tingkat keyakinan
alasan tingkat keyakinan
```

Untuk Ruko, Tanah, Xpander, dan Canon, jangan menaikkan tingkat keyakinan tanpa pembanding yang lebih homogen.

---

# 8. Tahap 5 — Audit Perhitungan Sembilan Aset

Untuk setiap aset, ekspor:

- nilai mentah;
- jenis benefit/cost;
- nilai normalisasi;
- bobot presisi penuh;
- kontribusi setiap kriteria;
- nilai preferensi mentah;
- nilai preferensi setelah clamp;
- lima harga pembanding;
- median;
- nilai limit;
- ranking;
- tingkat keyakinan.

Gunakan formula:

\[
NL_i = V_i \times HP_i
\]

Assertion:

```text
nilaiLimit = safePreference × hargaReferensiPasar
```

Toleransi:

```text
1e-12 untuk nilai preferensi
Rp1 untuk pembulatan mata uang
```

Hasil disimpan sebagai:

```text
Final_Evidence/04_Verifikasi_Komputasional/audit_9_aset.csv
Final_Evidence/04_Verifikasi_Komputasional/audit_9_aset.xlsx
```

---

# 9. Tahap 6 — Pengujian End-to-End Tiga Kategori

Jalankan satu skenario lengkap untuk:

1. Tanah dan Bangunan;
2. Kendaraan;
3. Elektronik.

## Alur wajib

```text
login penjual
→ input aset
→ unggah dokumen
→ input atribut kategori
→ input/validasi pembanding
→ hitung median
→ input nilai kriteria
→ hitung SAW
→ tampilkan nilai limit
→ admin memverifikasi
```

Setiap tahap harus mempunyai:

- screenshot UI;
- request;
- response;
- snapshot database;
- log backend;
- status akhir.

---

# 10. Tahap 7 — Satu Siklus Lelang Terintegrasi

Jalankan:

```text
penjual mengajukan aset
→ admin menyetujui
→ nilai limit ditetapkan
→ admin membuat jadwal
→ pembeli terverifikasi masuk
→ pembeli melakukan penawaran
→ lelang ditutup
→ pemenang ditentukan
→ hasil disimpan
```

Keluaran:

- ID aset;
- ID lelang;
- nilai limit;
- harga pembukaan;
- jumlah bidder;
- jumlah penawaran;
- harga akhir;
- pemenang;
- waktu mulai dan selesai;
- status akhir.

Tidak perlu menggunakan pembayaran nyata apabila berada di luar ruang lingkup artikel.

---

# 11. Tahap 8 — Validasi Praktisi

AI Agent hanya menyiapkan instrumen. AI Agent **tidak boleh mengisi jawaban praktisi**.

Siapkan formulir dengan kolom:

| Aset | Harga referensi | Nilai limit sistem | Kesesuaian harga referensi 1–5 | Kewajaran nilai limit 1–5 | Layak sebagai rekomendasi awal | Komentar |
|---|---:|---:|---:|---:|---|---|

Setelah peneliti memperoleh jawaban nyata, AI Agent boleh:

- mengimpor data;
- menghitung rata-rata;
- menghitung jumlah diterima;
- menghitung jumlah revisi;
- menghitung selisih terhadap estimasi praktisi;
- membuat tabel jurnal.

Jangan menyebut hasil sebagai appraisal formal.

Gunakan istilah:

```text
validasi kewajaran dan kegunaan praktis
```

---

# 12. Tahap 9 — Pengukuran Efisiensi

Ukur waktu:

| Aktivitas | Manual | Sistem |
|---|---:|---:|
| Input aset | menit | menit |
| Pemeriksaan pembanding | menit | menit |
| Perhitungan median | menit | detik |
| Perhitungan SAW | menit | detik |
| Penyusunan rekomendasi | menit | detik |

Catat:

- waktu mulai;
- waktu selesai;
- jumlah kesalahan;
- jumlah percobaan ulang;
- status berhasil/gagal.

---

# 13. Tahap 10 — Struktur Evidence

Gunakan struktur:

```text
Final_Evidence/
├── 01_Source_Version/
├── 02_Group_AHP/
├── 03_Data_Pembanding/
├── 04_Verifikasi_Komputasional/
├── 05_Test_Case_18/
├── 06_End_to_End/
├── 07_Siklus_Lelang/
├── 08_Validasi_Praktisi/
├── 09_UAT/
├── 10_Sensitivitas/
└── 11_Ringkasan/
```

Setiap test case:

```text
TC-XX/
├── metadata.json
├── request.json
├── response.json
├── ui.png
├── network.png
├── backend.log
├── db_before.json
├── db_after.json
├── storage_before.txt
├── storage_after.txt
└── result.md
```

---

# 14. Format Metadata

```json
{
  "testCaseId": "TC-01",
  "testName": "Password salah",
  "executedAt": "2026-07-15T14:30:00+08:00",
  "timezone": "Asia/Makassar",
  "tester": "AI Agent",
  "branch": "research/jcis-final-validation",
  "commitHash": "FULL_GIT_SHA",
  "buildNumber": "JCIS-20260715-01",
  "frontendVersion": "VERSION",
  "backendVersion": "VERSION",
  "databaseVersion": "VERSION",
  "status": "PASS|FAIL|BLOCKED",
  "notes": ""
}
```

---

# 15. Aturan Status Test

## PASS

Hanya apabila:

- kondisi inti benar-benar dipicu;
- assertion terpenuhi;
- bukti lengkap;
- tidak ada kontradiksi API, UI, dan database.

## FAIL

Gunakan bila assertion gagal.

## BLOCKED

Gunakan bila lingkungan atau dependensi tidak tersedia.

## NOT RUN

Gunakan bila belum dijalankan.

Dilarang mengganti `FAIL` menjadi `PASS` hanya karena error telah diketahui.

---

# 16. Sanitasi Evidence

Sebelum membuat ZIP:

- hapus JWT;
- hapus password;
- samarkan email;
- samarkan rekening;
- samarkan KTP/NPWP;
- hapus secret;
- hapus path lokal;
- hapus stack trace sensitif;
- gunakan data dummy.

Gunakan:

```text
[REDACTED_JWT]
[REDACTED_EMAIL]
[REDACTED_ACCOUNT]
[REDACTED_DOCUMENT_PATH]
```

---

# 17. Ringkasan CSV Wajib

Buat:

```text
Final_Evidence/11_Ringkasan/test_case_summary.csv
```

Kolom:

```text
test_case_id
test_name
category
expected_http
actual_http
ui_result
api_result
database_result
storage_result
status
evidence_path
notes
```

Buat juga:

```text
asset_result_summary.csv
comparison_confidence_summary.csv
end_to_end_summary.csv
auction_cycle_summary.csv
practitioner_validation_summary.csv
```

---

# 18. Tabel Siap Jurnal

AI Agent harus menghasilkan tabel:

1. CR individual dan kelompok;
2. bobot Group AHP;
3. ringkasan data pembanding;
4. tingkat keyakinan sembilan aset;
5. hasil SAW dan nilai limit;
6. verifikasi aplikasi vs workbook;
7. hasil SAW vs TOPSIS;
8. sensitivitas;
9. hasil 18 test case;
10. hasil end-to-end;
11. hasil UAT;
12. validasi praktisi;
13. efisiensi manual vs sistem.

Simpan dalam:

```text
Final_Evidence/11_Ringkasan/tabel_jurnal.md
Final_Evidence/11_Ringkasan/tabel_jurnal.xlsx
```

---

# 19. Laporan Akhir AI Agent

Buat:

```text
FINAL_IMPLEMENTATION_AND_TEST_REPORT.md
```

Struktur:

## 1. Ringkasan
## 2. Commit dan environment
## 3. Perubahan implementasi
## 4. Hasil 18 test case
## 5. Hasil end-to-end
## 6. Audit sembilan aset
## 7. Tingkat keyakinan pembanding
## 8. Siklus lelang
## 9. Validasi praktisi
## 10. UAT
## 11. Keterbatasan
## 12. Daftar defect tersisa
## 13. Kesimpulan kelayakan untuk jurnal

---

# 20. Definition of Done

Pekerjaan dinyatakan selesai apabila:

- [ ] enam test case kritis telah diperbaiki;
- [ ] seluruh 18 test case benar-benar dijalankan;
- [ ] tidak ada status palsu;
- [ ] setiap test case memiliki bukti lengkap;
- [ ] lifecycle nilai limit konsisten;
- [ ] preferensi selalu berada pada 0–1;
- [ ] ranking seri memiliki aturan;
- [ ] tingkat keyakinan tersedia;
- [ ] URL mati dapat dideteksi;
- [ ] tiga skenario end-to-end selesai;
- [ ] satu siklus lelang selesai;
- [ ] sembilan aset telah diaudit;
- [ ] validasi praktisi menggunakan data nyata;
- [ ] seluruh evidence telah disanitasi;
- [ ] commit Git final telah dikunci;
- [ ] laporan akhir dan tabel jurnal tersedia.

---

# 21. Instruksi Eksekusi Singkat untuk AI Agent

Gunakan perintah berikut sebagai prompt utama:

```text
Pelajari seluruh repository aplikasi lelang dan SPK AHP–SAW ini. Kerjakan pada branch research/jcis-final-validation dan database pengujian terpisah. Jangan mengubah data penelitian tanpa dokumentasi dan jangan membuat data pakar, responden, atau praktisi.

Laksanakan seluruh tahapan dalam dokumen PANDUAN_EKSEKUSI_AI_AGENT_JCIS.md. Prioritaskan perbaikan TC-05, TC-08, TC-11, TC-14, TC-15, dan TC-17, kemudian perkuat TC-02, TC-06, TC-10, TC-12, TC-16, dan TC-18. Implementasikan lifecycle nilai limit yang konsisten, clamp preferensi 0–1, tingkat keyakinan data pembanding, pemeriksaan URL tidak aktif, dan aturan ranking seri.

Jalankan 18 test case, tiga skenario end-to-end kategori aset, satu siklus lelang terintegrasi, dan audit sembilan aset. Simpan bukti UI, API, HTTP, log backend, database sebelum-sesudah, dan storage sebelum-sesudah. Gunakan commit Git lengkap dan build unik. Jangan menandai PASS apabila kondisi inti belum terpicu atau evidence belum lengkap.

Hasilkan folder Final_Evidence, CSV ringkasan, tabel siap jurnal, serta FINAL_IMPLEMENTATION_AND_TEST_REPORT.md. Sanitasi seluruh JWT, password, email, rekening, dokumen identitas, secret, dan path lokal sebelum membuat ZIP akhir.
```
