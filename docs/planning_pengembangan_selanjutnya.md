# Planning Pengembangan Selanjutnya
*Tanggal: 7 April 2026*

Dokumen ini disusun berdasarkan:
- `panduan_pengembangan_sistem_lelang_final_v2.md`
- `docs/analisis_progress_sistem.md`
- audit implementasi aktual pada backend, frontend, dan skema database proyek

## 1. Ringkasan Kondisi Sistem Saat Ini

Secara umum sistem sudah berada pada tahap **beta siap uji** untuk alur inti berikut:
- Auth multi-role `ADMIN`, `PENJUAL`, `PEMBELI`
- Verifikasi penjual dasar
- CRUD kategori, kriteria, aset, nilai aset
- Perhitungan SPK AHP dan SAW
- Pengajuan aset ke lelang
- Penjadwalan lelang oleh admin
- Bidding real-time dengan Socket.io
- Penutupan lelang otomatis dan penentuan pemenang
- Laporan aset, lelang, dan transaksi

Namun jika diselaraskan dengan panduan final, masih ada gap fungsional pada area:
- pembayaran pemenang masih di luar sistem
- invoice belum ada
- penolakan verifikasi penjual belum memiliki alasan dan alur revisi dokumen
- notifikasi in-app belum ada
- dashboard belum dipersonalisasi per role
- verifikasi pembeli masih opsional dan belum memiliki alur KYC

## 2. Gap Analysis yang Terkonfirmasi dari Kode

### A. Pembayaran & Invoice
- `LelangRoomPage` masih mengarahkan pemenang ke WhatsApp admin, bukan upload bukti bayar di dalam sistem.
- `LelangAdminPage` masih menyediakan tombol `WhatsApp` dan `Tandai Lunas`, tetapi belum ada bukti transfer, invoice, maupun riwayat verifikasi.
- Skema `Lelang` baru menyimpan `statusPembayaran` dan `statusBarang`; belum ada field invoice, bukti transfer, waktu bayar, catatan verifikasi, atau nominal final yang terdokumentasi sebagai transaksi.

### B. Reject Penjual & Revisi Dokumen
- Verifikasi penjual saat ini hanya boolean `isVerified`.
- Tombol “tolak” pada UI admin pada praktiknya hanya mengatur seller tetap tidak terverifikasi, tanpa status penolakan formal, alasan, dan permintaan revisi.
- `SellerWaitingPage` belum memberi sarana upload ulang dokumen.

### C. Buyer Verification / KYC
- Pembeli sudah diminta upload KTP saat registrasi, tetapi login tetap menganggap pembeli aktif tanpa proses verifikasi admin.
- Belum ada panel admin untuk review KTP pembeli dan belum ada pembatasan bidding berbasis status verifikasi.

### D. Notifikasi
- Belum ada entitas notifikasi, endpoint notifikasi, ataupun komponen UI notifikasi.
- Informasi perubahan status masih tersebar di halaman detail masing-masing.

### E. Refinement Teknis
- Penjadwalan lelang masih berbasis hitung antrean dari `waktuBuka` yang sama, belum memiliki validasi preventif agar admin tidak membuat jadwal yang overlap atau tidak logis dari UI.
- Belum ada indikator koneksi socket, retry state, maupun reconnect handling yang eksplisit di halaman room lelang.
- Dashboard utama masih generik dan belum menampilkan KPI spesifik admin, penjual, dan pembeli.

## 3. Prioritas Pengembangan

Prioritas pengembangan berikut disusun berdasarkan dampak bisnis, kesesuaian dengan panduan final, dan kedekatan dengan arsitektur yang sudah ada.

### Prioritas 1
**Modul Pembayaran In-App + Invoice**

Alasan:
- ini gap terbesar terhadap panduan final
- menyelesaikan alur pasca-lelang end-to-end
- bisa dibangun di atas modul lelang dan laporan yang sudah ada

### Prioritas 2
**Reject Verifikasi Penjual + Re-upload Dokumen**

Alasan:
- memperbaiki flow verifikasi agar realistis untuk operasional
- perubahan data model masih cukup lokal pada modul seller
- berdampak langsung pada kualitas data dan keamanan platform

### Prioritas 3
**Dashboard Personal + Notifikasi Dasar**

Alasan:
- memperjelas status aksi untuk semua role
- mengurangi ketergantungan user membuka banyak halaman untuk memantau status

### Prioritas 4
**KYC Pembeli**

Alasan:
- penting jika dibutuhkan oleh institusi atau regulasi internal
- namun dapat diposisikan sebagai fitur opsional setelah pembayaran internal stabil

## 4. Rencana Sprint yang Disarankan

## Sprint 1: Pembayaran In-App dan Invoice
**Target durasi:** 1-2 minggu

### Tujuan
Menyelesaikan alur setelah lelang selesai sampai pembayaran diverifikasi admin tanpa WhatsApp.

### Pekerjaan Backend
- Tambah tabel baru `Pembayaran` atau perluas model `Lelang` untuk menyimpan:
  - `invoiceNumber`
  - `invoiceUrl` atau data cetak invoice
  - `buktiBayarUrl`
  - `tanggalUploadBukti`
  - `tanggalVerifikasiPembayaran`
  - `catatanVerifikasi`
  - `verifiedBy`
  - `statusPembayaran` yang lebih eksplisit: `UNPAID`, `PENDING_VERIFICATION`, `LUNAS`, `DITOLAK`
- Buat endpoint:
  - `GET /api/lelang/:id/invoice`
  - `POST /api/lelang/:id/upload-bukti`
  - `PUT /api/lelang/:id/pembayaran/verifikasi`
  - `PUT /api/lelang/:id/pembayaran/tolak`
- Simpan metadata invoice berdasarkan pemenang, aset, nilai limit, nilai menang, rekening tujuan, dan tenggat bayar.
- Tambahkan middleware upload bukti transfer.
- Tambahkan validasi:
  - hanya pemenang lelang yang boleh upload bukti
  - hanya admin yang boleh verifikasi/tolak
  - bukti tidak bisa diupload sebelum lelang `FINISHED`

### Pekerjaan Frontend
- Tambah panel invoice pada `LelangRoomPage` untuk pemenang:
  - tombol lihat/unduh invoice
  - form upload bukti transfer
  - status pembayaran dan catatan admin
- Ubah `LelangAdminPage`:
  - tampilkan preview bukti bayar
  - tampilkan detail invoice
  - tombol `Verifikasi`, `Tolak`, dan input catatan
- Tambah card riwayat pembayaran di dashboard pembeli.

### Pekerjaan Dokumen & Laporan
- Perluas `LaporanPage` agar transaksi pembayaran dapat diekspor.
- Gunakan pola PDF yang sudah ada di frontend sebagai dasar invoice versi awal.

### Acceptance Criteria
- pemenang bisa unduh invoice dari sistem
- pemenang bisa upload bukti bayar dari sistem
- admin bisa melihat bukti, memberi keputusan, dan menambahkan catatan
- status pembayaran berubah konsisten di halaman lelang, dashboard, dan laporan
- flow WhatsApp tidak lagi menjadi jalur utama

## Sprint 2: Reject Verifikasi Penjual dan Revisi Dokumen
**Target durasi:** 1 minggu

### Tujuan
Membuat alur verifikasi penjual benar-benar operasional, bukan hanya approve/unapprove.

### Pekerjaan Backend
- Perluas model `Penjual` dengan field:
  - `verificationStatus`: `PENDING`, `APPROVED`, `REJECTED`, `REVISION_REQUESTED`
  - `verificationNote`
  - `verifiedAt`
  - `verifiedBy`
  - `revisionCount`
- Buat endpoint:
  - `PUT /api/penjual/:id/approve`
  - `PUT /api/penjual/:id/reject`
  - `PUT /api/penjual/me/reupload-dokumen`
- Simpan alasan penolakan wajib saat reject.
- Pastikan aset tidak bisa diajukan jika status verifikasi seller belum `APPROVED`.

### Pekerjaan Frontend
- Ubah `AdminSellerDetailPage`:
  - pisahkan aksi `Setujui` dan `Tolak`
  - input alasan penolakan
  - tampilkan histori status verifikasi
- Ubah `SellerWaitingPage`:
  - jika status `REJECTED` atau `REVISION_REQUESTED`, tampilkan alasan
  - tampilkan form upload ulang KTP/NPWP dan data rekening
- Tambahkan badge status verifikasi lebih detail pada daftar penjual.

### Acceptance Criteria
- admin bisa menolak verifikasi dengan alasan
- seller dapat melihat alasan penolakan
- seller bisa unggah ulang dokumen tanpa registrasi akun baru
- status verifikasi seller terekam jelas dan tidak bergantung pada boolean tunggal

## Sprint 3: Dashboard Personal dan Notifikasi Dasar
**Target durasi:** 1 minggu

### Tujuan
Membuat status kerja user lebih terlihat dan mengurangi kebutuhan membuka halaman detail satu per satu.

### Pekerjaan Backend
- Tambah tabel `Notifikasi`:
  - `userId`
  - `judul`
  - `pesan`
  - `tipe`
  - `isRead`
  - `referenceType`
  - `referenceId`
- Trigger notifikasi saat:
  - seller disetujui / ditolak
  - aset disetujui masuk lelang
  - user menang lelang
  - bukti bayar diverifikasi / ditolak
- Tambah endpoint notifikasi:
  - `GET /api/notifikasi`
  - `PUT /api/notifikasi/:id/read`
  - `PUT /api/notifikasi/read-all`

### Pekerjaan Frontend
- Tambah ikon lonceng + panel daftar notifikasi.
- Personalisasi `DashboardPage`:
  - Admin: total seller pending, lelang aktif, pembayaran pending, laporan singkat
  - Penjual: total aset, aset pending verifikasi, aset aktif lelang, aset terjual
  - Pembeli: lelang yang diikuti, lelang yang dimenangkan, pembayaran pending, barang belum dikonfirmasi

### Acceptance Criteria
- setiap role melihat KPI yang relevan saat login
- user menerima notifikasi status penting
- notifikasi dapat ditandai sudah dibaca

## Sprint 4: Hardening Lelang dan KYC Pembeli
**Target durasi:** 1 minggu

### Tujuan
Menutup risiko operasional dan meningkatkan kualitas alur bidding.

### Pekerjaan Teknis
- Tambahkan validasi preventif jadwal lelang di UI admin:
  - tanggal tidak boleh di masa lalu
  - durasi wajib valid
  - tampilkan estimasi slot antrean secara eksplisit
- Tambahkan state koneksi socket di room lelang:
  - indikator connected/disconnected
  - auto rejoin room setelah reconnect
  - fallback refresh data setelah reconnect
- Jika KYC pembeli diaktifkan:
  - tambah `buyerVerificationStatus`
  - halaman review KTP pembeli untuk admin
  - batasi bidding hanya untuk pembeli terverifikasi

### Acceptance Criteria
- koneksi putus tidak membuat user kehilangan konteks bidding
- admin mendapat feedback jadwal yang lebih jelas sebelum menerbitkan lelang
- jika KYC pembeli dipilih, bidding benar-benar terkunci untuk akun yang belum lolos verifikasi

## 5. Perubahan Data Model yang Direkomendasikan

Agar sprint di atas tidak menghasilkan patch sementara, berikut perubahan skema yang disarankan.

### Entitas/field baru minimum
- `Penjual.verificationStatus`
- `Penjual.verificationNote`
- `Penjual.verifiedAt`
- `Penjual.verifiedBy`
- `Penjual.revisionCount`
- `Lelang.invoiceNumber`
- `Lelang.invoiceGeneratedAt`
- `Lelang.tanggalVerifikasiPembayaran`
- `Lelang.catatanPembayaran`
- `Lelang.verifiedBy`
- tabel `Pembayaran` bila ingin riwayat lebih bersih
- tabel `Notifikasi`

### Opsi desain
- **Desain cepat:** simpan invoice dan status bayar di tabel `Lelang`
- **Desain lebih rapi:** buat tabel `Pembayaran` terpisah dengan relasi satu-ke-satu ke `Lelang`

Rekomendasi:
- gunakan tabel `Pembayaran` jika proyek ini akan terus dikembangkan sampai audit transaksi lebih detail
- gunakan perluasan `Lelang` bila target terdekat hanya penyelesaian TA dengan kompleksitas terkendali

## 6. Urutan Implementasi Teknis yang Paling Aman

1. Refactor status verifikasi seller dari boolean ke enum/status terstruktur.
2. Tambahkan modul pembayaran internal tanpa menghapus flow lama terlebih dahulu.
3. Setelah alur baru stabil, nonaktifkan CTA WhatsApp sebagai jalur utama.
4. Tambahkan notifikasi dan dashboard personal di atas event yang sudah stabil.
5. Aktifkan KYC pembeli hanya jika kebutuhan institusi sudah dipastikan.

## 7. Testing yang Wajib Ditambahkan

### Backend
- test upload bukti bayar oleh pemenang dan non-pemenang
- test verifikasi pembayaran admin
- test reject pembayaran
- test reject seller dengan alasan
- test reupload dokumen seller
- test pembatasan bidding jika KYC pembeli diaktifkan

### Frontend
- test status UI pemenang sebelum dan sesudah upload bukti
- test seller waiting page untuk status pending, rejected, approved
- test dashboard per role
- test reconnect socket dan refresh histori bid

### UAT
- seller daftar → diverifikasi / ditolak → revisi → approved
- seller submit aset → SPK → ajukan lelang
- admin jadwalkan lelang
- pembeli menang → unduh invoice → upload bukti → admin verifikasi → pembeli konfirmasi barang

## 8. Rekomendasi Eksekusi Nyata

Jika hanya memilih dua pekerjaan berikut untuk sprint terdekat, urutannya harus:

1. **Pembayaran In-App + Invoice**
2. **Reject Verifikasi Penjual + Re-upload Dokumen**

Setelah dua modul ini selesai, sistem sudah jauh lebih dekat ke spesifikasi panduan final dan lebih layak dipresentasikan sebagai sistem yang benar-benar end-to-end.
