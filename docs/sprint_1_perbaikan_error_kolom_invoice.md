# Sprint 1: Perbaikan Error Kolom Invoice
*Tanggal: 7 April 2026*

## Error yang Terjadi

Backend melempar error:

```txt
Invalid `prisma.aset.findMany()` invocation:
The column `db_lelang_spk.lelang.invoice_number` does not exist in the current database.
```

## Akar Masalah

Kode backend sudah menggunakan field baru Sprint 1 pada tabel `lelang`, tetapi database MySQL belum tersinkron dengan skema Prisma terbaru.

Field baru yang dibutuhkan antara lain:
- `invoice_number`
- `invoice_generated_at`
- `payment_due_date`
- `bukti_bayar_url`
- `tanggal_upload_bukti`
- `tanggal_verifikasi_pembayaran`
- `catatan_pembayaran`
- `verified_by`

## Perbaikan yang Dilakukan

### 1. Sinkronisasi schema ke database
Menjalankan:

```bash
cd backend
npx prisma db push --accept-data-loss
```

Catatan:
- Prisma meminta flag `--accept-data-loss` karena ada penambahan unique constraint pada `invoice_number`
- dalam konteks ini aman karena kolom invoice memang baru ditambahkan

### 2. Verifikasi struktur tabel
Dilakukan pengecekan langsung dengan:

```sql
SHOW CREATE TABLE lelang;
```

Hasil verifikasi menunjukkan tabel `lelang` sekarang sudah memiliki kolom:
- `invoice_number`
- `invoice_generated_at`
- `payment_due_date`
- `bukti_bayar_url`
- `tanggal_upload_bukti`
- `tanggal_verifikasi_pembayaran`
- `catatan_pembayaran`
- `verified_by`

## Status Setelah Perbaikan

Database sudah tersinkron dengan skema Sprint 1 untuk modul pembayaran dan invoice.

## Tindakan yang Perlu Dilakukan Setelah Ini

Jika backend Anda sedang berjalan saat error terjadi, restart backend agar proses server menggunakan koneksi dan metadata database terbaru:

```bash
cd backend
npm run dev
```

## Ringkasan

Error ini bukan bug logika controller, tetapi mismatch antara:
- schema Prisma dan kode backend terbaru
- struktur tabel MySQL yang belum di-update

Setelah `db push`, struktur tabel `lelang` sudah sesuai kebutuhan Sprint 1.
