# Checklist Uji End-to-End
*Tanggal: 8 April 2026*

Dokumen ini digunakan untuk pengujian final sistem setelah perubahan pengembangan selanjutnya selesai diimplementasikan dan setelah migration / sinkronisasi database Prisma berhasil dijalankan.

Dokumen ini berfokus pada validasi alur bisnis utama dari sisi:
- admin
- seller
- buyer
- lifecycle lelang
- pembayaran
- regresi fitur inti

---

## 1. Prasyarat Sebelum Uji

Pastikan hal berikut sudah selesai:

- Prisma schema terbaru sudah diterapkan ke database
- Prisma client terbaru sudah tergenerate
- backend berjalan normal
- frontend berjalan normal
- database memiliki minimal:
  - 1 akun admin
  - 1 seller baru / pending
  - 1 buyer
  - minimal 1 kategori
  - minimal 2 kriteria pada kategori yang akan dipakai

Command yang ideal sudah berhasil:

```bash
cd backend
npm run generate
npm run db:push
```

Atau:

```bash
cd backend
npm run migrate
```

Lalu:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

---

## 2. Data Uji yang Disarankan

Siapkan akun dan data berikut:

### Akun
- `admin@test.com`
- `seller.pending@test.com`
- `seller.approved@test.com`
- `buyer@test.com`

### Dokumen
- file KTP seller valid
- file NPWP seller valid
- file KTP seller revisi
- file bukti pembayaran buyer

### Data aset
- 1 aset milik seller untuk kategori yang sudah memiliki kriteria dan bobot AHP

---

## 3. Checklist Uji Auth dan Profile

## 3.1 Login Admin
- [ ] Admin dapat login dengan email dan password valid
- [ ] Admin diarahkan ke dashboard admin
- [ ] Sidebar admin tampil lengkap
- [ ] Dashboard admin memuat tanpa error

## 3.2 Login Seller Pending
- [ ] Seller pending dapat login
- [ ] Seller tidak diarahkan ke dashboard utama
- [ ] Seller diarahkan ke halaman waiting / verifikasi seller
- [ ] Status seller tampil sebagai `PENDING`

## 3.3 Login Seller Rejected
- [ ] Seller rejected dapat login
- [ ] Seller diarahkan ke halaman waiting seller
- [ ] Catatan admin tampil di halaman
- [ ] Form upload ulang dokumen tampil

## 3.4 Login Seller Approved
- [ ] Seller approved dapat login
- [ ] Seller dapat masuk ke dashboard seller
- [ ] Seller tidak terblokir oleh halaman waiting seller

## 3.5 Login Buyer
- [ ] Buyer dapat login
- [ ] Dashboard buyer tampil
- [ ] Status KYC buyer tampil benar

---

## 4. Checklist Uji Verifikasi Seller oleh Admin

## 4.1 Review Seller Pending
- [ ] Admin membuka halaman daftar seller
- [ ] Seller pending muncul pada filter `Pending`
- [ ] Status seller tampil sebagai `Menunggu Review`
- [ ] Dokumen KTP dan NPWP bisa dibuka / dilihat

## 4.2 Approve Seller
- [ ] Admin membuka detail seller
- [ ] Admin klik `Verifikasi dan Setujui Akun`
- [ ] Request berhasil
- [ ] Status seller berubah menjadi `APPROVED`
- [ ] Seller menerima notifikasi approval
- [ ] Seller yang sebelumnya pending sekarang bisa mengakses dashboard seller

## 4.3 Reject Seller
- [ ] Admin membuka detail seller pending
- [ ] Admin mencoba reject tanpa catatan
- [ ] Sistem menolak aksi dan meminta catatan
- [ ] Admin mengisi catatan revisi
- [ ] Admin klik `Tolak & Minta Revisi`
- [ ] Status seller berubah menjadi `REJECTED`
- [ ] Catatan tersimpan
- [ ] Seller menerima notifikasi rejection

---

## 5. Checklist Uji Revisi Dokumen Seller

## 5.1 Halaman Waiting Seller Rejected
- [ ] Seller rejected login
- [ ] Halaman waiting menampilkan status `Perlu Revisi`
- [ ] Catatan admin tampil sesuai data rejection
- [ ] Form upload ulang dokumen tersedia

## 5.2 Upload Ulang Dokumen
- [ ] Seller upload ulang KTP
- [ ] Seller upload ulang NPWP
- [ ] Seller bisa memperbarui rekening bank / nomor rekening
- [ ] Submit berhasil
- [ ] Status seller kembali ke `PENDING`
- [ ] Feedback sukses tampil
- [ ] Admin menerima notifikasi seller resubmission

## 5.3 Review Ulang oleh Admin
- [ ] Seller yang sudah reupload muncul lagi sebagai pending
- [ ] Admin dapat membuka dokumen baru
- [ ] Admin dapat approve seller setelah revisi

---

## 6. Checklist Uji Guard Seller

## 6.1 Seller Pending Tidak Bisa Input Aset
- [ ] Seller pending mencoba mengakses fitur aset
- [ ] Seller tetap tertahan pada waiting page

## 6.2 Seller Rejected Tidak Bisa Input Aset
- [ ] Seller rejected mencoba mengakses fitur aset
- [ ] Seller tetap tertahan pada waiting page

## 6.3 Seller Approved Bisa Input Aset
- [ ] Seller approved membuka halaman aset
- [ ] Seller dapat menambah aset baru
- [ ] Seller dapat melihat aset miliknya

---

## 7. Checklist Uji Dashboard KPI

## 7.1 Dashboard Admin
- [ ] KPI `Seller Pending` tampil
- [ ] KPI `Buyer KYC Pending` tampil
- [ ] KPI `Aset Pending` tampil
- [ ] KPI `Lelang Aktif` tampil
- [ ] KPI `Bayar Pending` tampil
- [ ] KPI `Pendapatan` tampil
- [ ] Highlight seller pending tampil
- [ ] Highlight lelang selesai tampil

## 7.2 Dashboard Seller
- [ ] KPI `Total Aset` tampil
- [ ] KPI `Pending Review` tampil
- [ ] KPI `Aktif Lelang` tampil
- [ ] KPI `Aset Terjual` tampil
- [ ] KPI `Hasil Penjualan` tampil
- [ ] Status seller tampil sesuai verification status
- [ ] Daftar aset terbaru tampil

## 7.3 Dashboard Buyer
- [ ] KPI `Lelang Diikuti` tampil
- [ ] KPI `Menang Lelang` tampil
- [ ] KPI `Pembayaran Pending` tampil
- [ ] KPI `Belum Konfirmasi` tampil
- [ ] KPI `Segera Dimulai` tampil
- [ ] Panel status KYC buyer tampil benar
- [ ] Widget lelang yang diikuti tampil jika ada

---

## 8. Checklist Uji SPK dan Aset

## 8.1 CRUD Data Master
- [ ] Admin dapat membuat kategori
- [ ] Admin dapat membuat minimal 2 kriteria untuk kategori
- [ ] Admin dapat melihat daftar kategori dan kriteria

## 8.2 Input Aset dan Nilai
- [ ] Seller approved dapat membuat aset
- [ ] Admin dapat menginput nilai kriteria aset
- [ ] Admin dapat menjalankan AHP
- [ ] Admin dapat menjalankan SAW
- [ ] Nilai limit aset berhasil terbentuk
- [ ] Hasil ranking tampil di halaman hasil

## 8.3 Pengajuan Lelang
- [ ] Seller approved dapat mengajukan aset ke lelang
- [ ] Aset berubah ke status `PENDING`
- [ ] Aset pending muncul di halaman admin lelang

---

## 9. Checklist Uji Jadwal dan Lifecycle Lelang

## 9.1 Penjadwalan Lelang
- [ ] Admin dapat membuka modal jadwal lelang
- [ ] Admin tidak dapat memilih waktu lampau
- [ ] Admin tidak dapat mengisi durasi nol
- [ ] Estimasi antrean tampil
- [ ] Jadwal berhasil dibuat

## 9.2 Aktivasi Otomatis Lelang
- [ ] Lelang dengan waktu buka dekat berubah menjadi `ACTIVE` saat waktunya tiba
- [ ] Status ini berubah walau tidak ada user yang membuka detail lelang
- [ ] Hal ini menandakan scheduler lifecycle berjalan

## 9.3 Penyelesaian Otomatis Lelang
- [ ] Lelang aktif berubah menjadi `FINISHED` saat waktu tutup terlewati
- [ ] Jika ada penawaran, pemenang tersimpan
- [ ] Jika tidak ada penawaran, lelang selesai tanpa pemenang
- [ ] Aset ikut berubah ke status selesai

---

## 10. Checklist Uji Bidding Buyer

## 10.1 Buyer KYC Belum Approved
- [ ] Buyer dengan KYC belum approved tidak bisa submit bid
- [ ] Pesan blokir tampil jelas

## 10.2 Buyer Approved Masuk Room Lelang
- [ ] Buyer approved dapat membuka room lelang
- [ ] Status koneksi socket tampil
- [ ] Data penawaran terbaru muncul

## 10.3 Submit Bid
- [ ] Buyer submit bid di atas limit / penawaran tertinggi
- [ ] Bid berhasil tersimpan
- [ ] Bid tampil real-time di room
- [ ] Bid di bawah nilai minimum ditolak

---

## 11. Checklist Uji Pemenang, Invoice, dan Pembayaran

## 11.1 Penentuan Pemenang
- [ ] Setelah lelang selesai, pemenang tertinggi terpilih otomatis
- [ ] Buyer pemenang menerima notifikasi menang
- [ ] Seller menerima notifikasi aset memiliki pemenang

## 11.2 Invoice
- [ ] Buyer pemenang dapat membuka invoice
- [ ] Nomor invoice tampil
- [ ] tanggal invoice tampil
- [ ] jatuh tempo pembayaran tampil
- [ ] rekening seller tampil

## 11.3 Upload Bukti Pembayaran
- [ ] Buyer pemenang dapat upload bukti pembayaran
- [ ] Status pembayaran berubah ke `PENDING_VERIFICATION`
- [ ] Admin dapat melihat bukti pembayaran

## 11.4 Verifikasi Pembayaran
- [ ] Admin dapat approve pembayaran
- [ ] Status berubah menjadi `LUNAS`
- [ ] Buyer menerima notifikasi pembayaran disetujui

## 11.5 Tolak Pembayaran
- [ ] Admin dapat reject pembayaran dengan catatan
- [ ] Reject tanpa catatan ditolak sistem
- [ ] Buyer menerima notifikasi penolakan pembayaran
- [ ] Buyer bisa upload ulang bukti

---

## 12. Checklist Uji Konfirmasi Barang

- [ ] Buyer dengan pembayaran `LUNAS` dapat konfirmasi barang diterima
- [ ] Status barang berubah ke `DITERIMA`
- [ ] Data muncul benar pada dashboard / halaman aset buyer

---

## 13. Checklist Uji Notifikasi

- [ ] Notifikasi seller approval terkirim
- [ ] Notifikasi seller rejection terkirim
- [ ] Notifikasi seller resubmission terkirim ke admin
- [ ] Notifikasi buyer KYC tetap berjalan normal
- [ ] Notifikasi menang lelang terkirim
- [ ] Notifikasi pembayaran approved/rejected terkirim
- [ ] Notifikasi dapat ditandai read

---

## 14. Checklist Uji Regresi Fitur Lama

- [ ] Registrasi buyer tetap berjalan
- [ ] Registrasi seller tetap berjalan
- [ ] Login semua role tetap berjalan
- [ ] CRUD kategori dan kriteria tetap berjalan
- [ ] Input nilai aset tetap berjalan
- [ ] Hitung AHP tetap berjalan
- [ ] Hitung SAW tetap berjalan
- [ ] Export laporan tetap berjalan
- [ ] Room lelang tetap berjalan

---

## 15. Checklist Teknis Pasca Uji

- [ ] Tidak ada error fatal di console backend
- [ ] Tidak ada error fatal di console frontend
- [ ] Tidak ada endpoint 500 pada alur utama
- [ ] Tidak ada notifikasi ganda saat lifecycle lelang berubah otomatis
- [ ] Tidak ada seller pending/rejected yang lolos ke fitur seller aktif

---

## 16. Hasil Akhir Uji

Gunakan tabel berikut saat eksekusi uji:

| Area Uji | Status | Catatan |
|---|---|---|
| Auth & Profile |  |  |
| Verifikasi Seller |  |  |
| Revisi Dokumen Seller |  |  |
| Guard Seller |  |  |
| Dashboard KPI |  |  |
| SPK & Aset |  |  |
| Jadwal & Lifecycle Lelang |  |  |
| Bidding Buyer |  |  |
| Invoice & Pembayaran |  |  |
| Konfirmasi Barang |  |  |
| Notifikasi |  |  |
| Regresi Fitur Lama |  |  |

---

## 17. Kriteria Lulus Uji Final

Sistem dapat dianggap lulus uji final jika:

- seluruh alur utama seller, admin, dan buyer berjalan
- status seller baru bekerja konsisten
- alur revisi dokumen seller berjalan end-to-end
- dashboard menampilkan KPI yang benar
- lifecycle lelang otomatis berjalan tanpa ketergantungan traffic user
- pembayaran dan notifikasi tetap konsisten
- tidak ditemukan regresi kritis pada fitur inti
