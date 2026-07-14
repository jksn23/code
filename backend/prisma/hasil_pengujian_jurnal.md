# Hasil Pengujian Data Uji Jurnal AHP-SAW

Tanggal pengujian: 20 Juni 2026 pukul 20.34

## File yang Dibuat atau Diubah
- backend/prisma/seed_data_jurnal.js
- backend/package.json
- backend/prisma/hasil_pengujian_jurnal.md

## Ringkasan Data Uji
- Jumlah kategori: 3
- Jumlah kriteria: 20
- Jumlah aset: 9
- Jumlah nilai kriteria aset: 60
- Jumlah bobot AHP: 20
- Jumlah hasil perhitungan: 9

## Tabel Kategori
| No | Kategori |
|---:|---|
| 1 | Tanah dan Bangunan |
| 2 | Kendaraan |
| 3 | Elektronik |

## Tabel Kriteria dan Bobot
| Kategori | Kriteria | Tipe | Bobot |
|---|---|---|---:|
| Tanah dan Bangunan | Lokasi dan Aksesibilitas | benefit | 0.25 |
| Tanah dan Bangunan | Legalitas | benefit | 0.20 |
| Tanah dan Bangunan | Luas | benefit | 0.15 |
| Tanah dan Bangunan | Kondisi Fisik | benefit | 0.12 |
| Tanah dan Bangunan | Fasilitas Sekitar | benefit | 0.10 |
| Tanah dan Bangunan | Lingkungan dan Risiko | cost | 0.10 |
| Tanah dan Bangunan | Potensi Pengembangan | benefit | 0.08 |
| Kendaraan | Kondisi Mesin | benefit | 0.25 |
| Kendaraan | Performa | benefit | 0.18 |
| Kendaraan | Kilometer | cost | 0.15 |
| Kendaraan | Tahun Produksi | benefit | 0.12 |
| Kendaraan | Riwayat Kendaraan | benefit | 0.10 |
| Kendaraan | Merek atau Model | benefit | 0.10 |
| Kendaraan | Kondisi Fisik | benefit | 0.10 |
| Elektronik | Kondisi Barang | benefit | 0.25 |
| Elektronik | Spesifikasi Teknis | benefit | 0.20 |
| Elektronik | Performa atau Fungsi | benefit | 0.18 |
| Elektronik | Usia Pemakaian | cost | 0.15 |
| Elektronik | Merek | benefit | 0.12 |
| Elektronik | Kelengkapan | benefit | 0.10 |

## Tabel Aset dan Harga Pasar
| Kategori | Kode | Aset | Harga Pasar |
|---|---|---|---:|
| Tanah dan Bangunan | TB01 | Rumah Tipe 45/90 | 450000000 |
| Tanah dan Bangunan | TB02 | Ruko 2 Lantai | 850000000 |
| Tanah dan Bangunan | TB03 | Tanah Kavling | 300000000 |
| Kendaraan | KD01 | Toyota Avanza 2019 | 165000000 |
| Kendaraan | KD02 | Honda Beat 2021 | 14000000 |
| Kendaraan | KD03 | Mitsubishi Xpander 2018 | 185000000 |
| Elektronik | EL01 | Laptop Lenovo ThinkPad 2021 | 6500000 |
| Elektronik | EL02 | iPhone 12 128GB | 5800000 |
| Elektronik | EL03 | Kamera Canon EOS 700D | 4000000 |

## Tabel Nilai Preferensi dan Nilai Limit
| Kategori | Aset | Harga Pasar | Nilai Preferensi | Nilai Limit | Ranking |
|---|---|---:|---:|---:|---:|
| Tanah dan Bangunan | Ruko 2 Lantai | 850000000 | 0.984000 | 836400000.00 | 1 |
| Tanah dan Bangunan | Rumah Tipe 45/90 | 450000000 | 0.860500 | 387225000.00 | 2 |
| Tanah dan Bangunan | Tanah Kavling | 300000000 | 0.756667 | 227000000.00 | 3 |
| Kendaraan | Honda Beat 2021 | 14000000 | 0.944000 | 13216000.00 | 1 |
| Kendaraan | Toyota Avanza 2019 | 165000000 | 0.890000 | 146850000.00 | 2 |
| Kendaraan | Mitsubishi Xpander 2018 | 185000000 | 0.852000 | 157620000.00 | 3 |
| Elektronik | Laptop Lenovo ThinkPad 2021 | 6500000 | 1.000000 | 6500000.00 | 1 |
| Elektronik | iPhone 12 128GB | 5800000 | 0.975000 | 5655000.00 | 2 |
| Elektronik | Kamera Canon EOS 700D | 4000000 | 0.826000 | 3304000.00 | 3 |

## Ranking Per Kategori
### Tanah dan Bangunan
1. Ruko 2 Lantai - Preferensi 0.984000 - Nilai Limit Rp836.400.000
2. Rumah Tipe 45/90 - Preferensi 0.860500 - Nilai Limit Rp387.225.000
3. Tanah Kavling - Preferensi 0.756667 - Nilai Limit Rp227.000.000

### Kendaraan
1. Honda Beat 2021 - Preferensi 0.944000 - Nilai Limit Rp13.216.000
2. Toyota Avanza 2019 - Preferensi 0.890000 - Nilai Limit Rp146.850.000
3. Mitsubishi Xpander 2018 - Preferensi 0.852000 - Nilai Limit Rp157.620.000

### Elektronik
1. Laptop Lenovo ThinkPad 2021 - Preferensi 1.000000 - Nilai Limit Rp6.500.000
2. iPhone 12 128GB - Preferensi 0.975000 - Nilai Limit Rp5.655.000
3. Kamera Canon EOS 700D - Preferensi 0.826000 - Nilai Limit Rp3.304.000

## Cara Menjalankan Seed
```bash
cd backend
npm install
npx prisma generate
npm run seed:jurnal
```

## Status Validasi
- Validasi database: BERHASIL
- Validasi SAW: BERHASIL
- Selisih maksimum perhitungan SAW vs database: 0.000000

## Checklist Screenshot Artikel Jurnal
- [ ] 01_dashboard.png - Halaman login/admin dashboard
- [ ] 02_kategori.png - Halaman daftar kategori
- [ ] 03_kriteria.png - Halaman daftar kriteria per kategori
- [ ] 04_aset.png - Halaman daftar aset uji
- [ ] 05_detail_aset.png - Halaman detail aset dan nilai kriteria
- [ ] 06_hasil_perhitungan.png - Halaman hasil nilai preferensi dan nilai limit
- [ ] 07_terminal_seed.png - Terminal log saat seed berhasil dijalankan
- [ ] 08_terminal_validasi.png - Terminal log validasi SAW berhasil

## Catatan
- Seed membersihkan ulang hanya aset uji jurnal berdasarkan nama aset wajib, beserta nilai, hasil, lelang, dan penawaran yang terkait aset tersebut.
- Script tidak menjalankan reset database dan tidak menghapus user, admin, atau data lain di luar aset uji jurnal.
- Jika halaman web tertentu belum tersedia, gunakan endpoint API kategori, kriteria, aset, dan hasil SPK sebagai bukti data tersimpan.
