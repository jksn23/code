# Implementation Plan Pengembangan Selanjutnya
*Tanggal: 8 April 2026*

Dokumen ini merupakan turunan implementatif dari `docs/planning_pengembangan_selanjutnya.md`.
Fungsinya adalah menerjemahkan planning tingkat sprint menjadi langkah eksekusi yang konkret untuk database, backend, frontend, testing, dan rollout.

---

## 1. Hasil Analisis Planning Existing

Berdasarkan pembacaan `docs/planning_pengembangan_selanjutnya.md` dan validasi cepat ke kode saat ini, ada tiga kesimpulan utama:

1. **Prioritas seller verification sudah tepat**
   Gap paling nyata memang ada pada model verifikasi penjual yang masih memakai boolean `isVerified`.

2. **Sebagian item Sprint 3 pada planning lama sudah selesai**
   Poin berikut sudah ada di implementasi:
   - indikator status koneksi pada `LelangRoomPage`
   - validasi frontend untuk waktu jadwal lelang yang lampau dan durasi nol

3. **Ada gap teknis tambahan yang belum tertulis kuat di planning lama**
   Lifecycle lelang masih banyak bergantung pada request masuk atau aktivitas socket melalui `syncLelangLifecycle()`, sehingga perlu hardening dengan job sinkronisasi berkala.

Karena itu, implementation plan ini memakai prioritas aktual berikut:
- `P1` Refinement verifikasi penjual
- `P2` Revisi alur dokumen penjual
- `P3` Pengayaan dashboard KPI
- `P4` Hardening lifecycle lelang

---

## 2. Strategi Eksekusi

Eksekusi disarankan berjalan berurutan, bukan paralel penuh, karena ada dependensi model data:

1. **Refactor model seller verification lebih dulu**
   Semua halaman dan API lain masih bergantung pada `isVerified`.

2. **Bangun alur revisi dokumen setelah status seller rapi**
   Fitur reupload dokumen akan jauh lebih bersih jika status seller sudah enum-based.

3. **Perkaya dashboard setelah data verification stabil**
   KPI dashboard akan lebih konsisten jika status seller dan transaksi sudah final.

4. **Lakukan hardening lifecycle di tahap akhir**
   Ini lebih aman setelah alur bisnis utama tidak banyak berubah.

---

## 3. Rencana Implementasi Detail

## Fase 0 - Baseline dan Persiapan
**Tujuan:** menyiapkan fondasi sebelum refactor dimulai.

### Task
- Audit semua pemakaian `isVerified` pada backend dan frontend.
- Audit semua sumber data dashboard agar tahu metrik mana yang sudah tersedia dan mana yang masih harus dihitung.
- Audit semua endpoint lelang yang memanggil `syncLelangLifecycle()`.
- Tentukan nama enum final seller verification.

### Output
- daftar file terdampak
- daftar query yang harus diubah
- keputusan final naming enum

### File terdampak awal
- `backend/prisma/schema.prisma`
- `backend/src/controllers/auth.controller.js`
- `backend/src/controllers/penjual.controller.js`
- `backend/src/controllers/dashboard.controller.js`
- `backend/src/controllers/aset.controller.js`
- `backend/src/controllers/user.controller.js`
- `frontend/src/App.tsx`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/pages/AdminSellerDetailPage.jsx`
- `frontend/src/pages/SellerWaitingPage.jsx`
- `frontend/src/pages/PenjualPage.jsx`
- `frontend/src/pages/UserManagementPage.jsx`
- `frontend/src/pages/DashboardPage.jsx`
- `frontend/src/services/api.js`

---

## Fase 1 - Refinement Verifikasi Penjual
**Prioritas:** `P1`
**Estimasi:** 2-3 hari

### 1. Database

#### Perubahan skema
- Tambahkan enum `SellerVerificationStatus`
- Ubah model `Penjual`:
  - hapus atau deprecate `isVerified`
  - tambah `verificationStatus`
  - tambah `verificationNote`
  - tambah `verifiedAt`
  - tambah `verifiedBy`

#### Keputusan implementasi
- Status minimal:
  - `PENDING`
  - `APPROVED`
  - `REJECTED`
- `REVISION_REQUESTED` opsional. Jika ingin sederhana, cukup gunakan `REJECTED` + `verificationNote`.

#### Langkah migrasi
1. Tambah field baru tanpa langsung menghapus `isVerified`.
2. Backfill data lama:
   - `isVerified = true` menjadi `APPROVED`
   - `isVerified = false` menjadi `PENDING`
3. Update kode aplikasi agar membaca field baru.
4. Setelah seluruh kode stabil, baru putuskan apakah `isVerified` dihapus total.

### 2. Backend

#### Endpoint yang perlu diubah
- Login/profile seller harus mengirim:
  - `sellerVerificationStatus`
  - `sellerVerificationNote`
  - `sellerVerifiedAt`
- Endpoint verifikasi seller diubah dari payload boolean menjadi payload aksi.

#### Kontrak API yang disarankan
```json
{
  "action": "approve",
  "note": "Dokumen valid dan akun diaktifkan"
}
```

```json
{
  "action": "reject",
  "note": "NPWP buram, mohon unggah ulang dokumen yang lebih jelas"
}
```

#### Rule bisnis
- `approve`
  - set `verificationStatus = APPROVED`
  - simpan `verificationNote`
  - set `verifiedAt`
  - set `verifiedBy`
- `reject`
  - `note` wajib
  - set `verificationStatus = REJECTED`
  - simpan `verificationNote`
  - set `verifiedAt`
  - set `verifiedBy`

#### Query yang harus disesuaikan
- filter seller pending di dashboard admin
- guard akses seller saat membuat aset
- guard routing seller di auth/profile
- manajemen user admin

### 3. Frontend

#### Halaman utama yang diubah
- `AdminSellerDetailPage`
  - tambah textarea catatan admin
  - aksi approve/reject berbasis `action`
  - status badge gunakan enum, bukan boolean

- `SellerWaitingPage`
  - tampilkan status seller
  - jika `REJECTED`, tampilkan catatan revisi
  - ubah copy halaman agar sesuai status aktual

- `App.tsx`
  - auth guard seller jangan lagi baca `user.isVerified`
  - baca `user.sellerVerificationStatus`

- `DashboardPage`
  - ubah status seller pada kartu profil

- `PenjualPage` dan `UserManagementPage`
  - filter dan badge seller gunakan enum

### 4. Testing

#### Backend
- approve seller berhasil
- reject seller tanpa catatan gagal
- seller `REJECTED` tidak bisa akses fitur seller aktif
- seller `APPROVED` tetap bisa input aset

#### Frontend
- status badge seller tampil benar
- waiting page berbeda untuk `PENDING` dan `REJECTED`
- form reject seller mewajibkan catatan

### 5. Definition of Done
- seluruh referensi utama `isVerified` di runtime sudah dipindah ke status baru
- admin bisa approve/reject seller dengan catatan
- seller melihat status dan alasan secara jelas

---

## Fase 2 - Revisi Dokumen Penjual
**Prioritas:** `P2`
**Estimasi:** 1-2 hari

### Tujuan
Menutup gap setelah seller ditolak, agar alur bisnis tidak berhenti di status penolakan.

### Backend
- Tambahkan endpoint update dokumen seller:
  - reupload `ktp`
  - reupload `npwp`
  - opsional update rekening
- Saat seller mengunggah ulang dokumen:
  - set `verificationStatus = PENDING`
  - kosongkan atau arsipkan `verificationNote`

### Frontend
- Tambahkan form reupload pada `SellerWaitingPage` atau halaman profil seller.
- Jika status `REJECTED`, tombol utama berubah menjadi `Perbaiki Dokumen`.
- Setelah submit berhasil, tampilkan status `PENDING`.

### Risiko desain
- Jika catatan verifikasi lama langsung dihapus, jejak review hilang.
- Solusi minimum:
  - simpan catatan terakhir untuk ditampilkan
  - jika belum ada audit log table, cukup reset status dan pertahankan histori di catatan terpisah hanya jika benar-benar dibutuhkan

### Definition of Done
- seller yang ditolak bisa unggah ulang dokumen
- status kembali ke `PENDING`
- admin dapat mereview ulang tanpa manipulasi data manual

---

## Fase 3 - Dashboard KPI dan Personalisasi
**Prioritas:** `P3`
**Estimasi:** 2-3 hari

### 1. Dashboard Admin

#### KPI yang disarankan
- total seller pending
- total buyer KYC pending
- total pembayaran pending verification
- total aset `PENDING` yang belum dijadwalkan
- total lelang aktif hari ini

#### Query backend
- perlu agregasi tambahan di `dashboard.controller.js`
- jangan hitung semuanya di frontend

### 2. Dashboard Penjual

#### KPI yang disarankan
- total aset saya
- total aset terjual
- total hasil penjualan
- aset aktif di lelang
- aset menunggu review/admin

#### Query tambahan
- jumlah lelang selesai dengan pemenang
- sum penawaran tertinggi untuk aset seller yang selesai

### 3. Dashboard Pembeli

#### KPI yang disarankan
- lelang yang diikuti
- lelang dimenangkan
- pembayaran pending
- barang belum dikonfirmasi

#### Widget tambahan
- lelang yang akan segera dimulai
- lelang aktif yang pernah diikuti buyer
- countdown tenggat invoice

### 4. Frontend UX
- jaga agar dashboard tetap satu kali fetch ringkasan utama
- hindari memecah terlalu banyak API call kecil
- tampilkan CTA jelas:
  - admin: review seller / review pembayaran
  - seller: cek status aset
  - buyer: bayar invoice / masuk room lelang

### 5. Definition of Done
- setiap role punya dashboard yang benar-benar action-oriented
- tidak ada KPI yang dihitung manual di banyak komponen berbeda

---

## Fase 4 - Hardening Lifecycle Lelang
**Prioritas:** `P4`
**Estimasi:** 2 hari

### Masalah saat ini
Transisi status lelang masih dipicu oleh akses endpoint atau socket, misalnya saat user membuka room atau mengambil detail lelang.

### Solusi implementasi
- Buat scheduler ringan di backend, misalnya `setInterval()` terpusat pada server startup.
- Scheduler menjalankan sinkronisasi berkala untuk lelang `PENDING` dan `ACTIVE`.
- Hindari notifikasi ganda dengan memastikan transisi hanya terjadi jika status memang berubah.

### Opsi teknis

#### Opsi A - Interval internal server
Paling cepat untuk project TA.

Contoh tanggung jawab:
- tiap 15-30 detik:
  - cari lelang `PENDING` yang sudah lewat `waktuBuka`
  - cari lelang `ACTIVE` yang sudah lewat `waktuTutup`
  - jalankan transisi aman

#### Opsi B - Scheduler library
Lebih rapi, tapi tidak wajib jika proyek mengejar penyelesaian cepat.

### Catatan penting
- `syncLelangLifecycle(lelangId)` saat ini berbasis satu lelang.
- Untuk scheduler, sebaiknya tambahkan fungsi baru misalnya:
  - `syncPendingAuctions()`
  - `syncAuctionLifecycleBatch()`
- Hindari memanggil seluruh list lelang terlalu berat tiap interval jika data makin besar.

### Testing
- lelang aktif berubah selesai tanpa halaman dibuka
- pemenang otomatis tersimpan
- invoice tetap bisa di-generate
- notifikasi menang tidak terkirim ganda

### Definition of Done
- transisi status lelang tidak lagi bergantung pada aktivitas user
- race condition dasar sudah ditangani

---

## 4. Breakdown File per Fase

## Fase 1
- `backend/prisma/schema.prisma`
- `backend/src/controllers/auth.controller.js`
- `backend/src/controllers/penjual.controller.js`
- `backend/src/controllers/aset.controller.js`
- `backend/src/controllers/dashboard.controller.js`
- `backend/src/controllers/user.controller.js`
- `frontend/src/App.tsx`
- `frontend/src/pages/AdminSellerDetailPage.jsx`
- `frontend/src/pages/SellerWaitingPage.jsx`
- `frontend/src/pages/PenjualPage.jsx`
- `frontend/src/pages/UserManagementPage.jsx`
- `frontend/src/pages/DashboardPage.jsx`
- `frontend/src/services/api.js`

## Fase 2
- `backend/src/controllers/penjual.controller.js`
- `backend/src/routes/penjual.routes.js`
- `backend/src/middleware/upload.middleware.js`
- `frontend/src/pages/SellerWaitingPage.jsx`
- `frontend/src/services/api.js`

## Fase 3
- `backend/src/controllers/dashboard.controller.js`
- `frontend/src/pages/DashboardPage.jsx`

## Fase 4
- `backend/app.js`
- `backend/src/controllers/lelang.controller.js`

---

## 5. Risiko dan Mitigasi

### Risiko 1
Refactor seller verification memutus alur login atau guard seller.

Mitigasi:
- lakukan migrasi bertahap
- sementara dukung fallback `isVerified` hanya selama transisi jika perlu

### Risiko 2
Dashboard menjadi lambat karena query agregasi terlalu banyak.

Mitigasi:
- gunakan `Promise.all`
- batasi item highlight maksimal 5
- hitung agregasi utama di backend

### Risiko 3
Scheduler lifecycle memicu notifikasi ganda.

Mitigasi:
- pastikan notifikasi hanya dibuat saat update status benar-benar terjadi
- cek status existing sebelum menulis perubahan

---

## 6. Urutan Commit yang Disarankan

1. `refactor(prisma): add seller verification status fields`
2. `refactor(auth): switch seller verification payload to enum-based status`
3. `feat(admin): support approve/reject seller with notes`
4. `feat(seller): show rejection note and waiting status`
5. `feat(seller): allow rejected seller to resubmit documents`
6. `feat(dashboard): enrich admin seller and buyer KPIs`
7. `feat(lelang): add periodic lifecycle sync job`
8. `test/docs: final verification and update documentation`

---

## 7. Checklist Eksekusi

### Sebelum coding
- finalisasi nama enum seller verification
- finalisasi payload API verifikasi seller

### Saat coding
- mulai dari skema dan backend
- lanjut ke service API frontend
- baru update halaman UI

### Setelah coding
- uji login seller
- uji approve/reject seller
- uji seller rejected reupload
- uji dashboard semua role
- uji lifecycle lelang tanpa interaksi user

---

## 8. Kesimpulan Eksekusi

Jika implementation plan ini diikuti, urutan kerja akan tetap aman terhadap dependensi data dan meminimalkan rework. Fokus paling penting tetap:

1. menyelesaikan refactor verifikasi penjual
2. menutup alur revisi dokumen penjual
3. memperkaya dashboard berdasarkan data yang sudah matang
4. menguatkan lifecycle lelang agar tidak request-driven

Dokumen ini bisa langsung dipakai sebagai acuan implementasi bertahap pada sprint berikutnya.
