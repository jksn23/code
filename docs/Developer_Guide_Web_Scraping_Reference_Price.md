# Developer Guide: Web Scraping Reference Price

## Tujuan

Membangun **Reference Price Acquisition Engine** untuk memperoleh data
pembanding harga aset, memvalidasi kualitas data, dan menghasilkan harga
referensi yang digunakan oleh SPK AHP--SAW.

## Arsitektur

``` text
Input Aset
↓
Keyword Generator
↓
BullMQ Queue
↓
Playwright Scraper
↓
Cleaning
↓
Fuzzy Matching
↓
Outlier Detection (IQR)
↓
Median Calculator
↓
Admin Validation
↓
Reference Price
↓
SPK
```

## Teknologi

-   Node.js + Express
-   Prisma + MySQL
-   Playwright
-   Cheerio
-   BullMQ + Redis
-   Fuse.js
-   Socket.IO (opsional)

## Struktur Modul

``` text
src/modules/reference-price/
  controllers/
  services/
  scrapers/
  queue/
  workers/
  matching/
  statistics/
  validators/
```

## Implementasi

### 1. Keyword Generator

Input: kategori, merek, model, tahun, spesifikasi. Output: keyword
pencarian terstandar. Normalisasi kapital, hapus karakter khusus,
abaikan field kosong.

### 2. Queue

Saat aset dibuat, enqueue scraping job. Status: pending, processing,
completed, failed.

### 3. Web Scraping

Ambil: - judul - harga - URL - gambar - lokasi - waktu scraping

### 4. Data Cleaning

-   Konversi harga menjadi integer
-   Hapus simbol mata uang
-   Trim whitespace
-   Normalisasi judul
-   Hapus duplikasi URL

### 5. Fuzzy Matching

Gunakan Fuse.js. Threshold minimal 0.90. Bandingkan judul, merek, model,
tahun.

### 6. Outlier Detection

Gunakan metode IQR. Flag data sebagai is_outlier.

### 7. Median

Hitung: - median_price - average_price - valid_records Gunakan median
sebagai final_reference_price.

### 8. Validasi Admin

Admin dapat approve, reject, atau re-run scraping. SPK hanya menggunakan
final_reference_price yang telah divalidasi.

## Database

### scraping_jobs

-   id
-   asset_id
-   keyword
-   status
-   started_at
-   finished_at

### reference_prices

-   id
-   asset_id
-   marketplace
-   title
-   url
-   image
-   location
-   price
-   similarity
-   is_outlier
-   is_validated
-   scraped_at

### reference_price_summary

-   asset_id
-   total_records
-   valid_records
-   median_price
-   average_price
-   final_reference_price

## API

-   POST /reference-price/jobs
-   GET /reference-price/jobs/{assetId}
-   GET /reference-price/results/{assetId}
-   POST /reference-price/recalculate/{assetId}
-   POST /reference-price/approve/{assetId}

## UI

Penjual: - Cari Harga Pembanding - Progress scraping - Daftar harga -
Median - Harga referensi

Admin: - Validasi hasil - Approve/Reject - Jalankan ulang scraping

## Acceptance Criteria

-   Asynchronous queue
-   Cleaning berjalan
-   Fuzzy matching diterapkan
-   Outlier dibuang
-   Median dihitung
-   Admin memvalidasi
-   SPK menggunakan final_reference_price
