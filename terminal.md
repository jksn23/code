
up to date, audited 159 packages in 1m

33 packages are looking for funding
  run `npm fund` for details

5 moderate severity vulnerabilities

To address all issues, run:
  npm audit fix

Run `npm audit` for details.
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": MySQL database "db_lelang_spk" at "localhost:3306"

The database is already in sync with the Prisma schema.

Running generate... (Use --skip-generate to skip the generators)
[2K[1A[2K[GRunning generate... - Prisma Client
[2K[1A[2K[GEPERM: operation not permitted, rename 'C:\Users\McCrazy\Documents\kampus\TA\cod
e\backend\node_modules\.prisma\client\query_engine-windows.dll.node.tmp30368' ->
 'C:\Users\McCrazy\Documents\kampus\TA\code\backend\node_modules\.prisma\client\
query_engine-windows.dll.node'

⚠️ Akun Admin sudah ada di database.

> backend-lelang-spk@1.0.0 seed:jurnal
> node prisma/seed_data_jurnal.js

========================================
SEED DATA UJI JURNAL AHP-SAW LELANG
========================================

[1] Membersihkan data uji lama...
Tidak ada aset uji jurnal lama yang perlu dibersihkan.
Data uji lama berhasil dibersihkan. Aset: 0, Nilai: 0, Hasil: 0, Lelang: 0, Penawaran: 0

[2] Membuat kategori: Tanah dan Bangunan
Kategori berhasil dibuat/diperbarui. ID: 8

Kriteria:
- Lokasi dan Aksesibilitas | benefit | bobot 0.25
- Legalitas | benefit | bobot 0.20
- Luas | benefit | bobot 0.15
- Kondisi Fisik | benefit | bobot 0.12
- Fasilitas Sekitar | benefit | bobot 0.10
- Lingkungan dan Risiko | cost | bobot 0.10
- Potensi Pengembangan | benefit | bobot 0.08

Aset:
- Rumah Tipe 45/90
  Kode: TB01
  Harga Pasar: Rp450.000.000
  Nilai Kriteria:
  - Lokasi dan Aksesibilitas: 4
  - Legalitas: 5
  - Luas: 3
  - Kondisi Fisik: 4
  - Fasilitas Sekitar: 4
  - Lingkungan dan Risiko: 2
  - Potensi Pengembangan: 3
- Ruko 2 Lantai
  Kode: TB02
  Harga Pasar: Rp850.000.000
  Nilai Kriteria:
  - Lokasi dan Aksesibilitas: 5
  - Legalitas: 5
  - Luas: 4
  - Kondisi Fisik: 4
  - Fasilitas Sekitar: 5
  - Lingkungan dan Risiko: 2
  - Potensi Pengembangan: 4
- Tanah Kavling
  Kode: TB03
  Harga Pasar: Rp300.000.000
  Nilai Kriteria:
  - Lokasi dan Aksesibilitas: 3
  - Legalitas: 4
  - Luas: 4
  - Kondisi Fisik: 3
  - Fasilitas Sekitar: 3
  - Lingkungan dan Risiko: 3
  - Potensi Pengembangan: 5

Hasil perhitungan kategori Tanah dan Bangunan:
- Ruko 2 Lantai
  Nilai Preferensi: 0.984000
  Nilai Limit: Rp836.400.000
- Rumah Tipe 45/90
  Nilai Preferensi: 0.860500
  Nilai Limit: Rp387.225.000
- Tanah Kavling
  Nilai Preferensi: 0.756667
  Nilai Limit: Rp227.000.000

Ranking kategori Tanah dan Bangunan:
1. Ruko 2 Lantai | Preferensi: 0.984000 | Nilai Limit: Rp836.400.000
2. Rumah Tipe 45/90 | Preferensi: 0.860500 | Nilai Limit: Rp387.225.000
3. Tanah Kavling | Preferensi: 0.756667 | Nilai Limit: Rp227.000.000

[3] Membuat kategori: Kendaraan
Kategori berhasil dibuat/diperbarui. ID: 9

Kriteria:
- Kondisi Mesin | benefit | bobot 0.25
- Performa | benefit | bobot 0.18
- Kilometer | cost | bobot 0.15
- Tahun Produksi | benefit | bobot 0.12
- Riwayat Kendaraan | benefit | bobot 0.10
- Merek atau Model | benefit | bobot 0.10
- Kondisi Fisik | benefit | bobot 0.10

Aset:
- Toyota Avanza 2019
  Kode: KD01
  Harga Pasar: Rp165.000.000
  Nilai Kriteria:
  - Kondisi Mesin: 4
  - Performa: 4
  - Kilometer: 3
  - Tahun Produksi: 4
  - Riwayat Kendaraan: 4
  - Merek atau Model: 5
  - Kondisi Fisik: 4
- Honda Beat 2021
  Kode: KD02
  Harga Pasar: Rp14.000.000
  Nilai Kriteria:
  - Kondisi Mesin: 4
  - Performa: 4
  - Kilometer: 2
  - Tahun Produksi: 5
  - Riwayat Kendaraan: 4
  - Merek atau Model: 4
  - Kondisi Fisik: 4
- Mitsubishi Xpander 2018
  Kode: KD03
  Harga Pasar: Rp185.000.000
  Nilai Kriteria:
  - Kondisi Mesin: 4
  - Performa: 5
  - Kilometer: 4
  - Tahun Produksi: 3
  - Riwayat Kendaraan: 3
  - Merek atau Model: 5
  - Kondisi Fisik: 4

Hasil perhitungan kategori Kendaraan:
- Honda Beat 2021
  Nilai Preferensi: 0.944000
  Nilai Limit: Rp13.216.000
- Toyota Avanza 2019
  Nilai Preferensi: 0.890000
  Nilai Limit: Rp146.850.000
- Mitsubishi Xpander 2018
  Nilai Preferensi: 0.852000
  Nilai Limit: Rp157.620.000

Ranking kategori Kendaraan:
1. Honda Beat 2021 | Preferensi: 0.944000 | Nilai Limit: Rp13.216.000
2. Toyota Avanza 2019 | Preferensi: 0.890000 | Nilai Limit: Rp146.850.000
3. Mitsubishi Xpander 2018 | Preferensi: 0.852000 | Nilai Limit: Rp157.620.000

[4] Membuat kategori: Elektronik
Kategori berhasil dibuat/diperbarui. ID: 10

Kriteria:
- Kondisi Barang | benefit | bobot 0.25
- Spesifikasi Teknis | benefit | bobot 0.20
- Performa atau Fungsi | benefit | bobot 0.18
- Usia Pemakaian | cost | bobot 0.15
- Merek | benefit | bobot 0.12
- Kelengkapan | benefit | bobot 0.10

Aset:
- Laptop Lenovo ThinkPad 2021
  Kode: EL01
  Harga Pasar: Rp6.500.000
  Nilai Kriteria:
  - Kondisi Barang: 4
  - Spesifikasi Teknis: 4
  - Performa atau Fungsi: 4
  - Usia Pemakaian: 3
  - Merek: 5
  - Kelengkapan: 4
- iPhone 12 128GB
  Kode: EL02
  Harga Pasar: Rp5.800.000
  Nilai Kriteria:
  - Kondisi Barang: 4
  - Spesifikasi Teknis: 4
  - Performa atau Fungsi: 4
  - Usia Pemakaian: 3
  - Merek: 5
  - Kelengkapan: 3
- Kamera Canon EOS 700D
  Kode: EL03
  Harga Pasar: Rp4.000.000
  Nilai Kriteria:
  - Kondisi Barang: 3
  - Spesifikasi Teknis: 3
  - Performa atau Fungsi: 4
  - Usia Pemakaian: 4
  - Merek: 4
  - Kelengkapan: 4

Hasil perhitungan kategori Elektronik:
- Laptop Lenovo ThinkPad 2021
  Nilai Preferensi: 1.000000
  Nilai Limit: Rp6.500.000
- iPhone 12 128GB
  Nilai Preferensi: 0.975000
  Nilai Limit: Rp5.655.000
- Kamera Canon EOS 700D
  Nilai Preferensi: 0.826000
  Nilai Limit: Rp3.304.000

Ranking kategori Elektronik:
1. Laptop Lenovo ThinkPad 2021 | Preferensi: 1.000000 | Nilai Limit: Rp6.500.000
2. iPhone 12 128GB | Preferensi: 0.975000 | Nilai Limit: Rp5.655.000
3. Kamera Canon EOS 700D | Preferensi: 0.826000 | Nilai Limit: Rp3.304.000

[5] Validasi database...
Kategori: 3/3
Kriteria: 20/20
Bobot AHP: 20/20
Aset: 9/9
Nilai kriteria aset: 60/60
Hasil perhitungan: 9/9
Validasi database: BERHASIL

[6] Validasi SAW...
Validasi SAW: BERHASIL
Selisih maksimum: 0.000000

[7] Dokumentasi hasil pengujian dibuat: C:\Users\McCrazy\Documents\kampus\TA\code\backend\prisma\hasil_pengujian_jurnal.md

========================================
SEED DATA UJI JURNAL SELESAI
========================================
