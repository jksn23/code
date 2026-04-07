# Analisis Progres Sistem E-Lelang (SPK AHP-SAW)

Dokumen ini berisi analisis komprehensif terkait progres pengerjaan proyek sistem E-Lelang saat ini, fitur-fitur yang telah berhasil diimplementasikan, serta beberapa kekurangan dan rekomendasi pengembangan ke depan.

---

## 1. Progres Proyek Saat Ini
Sistem E-Lelang dengan integrasi Sistem Pendukung Keputusan (SPK) menggunakan metode AHP (Analytical Hierarchy Process) dan SAW (Simple Additive Weighting) **sudah mencapai tahap fungsionalitas inti yang stabil**. Alur bisnis utama dari mulai pendaftaran pengguna, penilaian aset oleh SPK untuk menentukan Nilai Limit Dasar, hingga proses *live bidding* lelang telah berjalan dengan baik.

Berdasarkan struktur database (`schema.prisma`) dan komponen frontend (React), arsitektur sistem sudah terbagi jelas untuk tiga *role* pengguna: **ADMIN, PENJUAL, dan PEMBELI**.

---

## 2. Fitur-Fitur yang Telah Selesai Dibuat

### A. Fitur Inti (Core) & Autentikasi
- **Manajemen Role/Akses:** Login dan Registrasi berbasis Role (Admin, Penjual, Pembeli).
- **Proteksi Rute (Protected Routes):** Pengamanan rute menggunakan `RoleRoute` di frontend, memastikan Pembeli tidak dapat mengakses paksa halaman Manajemen Aset atau Kategori Penjual/Admin.
- **Profil Penjual:** Skema untuk kelengkapan identitas KTP, NPWP, dan rekening bank sudah terbentuk di database.

### B. Modul SPK (Sistem Pendukung Keputusan)
- **Manajemen Kriteria & Kategori:** Admin dapat menetapkan kriteria dinamis (Tipe: Cost/Benefit) untuk jenis-jenis aset.
- **Perhitungan AHP:** Sistem sudah mampu memproses perhitungan matriks AHP untuk menentukan bobot prioritas masing-masing kriteria. Validasi juga telah ditambahkan agar sistem tidak *crash* jika terdapat kategori dengan kurang dari dua kriteria.
- **Perhitungan SAW & Nilai Limit:** Sistem sudah bisa menghitung `Nilai Preferensi` dan `Nilai Limit Dasar` secara otomatis (disimpan dalam tabel `Hasil`) sebelum aset dilelang.

### C. Manajemen Aset & Jadwal
- **Sistem Antrean Lelang Bergilir (Sequential Queue):**
  - Mengubah logika penjadwalan dari pengisian *waktu buka/tutup manual* menjadi sistem berbasis **antrean dan durasi**.
  - Jika banyak aset dijadwalkan pada jam yang sama, aset berikutnya akan secara otomatis dijadwalkan tepat setelah aset pertama selesai (sistem antrean).
- **CRUD Data Aset:** Penjual dapat mengunggah aset miliknya (Draft), mengajukannya, dan Admin bertugas menyetujui aset untuk masuk jadwal lelang.
- **Format Rupiah Real-Time:** Standardisasi komponen input (mengubah misalnya `50000000` menjadi `Rp 50.000.000`) di form Harga Pasar dan Bidding.

### D. Live Bidding (Ruang Lelang)
- **Dashboard Daftar Lelang Pembeli:** Disusun menjadi tiga seksi (Sedang Berlangsung, Antrean Berikutnya, dan Selesai) untuk visualisasi yang jelas.
- **Shortcut Bidding Tercepat:** Fitur tombol *quick bid* (+500 Ribu, +1 Juta, +5 Juta, +10 Juta) untuk mempercepat proses penawaran harga melebihi batas tertinggi.
- **Countdown Timer:** Halaman sinkronisasi real-time kapan lelang berakhir.
- **Informasi Pemenang (Winner Banner):** Tampilan Hero Banner besar untuk menginformasikan pemenang lelang di akhir sesi, memuat status "LUNAS / BELUM LUNAS" dan "DITERIMA / DALAM PROSES", serta terintegrasi WhatsApp untuk konfirmasi pembayaran langsung ke admin/penjual.

---

## 3. Kekurangan & Fitur yang Perlu Ditambahkan Kedepannya

Meskipun fondasi proyek telah solid, ada beberapa kekurangan dan elemen penyempurnaan (enhancement) yang masih dibutuhkan untuk menjadikannya sistem e-Lelang berskala produksi:

### 💡 Kelemahan Sistem Saat Ini
1. **Verifikasi Dokumen Penjual (KTP/NPWP) Belum Optimal:** Skema DB memiliki `ktpUrl` dan `npwpUrl`, dan ada tabel isVerified untuk penjual. Namun, validasi dan sistem verifikasi *approval/reject* dokumen secara manual oleh Admin di antarmuka (Dashboard Khusus Verifikasi Penjual) dapat dikembangkan lebih detail.
2. **Ketergantungan Polling Frontend:** Beberapa mekanisme status transisi (contohnya melihat *bid* baru) mungkin masih mengandalkan polling waktu (setInterval). Skala pengguna yang banyak dapat membebani server backend.
3. **Pembayaran Masih Manual (WhatsApp):** Ketika lelang dimenangkan, pemenang dihubungkan melalui *WhatsApp* untuk membayar. Saat ini belum ada integrasi otomatis *Payment Gateway* (seperti Midtrans atau Xendit).
4. **Validasi File Tambahan:** Belum adanya format validasi yang ketat dan keamanan terkait jenis *file* yang diunggah pengguna (misal unggah KTP wajib gambar dengan *size* maksimum tertentu).

### 🚀 Rekomendasi Fitur Tambahan (Roadmap Lanjutan)
1. **Implementasi WebSockets / Socket.io Penuh:**
   Penerapan koneksi Socket.io (real-time bid push) secara penuh untuk ruang lelang agar tampilan angka penawaran langsung terperbarui dalam milidetik *(sub-second latency)* tanpa klien harus memuat ulang terus-menerus.
2. **Notifikasi Otomatis (Email/Push Notifications):**
   Mengingatkan pembeli via Email atau notifikasi internal sistem ketika mereka *outbid* (dikalahkan tawarannya) oleh orang lain, serta pengingat tagihan kepada pemenang lelang.
3. **Manajemen Deposit Penawaran (Tanda Jadi):**
   Sistem lelang modern biasanya mewajibkan calon pembeli menyetor *deposit* dompet digital untuk mencegah *hit-and-run* (pemenang lelang kabur tanpa membayar).
4. **Pagings & Filter Lanjutan:**
   Paging data di semua tabel aset (Pagination/Lazy Loading) mengingat ketika jumlah aset banyak, proses tarikan *query* API `GET /aset` bisa menjadi *bottleneck*. 

---
*Laporan Analisis Progres Sistem E-Lelang | Diperbarui secara otomatis.*
