# 🧠 USER FLOW SISTEM (VERSI AKADEMIS & TERSTRUKTUR)

Sistem terdiri dari **3 aktor utama**:

1. **Penjual**
2. **Admin (Pejabat Lelang)**
3. **Pembeli**

Serta 2 proses inti:

- **SPK (Penentuan Nilai Aset)**
- **Lelang Online**

---

# 🟢 A. USER FLOW PENJUAL (SELLER FLOW)

## 🎯 Tujuan:
Mengajukan aset untuk dilelang dan mendapatkan nilai limit dari sistem SPK

---

## 🔄 Alur Detail:

### 1. Registrasi Akun
Penjual melakukan:
- Input nama
- Email
- Password  

➡️ Sistem:
- Menyimpan data user  
- Assign role: **penjual**

---

### 2. Login
Penjual login ke sistem

➡️ Sistem:
- Validasi kredensial
- Redirect ke dashboard penjual

---

### 3. Input Data Identitas
Penjual mengisi:
- KTP  
- NPWP  
- Data rekening  

➡️ Sistem:
- Menyimpan data identitas  
- Menandai status: *menunggu verifikasi*

---

### 4. Input Data Aset
Penjual menginput:
- Nama aset  
- Kategori (Tanah/Kendaraan/Elektronik)  
- Deskripsi  
- Upload dokumen  

➡️ Sistem:
- Menyimpan data aset  
- Mengambil **kriteria berdasarkan kategori**

---

### 5. Input Nilai Kriteria (SPK)
Penjual memberikan nilai:
- Berdasarkan skala (1–5)

➡️ Sistem:
- Menyimpan nilai ke tabel `nilai_aset`

---

### 6. Proses SPK (AHP–SAW)

#### a. AHP
- Input pairwise comparison  
- Hitung bobot  
- Hitung CR  

➡️ Jika:
- **CR > 0.1 → ulangi input**
- **CR ≤ 0.1 → lanjut**

---

#### b. SAW
- Normalisasi nilai  
- Hitung nilai preferensi  

---

#### c. Konversi Nilai Limit

Nilai Limit = Preferensi × Harga Pasar

➡️ Sistem menghasilkan:
- Nilai preferensi  
- Nilai limit (Rp)

---

### 7. Pengajuan Lelang
Penjual:
- Mengajukan aset ke admin

➡️ Status:
- “Menunggu verifikasi”

---

### 8. Monitoring Status
Penjual dapat melihat:
- Status verifikasi  
- Jadwal lelang  
- Hasil lelang  

---

# 🔵 B. USER FLOW ADMIN (PEJABAT LELANG)

## 🎯 Tujuan:
Mengelola sistem, memverifikasi aset, dan mengontrol proses lelang

---

## 🔄 Alur Detail:

### 1. Login
Admin login ke sistem

---

### 2. Verifikasi Penjual
Admin memeriksa:
- KTP  
- NPWP  

➡️ Output:
- Disetujui / Ditolak  

---

### 3. Verifikasi Aset
Admin memeriksa:
- Dokumen aset  
- Kelengkapan  

➡️ Output:
- Layak lelang / Tidak  

---

### 4. Validasi Nilai SPK
Admin dapat:
- Melihat hasil AHP  
- Melihat hasil SAW  
- Melihat nilai limit  

➡️ Tujuan:
- memastikan hasil rasional

---

### 5. Penjadwalan Lelang
Admin menentukan:
- Tanggal mulai  
- Durasi lelang  

---

### 6. Publikasi Lelang
Sistem menampilkan:
- Daftar aset lelang  
- Nilai limit  

---

### 7. Monitoring Lelang
Admin memantau:
- Aktivitas bidding  
- Peserta  

---

### 8. Penentuan Pemenang
Sistem otomatis:
- memilih harga tertinggi  

➡️ Admin hanya:
- memverifikasi hasil

---

### 9. Verifikasi Pembayaran
Admin:
- mengecek bukti pembayaran  

➡️ Status:
- Lunas / Tidak  

---

### 10. Generate Laporan
Admin menghasilkan:
- Laporan transaksi  
- Laporan aset  
- Laporan lelang  

---

# 🟡 C. USER FLOW PEMBELI (BIDDER FLOW)

## 🎯 Tujuan:
Mengikuti lelang dan memenangkan aset

---

## 🔄 Alur Detail:

### 1. Registrasi & Login
- Input data  
- Upload KTP  

---

### 2. Akses Daftar Lelang
Pembeli melihat:
- Daftar aset  
- Nilai limit  
- Deskripsi  

---

### 3. Memilih Aset
Pembeli memilih aset yang ingin diikuti

---

### 4. Proses Bidding
Saat lelang aktif:
- Input harga penawaran  

➡️ Sistem:
- Menyimpan bid  
- Validasi > bid sebelumnya  

---

### 5. Penutupan Lelang
Saat waktu habis:

➡️ Sistem menentukan:
- pemenang = **bid tertinggi**

---

### 6. Notifikasi
Pemenang menerima:
- notifikasi kemenangan  
- invoice pembayaran  

---

### 7. Pembayaran
Pembeli:
- melakukan transfer  
- upload bukti  

---

### 8. Konfirmasi
- Admin verifikasi  
- Pembeli konfirmasi penerimaan barang  

---

# 🔥 D. USER FLOW PROSES LELANG (SYSTEM FLOW)

## 🔄 Alur Sistem:

1. Lelang dibuka  
2. Timer aktif  
3. Pembeli melakukan bidding  
4. Sistem mencatat semua penawaran  
5. Saat waktu habis:
   - sistem mengunci bidding  
   - menentukan pemenang  
6. Generate invoice  
7. Pembayaran:
   - pilih metode (Cash / Transfer)  
   - diarahkan ke WhatsApp pejabat lelang untuk verifikasi  
8. Verifikasi pembayaran  
9. Penyerahan barang  

---

# 🧠 E. USER FLOW SPK (INTI SISTEM)

## 🔄 Tahapan:

1. Input nilai kriteria  
2. Input matriks AHP  
3. Hitung bobot  
4. Validasi CR  
5. Normalisasi SAW  
6. Hitung nilai preferensi  
7. Hitung nilai limit  
8. Tampilkan hasil  

---