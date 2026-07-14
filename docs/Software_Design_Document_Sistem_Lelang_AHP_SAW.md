# Software Design Document (SDD)

## Sistem Lelang Online Berbasis SPK Hybrid AHP--SAW

### Versi 2.0

------------------------------------------------------------------------

# 1. Pendahuluan

## 1.1 Tujuan

Dokumen ini menjadi acuan teknis implementasi sistem lelang online yang
mengintegrasikan Sistem Pendukung Keputusan (SPK) Hybrid AHP--SAW,
mekanisme lelang daring, administrasi lelang, dan harga referensi
berbasis web scraping.

## 1.2 Ruang Lingkup

-   Backend API
-   Frontend Web
-   Database
-   Modul SPK
-   Workflow lelang
-   Dokumen administrasi
-   Notifikasi
-   Integrasi web scraping
-   Deployment

------------------------------------------------------------------------

# 2. Arsitektur Sistem

## 2.1 Komponen

-   Frontend: React + TypeScript + Vite
-   Backend: Node.js + Express
-   ORM: Prisma
-   Database: MySQL
-   Realtime: Socket.IO
-   Queue: BullMQ + Redis
-   Scraping: Playwright + Cheerio
-   Authentication: JWT
-   Storage: Local/S3 Compatible

### Diagram Arsitektur

``` text
Browser
   │
React Frontend
   │ REST/WebSocket
Express API
 ├── Authentication
 ├── SPK Service
 ├── Auction Service
 ├── Document Service
 ├── Notification Service
 ├── Scraping Service
 └── Admin Service
        │
 Prisma ORM
        │
     MySQL
```

------------------------------------------------------------------------

# 3. Modul Sistem

1.  Authentication
2.  User Management
3.  Seller Profile
4.  Buyer Profile
5.  Asset Management
6.  SPK AHP--SAW
7.  Reference Price Engine
8.  Auction Management
9.  Realtime Bidding
10. Payment
11. Document Generator
12. Reporting
13. Notification

------------------------------------------------------------------------

# 4. Aktor Sistem

## Penjual

-   Registrasi
-   Kelola aset
-   Input nilai kriteria
-   Melihat hasil SPK
-   Mengajukan lelang
-   Melihat dokumen
-   Melihat status

## Pembeli

-   Registrasi
-   Verifikasi
-   Mengikuti lelang
-   Upload pembayaran
-   Melihat riwayat

## Admin/Pejabat Lelang

-   Verifikasi
-   Kelola kategori
-   Kelola kriteria
-   Penjadwalan
-   Validasi
-   Generate dokumen
-   Verifikasi pembayaran
-   Laporan

------------------------------------------------------------------------

# 5. Business Process

## Seller Flow

``` text
Registrasi
↓
Lengkapi Profil
↓
Input Aset
↓
Input Nilai Kriteria
↓
SPK
↓
Nilai Limit
↓
Ajukan Lelang
↓
Verifikasi
↓
Penjadwalan
↓
Surat Penetapan
↓
Lelang
```

## Buyer Flow

``` text
Registrasi
↓
Verifikasi
↓
Ikut Lelang
↓
Menang
↓
Upload Pembayaran
↓
Verifikasi
↓
Selesai
```

------------------------------------------------------------------------

# 6. SPK Engine

## Tahap AHP

-   Bobot predefined
-   CR dihitung saat kalibrasi pakar
-   Disimpan database

## Tahap SAW

1.  Ambil bobot
2.  Normalisasi
3.  Hitung preferensi
4.  Hitung nilai limit

Formula:

Nilai Limit = Harga Referensi × Nilai Preferensi

------------------------------------------------------------------------

# 7. Harga Referensi

Workflow:

``` text
Input aset
↓
Generate keyword
↓
Web scraping
↓
Fuzzy matching
↓
Filter outlier
↓
Median harga
↓
Validasi admin
↓
Harga referensi
```

------------------------------------------------------------------------

# 8. Database (Entitas)

-   users
-   roles
-   seller_profiles
-   buyer_profiles
-   assets
-   asset_categories
-   criteria
-   ahp_weights
-   asset_scores
-   saw_results
-   auctions
-   bids
-   payments
-   notifications
-   documents
-   reference_prices
-   scraping_jobs

------------------------------------------------------------------------

# 9. Workflow Lelang

-   Verifikasi aset
-   Penjadwalan
-   Minimum increment configurable
-   Auto extension configurable
-   Generate surat
-   Realtime bidding
-   Penentuan pemenang
-   Pelunasan maksimal 5 hari kerja
-   Verifikasi pembayaran

------------------------------------------------------------------------

# 10. Document Generator

Template placeholder:

-   {{nomor_surat}}
-   {{nama_penjual}}
-   {{tanggal}}
-   {{nilai_limit}}
-   {{jadwal}}

Output: - DOCX - PDF

------------------------------------------------------------------------

# 11. API Standar

## Auth

POST /auth/login POST /auth/register

## Asset

GET /assets POST /assets PUT /assets/{id}

## SPK

POST /spk/calculate GET /spk/result/{id}

## Auction

POST /auctions POST /bids GET /auctions/live

------------------------------------------------------------------------

# 12. Struktur Folder

## Backend

``` text
src/
 controllers/
 services/
 routes/
 middleware/
 prisma/
 sockets/
 jobs/
 utils/
```

## Frontend

``` text
src/
 pages/
 components/
 hooks/
 services/
 contexts/
 layouts/
```

------------------------------------------------------------------------

# 13. Security

-   JWT
-   BCrypt
-   RBAC
-   Input Validation
-   Rate Limiting
-   Audit Log

------------------------------------------------------------------------

# 14. Testing

Unit Test Integration Test API Test Socket Test Black-box Test UAT

------------------------------------------------------------------------

# 15. Deployment

Docker PM2 Nginx HTTPS Environment Variables Database Migration

------------------------------------------------------------------------

# 16. Roadmap Branch

feature/predefined-ahp feature/reference-price
feature/document-generator feature/auction-v2 feature/payment
feature/notifications release/v2.0

------------------------------------------------------------------------

# 17. Definition of Done

-   Semua modul lulus testing
-   Nilai SPK tervalidasi
-   Dokumen otomatis
-   Workflow lengkap
-   Repository terdokumentasi
-   Siap skripsi
-   Siap publikasi jurnal

------------------------------------------------------------------------

# Lampiran

## Checklist Implementasi

-   [ ] Authentication
-   [ ] Seller
-   [ ] Buyer
-   [ ] Admin
-   [ ] Asset
-   [ ] Kategori
-   [ ] Kriteria
-   [ ] AHP
-   [ ] SAW
-   [ ] Scraping
-   [ ] Reference Price
-   [ ] Auction
-   [ ] Socket.IO
-   [ ] Payment
-   [ ] Document Generator
-   [ ] Notification
-   [ ] Reporting
-   [ ] Testing
-   [ ] Deployment
