# Panduan Implementasi Update Sistem Lelang Online Berbasis SPK AHP--SAW

## Tujuan

Dokumen ini menjadi acuan implementasi pengembangan sistem agar selaras
dengan arsitektur penelitian dan kebutuhan implementasi.

## Roadmap Implementasi

### Fase 1 --- Refactoring SPK

-   [ ] Pindahkan proses input penilaian dari Admin ke Penjual.
-   [ ] Admin hanya melakukan validasi.
-   [ ] Gunakan bobot AHP statis (predefined).
-   [ ] Pisahkan service AHP dan SAW.

**Target**

    Penjual -> Input Aset -> Input Nilai -> SAW -> Nilai Limit -> Verifikasi Admin

------------------------------------------------------------------------

### Fase 2 --- Kategori Aset

Implementasikan tiga kategori:

1.  Tanah & Bangunan
2.  Kendaraan
3.  Elektronik

Setiap kategori memiliki: - tabel kriteria - bobot AHP - form input -
validasi

------------------------------------------------------------------------

### Fase 3 --- Harga Referensi

Workflow:

    Input aset
    ↓
    Generate keyword
    ↓
    Web Scraping
    ↓
    Fuzzy Matching
    ↓
    Outlier Filtering
    ↓
    Median Harga
    ↓
    Harga Referensi
    ↓
    SPK
    ↓
    Nilai Limit

Teknologi: - Playwright - Cheerio - BullMQ - Redis - MySQL

------------------------------------------------------------------------

### Fase 4 --- Dashboard Penjual

Tambahkan: - Harga pembanding - Median harga - Nilai preferensi - Nilai
limit - Status verifikasi

------------------------------------------------------------------------

### Fase 5 --- Workflow Lelang

Implementasikan: - Verifikasi penjual - Verifikasi aset - Jadwal
lelang - Auto Extension Timer - Minimum Bid Increment - Riwayat
bidding - Upload bukti pembayaran - Status pelunasan - Notifikasi

------------------------------------------------------------------------

### Fase 6 --- Otomatisasi Dokumen

Gunakan template placeholder.

Contoh:

    {{nama_penjual}}
    {{nomor_lelang}}
    {{tanggal}}
    {{nilai_limit}}

Generate: - Surat Permohonan - Surat Penetapan - Berita Acara - Dokumen
hasil lelang

------------------------------------------------------------------------

### Fase 7 --- Penyempurnaan Repository

-   Konsistenkan dokumentasi.
-   Refactoring service.
-   Logging perhitungan.
-   Validasi upload.
-   Optimasi query Prisma.

------------------------------------------------------------------------

### Fase 8 --- Validasi Penelitian

Lakukan: - Validasi algoritma - Validasi pakar - Validasi harga
referensi - Black-box testing - User Acceptance Test

------------------------------------------------------------------------

# Struktur Branch Git

    feature/spk-refactor
    feature/predefined-ahp
    feature/category-assets
    feature/reference-price
    feature/dashboard-seller
    feature/auction-workflow
    feature/document-generator
    feature/system-validation

# Definition of Done

-   Seluruh fitur berjalan tanpa error.
-   Hasil SPK sesuai perhitungan manual.
-   Workflow lelang lengkap.
-   Dokumen otomatis dapat diunduh.
-   Siap untuk pengujian skripsi dan publikasi jurnal.
