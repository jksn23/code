# Prompt AI Agent: Otomatisasi Data Uji Jurnal AHP-SAW untuk Sistem Lelang Online

## Peran AI Agent
Anda bertindak sebagai **AI coding assistant** yang membantu membuat, menguji, dan memvalidasi data uji untuk sistem **Sistem Pendukung Keputusan Penentuan Nilai Limit Aset Lelang Sukarela Berbasis Web Menggunakan AHP-SAW**.

Sistem ini digunakan untuk kebutuhan publikasi jurnal INSECT. Oleh karena itu, seluruh data uji, log terminal, hasil perhitungan, dan tampilan web harus dapat digunakan sebagai bukti pada bagian **Hasil dan Pembahasan** artikel ilmiah.

---

## Tujuan Utama
Buat serangkaian kode dan prosedur pengujian untuk:

1. Mengenerate data uji otomatis ke database.
2. Menyimpan kategori, kriteria, bobot AHP, aset, nilai kriteria, nilai preferensi, dan nilai limit.
3. Menampilkan hasil input dan hasil perhitungan pada terminal log.
4. Memastikan data muncul pada tampilan web.
5. Menyediakan hasil validasi yang dapat dibandingkan dengan Excel/manual calculation.
6. Menyediakan dasar dokumentasi untuk artikel jurnal.

---

## Konteks Sistem
Sistem yang digunakan adalah aplikasi web SPK lelang online dengan metode AHP dan SAW.

Teknologi sistem:

- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express
- Database: MySQL
- ORM: Prisma
- HTTP Client: Axios

Fokus sistem:

- Menentukan **nilai limit awal aset lelang sukarela**.
- Menggunakan **AHP** untuk bobot kriteria.
- Menggunakan **SAW** untuk nilai preferensi dan nilai limit.
- Menggunakan tiga kategori aset:
  1. Tanah dan Bangunan
  2. Kendaraan
  3. Elektronik

Batasan penelitian:

> Penelitian ini dibatasi pada sistem pendukung keputusan untuk menentukan nilai limit awal aset lelang sukarela berdasarkan tiga kategori aset, yaitu tanah dan bangunan, kendaraan, dan elektronik. Sistem tidak membahas proses pembayaran, legalisasi risalah lelang, dan integrasi dengan sistem lelang pemerintah.

---

## Prinsip Data Uji
Data uji harus memenuhi prinsip berikut:

1. Realistis untuk simulasi penelitian.
2. Setiap kategori memiliki minimal 3 alternatif aset.
3. Nilai kriteria menggunakan skala 1 sampai 5.
4. Kriteria bertipe **benefit** berarti semakin besar semakin baik.
5. Kriteria bertipe **cost** berarti semakin kecil semakin baik.
6. Bobot kriteria sudah bersifat predefined AHP weighting.
7. Hasil SAW harus dapat dihitung ulang secara manual atau Excel.
8. Terminal harus menampilkan seluruh proses seed dan hasil perhitungan.

---

## Data Uji yang Harus Dibuat

### 1. Kategori Tanah dan Bangunan

#### Kriteria dan Bobot

| No | Kriteria | Tipe | Bobot |
|---:|---|---|---:|
| 1 | Lokasi dan Aksesibilitas | benefit | 0.25 |
| 2 | Legalitas | benefit | 0.20 |
| 3 | Luas | benefit | 0.15 |
| 4 | Kondisi Fisik | benefit | 0.12 |
| 5 | Fasilitas Sekitar | benefit | 0.10 |
| 6 | Lingkungan dan Risiko | cost | 0.10 |
| 7 | Potensi Pengembangan | benefit | 0.08 |

#### Alternatif Aset

| Kode | Nama Aset | Harga Pasar | Lokasi | Legalitas | Luas | Kondisi | Fasilitas | Risiko | Potensi |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| TB01 | Rumah Tipe 45/90 | 450000000 | 4 | 5 | 3 | 4 | 4 | 2 | 3 |
| TB02 | Ruko 2 Lantai | 850000000 | 5 | 5 | 4 | 4 | 5 | 2 | 4 |
| TB03 | Tanah Kavling | 300000000 | 3 | 4 | 4 | 3 | 3 | 3 | 5 |

---

### 2. Kategori Kendaraan

#### Kriteria dan Bobot

| No | Kriteria | Tipe | Bobot |
|---:|---|---|---:|
| 1 | Kondisi Mesin | benefit | 0.25 |
| 2 | Performa | benefit | 0.18 |
| 3 | Kilometer | cost | 0.15 |
| 4 | Tahun Produksi | benefit | 0.12 |
| 5 | Riwayat Kendaraan | benefit | 0.10 |
| 6 | Merek atau Model | benefit | 0.10 |
| 7 | Kondisi Fisik | benefit | 0.10 |

#### Alternatif Aset

| Kode | Nama Aset | Harga Pasar | Mesin | Performa | Kilometer | Tahun | Riwayat | Merek | Fisik |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| KD01 | Toyota Avanza 2019 | 165000000 | 4 | 4 | 3 | 4 | 4 | 5 | 4 |
| KD02 | Honda Beat 2021 | 14000000 | 4 | 4 | 2 | 5 | 4 | 4 | 4 |
| KD03 | Mitsubishi Xpander 2018 | 185000000 | 4 | 5 | 4 | 3 | 3 | 5 | 4 |

---

### 3. Kategori Elektronik

#### Kriteria dan Bobot

| No | Kriteria | Tipe | Bobot |
|---:|---|---|---:|
| 1 | Kondisi Barang | benefit | 0.25 |
| 2 | Spesifikasi Teknis | benefit | 0.20 |
| 3 | Performa atau Fungsi | benefit | 0.18 |
| 4 | Usia Pemakaian | cost | 0.15 |
| 5 | Merek | benefit | 0.12 |
| 6 | Kelengkapan | benefit | 0.10 |

#### Alternatif Aset

| Kode | Nama Aset | Harga Pasar | Kondisi | Spesifikasi | Performa | Usia | Merek | Kelengkapan |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| EL01 | Laptop Lenovo ThinkPad 2021 | 6500000 | 4 | 4 | 4 | 3 | 5 | 4 |
| EL02 | iPhone 12 128GB | 5800000 | 4 | 4 | 4 | 3 | 5 | 3 |
| EL03 | Kamera Canon EOS 700D | 4000000 | 3 | 3 | 4 | 4 | 4 | 4 |

---

## Rumus yang Harus Digunakan

### 1. Normalisasi SAW untuk Benefit

```text
r_ij = x_ij / max(x_j)
```

Keterangan:

- `r_ij` = nilai normalisasi alternatif ke-i pada kriteria ke-j
- `x_ij` = nilai asli alternatif ke-i pada kriteria ke-j
- `max(x_j)` = nilai maksimum pada kriteria ke-j

### 2. Normalisasi SAW untuk Cost

```text
r_ij = min(x_j) / x_ij
```

Keterangan:

- `min(x_j)` = nilai minimum pada kriteria ke-j

### 3. Nilai Preferensi SAW

```text
V_i = Σ(w_j × r_ij)
```

Keterangan:

- `V_i` = nilai preferensi alternatif ke-i
- `w_j` = bobot kriteria ke-j
- `r_ij` = nilai normalisasi

### 4. Nilai Limit

```text
Nilai Limit = Nilai Preferensi × Harga Pasar
```

---

## Tugas Teknis AI Agent

### A. Analisis Struktur Database

1. Baca file `backend/prisma/schema.prisma`.
2. Identifikasi nama model yang tersedia.
3. Pastikan model berikut tersedia atau temukan padanannya:
   - kategori
   - kriteria
   - bobot AHP
   - aset
   - nilai aset
   - hasil
4. Jangan mengubah struktur database jika tidak diperlukan.
5. Jika nama model berbeda, sesuaikan kode seed dengan nama model aktual di Prisma schema.

---

### B. Buat Script Seed Data Uji

Buat file baru:

```bash
backend/prisma/seed_data_jurnal.js
```

Script harus melakukan hal berikut:

1. Menggunakan `PrismaClient`.
2. Membersihkan data uji lama untuk tiga kategori:
   - Tanah dan Bangunan
   - Kendaraan
   - Elektronik
3. Membuat ulang kategori.
4. Membuat kriteria per kategori.
5. Menyimpan bobot AHP per kriteria.
6. Membuat 9 aset uji.
7. Menyimpan nilai kriteria aset.
8. Menghitung normalisasi SAW.
9. Menghitung nilai preferensi.
10. Menghitung nilai limit.
11. Menyimpan hasil ke database.
12. Menampilkan log detail di terminal.

---

### C. Tambahkan Script ke package.json

Tambahkan command berikut pada `backend/package.json`:

```json
"seed:jurnal": "node prisma/seed_data_jurnal.js"
```

Pastikan tidak merusak script lain yang sudah ada.

---

### D. Jalankan Seed

Jalankan perintah berikut dari folder backend:

```bash
npm install
npx prisma generate
npm run seed:jurnal
```

Jika database belum tersinkronisasi, jalankan:

```bash
npx prisma db push
```

Lalu ulangi:

```bash
npm run seed:jurnal
```

---

## Format Terminal Log yang Wajib Ditampilkan

Terminal harus menampilkan minimal informasi berikut:

```text
========================================
SEED DATA UJI JURNAL AHP-SAW LELANG
========================================

[1] Membersihkan data uji lama...
Data uji lama berhasil dibersihkan.

[2] Membuat kategori: Tanah dan Bangunan
Kategori berhasil dibuat.

Kriteria:
- Lokasi dan Aksesibilitas | benefit | bobot 0.25
- Legalitas | benefit | bobot 0.20
...

Aset:
- Rumah Tipe 45/90
  Harga Pasar: Rp450.000.000
  Nilai Preferensi: 0.xxxxxx
  Nilai Limit: Rpxxx.xxx.xxx

Ranking kategori Tanah dan Bangunan:
1. Ruko 2 Lantai | Preferensi: 0.xxxxxx | Nilai Limit: Rpxxx.xxx.xxx
2. Rumah Tipe 45/90 | Preferensi: 0.xxxxxx | Nilai Limit: Rpxxx.xxx.xxx
3. Tanah Kavling | Preferensi: 0.xxxxxx | Nilai Limit: Rpxxx.xxx.xxx
```

Ulangi format ranking untuk kategori Kendaraan dan Elektronik.

---

## Pengujian yang Harus Dilakukan AI Agent

### 1. Pengujian Database

Pastikan setelah seed dijalankan:

- Terdapat 3 kategori.
- Terdapat 20 kriteria total:
  - 7 kriteria tanah dan bangunan
  - 7 kriteria kendaraan
  - 6 kriteria elektronik
- Terdapat 9 aset.
- Setiap aset memiliki nilai kriteria lengkap.
- Setiap aset memiliki hasil nilai preferensi dan nilai limit.

Buat query validasi menggunakan Prisma atau SQL dan tampilkan hasilnya di terminal.

---

### 2. Pengujian Perhitungan SAW

Validasi per kategori:

1. Hitung nilai maksimum dan minimum setiap kriteria.
2. Hitung normalisasi benefit/cost.
3. Hitung nilai preferensi.
4. Hitung nilai limit.
5. Bandingkan hasil yang dihitung script dengan data yang tersimpan di database.
6. Selisih harus 0 atau sangat kecil karena pembulatan.

Tampilkan log:

```text
Validasi SAW: BERHASIL
Selisih maksimum: 0.000001
```

---

### 3. Pengujian Tampilan Web

Setelah seed berhasil, jalankan sistem:

```bash
npm run dev
```

Lalu buka frontend dan pastikan data muncul pada halaman:

1. Daftar kategori.
2. Daftar kriteria.
3. Daftar aset.
4. Detail aset.
5. Nilai kriteria aset.
6. Hasil perhitungan.
7. Ranking atau nilai limit.

Jika halaman tertentu belum tersedia, catat sebagai keterbatasan implementasi dan jangan menghapus data uji.

---

## Checklist Screenshot untuk Artikel Jurnal

Ambil screenshot berikut untuk kebutuhan artikel:

- Screenshot 1: Halaman login/admin dashboard.
- Screenshot 2: Halaman daftar kategori.
- Screenshot 3: Halaman daftar kriteria per kategori.
- Screenshot 4: Halaman daftar aset uji.
- Screenshot 5: Halaman detail aset dan nilai kriteria.
- Screenshot 6: Halaman hasil nilai preferensi dan nilai limit.
- Screenshot 7: Terminal log saat seed berhasil dijalankan.
- Screenshot 8: Terminal log validasi SAW berhasil.

Simpan screenshot dengan nama file:

```text
01_dashboard.png
02_kategori.png
03_kriteria.png
04_aset.png
05_detail_aset.png
06_hasil_perhitungan.png
07_terminal_seed.png
08_terminal_validasi.png
```

---

## Output Tambahan yang Harus Dibuat

Selain seed script, buat file dokumentasi hasil pengujian:

```bash
backend/prisma/hasil_pengujian_jurnal.md
```

Isi file tersebut dengan:

1. Tanggal pengujian.
2. Jumlah kategori.
3. Jumlah kriteria.
4. Jumlah aset.
5. Tabel hasil nilai preferensi.
6. Tabel hasil nilai limit.
7. Ranking tiap kategori.
8. Status validasi database.
9. Status validasi SAW.
10. Catatan error jika ada.

Format tabel contoh:

```markdown
| Kategori | Aset | Harga Pasar | Nilai Preferensi | Nilai Limit | Ranking |
|---|---|---:|---:|---:|---:|
| Kendaraan | Toyota Avanza 2019 | 165000000 | 0.xxxxxx | 0 | 1 |
```

---

## Kriteria Keberhasilan

Pengujian dianggap berhasil jika:

1. Script seed dapat dijalankan tanpa error.
2. Data kategori, kriteria, aset, nilai kriteria, bobot, dan hasil tersimpan ke database.
3. Terminal menampilkan log lengkap.
4. Data muncul pada tampilan web.
5. Nilai preferensi dan nilai limit berhasil dihitung.
6. Ranking setiap kategori berhasil ditampilkan.
7. Hasil perhitungan dapat dibandingkan dengan Excel/manual.
8. Dokumentasi hasil pengujian berhasil dibuat.

---

## Catatan Keamanan

1. Jangan menjalankan seed ini pada database produksi.
2. Gunakan database lokal/testing.
3. Script boleh membersihkan data uji hanya untuk kategori:
   - Tanah dan Bangunan
   - Kendaraan
   - Elektronik
4. Jangan menghapus data user asli jika ada.
5. Jangan menghapus tabel secara keseluruhan kecuali diminta eksplisit.

---

## Catatan Akademik untuk Artikel

Data ini akan digunakan dalam artikel jurnal dengan narasi berikut:

> Pengujian dilakukan menggunakan sembilan data aset uji yang terdiri atas tiga aset tanah dan bangunan, tiga aset kendaraan, dan tiga aset elektronik. Setiap aset dinilai menggunakan skala 1 sampai 5 berdasarkan kriteria yang telah ditentukan pada masing-masing kategori. Bobot kriteria diperoleh melalui pendekatan predefined AHP weighting, sedangkan nilai preferensi dan nilai limit dihitung menggunakan metode SAW. Hasil pengujian digunakan untuk memvalidasi bahwa sistem mampu melakukan proses input data, normalisasi nilai, perhitungan preferensi, penentuan nilai limit, dan pemeringkatan aset secara otomatis.

---

## Instruksi Akhir untuk AI Agent

Lakukan pekerjaan secara bertahap:

1. Baca struktur repository.
2. Baca schema Prisma.
3. Buat seed script sesuai struktur database aktual.
4. Tambahkan script ke package.json.
5. Jalankan seed.
6. Perbaiki error jika ada.
7. Validasi data di database.
8. Validasi perhitungan SAW.
9. Pastikan data muncul di web.
10. Buat dokumentasi hasil pengujian Markdown.
11. Berikan ringkasan file yang dibuat/diubah.
12. Berikan daftar screenshot yang harus diambil oleh peneliti.

Jangan mengubah arsitektur besar sistem. Fokus hanya pada pembuatan data uji, seed database, validasi perhitungan, dan dokumentasi kebutuhan jurnal.
