# Planning Pengembangan Selanjutnya
*Tanggal: 8 April 2026*

Dokumen ini disusun berdasarkan analisis terbaru pada seluruh kode backend, frontend, dan skema database proyek setelah pemutbaruan besar pada sistem pembayaran, KYC, dan notifikasi.

---

## ✅ 1. Fitur yang Telah Selesai (Completed)

Beberapa tonggak pencapaian besar (milestones) dari rencana sebelumnya telah berhasil diimplementasikan sepenuhnya:

*   **Sistem Pembayaran In-App**: Pemenang lelang sudah bisa mendapatkan nomor invoice, mengunduh data invoice, dan mengunggah bukti pembayaran di dalam sistem.
*   **Verifikasi Pembayaran Admin**: Admin memiliki panel untuk meninjau bukti transfer, menyetujui, atau menolak pembayaran dengan catatan alasan.
*   **KYC Pembeli (Verified Buyer)**: Alur verifikasi KTP pembeli oleh admin sudah aktif, lengkap dengan status `PENDING`, `APPROVED`, dan `REJECTED`.
*   **Pusat Notifikasi (In-App Notifications)**: Sistem notifikasi terintegrasi sudah ada (ikon lonceng) yang memberitahu pengguna tentang kemenangan lelang, status verifikasi, dan status pembayaran.
*   **Manajemen User Terpusat**: Admin memiliki halaman `UserManagementPage` yang kuat untuk mengelola semua akun dan role.

---

## 🚀 2. Fokus Pengembangan Terakhir (Final Polish)

Mengingat sistem sudah mencapai fungsionalitas **96%**, fokus selanjutnya adalah pada penguatan data model dan penyempurnaan pengalaman pengguna (UX).

### Prioritas Utama: Penyempurnaan Verifikasi Penjual
Saat ini, verifikasi penjual masih menggunakan boolean `isVerified` saja di database. Ini perlu diselaraskan dengan pola verifikasi pembeli yang sudah menggunakan status terstruktur (Enum) agar admin bisa memberikan alasan penolakan/revisi dokumen.

---

## 📅 Rencana Sprint Final

### Sprint 1: Refinement Verifikasi Penjual (Enum Status)
**Target:** 1-2 hari
*   **Backend:**
    *   Migrasi field `isVerified` (Boolean) di model `Penjual` menjadi `verificationStatus` (Enum: `PENDING`, `APPROVED`, `REJECTED`, `REVISION_REQUESTED`).
    *   Tambahkan field `verificationNote` pada model `Penjual`.
    *   Update controller `penjual.controller.js` untuk mendukung proses penolakan dengan catatan.
*   **Frontend:**
    *   Update `AdminSellerDetailPage` agar admin bisa menginput alasan saat menolak verifikasi.
    *   Update `SellerWaitingPage` agar penjual bisa melihat alasan penolakan dan mengunggah ulang dokumen.

### Sprint 2: Dashboard KPI & Visualisasi Data
**Target:** 2-3 hari
*   **Dashboard Admin:** Tambahkan ringkasan total transaksi bulanan, jumlah aset pending, dan statistik user aktif.
*   **Dashboard Penjual:** Tambahkan widget "Hasil Penjualan Saya" dan status aset yang sedang dilelang secara visual.
*   **Dashboard Pembeli:** Tambahkan widget "Lelang yang Saya Ikuti" dan pengingat tenggat waktu pembayaran invoice.

### Sprint 3: Hardening & Final QA
**Target:** 2 hari
*   **Socket.io Stability:** Tambahkan indikator status koneksi (dot hijau/merah) di `LelangRoomPage` untuk memberikan kepastian kepada bidder.
*   **Validasi Preventif:** Tambahkan pengecekan ketat di frontend Admin saat membuat jadwal lelang (mencegah waktu lampau atau durasi tidak logis).
*   **Performance:** Audit pemanggilan API di halaman dashboard dan room lelang untuk memastikan efisiensi.

---

## 🛡️ 3. Perubahan Data Model (Refinement)

Field baru yang disarankan untuk model **Penjual**:
```prisma
model Penjual {
  // ... existing fields
  verificationStatus VerificationStatus @default(PENDING) @map("verification_status")
  verificationNote   String?            @map("verification_note") @db.Text
  verifiedAt         DateTime?          @map("verified_at")
  verifiedBy         Int?               @map("verified_by")
}
```

---

## 🏁 Kesimpulan Akhir
Dengan selesainya Sprint Final ini, sistem akan memiliki standar kualitas produksi yang siap digunakan secara profesional untuk keperluan TA maupun operasional nyata. Sistem saat ini sudah jauh melampaui kebutuhan dasar awal dan memiliki arsitektur yang sangat solid.
