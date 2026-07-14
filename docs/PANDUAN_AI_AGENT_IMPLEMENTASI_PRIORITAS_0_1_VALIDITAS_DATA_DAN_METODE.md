# PANDUAN AI AGENT  
## Implementasi Prioritas 0 dan Prioritas 1: Validitas Data Pembanding dan Metode AHP–SAW

**Repository target:** `https://github.com/jksn23/code`  
**Branch dasar:** `feature/penilaian-penjual`  
**Jenis dokumen:** Instruksi implementasi untuk AI coding agent  
**Tanggal penyusunan:** 14 Juli 2026  
**Status:** Siap dieksekusi  
**Prioritas:** Kritis untuk validitas artikel ilmiah

---

# 1. MISI IMPLEMENTASI

Lakukan perbaikan pada aplikasi SPK nilai limit aset agar:

1. tidak menggunakan harga sintetis sebagai data faktual;
2. hanya menggunakan data pembanding yang telah diterima admin;
3. dapat membedakan sumber data pembanding secara eksplisit;
4. hanya menerima URL iklan aktual sebagai sumber harga;
5. menggunakan pencocokan data pembanding yang lebih ketat;
6. menampilkan tingkat keyakinan harga referensi;
7. menghasilkan nilai SAW yang tidak berubah hanya karena aset lain ditambahkan atau dihapus;
8. hanya menggunakan versi bobot AHP yang aktif dan valid;
9. menyimpan snapshot seluruh input dan parameter perhitungan;
10. memvalidasi matriks AHP secara lengkap;
11. menggunakan rubrik skor 1–5 yang dapat direplikasi;
12. menyediakan mekanisme validasi formula nilai limit terhadap nilai pakar atau data aktual.

Hasil akhir tidak boleh sekadar membuat fitur terlihat berjalan. Implementasi harus menyediakan:

- kontrol validitas data;
- jejak audit;
- bukti pengujian;
- migrasi data lama;
- dokumentasi perubahan;
- keluaran yang dapat digunakan sebagai bukti penelitian.

---

# 2. BATASAN PEKERJAAN

## 2.1 Termasuk dalam ruang lingkup

Implementasikan seluruh bagian berikut:

### Prioritas 0 — Validitas data pembanding

1. Menghapus pembuatan harga fallback sintetis.
2. Median hanya memakai data berstatus `DITERIMA`.
3. Memisahkan data:
   - hasil scraping aktual;
   - input manual;
   - saran pencarian;
   - data pengujian.
4. Memperketat fuzzy matching.
5. Memastikan sumber harga adalah URL halaman detail iklan.
6. Menampilkan tingkat keyakinan rendah apabila data aktual tidak mencukupi.

### Prioritas 1 — Validitas metode

1. Mengganti normalisasi SAW menjadi normalisasi skala tetap.
2. Menggunakan hanya versi bobot AHP yang aktif.
3. Menyimpan snapshot bobot, skor, hasil normalisasi, dan data pembanding.
4. Memvalidasi matriks reciprocal AHP.
5. Menambahkan rubrik skor 1–5 untuk setiap kriteria.
6. Menambahkan mekanisme validasi formula nilai limit.

## 2.2 Di luar ruang lingkup

Jangan mengerjakan bagian berikut dalam paket implementasi ini, kecuali diperlukan untuk menjaga test tetap berjalan:

- autentikasi Socket.IO;
- race condition bidding;
- perlindungan file KTP/NPWP;
- perubahan desain besar sistem lelang;
- perubahan algoritma penentuan pemenang lelang;
- refactor seluruh frontend;
- penggantian framework;
- migrasi MySQL ke database lain.

Buat catatan terpisah apabila menemukan masalah di luar ruang lingkup. Jangan memperluas pekerjaan tanpa alasan teknis yang kuat.

---

# 3. ATURAN WAJIB UNTUK AI AGENT

## 3.1 Sebelum mengubah kode

Baca berkas berikut:

1. `AGENTS.md`
2. `CLAUDE.md`
3. `README.md`
4. `backend/package.json`
5. `backend/prisma/schema.prisma`
6. `backend/src/services/pembanding.service.js`
7. `backend/src/services/puppeteer_scraper.service.js`
8. `backend/src/services/scraping_queue.service.js`
9. `backend/src/controllers/pembanding.controller.js`
10. `backend/src/routes/pembanding.routes.js`
11. `backend/src/services/penilaian.service.js`
12. `backend/src/services/saw.service.js`
13. `backend/src/services/ahp.service.js`
14. `backend/src/controllers/spk.controller.js`
15. `backend/src/controllers/penilaian.controller.js`
16. `backend/src/tests/spk.test.js`
17. `frontend/src/pages/DataPembandingPage.jsx`
18. `frontend/src/pages/ValidasiPembandingPage.jsx`
19. `frontend/src/pages/SellerPenilaianPage.jsx`
20. `frontend/src/pages/AdminPenilaianAsetPage.jsx`
21. `frontend/src/pages/HasilPage.jsx`
22. layanan API frontend yang digunakan halaman-halaman tersebut.

Jangan berasumsi nama fungsi masih sama. Cari pemanggilan fungsi dan endpoint sebelum mengubah kontrak.

## 3.2 Strategi branch

Buat branch kerja:

```bash
git checkout feature/penilaian-penjual
git pull
git checkout -b fix/validitas-data-metode-p0-p1
```

Jangan commit langsung ke `main`.

## 3.3 Prinsip perubahan

- Pertahankan kompatibilitas fitur yang tidak terkait.
- Hindari perubahan skema tanpa migrasi Prisma.
- Jangan menghapus data lama sebelum membuat backup atau dry-run report.
- Jangan memasukkan data simulasi ke database produksi.
- Jangan menyatakan saran pencarian sebagai data harga.
- Jangan menganggap input manual identik dengan aset.
- Jangan menggunakan hasil berstatus `MENUNGGU` dalam median.
- Jangan menggunakan bobot AHP nonaktif.
- Jangan mengubah hasil historis secara diam-diam.
- Jangan membuat klaim “nilai appraisal resmi”.
- Gunakan istilah UI: **Rekomendasi Nilai Limit Awal**.

## 3.4 Strategi commit

Buat commit atomik dengan urutan berikut:

1. `chore: add baseline tests and migration safety`
2. `feat: classify comparable data sources and url integrity`
3. `fix: remove synthetic comparable prices`
4. `fix: restrict median to accepted eligible comparables`
5. `feat: add reference confidence calculation`
6. `fix: use fixed-scale SAW normalization`
7. `fix: enforce active AHP weight version`
8. `feat: persist calculation snapshots`
9. `feat: add criterion scoring rubrics`
10. `feat: add limit formula validation workflow`
11. `test: add negative and integration cases for p0 p1`
12. `docs: add implementation and evidence reports`

Apabila struktur aktual repository membuat urutan tersebut tidak praktis, pertahankan prinsip bahwa setiap commit harus dapat dijelaskan dan diuji secara terpisah.

---

# 4. KONDISI AWAL YANG HARUS DIPERBAIKI

Audit awal menemukan pola berikut.

## 4.1 Harga fallback sintetis

`backend/src/services/pembanding.service.js` memiliki generator fallback yang:

- memakai `hargaPasar` aset sebagai harga dasar;
- mengalikan harga tersebut dengan variasi angka;
- membuat judul dan kondisi buatan;
- memakai URL halaman pencarian marketplace;
- memasukkan hasil tersebut sebagai data pembanding.

Pola ini harus dihapus dari jalur produksi.

## 4.2 Median menerima data belum disetujui

`hitungMedian` saat ini menggunakan kondisi:

```javascript
statusValidasi: { not: 'DITOLAK' }
```

Kondisi tersebut memasukkan status `MENUNGGU`. Perbaiki menjadi hanya:

```javascript
statusValidasi: 'DITERIMA'
```

## 4.3 Input manual diberi similarity sempurna

Input manual saat ini menetapkan:

```javascript
similarity: 1.0
skorKecocokan: 90
isOutlier: false
dipilihPenjual: true
```

Perilaku ini tidak dapat dipertahankan. Data manual harus melalui:

- normalisasi URL;
- validasi URL detail;
- fuzzy matching;
- outlier detection;
- validasi admin.

## 4.4 Fuzzy threshold terlalu longgar

Komentar kode menyatakan kemiripan tinggi, tetapi konfigurasi Fuse.js menggunakan threshold longgar. Ubah menjadi mekanisme yang eksplisit dan dapat dikonfigurasi.

## 4.5 Bobot AHP dipilih berdasarkan data terbaru

`penilaian.service.js` mengambil bobot terbaru berdasarkan `createdAt`, bukan berdasarkan versi aktif. Ubah agar seluruh bobot berasal dari satu `BobotVersion` aktif.

## 4.6 Hasil belum menyimpan parameter perhitungan

Model `Hasil` saat ini hanya menyimpan:

- nilai preferensi;
- harga referensi;
- nilai limit.

Tambahkan snapshot agar hasil dapat direproduksi.

---

# 5. ARSITEKTUR TARGET

Alur baru harus menjadi:

```text
Aset
  ↓
Pencarian data
  ├── SCRAPED_REAL → URL detail iklan → fuzzy match → admin review
  ├── MANUAL       → URL detail iklan → fuzzy match → admin review
  ├── SEARCH_SUGGESTION → hanya link pencarian, tanpa harga
  └── TEST_FIXTURE → hanya lingkungan test
  ↓
Data berstatus DITERIMA + dipilih + URL detail + bukan outlier
  ↓
Hitung median
  ↓
Hitung tingkat keyakinan
  ↓
Ambil satu BobotVersion yang aktif
  ↓
Validasi kelengkapan bobot
  ↓
Normalisasi SAW skala tetap 1–5
  ↓
Hitung preferensi
  ↓
Nilai limit = preferensi × median harga referensi
  ↓
Simpan snapshot lengkap
  ↓
Tampilkan sebagai Rekomendasi Nilai Limit Awal
```

---

# 6. PERUBAHAN SKEMA DATABASE

Edit:

```text
backend/prisma/schema.prisma
```

Nama enum dapat disesuaikan dengan konvensi repository, tetapi maknanya wajib sama.

## 6.1 Enum jenis sumber data pembanding

Tambahkan:

```prisma
enum JenisSumberPembanding {
  SCRAPED_REAL
  MANUAL
  TEST_FIXTURE
}
```

`SEARCH_SUGGESTION` disarankan disimpan pada model terpisah karena tidak mempunyai harga yang teramati.

## 6.2 Enum integritas URL

Tambahkan:

```prisma
enum StatusIntegritasUrl {
  DETAIL_IKLAN
  HALAMAN_PENCARIAN
  TIDAK_VALID
  BELUM_DIVERIFIKASI
}
```

## 6.3 Enum status kecocokan

Tambahkan:

```prisma
enum StatusKecocokanPembanding {
  LAYAK
  PERLU_TINJAU
  TIDAK_LAYAK
}
```

## 6.4 Enum tingkat keyakinan

Tambahkan:

```prisma
enum TingkatKeyakinanReferensi {
  TINGGI
  SEDANG
  RENDAH
  TIDAK_CUKUP
}
```

## 6.5 Perubahan `DataPembanding`

Tambahkan minimal:

```prisma
jenisSumber       JenisSumberPembanding @default(SCRAPED_REAL) @map("jenis_sumber")
statusIntegritasUrl StatusIntegritasUrl @default(BELUM_DIVERIFIKASI) @map("status_integritas_url")
statusKecocokan   StatusKecocokanPembanding @default(PERLU_TINJAU) @map("status_kecocokan")
canonicalUrl      String? @map("canonical_url") @db.Text
canonicalUrlHash  String? @map("canonical_url_hash") @db.Char(64)
sourceDomain      String? @map("source_domain") @db.VarChar(150)
alasanKecocokan   Json? @map("alasan_kecocokan")
validatedAt       DateTime? @map("validated_at")
validatedBy       Int? @map("validated_by")
```

Tambahkan indeks:

```prisma
@@index([asetId, statusValidasi])
@@index([asetId, jenisSumber])
@@index([asetId, statusKecocokan])
@@unique([asetId, canonicalUrlHash])
```

Catatan:

- `sourceUrl` boleh tetap disimpan.
- Apabila panjang URL menjadi masalah, ubah `sourceUrl` menjadi `@db.Text`.
- Gunakan `canonicalUrlHash` untuk deduplikasi.
- Jangan menjadikan URL halaman pencarian sebagai data harga.

## 6.6 Model saran pencarian

Tambahkan:

```prisma
model SaranPencarianPembanding {
  id          Int      @id @default(autoincrement())
  asetId      Int      @map("aset_id")
  marketplace String   @db.VarChar(100)
  query       String   @db.VarChar(255)
  searchUrl   String   @map("search_url") @db.Text
  createdAt   DateTime @default(now())

  aset Aset @relation(fields: [asetId], references: [id], onDelete: Cascade)

  @@index([asetId])
  @@map("saran_pencarian_pembanding")
}
```

Tambahkan relasi pada `Aset`.

Saran pencarian:

- tidak mempunyai `harga`;
- tidak mempunyai `statusValidasi`;
- tidak boleh masuk median;
- hanya membantu pengguna membuka halaman marketplace.

## 6.7 Model rubrik kriteria

Tambahkan:

```prisma
model RubrikKriteria {
  id          Int      @id @default(autoincrement())
  kriteriaId  Int      @map("kriteria_id")
  skor        Int
  label       String   @db.VarChar(100)
  deskripsi   String   @db.Text
  contohBukti String?  @map("contoh_bukti") @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  kriteria Kriteria @relation(fields: [kriteriaId], references: [id], onDelete: Cascade)

  @@unique([kriteriaId, skor])
  @@map("rubrik_kriteria")
}
```

Tambahkan relasi pada `Kriteria`.

Validasi aplikasi harus memastikan setiap kriteria memiliki tepat lima rubrik:

```text
skor 1, 2, 3, 4, dan 5
```

## 6.8 Perubahan model `Hasil`

Tambahkan:

```prisma
bobotVersionId       Int?     @map("bobot_version_id")
metodeNormalisasi    String   @default("FIXED_SCALE_1_5") @map("metode_normalisasi") @db.VarChar(50)
versiFormula         String   @default("LIMIT_V2") @map("versi_formula") @db.VarChar(50)

bobotSnapshot        Json?    @map("bobot_snapshot")
nilaiSnapshot        Json?    @map("nilai_snapshot")
normalisasiSnapshot  Json?    @map("normalisasi_snapshot")
pembandingSnapshot   Json?    @map("pembanding_snapshot")

tingkatKeyakinan     TingkatKeyakinanReferensi? @map("tingkat_keyakinan")
skorKeyakinan        Decimal? @map("skor_keyakinan") @db.Decimal(5, 2)
alasanKeyakinan      Json?    @map("alasan_keyakinan")

jumlahPembandingValid Int?    @map("jumlah_pembanding_valid")
jumlahScrapedReal     Int?    @map("jumlah_scraped_real")
jumlahManual          Int?    @map("jumlah_manual")
jumlahDomainUnik      Int?    @map("jumlah_domain_unik")

calculatedAt          DateTime? @map("calculated_at")
```

Tambahkan relasi ke `BobotVersion` dengan kebijakan yang tidak menghapus hasil historis:

```prisma
bobotVersion BobotVersion? @relation(fields: [bobotVersionId], references: [id], onDelete: Restrict)
```

Tambahkan relasi balik pada `BobotVersion`.

## 6.9 Model validasi nilai limit

Tambahkan:

```prisma
enum JenisNilaiAcuan {
  NILAI_PAKAR
  NILAI_LIMIT_AKTUAL
  HARGA_TRANSAKSI
  HASIL_LELANG
}

model ValidasiNilaiLimit {
  id              Int      @id @default(autoincrement())
  asetId          Int      @map("aset_id")
  hasilId         Int      @map("hasil_id")
  jenisNilaiAcuan JenisNilaiAcuan @map("jenis_nilai_acuan")
  nilaiAcuan      Decimal  @map("nilai_acuan") @db.Decimal(20, 2)
  sumberAcuan     String   @map("sumber_acuan") @db.Text
  tanggalAcuan    DateTime? @map("tanggal_acuan")
  absoluteError   Decimal? @map("absolute_error") @db.Decimal(20, 2)
  percentageError Decimal? @map("percentage_error") @db.Decimal(10, 4)
  catatan         String?  @db.Text
  createdAt       DateTime @default(now())

  aset  Aset  @relation(fields: [asetId], references: [id], onDelete: Cascade)
  hasil Hasil @relation(fields: [hasilId], references: [id], onDelete: Cascade)

  @@index([asetId])
  @@index([hasilId])
  @@map("validasi_nilai_limit")
}
```

Tambahkan relasi pada `Aset` dan `Hasil`.

## 6.10 Migrasi

Jalankan:

```bash
cd backend
npx prisma format
npx prisma migrate dev --name validitas_data_dan_metode_p0_p1
npx prisma generate
```

Untuk deployment nondevelopment, gunakan mekanisme migrasi yang berlaku pada project.

---

# 7. MIGRASI DAN KLASIFIKASI DATA LAMA

Buat:

```text
backend/src/scripts/migrate_legacy_comparables.js
```

Script harus memiliki mode:

```bash
node src/scripts/migrate_legacy_comparables.js --dry-run
node src/scripts/migrate_legacy_comparables.js --apply
```

## 7.1 Aturan klasifikasi

### Klasifikasi sebagai `HALAMAN_PENCARIAN`

Apabila URL mengandung pola seperti:

```text
/search
search?
?q=
?keyword=
/items/q-
/products?
/cari/
/cars/?q=
```

atau path hanya menuju halaman daftar hasil.

### Klasifikasi sebagai kandidat sintetis lama

Deteksi gabungan, jangan hanya berdasarkan satu field:

- spesifikasi dimulai dengan pola:
  - `Unit pembanding dari`;
  - `Iklan dari ... untuk`;
- judul memakai pola fallback yang diketahui;
- URL adalah halaman pencarian;
- harga sangat dekat dengan `hargaPasar` melalui pengali fallback lama;
- dibuat pada periode implementasi fallback.

### Perlakuan

- Jangan hapus langsung dalam dry-run.
- Tulis report:
  - ID;
  - aset;
  - URL;
  - sumber;
  - harga;
  - alasan klasifikasi;
  - tindakan yang direkomendasikan.
- Saat `--apply`:
  - tandai `statusIntegritasUrl = HALAMAN_PENCARIAN`;
  - tandai `statusKecocokan = TIDAK_LAYAK`;
  - ubah `statusValidasi = DITOLAK`;
  - ubah `dipilihPenjual = false`;
  - jangan gunakan dalam median.
- Jangan mengubah data manual yang belum dapat dipastikan.
- Data ambigu harus diberi status `PERLU_TINJAU`.

## 7.2 Bukti migrasi

Simpan keluaran:

```text
docs/evidence/p0_p1/legacy-comparable-dry-run.json
docs/evidence/p0_p1/legacy-comparable-apply.json
docs/evidence/p0_p1/legacy-comparable-summary.md
```

Jangan commit data pribadi atau token.

---

# 8. PRIORITAS 0.1 — HAPUS HARGA FALLBACK SINTETIS

## 8.1 File utama

```text
backend/src/services/pembanding.service.js
backend/src/services/scraping_queue.service.js
backend/src/controllers/pembanding.controller.js
```

## 8.2 Perubahan wajib

Hapus fungsi atau perilaku yang:

- mengambil `asset.hargaPasar`;
- membentuk variasi harga menggunakan multiplier;
- membuat data pembanding seolah-olah berasal dari marketplace;
- menyimpan link pencarian sebagai sumber data harga.

Ganti fallback menjadi generator **saran pencarian tanpa harga**.

Contoh struktur:

```javascript
const buildSearchSuggestions = (asset, keyword) => [
  {
    marketplace: 'Tokopedia',
    query: keyword,
    searchUrl: `https://www.tokopedia.com/search?st=product&q=${encodeURIComponent(keyword)}`
  },
  // marketplace lain
];
```

Simpan ke `SaranPencarianPembanding`, bukan `DataPembanding`.

## 8.3 Perilaku saat scraping kurang dari tiga hasil

Response harus memuat:

```json
{
  "realComparableCount": 1,
  "searchSuggestions": 5,
  "message": "Data iklan aktual belum mencukupi. Saran pencarian disediakan tanpa harga."
}
```

Dilarang:

- mengisi harga saran;
- menghitung median dari saran;
- memberi similarity pada saran;
- menampilkan saran sebagai “data ditemukan”.

## 8.4 Kriteria penerimaan

- Tidak ada lagi `priceVariations`.
- Tidak ada lagi perkalian `basePrice * multiplier`.
- Tidak ada data `DataPembanding` baru yang berasal dari URL pencarian.
- Search suggestion tampil terpisah.
- Scraping gagal tidak menciptakan harga apa pun.

## 8.5 Test wajib

1. Scraper mengembalikan 0 hasil.
2. Scraper mengembalikan 1 hasil.
3. Scraper mengembalikan 2 hasil.
4. Scraper melempar error.
5. Redis tidak tersedia dan mode synchronous aktif.

Ekspektasi semua test:

- jumlah data harga sama dengan hasil real scraper;
- tidak ada harga sintetis;
- tersedia saran pencarian;
- tidak ada median otomatis.

---

# 9. PRIORITAS 0.2 — MEDIAN HANYA DATA `DITERIMA`

## 9.1 File utama

```text
backend/src/controllers/pembanding.controller.js
backend/src/services/pembanding.service.js
backend/src/routes/pembanding.routes.js
```

## 9.2 Query median baru

Gunakan seluruh filter berikut:

```javascript
where: {
  asetId,
  dipilihPenjual: true,
  statusValidasi: 'DITERIMA',
  statusKecocokan: 'LAYAK',
  statusIntegritasUrl: 'DETAIL_IKLAN',
  isOutlier: false,
  jenisSumber: {
    in: ['SCRAPED_REAL', 'MANUAL']
  }
}
```

Minimal tiga data valid diperlukan.

Jangan fallback ke data outlier apabila data non-outlier kurang dari tiga.

Perilaku lama yang menggunakan semua harga apabila non-outlier tidak cukup harus dihapus.

## 9.3 Response error

Apabila data kurang:

```json
{
  "success": false,
  "code": "INSUFFICIENT_ACCEPTED_COMPARABLES",
  "message": "Minimal tiga data pembanding yang diterima, layak, berasal dari URL detail iklan, dan bukan outlier diperlukan.",
  "counts": {
    "selected": 4,
    "accepted": 2,
    "eligible": 2,
    "nonOutlier": 2
  }
}
```

## 9.4 Perilaku hasil

Jangan membuat baris `Hasil` placeholder dengan:

```text
nilaiPreferensi = 0
nilaiLimit = median
```

Median harga referensi boleh disimpan pada aset atau tabel khusus, tetapi jangan menyatakannya sebagai hasil final SPK sebelum penilaian SAW dilakukan.

Rekomendasi:

- update `Aset.hargaPasar` hanya setelah median valid;
- jangan membuat `Hasil` apabila SAW belum dijalankan;
- atau buat model hasil harga referensi terpisah apabila struktur project memungkinkan.

## 9.5 Test wajib

| Kasus | Ekspektasi |
|---|---|
| 2 diterima + 2 menunggu | gagal |
| 3 diterima + 1 menunggu | berhasil, hanya 3 dipakai |
| 3 diterima tetapi satu outlier | gagal |
| 4 diterima dan satu outlier | berhasil memakai 3 |
| 3 diterima tetapi satu URL pencarian | gagal |
| 3 diterima tetapi satu `TEST_FIXTURE` | gagal |
| 3 diterima dan semua valid | median benar |

---

# 10. PRIORITAS 0.3 — PEMISAHAN JENIS DATA

## 10.1 Aturan klasifikasi

### `SCRAPED_REAL`

Syarat:

- berasal dari scraper;
- mempunyai harga teramati;
- mempunyai URL detail;
- mempunyai tanggal scraping;
- source domain dikenali atau dapat diverifikasi.

### `MANUAL`

Syarat:

- dimasukkan pengguna;
- mempunyai harga;
- mempunyai URL detail;
- status awal `MENUNGGU`;
- similarity dihitung sistem;
- tidak otomatis dipilih;
- harus disetujui admin.

### `SEARCH_SUGGESTION`

Syarat:

- hanya berisi marketplace, query, dan URL pencarian;
- tidak mempunyai harga;
- disimpan pada model terpisah;
- tidak dapat dipilih sebagai pembanding.

### `TEST_FIXTURE`

Syarat:

- hanya dibuat dalam test atau seed khusus test;
- tidak tersedia melalui UI produksi;
- ditolak oleh service median;
- tidak boleh dibuat saat `NODE_ENV=production`.

## 10.2 Guard production

Tambahkan guard:

```javascript
if (jenisSumber === 'TEST_FIXTURE' && process.env.NODE_ENV === 'production') {
  throw new Error('TEST_FIXTURE tidak diizinkan pada lingkungan production');
}
```

## 10.3 Frontend

Pada `DataPembandingPage.jsx`, tampilkan badge:

- `Scraping Aktual`
- `Input Manual`
- `Data Uji`

Search suggestion harus berada pada panel berbeda:

```text
Saran Tautan Pencarian
```

Jangan tampilkan tombol pilih atau validasi harga pada saran pencarian.

## 10.4 Kriteria penerimaan

- Setiap data harga memiliki jenis sumber.
- Tidak ada harga pada search suggestion.
- Data test tidak dapat masuk median.
- UI tidak mencampurkan saran pencarian dan data harga.

---

# 11. PRIORITAS 0.4 — PERKETAT FUZZY MATCHING

## 11.1 File utama

```text
backend/src/services/pembanding.service.js
```

Disarankan membuat:

```text
backend/src/services/comparable_matching.service.js
```

agar logika mudah diuji.

## 11.2 Normalisasi teks

Buat fungsi:

```javascript
normalizeComparableText(text)
```

Minimal melakukan:

- lowercase;
- hapus tanda baca;
- normalisasi spasi;
- normalisasi variasi merek umum;
- hapus token promosi:
  - murah;
  - promo;
  - nego;
  - ready;
  - termurah;
  - berkualitas;
  - fullset apabila bukan atribut yang dinilai.

Jangan menghapus:

- merek;
- model;
- tipe;
- tahun;
- kapasitas;
- lokasi;
- ukuran.

## 11.3 Hard gates sebelum fuzzy score

### Kendaraan

Wajib:

- merek sesuai;
- model/tipe sesuai;
- tahun dalam toleransi yang dikonfigurasi, default ±2 tahun.

### Elektronik

Wajib:

- merek sesuai;
- model atau seri utama sesuai;
- kapasitas/spesifikasi utama tidak bertentangan.

### Tanah dan bangunan

Wajib:

- jenis objek sesuai;
- kota/kabupaten sesuai;
- kecamatan atau area berdekatan apabila tersedia.

Data yang gagal hard gate:

```text
statusKecocokan = TIDAK_LAYAK
```

## 11.4 Threshold

Gunakan environment:

```env
COMPARABLE_MIN_SIMILARITY=0.80
COMPARABLE_REVIEW_SIMILARITY=0.70
COMPARABLE_YEAR_TOLERANCE=2
```

Aturan:

```text
similarity >= 0.80 → LAYAK
0.70 <= similarity < 0.80 → PERLU_TINJAU
similarity < 0.70 → TIDAK_LAYAK
```

Jangan memakai `sumber` marketplace sebagai faktor kemiripan semantik.

Bobot yang disarankan:

```text
judul/model utama: 0.55
spesifikasi:       0.30
lokasi/tahun:      0.15
```

Sesuaikan per kategori.

## 11.5 Input manual

Input manual harus melewati fungsi matching yang sama.

Dilarang:

```javascript
similarity: 1.0
```

kecuali hasil perhitungan memang 1.0.

## 11.6 Audit reason

Simpan `alasanKecocokan`, contoh:

```json
{
  "brandMatch": true,
  "modelMatch": true,
  "yearDifference": 1,
  "locationMatch": false,
  "fuseScore": 0.14,
  "similarity": 0.86,
  "decision": "LAYAK"
}
```

## 11.7 Test wajib

- merek sama, model sama;
- merek beda;
- model beda tetapi token umum sama;
- tahun selisih 1;
- tahun selisih 5;
- judul promosi;
- input manual;
- lokasi properti beda kota;
- similarity tepat pada batas 0.80;
- similarity tepat di bawah batas.

---

# 12. PRIORITAS 0.5 — VALIDASI URL IKLAN AKTUAL

## 12.1 Buat utility

```text
backend/src/utils/url_integrity.js
```

Fungsi minimal:

```javascript
canonicalizeUrl(url)
getSourceDomain(url)
classifyMarketplaceUrl(url)
hashCanonicalUrl(url)
```

## 12.2 Canonicalization

- hapus fragment `#`;
- hapus parameter tracking:
  - `utm_*`;
  - `fbclid`;
  - `gclid`;
  - parameter referral;
- pertahankan parameter yang merupakan ID iklan;
- normalisasi trailing slash;
- lowercase domain;
- gunakan SHA-256 untuk `canonicalUrlHash`.

## 12.3 Klasifikasi

Kembalikan:

```javascript
{
  canonicalUrl,
  canonicalUrlHash,
  sourceDomain,
  statusIntegritasUrl,
  reasons
}
```

`DETAIL_IKLAN` hanya diberikan apabila:

- URL bukan halaman pencarian;
- URL bukan homepage;
- URL bukan kategori/listing;
- path mempunyai identitas item atau pola detail marketplace;
- URL valid secara sintaks.

Apabila melakukan request HTTP untuk verifikasi:

- timeout maksimal 8 detik;
- batasi redirect;
- jangan mengunduh file besar;
- hormati error;
- jangan menjadikan kegagalan jaringan sebagai detail valid.

## 12.4 Validasi input manual

Endpoint manual harus menolak URL pencarian:

```json
{
  "code": "SEARCH_URL_NOT_ALLOWED",
  "message": "URL harus mengarah ke halaman detail iklan, bukan halaman pencarian."
}
```

Status awal data manual tetap `MENUNGGU`.

## 12.5 Kriteria penerimaan

- Semua data yang masuk median berstatus `DETAIL_IKLAN`.
- URL pencarian tidak dapat ditambahkan sebagai data manual.
- URL duplikat pada aset yang sama ditolak berdasarkan hash.
- URL dengan tracking berbeda tetapi item sama dianggap duplikat.
- Search URL hanya berada pada model saran pencarian.

---

# 13. PRIORITAS 0.6 — TINGKAT KEYAKINAN HARGA REFERENSI

## 13.1 Buat service

```text
backend/src/services/reference_confidence.service.js
```

Ekspor:

```javascript
calculateReferenceConfidence(comparables)
```

## 13.2 Data yang dihitung

Hanya gunakan data yang:

- dipilih penjual;
- `DITERIMA`;
- `LAYAK`;
- `DETAIL_IKLAN`;
- bukan outlier;
- jenis sumber `SCRAPED_REAL` atau `MANUAL`.

Hitung:

- total valid;
- jumlah scraped real;
- jumlah manual;
- jumlah domain unik;
- rentang harga;
- coefficient of variation apabila diperlukan;
- jumlah data yang ditolak;
- jumlah outlier.

## 13.3 Aturan tingkat keyakinan

Gunakan aturan deterministik berikut.

### `TIDAK_CUKUP`

Apabila:

```text
total valid < 3
```

Dampak:

- median diblokir;
- SAW tidak boleh menghasilkan nilai limit final;
- UI menampilkan kekurangan data.

### `RENDAH`

Apabila total valid minimal 3, tetapi salah satu berlaku:

- scraped real kurang dari 3;
- semua data berasal dari satu domain;
- data manual lebih dari 50%;
- hanya tiga data valid dan sebaran harga tinggi.

### `SEDANG`

Apabila:

- total valid 3–4;
- minimal dua scraped real;
- minimal dua domain;
- tidak ada anomali berat.

### `TINGGI`

Apabila:

- total valid minimal 5;
- minimal tiga scraped real;
- minimal dua domain;
- tidak ada URL bermasalah;
- sebaran harga berada dalam batas yang ditetapkan.

Jangan menganggap jumlah data semata sebagai bukti kualitas. Sertakan alasan.

## 13.4 Skor keyakinan

Boleh gunakan skor 0–100, tetapi level harus ditentukan aturan eksplisit.

Contoh komponen:

```text
jumlah data:       maksimum 35
scraped real:      maksimum 25
domain unik:       maksimum 20
konsistensi harga: maksimum 20
```

Simpan breakdown dalam `alasanKeyakinan`.

## 13.5 Frontend

Tampilkan badge pada:

- `DataPembandingPage.jsx`
- `SellerPenilaianPage.jsx`
- `AdminPenilaianAsetPage.jsx`
- `HasilPage.jsx`

Pesan:

### Rendah

> Tingkat keyakinan rendah. Harga referensi masih didominasi input manual atau jumlah iklan aktual belum mencukupi. Hasil hanya digunakan sebagai rekomendasi awal.

### Tidak cukup

> Data pembanding belum mencukupi. Tambahkan dan validasi minimal tiga data yang memenuhi syarat.

## 13.6 Test wajib

- 2 real;
- 3 manual satu domain;
- 2 real + 1 manual dua domain;
- 3 real dua domain;
- 5 real tiga domain;
- 5 data dengan sebaran harga ekstrem;
- outlier tidak ikut perhitungan.

---

# 14. PRIORITAS 1.1 — NORMALISASI SAW SKALA TETAP

## 14.1 Masalah

Normalisasi tidak boleh bergantung pada aset lain dalam database.

Nilai aset A harus tetap sama apabila:

- aset B ditambahkan;
- aset C dihapus;
- aset lain mempunyai skor ekstrem.

## 14.2 File utama

```text
backend/src/services/saw.service.js
backend/src/services/penilaian.service.js
backend/src/controllers/spk.controller.js
backend/src/tests/spk.test.js
```

## 14.3 Formula

Untuk skor 1–5:

### Benefit

\[
r_{ij} = \frac{x_{ij}}{5}
\]

### Cost

\[
r_{ij} = \frac{6-x_{ij}}{5}
\]

Validasi:

```text
x harus bilangan bulat 1–5
```

Hasil normalisasi:

```text
0.2–1.0
```

Catatan penting:

- Rubrik benefit harus mendefinisikan skor 5 sebagai kondisi terbaik.
- Rubrik cost harus mendefinisikan skor 1 sebagai kondisi terbaik dan skor 5 sebagai kondisi terburuk.
- Jangan memakai label generik yang membuat arah skor ambigu.

## 14.4 API service

Buat fungsi murni:

```javascript
normalizeFixedScale(value, type)
calculatePreference(criteriaScores)
```

Contoh:

```javascript
export function normalizeFixedScale(value, type) {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error('Nilai harus bilangan bulat 1 sampai 5');
  }

  if (type === 'benefit') return value / 5;
  if (type === 'cost') return (6 - value) / 5;

  throw new Error(`Tipe kriteria tidak didukung: ${type}`);
}
```

## 14.5 Hapus ketergantungan aset lain

Jangan mengambil seluruh aset kategori hanya untuk mencari min/max.

Perhitungan satu aset harus membutuhkan:

- skor aset tersebut;
- bobot aktif;
- harga referensi aset tersebut.

## 14.6 Backward compatibility

Jangan mengubah hasil historis lama. Hasil baru memakai:

```text
metodeNormalisasi = FIXED_SCALE_1_5
versiFormula = LIMIT_V2
```

Hasil lama dapat diberi:

```text
LEGACY_DYNAMIC_SAW
LIMIT_V1
```

melalui migrasi atau saat ditampilkan.

## 14.7 Test wajib

1. Aset A dihitung sendiri.
2. Tambahkan aset B dengan skor ekstrem.
3. Hitung ulang Aset A.
4. Nilai preferensi A harus identik.

Tambahkan juga:

- benefit nilai 1 dan 5;
- cost nilai 1 dan 5;
- nilai 0 ditolak;
- nilai 6 ditolak;
- nilai desimal ditolak;
- jumlah bobot tidak 1 ditolak atau dinormalisasi dengan aturan eksplisit.

Gunakan toleransi floating point.

---

# 15. PRIORITAS 1.2 — HANYA BOBOT AHP AKTIF

## 15.1 File utama

```text
backend/src/services/penilaian.service.js
backend/src/controllers/spk.controller.js
backend/src/services/ahp.service.js
backend/prisma/schema.prisma
```

## 15.2 Aturan active version

Untuk setiap kategori:

- harus ada tepat satu versi aktif;
- versi aktif harus mempunyai `cr <= 0.10`;
- versi aktif harus mempunyai bobot untuk semua kriteria aktif;
- total bobot harus mendekati 1;
- semua bobot harus positif.

## 15.3 Service pengambilan bobot

Buat:

```text
backend/src/services/weight_version.service.js
```

Ekspor:

```javascript
getActiveWeightVersion(kategoriId, client = prisma)
activateWeightVersion(versionId, actor)
validateWeightVersion(version)
```

`getActiveWeightVersion` harus:

1. mengambil seluruh versi aktif untuk kategori;
2. gagal apabila tidak ada;
3. gagal apabila lebih dari satu;
4. memuat semua `BobotAHP`;
5. memvalidasi CR dan total bobot.

Response error:

```json
{
  "code": "ACTIVE_WEIGHT_VERSION_NOT_FOUND"
}
```

atau:

```json
{
  "code": "MULTIPLE_ACTIVE_WEIGHT_VERSIONS"
}
```

## 15.4 Aktivasi atomik

Saat mengaktifkan versi:

```javascript
await prisma.$transaction(async (tx) => {
  // validasi versi target
  // nonaktifkan versi lain pada kategori
  // aktifkan target
});
```

Jangan mengaktifkan versi dengan CR di atas 0.10.

## 15.5 Perubahan query

Hapus pola:

```javascript
orderBy: { createdAt: 'desc' },
take: 1
```

sebagai cara memilih bobot.

Seluruh kriteria harus memakai bobot dari `versionId` yang sama.

## 15.6 Test wajib

- tidak ada versi aktif;
- satu versi aktif valid;
- dua versi aktif;
- versi aktif CR > 0.10;
- satu kriteria kehilangan bobot;
- total bobot 0.95;
- total bobot 1.00;
- versi terbaru tidak aktif tetapi versi lama aktif;
- sistem harus memilih versi lama yang aktif.

---

# 16. PRIORITAS 1.3 — SNAPSHOT PERHITUNGAN

## 16.1 Tujuan

Hasil harus dapat direproduksi meskipun:

- bobot berubah;
- rubrik diperbarui;
- data pembanding ditambah;
- status data pembanding berubah;
- nama kriteria berubah.

## 16.2 Snapshot minimal

Saat menghitung hasil, simpan:

### `bobotSnapshot`

```json
{
  "versionId": 3,
  "versionName": "Bobot Pakar 2026",
  "cr": 0.0321,
  "weights": [
    {
      "kriteriaId": 1,
      "nama": "Kondisi Mesin",
      "tipe": "benefit",
      "bobot": 0.25
    }
  ]
}
```

### `nilaiSnapshot`

```json
[
  {
    "kriteriaId": 1,
    "nama": "Kondisi Mesin",
    "nilai": 4,
    "rubrik": "Berfungsi baik dengan kerusakan ringan"
  }
]
```

### `normalisasiSnapshot`

```json
[
  {
    "kriteriaId": 1,
    "nilai": 4,
    "tipe": "benefit",
    "normalized": 0.8,
    "bobot": 0.25,
    "weightedScore": 0.2
  }
]
```

### `pembandingSnapshot`

```json
{
  "median": 185000000,
  "confidence": "SEDANG",
  "records": [
    {
      "id": 10,
      "jenisSumber": "SCRAPED_REAL",
      "sumber": "OLX",
      "sourceDomain": "olx.co.id",
      "sourceUrl": "...",
      "harga": 180000000,
      "similarity": 0.88,
      "statusValidasi": "DITERIMA",
      "isOutlier": false
    }
  ]
}
```

## 16.3 Aturan immutability

- Jangan update baris hasil historis saat median baru dihitung.
- Buat baris `Hasil` baru untuk setiap kalkulasi final.
- `Aset.limitValue` boleh menunjuk hasil terbaru.
- Hasil lama tetap dapat dibaca.
- Jangan delete `BobotVersion` yang telah direferensikan hasil.

## 16.4 API response

Response perhitungan harus memuat:

```json
{
  "hasilId": 100,
  "nilaiPreferensi": 0.82,
  "hargaReferensiPasar": 185000000,
  "nilaiLimit": 151700000,
  "bobotVersion": {
    "id": 3,
    "nama": "Bobot Pakar 2026"
  },
  "metodeNormalisasi": "FIXED_SCALE_1_5",
  "versiFormula": "LIMIT_V2",
  "tingkatKeyakinan": "SEDANG"
}
```

## 16.5 Test wajib

- hasil menyimpan versi bobot;
- snapshot bobot lengkap;
- snapshot nilai lengkap;
- snapshot normalisasi lengkap;
- snapshot pembanding hanya data yang dipakai;
- mengubah bobot aktif tidak mengubah snapshot hasil lama;
- menghitung ulang membuat hasil baru.

---

# 17. PRIORITAS 1.4 — VALIDASI RECIPROCAL MATRIX AHP

## 17.1 File utama

```text
backend/src/services/ahp.service.js
backend/src/tests/spk.test.js
backend/src/tests/test_algoritma.js
```

## 17.2 Fungsi validasi

Tambahkan:

```javascript
validatePairwiseMatrix(matrix, options)
```

Validasi:

1. matrix adalah array;
2. matrix tidak kosong;
3. setiap baris array;
4. matrix persegi;
5. semua nilai finite;
6. semua nilai positif;
7. diagonal sama dengan 1;
8. `a[i][j] × a[j][i] ≈ 1`;
9. dimensi sesuai jumlah kriteria;
10. nilai berada pada rentang skala yang disetujui, termasuk reciprocal.

Gunakan tolerance, misalnya:

```javascript
const tolerance = 1e-6;
```

Contoh reciprocity:

```javascript
Math.abs(matrix[i][j] * matrix[j][i] - 1) <= tolerance
```

## 17.3 Pesan error

Error harus menyebut posisi:

```text
Matriks tidak reciprocal pada [0][2] dan [2][0].
```

## 17.4 Kasus satu kriteria

Pilih satu perilaku dan dokumentasikan:

- menerima `[[1]]` dengan bobot 1 dan CR 0; atau
- menolak karena penelitian membutuhkan minimal dua kriteria.

Disarankan menerima `[[1]]` secara matematis, tetapi kategori aktual tetap harus memiliki struktur sesuai penelitian.

## 17.5 Test wajib

- matriks valid;
- diagonal bukan 1;
- pasangan tidak reciprocal;
- nilai 0;
- nilai negatif;
- `NaN`;
- `Infinity`;
- tidak persegi;
- dimensi tidak sesuai;
- matriks `[[1]]`;
- CR di bawah 0.10;
- CR di atas 0.10.

---

# 18. PRIORITAS 1.5 — RUBRIK SKOR 1–5

## 18.1 Prinsip

Rubrik harus:

- khusus per kriteria;
- dapat diamati;
- tidak hanya memakai kata “buruk” atau “baik”;
- menjelaskan bukti yang diperlukan;
- konsisten dengan tipe benefit/cost;
- tampil pada UI saat penjual memberi nilai.

## 18.2 Larangan

Jangan memakai satu rubrik generik untuk semua kriteria:

```text
1 Sangat Buruk
2 Buruk
3 Cukup
4 Baik
5 Sangat Baik
```

Rubrik tersebut tidak cukup untuk replikasi penelitian.

## 18.3 Seed rubrik

Buat:

```text
backend/prisma/seed_rubrik.js
```

atau integrasikan ke seed yang ada.

Agent harus membaca kriteria aktual pada database/seed. Buat mapping berdasarkan:

```text
kategori + nama kriteria
```

Apabila ada kriteria yang tidak dikenali:

- jangan membuat rubrik generik diam-diam;
- tulis ke report `unmapped-criteria.json`;
- batalkan submission penilaian untuk kriteria tersebut;
- tampilkan pesan bahwa rubrik belum dikonfigurasi.

## 18.4 Contoh rubrik kendaraan

### Kondisi Mesin — benefit

| Skor | Deskripsi |
|---:|---|
| 1 | Mesin tidak dapat beroperasi atau membutuhkan penggantian komponen utama. |
| 2 | Mesin dapat beroperasi terbatas dengan kerusakan berat dan membutuhkan perbaikan besar. |
| 3 | Mesin beroperasi, tetapi terdapat gangguan yang memerlukan perbaikan menengah. |
| 4 | Mesin beroperasi baik dengan gangguan ringan dan tidak memengaruhi fungsi utama. |
| 5 | Mesin beroperasi sangat baik, stabil, dan tidak ditemukan gangguan saat pemeriksaan. |

### Kilometer — cost

| Skor | Deskripsi |
|---:|---|
| 1 | Kilometer sangat rendah untuk usia kendaraan. |
| 2 | Kilometer rendah. |
| 3 | Kilometer sesuai rata-rata usia kendaraan. |
| 4 | Kilometer tinggi. |
| 5 | Kilometer sangat tinggi dan menunjukkan intensitas penggunaan berat. |

Batas numerik harus disesuaikan tipe kendaraan dan tahun. Simpan deskripsi yang disetujui penelitian.

## 18.5 Contoh rubrik elektronik

### Kelengkapan — benefit

| Skor | Deskripsi |
|---:|---|
| 1 | Unit utama tidak lengkap atau komponen penting hilang. |
| 2 | Unit tersedia, tetapi beberapa komponen utama/charger/adaptor tidak tersedia. |
| 3 | Unit dan komponen fungsi dasar tersedia, aksesori tambahan tidak lengkap. |
| 4 | Unit, komponen utama, dan sebagian besar aksesori tersedia. |
| 5 | Unit, komponen utama, aksesori, kemasan, dan dokumen pendukung lengkap. |

## 18.6 Contoh rubrik tanah/bangunan

### Legalitas — benefit

| Skor | Deskripsi |
|---:|---|
| 1 | Dokumen kepemilikan tidak tersedia atau terdapat sengketa yang belum diselesaikan. |
| 2 | Dokumen tersedia sebagian dan masih terdapat ketidakjelasan substantif. |
| 3 | Dokumen utama tersedia, tetapi masih membutuhkan verifikasi atau pembaruan administratif. |
| 4 | Dokumen utama lengkap dan tidak ditemukan sengketa berdasarkan pemeriksaan yang tersedia. |
| 5 | Dokumen lengkap, terverifikasi, konsisten dengan objek, dan tidak ditemukan indikasi sengketa. |

Rubrik tidak menggantikan pemeriksaan hukum profesional.

## 18.7 Frontend

`SellerPenilaianPage.jsx` harus menampilkan:

- nama kriteria;
- tipe benefit/cost;
- pilihan skor;
- deskripsi rubrik;
- contoh bukti;
- peringatan arah skor.

Untuk cost:

> Skor lebih rendah menunjukkan kondisi yang lebih baik.

## 18.8 Backend validation

Submission ditolak apabila:

- rubrik tidak lengkap;
- skor tidak mempunyai rubrik;
- terdapat kriteria kategori yang tidak diisi.

## 18.9 Test wajib

- setiap kriteria memiliki 5 rubrik;
- skor 1–5 unik;
- rubrik benefit tampil benar;
- rubrik cost tampil benar;
- kriteria tanpa rubrik memblokir submission;
- skor tidak sesuai rubrik ditolak.

---

# 19. PRIORITAS 1.6 — VALIDASI FORMULA NILAI LIMIT

## 19.1 Tujuan

Formula:

\[
NilaiLimit = NilaiPreferensi \times HargaReferensi
\]

tidak boleh langsung disebut akurat tanpa dibandingkan dengan nilai acuan.

Implementasikan workflow validasi sehingga penelitian dapat menghitung:

- Mean Absolute Error;
- Mean Absolute Percentage Error;
- Root Mean Squared Error;
- median absolute percentage error;
- bias rata-rata;
- korelasi peringkat apabila jumlah sampel memadai.

## 19.2 File baru

```text
backend/src/services/limit_validation.service.js
backend/src/controllers/limit_validation.controller.js
backend/src/routes/limit_validation.routes.js
backend/src/scripts/import_limit_validation.js
backend/src/scripts/report_limit_validation.js
backend/src/tests/limit_validation.test.js
```

## 19.3 Endpoint admin

Minimal:

```text
POST /api/limit-validation
GET  /api/limit-validation
GET  /api/limit-validation/summary
```

POST body:

```json
{
  "asetId": 10,
  "hasilId": 100,
  "jenisNilaiAcuan": "NILAI_PAKAR",
  "nilaiAcuan": 150000000,
  "sumberAcuan": "Berita acara penilaian pakar nomor ...",
  "tanggalAcuan": "2026-07-01",
  "catatan": ""
}
```

Admin-only.

## 19.4 Perhitungan error

```text
absoluteError = |nilaiLimitSistem - nilaiAcuan|
percentageError = absoluteError / nilaiAcuan × 100%
```

Jangan hitung percentage error jika `nilaiAcuan <= 0`.

### MAE

\[
MAE = \frac{1}{n}\sum |y_i-\hat y_i|
\]

### MAPE

\[
MAPE = \frac{100\%}{n}\sum \left|\frac{y_i-\hat y_i}{y_i}\right|
\]

### RMSE

\[
RMSE = \sqrt{\frac{1}{n}\sum(y_i-\hat y_i)^2}
\]

### Bias

\[
Bias = \frac{1}{n}\sum(\hat y_i-y_i)
\]

## 19.5 Status klaim

Jangan menetapkan ambang kelayakan secara arbitrer.

Summary harus memuat:

```json
{
  "sampleCount": 9,
  "mae": 0,
  "mape": 0,
  "rmse": 0,
  "bias": 0,
  "status": "PILOT",
  "note": "Status validasi akhir memerlukan ambang yang disetujui protokol penelitian."
}
```

Status:

- `BELUM_DIUJI`: tidak ada data;
- `PILOT`: ada data tetapi belum memenuhi protokol final;
- `TERVALIDASI`: hanya dapat ditetapkan dengan konfigurasi/keputusan penelitian;
- `PERLU_REVISI`: hasil melampaui ambang yang disetujui.

Jangan hardcode “MAPE < 10% berarti valid” tanpa dasar protokol penelitian.

## 19.6 Import CSV

Sediakan template:

```text
docs/templates/validasi_nilai_limit.csv
```

Kolom:

```csv
aset_id,hasil_id,jenis_nilai_acuan,nilai_acuan,sumber_acuan,tanggal_acuan,catatan
```

Script harus:

- dry-run;
- validasi aset dan hasil;
- memastikan hasil milik aset;
- menolak nilai acuan <= 0;
- mencegah duplikasi;
- menghasilkan report import.

## 19.7 Report penelitian

Generate:

```text
docs/evidence/p0_p1/limit-validation-summary.json
docs/evidence/p0_p1/limit-validation-report.md
docs/evidence/p0_p1/limit-validation-samples.csv
```

Report harus memuat:

- jumlah sampel;
- jenis nilai acuan;
- MAE;
- MAPE;
- RMSE;
- bias;
- nilai minimum/maksimum error;
- tabel tiap aset;
- keterbatasan.

Jangan memasukkan data pribadi.

---

# 20. KONTRAK API DATA PEMBANDING

Pertahankan endpoint lama selama memungkinkan, tetapi update responsenya.

## 20.1 GET pembanding aset

Response:

```json
{
  "success": true,
  "data": {
    "comparables": [],
    "searchSuggestions": [],
    "reference": {
      "median": null,
      "confidenceLevel": "TIDAK_CUKUP",
      "confidenceScore": 20,
      "reasons": [],
      "counts": {}
    }
  }
}
```

## 20.2 POST search

Response awal:

```json
{
  "success": true,
  "jobId": "123",
  "status": "QUEUED"
}
```

Job result:

```json
{
  "realDataSaved": 2,
  "suggestionsSaved": 5,
  "rejectedByMatching": 3,
  "invalidUrls": 1
}
```

## 20.3 POST manual

Jangan otomatis memilih data.

Response:

```json
{
  "success": true,
  "data": {
    "statusValidasi": "MENUNGGU",
    "dipilihPenjual": false,
    "jenisSumber": "MANUAL",
    "similarity": 0.84,
    "statusKecocokan": "LAYAK",
    "statusIntegritasUrl": "DETAIL_IKLAN"
  }
}
```

## 20.4 POST hitung median

Response:

```json
{
  "success": true,
  "data": {
    "median": 185000000,
    "confidenceLevel": "SEDANG",
    "confidenceScore": 70,
    "counts": {
      "valid": 4,
      "scrapedReal": 3,
      "manual": 1,
      "domains": 2
    },
    "usedComparableIds": [1, 2, 3, 4]
  }
}
```

---

# 21. PERUBAHAN FRONTEND

## 21.1 `DataPembandingPage.jsx`

Tambahkan:

- filter jenis sumber;
- badge integritas URL;
- badge similarity;
- status kecocokan;
- status validasi;
- tanda outlier;
- tingkat keyakinan;
- panel saran pencarian;
- pesan data tidak cukup.

Tombol pilih hanya aktif apabila:

```text
statusKecocokan = LAYAK
statusIntegritasUrl = DETAIL_IKLAN
statusValidasi != DITOLAK
jenisSumber != TEST_FIXTURE
```

Median hanya dapat dihitung apabila backend menyatakan eligible count minimal 3.

## 21.2 `ValidasiPembandingPage.jsx`

Admin harus melihat:

- URL detail yang dapat dibuka;
- domain;
- jenis sumber;
- similarity;
- alasan kecocokan;
- outlier;
- harga;
- atribut aset dan pembanding;
- keputusan menerima/menolak.

Admin tidak boleh menerima:

- search URL;
- invalid URL;
- `TEST_FIXTURE`;
- status `TIDAK_LAYAK`.

## 21.3 `SellerPenilaianPage.jsx`

Tambahkan:

- rubrik per skor;
- indikator benefit/cost;
- harga referensi;
- tingkat keyakinan;
- versi bobot aktif;
- peringatan bahwa hasil adalah rekomendasi awal.

Blok submit apabila:

- data pembanding tidak cukup;
- tidak ada bobot aktif;
- rubrik belum lengkap;
- skor belum lengkap.

## 21.4 `AdminPenilaianAsetPage.jsx`

Tampilkan:

- bobot version;
- CR;
- snapshot;
- confidence;
- jumlah data pembanding aktual/manual;
- metode normalisasi;
- versi formula;
- tombol atau tautan input nilai acuan validasi.

## 21.5 `HasilPage.jsx`

Ganti label:

```text
Nilai Limit
```

menjadi:

```text
Rekomendasi Nilai Limit Awal
```

Tampilkan:

- nilai preferensi;
- harga referensi;
- nilai limit;
- confidence;
- versi bobot;
- metode normalisasi;
- tanggal kalkulasi.

---

# 22. TEST PLAN WAJIB

Tambahkan atau pecah test ke file:

```text
backend/src/tests/comparable_source.test.js
backend/src/tests/comparable_matching.test.js
backend/src/tests/reference_confidence.test.js
backend/src/tests/saw_fixed_scale.test.js
backend/src/tests/ahp_validation.test.js
backend/src/tests/weight_version.test.js
backend/src/tests/calculation_snapshot.test.js
backend/src/tests/rubric.test.js
backend/src/tests/limit_validation.test.js
backend/src/tests/p0_p1.integration.test.js
```

## 22.1 Unit test

### Pembanding

- tidak membuat fallback price;
- search suggestion tanpa harga;
- URL classifier;
- canonical URL;
- duplicate URL;
- fuzzy score;
- hard gates;
- outlier IQR;
- median;
- confidence.

### SAW

- benefit;
- cost;
- fixed scale;
- determinisme;
- invalid score;
- total bobot.

### AHP

- square;
- positive;
- diagonal;
- reciprocal;
- CR;
- active version.

### Snapshot

- data lengkap;
- immutable;
- version relation.

### Formula validation

- MAE;
- MAPE;
- RMSE;
- bias;
- zero reference rejected.

## 22.2 Integration test

Gunakan test database.

Kasus minimal:

1. seller menambah manual URL detail;
2. admin menerima;
3. seller memilih;
4. tiga data valid tersedia;
5. median dihitung;
6. seller mengisi skor rubrik;
7. sistem mengambil bobot aktif;
8. SAW dihitung;
9. hasil dan snapshot tersimpan;
10. hasil dapat divalidasi terhadap nilai pakar.

## 22.3 Negative test

Wajib menyimpan bukti untuk:

- URL pencarian manual;
- URL tidak valid;
- duplicate URL;
- median dengan dua accepted;
- median dengan pending;
- median dengan outlier;
- `TEST_FIXTURE` pada production;
- nilai skor 0;
- nilai skor 6;
- matriks tidak reciprocal;
- tidak ada active weight;
- multiple active weights;
- incomplete rubric;
- incomplete snapshot;
- nilai acuan 0.

## 22.4 Frontend test

Apabila repository belum mempunyai framework frontend test, minimal lakukan:

- lint/build;
- manual test checklist;
- screenshot evidence.

Jangan menambahkan framework besar hanya untuk satu perubahan apabila waktu tidak proporsional. Namun, backend test wajib otomatis.

---

# 23. PERINTAH VERIFIKASI

Sesuaikan dengan script `package.json`.

Minimal:

```bash
cd backend
npm install
npx prisma format
npx prisma validate
npx prisma generate
npm test
```

Jalankan test existing:

```bash
node src/tests/test_algoritma.js
node src/tests/test_final_ahp_saw.js
```

Frontend:

```bash
cd frontend
npm install
npm run build
```

Apabila tersedia:

```bash
npm run lint
npm test
```

Cari seluruh penggunaan kode legacy:

```bash
grep -R "priceVariations" -n backend
grep -R "basePrice.*multiplier" -n backend
grep -R "statusValidasi.*not.*DITOLAK" -n backend
grep -R "similarity: 1.0" -n backend
grep -R "createdAt.*desc" -n backend/src/services backend/src/controllers
```

Ekspektasi:

- tidak ada synthetic price production;
- tidak ada median dengan status pending;
- tidak ada manual exact match hardcoded;
- tidak ada bobot dipilih hanya berdasarkan latest timestamp.

---

# 24. BUKTI IMPLEMENTASI

Buat folder:

```text
docs/evidence/p0_p1/
```

Simpan:

1. `01-before-state.md`
2. `02-schema-migration.md`
3. `03-legacy-data-migration.md`
4. `04-comparable-negative-tests.md`
5. `05-saw-determinism-test.md`
6. `06-ahp-reciprocal-test.md`
7. `07-active-weight-test.md`
8. `08-snapshot-test.md`
9. `09-rubric-coverage.md`
10. `10-limit-validation-report.md`
11. `test-results.txt`
12. screenshot UI yang relevan.

Setiap evidence harus memuat:

- tanggal;
- commit hash;
- environment;
- command;
- expected result;
- actual result;
- status pass/fail.

Jangan memalsukan hasil. Apabila test gagal, simpan kegagalan dan perbaikannya.

---

# 25. DEFINITION OF DONE

Implementasi dinyatakan selesai hanya apabila seluruh syarat berikut terpenuhi.

## Prioritas 0

- [ ] Tidak ada harga fallback sintetis pada production.
- [ ] Search suggestion tidak mempunyai harga.
- [ ] Data real/manual/search/test terpisah.
- [ ] Manual data tidak otomatis exact match.
- [ ] Median hanya memakai `DITERIMA`.
- [ ] Median hanya memakai `LAYAK`.
- [ ] Median hanya memakai URL detail.
- [ ] Median tidak memakai outlier.
- [ ] Median tidak memakai test fixture.
- [ ] Minimal tiga data wajib.
- [ ] Fuzzy matching lebih ketat dan teruji.
- [ ] URL detail divalidasi.
- [ ] Tingkat keyakinan dihitung dan ditampilkan.
- [ ] Data kurang dari batas tidak dianggap valid.

## Prioritas 1

- [ ] SAW memakai normalisasi skala tetap.
- [ ] Nilai aset tidak berubah karena aset lain.
- [ ] Tepat satu bobot version aktif.
- [ ] CR bobot aktif <= 0.10.
- [ ] Seluruh bobot berasal dari satu version.
- [ ] Snapshot lengkap tersimpan.
- [ ] Hasil historis immutable.
- [ ] Matriks AHP divalidasi reciprocal.
- [ ] Setiap kriteria mempunyai rubrik 1–5.
- [ ] Rubrik tampil di frontend.
- [ ] Formula nilai limit dapat dibandingkan dengan nilai acuan.
- [ ] Report MAE/MAPE/RMSE/bias tersedia.
- [ ] Semua test lama tetap lulus.
- [ ] Test baru lulus.
- [ ] Backend dan frontend berhasil build.

---

# 26. KRITERIA PENOLAKAN IMPLEMENTASI

Jangan nyatakan selesai apabila terdapat salah satu kondisi berikut:

- fallback harga hanya diganti nama tetapi masih dibuat;
- URL pencarian masih disimpan dengan harga;
- data `MENUNGGU` masih masuk median;
- manual data masih diberi similarity 1 tanpa perhitungan;
- data outlier dipakai ketika jumlah valid kurang;
- SAW masih mencari min/max dari aset lain;
- bobot latest masih digunakan tanpa cek aktif;
- snapshot hanya menyimpan ID tanpa nilai aktual;
- rubrik masih generik;
- hasil lama ditimpa;
- validasi formula hanya menampilkan selisih satu aset;
- tidak ada negative test;
- evidence hanya berupa klaim tanpa output test.

---

# 27. TEMPLATE LAPORAN AKHIR AI AGENT

Setelah implementasi, AI Agent wajib membuat:

```text
docs/IMPLEMENTATION_REPORT_P0_P1.md
```

Gunakan struktur:

```markdown
# Implementation Report P0–P1

## 1. Ringkasan
- branch:
- commit:
- tanggal:
- status:

## 2. Daftar Perubahan
| Work package | File | Ringkasan |

## 3. Migrasi Database
- nama migration:
- tabel/field:
- rollback consideration:

## 4. Migrasi Data Lama
- total diperiksa:
- search page:
- synthetic suspected:
- accepted:
- rejected:
- manual review:

## 5. Perubahan Algoritma
### Data pembanding
### Confidence
### SAW
### AHP
### Snapshot
### Formula validation

## 6. API Changes
| Endpoint | Before | After | Compatibility |

## 7. Test Results
| Test suite | Passed | Failed |

## 8. Evidence
- daftar file evidence

## 9. Known Limitations
- scraping marketplace:
- jumlah sampel validasi:
- rubrik belum disetujui:
- lainnya:

## 10. Rekomendasi Lanjutan
```

---

# 28. CATATAN AKADEMIK

Setelah implementasi, narasi artikel harus menggunakan istilah berikut:

### Gunakan

- data pembanding terverifikasi;
- harga referensi median;
- rekomendasi nilai limit awal;
- bobot AHP berbasis versi aktif;
- normalisasi SAW skala tetap;
- tingkat keyakinan harga referensi;
- validasi terhadap nilai acuan;
- hasil pilot.

### Hindari tanpa bukti

- harga pasar pasti;
- nilai appraisal resmi;
- akurasi tinggi;
- objektif sepenuhnya;
- tervalidasi secara umum;
- menggantikan penilai profesional.

Sistem adalah alat pendukung keputusan. Keputusan akhir tetap memerlukan verifikasi pihak berwenang.

---

# 29. URUTAN EKSEKUSI FINAL

AI Agent harus mengeksekusi dalam urutan berikut:

```text
1. Baseline test
2. Backup dan dry-run data lama
3. Prisma schema + migration
4. Source classification
5. Hapus synthetic fallback
6. Search suggestion terpisah
7. URL integrity
8. Fuzzy matching
9. Median accepted-only
10. Confidence
11. SAW fixed scale
12. Active AHP version
13. AHP reciprocal validation
14. Snapshot
15. Rubrik
16. Formula validation
17. Frontend
18. Unit test
19. Integration + negative test
20. Evidence
21. Final implementation report
```

Jangan menjalankan migrasi data lama sebelum schema baru tersedia. Jangan mengaktifkan formula baru tanpa test determinisme SAW. Jangan mengubah hasil historis.

---

# 30. INSTRUKSI PENUTUP UNTUK AI AGENT

Eksekusi seluruh pekerjaan secara bertahap dan auditabel.

Apabila menemukan perbedaan antara dokumen ini dan kode aktual:

1. prioritaskan tujuan validitas ilmiah;
2. pertahankan kontrak lama apabila aman;
3. dokumentasikan penyimpangan;
4. jangan mengurangi kontrol validitas;
5. jangan mengarang data;
6. jangan menandai test lulus tanpa menjalankannya;
7. jangan menghapus bukti kegagalan;
8. hasil akhir harus dapat direproduksi oleh developer lain.

**Output utama yang wajib dihasilkan:**

- kode implementasi;
- Prisma migration;
- data migration script;
- test otomatis;
- bukti pengujian;
- report implementasi;
- dokumentasi API;
- UI status keyakinan dan rubrik;
- report validasi formula.

