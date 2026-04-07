# Sprint 2: Perbaikan Error Prisma Relasi Verifikator

## Ringkasan Masalah

Saat membuka data penjual, backend mengembalikan error:

- `Unknown field 'verifikator' for include statement on model 'Penjual'`

Masalah ini terjadi bukan karena kode controller salah, tetapi karena Prisma Client yang sedang dipakai backend masih versi lama dan belum meregenerasi relasi baru `verifikator` dari `schema.prisma`.

## Akar Penyebab

Sprint 2 menambahkan relasi berikut pada model `Penjual`:

- `verifikator`
- `verifiedBy`
- `verificationStatus`
- `revisionCount`

Namun proses `prisma generate` sebelumnya gagal di Windows karena file engine Prisma terkunci oleh proses backend yang masih berjalan. Akibatnya:

- `prisma/schema.prisma` sudah terbaru
- database sudah sinkron
- tetapi generated Prisma Client masih schema lama

## Tindakan Perbaikan

Perbaikan yang dilakukan:

1. Mengidentifikasi proses backend Node/Nodemon yang mengunci Prisma engine.
2. Menghentikan proses backend yang sedang memakai `query_engine-windows.dll.node`.
3. Menjalankan ulang:

```bash
cd backend
npx prisma generate
```

4. Memverifikasi bahwa generated Prisma Client sudah memuat:
   - `SellerVerificationStatus`
   - relasi `verifikator`
   - field `verificationStatus`

5. Menjalankan query uji `prisma.penjual.findMany({ include: { user, verifikator } })` dan memastikan query berhasil.
6. Menyalakan kembali backend dev server.

## Hasil

Status setelah perbaikan:

- Prisma Client berhasil digenerate ulang.
- Query `penjual.findMany` dengan `include.verifikator` berhasil dijalankan.
- Backend dev server berhasil dijalankan kembali.

## Validasi

Validasi yang berhasil:

- `npx prisma generate`
- query uji `prisma.penjual.findMany(...)`
- backend `npm run dev` aktif kembali

## Catatan

Jika error serupa muncul lagi setelah perubahan schema Prisma, lakukan langkah berikut:

1. Pastikan backend yang memakai Prisma dihentikan dulu.
2. Jalankan `npx prisma generate`.
3. Jika ada perubahan struktur tabel, jalankan juga `npx prisma db push` atau migration yang sesuai.
4. Jalankan ulang backend.
