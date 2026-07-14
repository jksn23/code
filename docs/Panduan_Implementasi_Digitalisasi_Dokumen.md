# Panduan Implementasi Fitur Digitalisasi Dokumen

## Auction Document Management System (ADMS)

**Project:** Sistem Lelang Online Berbasis SPK AHP–SAW

**Versi:** 1.0

**Status:** Development Specification

---

# 1. Latar Belakang

Sistem lelang saat ini telah memiliki proses pengajuan aset, penjadwalan lelang, proses bidding, serta penentuan nilai limit menggunakan metode AHP–SAW. Namun proses administrasi dokumen masih bersifat statis dan belum terintegrasi dengan alur bisnis lelang.

Pengembangan ini bertujuan membangun **Auction Document Management System (ADMS)** sebagai modul administrasi digital yang mampu:

* mengelola seluruh dokumen lelang;
* melakukan validasi dokumen;
* menghasilkan dokumen administrasi secara otomatis;
* menyimpan histori perubahan dokumen;
* mengarsipkan seluruh dokumen setelah lelang selesai.

Modul ini harus terintegrasi dengan seluruh proses bisnis lelang tanpa mengubah mekanisme SPK maupun proses bidding yang telah ada.

---

# 2. Tujuan Pengembangan

Pengembangan bertujuan untuk:

* mendigitalisasi seluruh administrasi lelang;
* mengurangi pengisian dokumen secara manual;
* mengintegrasikan data sistem dengan dokumen resmi;
* meningkatkan transparansi proses administrasi;
* mempermudah proses audit dan pengarsipan.

---

# 3. Prinsip Pengembangan

Developer **tidak diperbolehkan mengubah**:

* algoritma AHP;
* algoritma SAW;
* modul perhitungan nilai limit;
* mekanisme bidding;
* autentikasi pengguna.

Seluruh pengembangan harus bersifat **modular** dan **non-breaking** terhadap sistem yang sudah berjalan.

---

# 4. Modul Baru

Buat modul baru:

Auction Document Management System (ADMS)

Struktur backend:

```
modules/
    document/
        controller
        service
        repository
        validator
        template-engine
```

Frontend:

```
pages/documents/

components/document/

components/document-template/

components/document-viewer/
```

---

# 5. Digital Document Repository

Seluruh dokumen harus disimpan pada satu repository.

Buat tabel:

Document

Field minimum:

* id
* ownerId
* auctionId
* assetId
* documentType
* fileName
* originalFileName
* storagePath
* mimeType
* version
* status
* uploadedBy
* verifiedBy
* verifiedAt
* createdAt
* updatedAt

Status:

* Draft
* Uploaded
* Pending Verification
* Approved
* Rejected
* Archived

Developer harus menggunakan soft delete.

---

# 6. Jenis Dokumen

Minimal sistem mendukung:

## Penjual

* KTP
* NPWP
* Surat Kuasa
* Surat Permohonan Lelang
* Surat Pernyataan
* Daftar Barang
* Bukti Rekening

## Aset

* Foto Aset
* Dokumen Kepemilikan

## Pengumuman

* Bukti Pengumuman

## Pembeli

* KTP
* NPWP
* Bukti Pembayaran

## Sistem

* Surat Penetapan Lelang
* Berita Acara
* Nota Pembayaran
* Ringkasan Hasil Lelang

Jenis dokumen harus menggunakan Enum.

---

# 7. Document Checklist

Tambahkan halaman:

Admin → Detail Pengajuan

Tampilkan checklist:

✓ KTP

✓ NPWP

✓ Surat Permohonan

✓ Surat Pernyataan

✓ Dokumen Kepemilikan

✓ Foto

✓ Bukti Pengumuman

Status harus realtime.

Apabila terdapat dokumen yang belum lengkap maka tombol:

"Verifikasi"

harus dinonaktifkan.

---

# 8. Workflow Dokumen

Implementasikan workflow:

Draft

↓

Uploaded

↓

Pending Verification

↓

Approved

↓

Archived

Jika ditolak:

Rejected

↓

Reupload

↓

Pending Verification

Workflow harus dicatat pada log aktivitas.

---

# 9. Activity Log

Buat tabel:

DocumentActivity

Field:

* id
* documentId
* action
* actorId
* note
* createdAt

Contoh:

UPLOAD

VERIFY

REJECT

GENERATE

DOWNLOAD

ARCHIVE

---

# 10. Template Engine

Buat Template Engine.

Admin dapat:

* upload template DOCX

Template menggunakan placeholder.

Contoh:

{{nomor_surat}}

{{nama_penjual}}

{{alamat}}

{{nama_aset}}

{{nilai_limit}}

{{tanggal_lelang}}

{{lokasi}}

{{nama_pejabat}}

Saat proses generate,

placeholder otomatis diganti menggunakan data database.

---

# 11. Generator Dokumen

Sistem harus mampu menghasilkan:

* Surat Penetapan Lelang
* Nota Pembayaran
* Berita Acara
* Ringkasan Hasil Lelang

Output minimal:

PDF

Opsional:

DOCX

Developer tidak diperbolehkan mengisi data secara manual.

Semua data harus berasal dari database.

---

# 12. Version Control

Setiap revisi dokumen tidak boleh menghapus versi sebelumnya.

Contoh:

Surat Penetapan

v1

↓

Revisi

↓

v2

↓

Revisi

↓

v3

Setiap versi tetap dapat diunduh.

---

# 13. Dashboard Timeline

Tambahkan Timeline Administrasi.

Contoh:

Upload Dokumen

↓

Verifikasi

↓

Generate Surat

↓

Penjadwalan

↓

Pengumuman

↓

Lelang

↓

Pembayaran

↓

Berita Acara

↓

Arsip

Timeline harus otomatis berdasarkan activity log.

---

# 14. Integrasi dengan SPK

Setelah proses SAW selesai,

hasil berikut harus dapat dipanggil oleh Template Engine:

* nama aset
* kategori
* nilai preferensi
* nilai limit
* tanggal penilaian

Tidak boleh dilakukan input ulang.

---

# 15. Integrasi dengan Penjadwalan

Saat admin menetapkan jadwal:

Sistem otomatis menyediakan data:

* tanggal
* jam
* lokasi
* pejabat lelang

yang akan digunakan pada Surat Penetapan.

---

# 16. Integrasi Pembayaran

Saat pembeli dinyatakan menang,

sistem otomatis membuat:

Nota Pembayaran

berisi:

* identitas pembeli
* identitas penjual
* aset
* harga akhir
* biaya administrasi
* total pembayaran
* deadline pelunasan

---

# 17. Digital Archive

Setelah status lelang selesai:

Sistem membuat:

Auction Archive

berisi:

* seluruh dokumen
* histori aktivitas
* hasil SPK
* hasil bidding
* pembayaran

Developer menyediakan fitur:

Download ZIP

yang berisi seluruh dokumen administrasi.

---

# 18. Hak Akses

Penjual

* upload dokumen
* melihat dokumen sendiri
* download dokumen sendiri

Pembeli

* upload bukti pembayaran
* melihat nota pembayaran

Admin

* melihat seluruh dokumen
* verifikasi
* generate dokumen
* upload template
* arsip

---

# 19. UI/UX

Gunakan tampilan menyerupai Document Management System.

Menu baru:

Administrasi Dokumen

Submenu:

* Repository
* Checklist
* Template
* Generated Documents
* Activity Log
* Archive

Gunakan status badge berwarna.

Hijau

Approved

Kuning

Pending

Merah

Rejected

Abu

Archived

---

# 20. Ketentuan Pengembangan

Developer wajib memastikan bahwa:

* seluruh fitur lama tetap berjalan;
* migrasi database menggunakan Prisma Migration;
* seluruh endpoint menggunakan autentikasi JWT;
* seluruh upload menggunakan validasi ukuran file dan MIME type;
* seluruh aktivitas tercatat pada log;
* struktur kode mengikuti arsitektur repository-service-controller yang telah digunakan pada sistem saat ini.

Implementasi harus dilakukan secara bertahap (incremental development) sehingga setiap modul dapat diuji secara independen sebelum diintegrasikan ke workflow lelang utama.
