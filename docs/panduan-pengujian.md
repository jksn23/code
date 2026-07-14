Gunakan prompt berikut pada AI Agent yang memiliki akses ke repository GitHub dan terminal proyek.

````markdown
Anda bertindak sebagai Senior Backend Engineer, Database Engineer, dan Software Tester.

Kerjakan langsung pada repository:

https://github.com/jksn23/code

Branch target:

feature/penilaian-penjual

Tujuan utama pekerjaan adalah memperbaiki alur pembobotan AHP, harga referensi median, perhitungan ulang SAW, penyimpanan hasil, serta membuat dan menjalankan pengujian sampai seluruh proses dinyatakan valid.

Jangan hanya memberikan saran. Lakukan inspeksi kode, implementasi perubahan, migrasi database jika diperlukan, pembuatan script, dan pengujian.

## 1. Persiapan

1. Clone atau buka repository yang tersedia.
2. Checkout branch `feature/penilaian-penjual`.
3. Jangan bekerja pada branch `master`.
4. Pelajari seluruh struktur backend dan frontend yang berkaitan dengan:
   - kategori;
   - kriteria;
   - bobot AHP;
   - aset;
   - nilai aset;
   - data pembanding;
   - harga pasar;
   - hasil SAW;
   - nilai limit;
   - penilaian penjual;
   - validasi admin;
   - audit log.
5. Baca minimal file:
   - `backend/prisma/schema.prisma`
   - `backend/prisma/seed_data_jurnal.js`
   - `backend/src/services/ahp.service.js`
   - `backend/src/services/saw.service.js`
   - `backend/src/services/pembanding.service.js`
   - `backend/src/controllers/spk.controller.js`
   - `backend/src/controllers/pembanding.controller.js`
   - seluruh route terkait
   - seluruh test terkait.
6. Jangan melakukan reset database.
7. Jangan menghapus data user, penjual, pembeli, lelang, pembayaran, atau penawaran.
8. Sebelum perubahan database, buat backup atau tampilkan perintah backup yang harus dijalankan.
9. Jangan melakukan commit atau push sebelum seluruh pengujian lulus.
10. Jangan mengarang bobot Group AHP yang belum tersedia.

## 2. Masalah yang harus diperbaiki

Saat ini terdapat potensi inkonsistensi:

1. Service SAW menghitung:
   `nilaiLimit = nilaiPreferensi × aset.hargaPasar`.
2. Endpoint median menyimpan median pada:
   `hasil.hargaReferensiPasar`.
3. Endpoint median belum selalu memperbarui:
   `aset.hargaPasar`.
4. Controller SAW menghapus hasil lama dan membuat hasil baru, tetapi belum menyimpan `hargaReferensiPasar`.
5. Jika median dihitung lebih dahulu, kemudian SAW dijalankan ulang, nilai limit dapat kembali memakai harga lama.
6. Controller mengambil bobot terbaru setiap kriteria secara terpisah berdasarkan `createdAt`, sehingga ada risiko bobot berasal dari versi yang berbeda.
7. Tabel bobot belum memiliki pengelolaan versi yang kuat.
8. Script seed masih memakai bobot provisional dan `CR_STATIS = 0`.

Perbaiki seluruh masalah tersebut.

## 3. Desain sumber harga referensi

Tentukan satu sumber utama harga aktif.

Gunakan desain berikut:

- `Aset.hargaPasar` menjadi harga referensi aktif yang digunakan oleh service SAW.
- Ketika median pembanding selesai dihitung, median harus disimpan ke:
  - `Aset.hargaPasar`;
  - `Hasil.hargaReferensiPasar`, jika hasil sudah tersedia.
- Ketika SAW dihitung ulang, controller harus menyimpan:
  - `nilaiPreferensi`;
  - `hargaReferensiPasar`;
  - `nilaiLimit`.
- `Hasil.hargaReferensiPasar` menjadi snapshot harga yang digunakan saat perhitungan dilakukan.
- `Aset.limitValue` harus sama dengan `Hasil.nilaiLimit`.

Pastikan relasi berikut selalu konsisten:

`Aset.hargaPasar = Hasil.hargaReferensiPasar`

`Hasil.nilaiLimit = Hasil.nilaiPreferensi × Hasil.hargaReferensiPasar`

`Aset.limitValue = Hasil.nilaiLimit`

Lakukan pembulatan nilai limit maksimal dua angka desimal.

## 4. Perbaikan endpoint median

Perbaiki `hitungMedian` agar:

1. Hanya memakai data pembanding yang:
   - dipilih penjual;
   - tidak berstatus `DITOLAK`.
2. Minimal terdapat tiga pembanding.
3. Outlier diproses secara eksplisit dan hasil penyaringannya dapat diaudit.
4. Menghitung median dari harga yang telah lolos penyaringan.
5. Melakukan update dalam satu transaksi:
   - `Aset.hargaPasar = median`;
   - `Hasil.hargaReferensiPasar = median`, jika hasil ada;
   - hitung ulang `Hasil.nilaiLimit` jika nilai preferensi sudah tersedia;
   - `Aset.limitValue = nilaiLimit`.
6. Jangan membuat record `Hasil` dengan nilai preferensi nol secara diam-diam.
7. Jika SAW belum pernah dihitung, cukup simpan median ke `Aset.hargaPasar` dan kembalikan pesan bahwa SAW perlu dijalankan.
8. Response API harus menampilkan:
   - jumlah pembanding dipilih;
   - harga sebelum penyaringan;
   - harga setelah penyaringan;
   - median;
   - jumlah data yang dianggap outlier;
   - status apakah nilai limit ikut diperbarui.

## 5. Perbaikan perhitungan SAW

Perbaiki `spk.controller.js` agar:

1. Mengambil semua aset dalam kategori.
2. Memastikan setiap aset memiliki nilai seluruh kriteria.
3. Memastikan seluruh harga pasar lebih besar dari nol.
4. Mengambil satu versi bobot aktif yang sama untuk seluruh kriteria.
5. Memvalidasi:
   - seluruh kriteria memiliki bobot;
   - total bobot sama dengan 1 dalam toleransi `0.000001`;
   - CR tidak lebih dari 0,10;
   - jumlah bobot sesuai jumlah kriteria.
6. Menjalankan SAW:
   - benefit: `xij / max xj`;
   - cost: `min xj / xij`;
   - preferensi: jumlah `wj × rij`;
   - nilai limit: preferensi × harga pasar.
7. Menghapus atau mengganti hasil lama hanya untuk kategori yang dihitung.
8. Menyimpan dalam satu transaksi:
   - `nilaiPreferensi`;
   - `hargaReferensiPasar = aset.hargaPasar`;
   - `nilaiLimit`;
   - `Aset.limitValue`.
9. Jika salah satu tahap gagal, seluruh transaksi harus rollback.
10. Response harus menyertakan:
    - bobot yang digunakan;
    - versi bobot;
    - CR;
    - max dan min per kriteria;
    - matriks normalisasi;
    - kontribusi setiap kriteria;
    - preferensi;
    - harga referensi;
    - nilai limit;
    - ranking.

## 6. Implementasi versi bobot AHP

Lakukan analisis skema terlebih dahulu.

Implementasikan mekanisme versi bobot yang aman. Desain yang disarankan:

### Model `BobotVersion`

Field minimal:

- `id`
- `kategoriId`
- `namaVersi`
- `jumlahPakar`
- `lambdaMax`
- `ci`
- `ri`
- `cr`
- `tanggalValidasi`
- `aktif`
- `catatan`
- `createdAt`
- `updatedAt`

### Model `BobotAHP`

Tambahkan relasi:

- `versionId`
- `kriteriaId`
- `bobot`

Ketentuan:

1. Hanya boleh ada satu versi aktif per kategori.
2. Semua bobot yang digunakan SAW harus berasal dari satu `versionId`.
3. Total bobot satu versi harus sama dengan 1.
4. CR versi aktif harus `<= 0.10`.
5. Versi lama jangan dihapus.
6. Saat versi baru diaktifkan, versi lama dinonaktifkan dalam satu transaksi.
7. Jangan memakai `orderBy createdAt take 1` per kriteria sebagai mekanisme pemilihan bobot.
8. Buat migrasi Prisma yang aman.
9. Perbarui seed, controller, service, query, dan test yang terpengaruh.

Jika perubahan skema besar berisiko merusak data lama, buat migrasi bertahap dan dokumentasikan strategi migrasinya.

## 7. Script penerapan bobot final dan median

Buat file:

`backend/scripts/apply_final_weights_medians_and_recalculate.js`

Script harus mendukung:

- `DRY_RUN=true`
- `DRY_RUN=false`

Script harus:

1. Memuat konfigurasi bobot final per kategori.
2. Memuat CR, lambda max, CI, RI, dan jumlah pakar.
3. Menolak eksekusi jika ada bobot `null`.
4. Menolak eksekusi jika total bobot tidak sama dengan 1.
5. Menolak eksekusi jika CR > 0,10.
6. Memastikan nama kategori dan kriteria ditemukan.
7. Membuat versi bobot baru.
8. Menonaktifkan versi sebelumnya.
9. Memperbarui sembilan median berikut:

   - Rumah Tipe 45/90: 690000000
   - Ruko 2 Lantai: 1800000000
   - Tanah Kavling: 250000000
   - Toyota Avanza 2019: 150000000
   - Honda Beat 2021: 12900000
   - Mitsubishi Xpander 2018: 179000000
   - Laptop Lenovo ThinkPad 2021: 5850000
   - iPhone 12 128GB: 5800000
   - Kamera Canon EOS 700D: 3300000

10. Menghitung ulang SAW untuk tiga kategori.
11. Menyimpan seluruh hasil dalam satu transaksi.
12. Tidak menghapus data di luar sembilan aset penelitian.
13. Menghasilkan laporan terminal yang mudah disimpan sebagai bukti penelitian.
14. Menghasilkan file Markdown hasil pengujian berisi:
    - versi bobot;
    - CR;
    - bobot setiap kriteria;
    - median harga;
    - nilai preferensi;
    - nilai limit;
    - ranking;
    - hasil validasi database;
    - selisih perhitungan.

Jangan isi bobot final dengan angka asumsi. Buat placeholder tervalidasi yang menyebabkan script berhenti sampai bobot asli dimasukkan.

## 8. Perbarui script seed jurnal

Perbaiki `seed_data_jurnal.js` agar:

1. Tidak lagi menggunakan `CR_STATIS = 0`.
2. Tidak menyebut bobot provisional sebagai bobot final.
3. Tidak menghapus seluruh riwayat bobot.
4. Menggunakan versi bobot aktif.
5. Mendukung mode:
   - data demo;
   - data penelitian final.
6. Memberi peringatan keras jika konfigurasi final belum lengkap.
7. Menggunakan median terbaru.
8. Menyimpan `hargaReferensiPasar`.
9. Menyimpan dan memperbarui `Aset.limitValue`.
10. Menjaga idempotensi: dijalankan dua kali tidak menghasilkan duplikasi.

## 9. Validasi data pembanding

Perbaiki validasi pembanding manual:

1. Jangan otomatis memberikan skor kecocokan 100 tanpa pemeriksaan.
2. Tambahkan validasi field wajib:
   - judul;
   - sumber;
   - URL;
   - harga > 0;
   - tanggal atau waktu pengambilan;
   - spesifikasi.
3. Validasi URL.
4. Cegah duplikasi berdasarkan kombinasi:
   - aset;
   - URL;
   - harga.
5. Data manual tetap harus memiliki status `MENUNGGU` sebelum disetujui admin.
6. Median final hanya memakai data:
   - dipilih penjual;
   - berstatus `DITERIMA`.
7. Jangan lagi menerima status `MENUNGGU` untuk median final.
8. Jika diperlukan untuk mode demo, pisahkan perilaku demo dari mode penelitian.

## 10. Pengujian unit

Tambahkan atau perbarui pengujian untuk kasus berikut:

### AHP

1. Total bobot sama dengan 1.
2. Bobot tidak boleh negatif.
3. CR <= 0,10 diterima.
4. CR > 0,10 ditolak.
5. Satu versi bobot aktif per kategori.
6. SAW tidak boleh mencampur bobot dari versi berbeda.

### SAW

1. Normalisasi benefit benar.
2. Normalisasi cost benar.
3. Preferensi sama dengan jumlah kontribusi.
4. Ranking urut menurun.
5. Nilai limit sama dengan preferensi × harga referensi.
6. Nilai nol pada cost ditangani dengan aman.
7. Kriteria kosong menghasilkan error.
8. Nilai aset belum lengkap menghasilkan error.
9. Bobot total bukan 1 menghasilkan error.
10. Harga pasar nol atau negatif menghasilkan error.

### Median

1. Median jumlah data ganjil.
2. Median jumlah data genap.
3. Minimal tiga pembanding.
4. Outlier IQR terdeteksi.
5. Data `DITOLAK` tidak digunakan.
6. Data `MENUNGGU` tidak digunakan untuk final.
7. Setelah median dihitung, `Aset.hargaPasar` berubah.
8. Jika hasil tersedia, `Hasil.hargaReferensiPasar` dan nilai limit berubah.
9. Jika hasil belum tersedia, tidak membuat hasil dummy preferensi nol.

## 11. Pengujian integrasi

Buat pengujian integrasi untuk alur:

1. Buat atau gunakan satu kategori uji.
2. Buat kriteria benefit dan cost.
3. Buat versi bobot aktif.
4. Buat minimal tiga aset.
5. Isi nilai kriteria lengkap.
6. Tambahkan lima pembanding per aset.
7. Validasi pembanding.
8. Pilih pembanding.
9. Hitung median.
10. Jalankan SAW.
11. Ambil hasil.
12. Verifikasi seluruh nilai.

Pastikan pengujian menggunakan database test atau transaksi yang di-rollback.

## 12. Perintah pengujian yang wajib dijalankan

Jalankan:

```bash
cd backend
npm install
npx prisma generate
npm test
````

Tambahkan script baru pada `package.json`, misalnya:

```json
"test:final": "node src/tests/test_final_ahp_saw.js",
"apply:final": "node scripts/apply_final_weights_medians_and_recalculate.js"
```

Lalu jalankan:

```bash
npm run test:final
```

Jalankan dry run:

Linux atau Git Bash:

```bash
DRY_RUN=true npm run apply:final
```

PowerShell:

```powershell
$env:DRY_RUN="true"
npm run apply:final
```

Jangan menjalankan mode penulisan jika bobot final belum diisi.

Setelah bobot asli tersedia, jalankan pada database development:

```bash
DRY_RUN=false npm run apply:final
```

## 13. Pengujian API

Jalankan backend:

```bash
npm run dev
```

Periksa:

```bash
curl http://localhost:5000/health
```

Ambil kategori:

```bash
curl http://localhost:5000/api/kategori
```

Jalankan SAW untuk setiap kategori menggunakan ID aktual:

```bash
curl -X POST http://localhost:5000/api/spk/hitung-saw \
  -H "Content-Type: application/json" \
  -d '{"kategori_id":ID_KATEGORI}'
```

Ambil hasil:

```bash
curl http://localhost:5000/api/spk/hasil/ID_KATEGORI
```

Untuk endpoint yang memerlukan autentikasi, gunakan token penjual atau admin yang valid. Jangan menonaktifkan middleware autentikasi hanya agar test berhasil.

## 14. Validasi SQL

Jalankan query untuk memastikan:

1. Satu versi bobot aktif per kategori.
2. Total bobot setiap kategori = 1.
3. CR setiap versi aktif <= 0,10.
4. Jumlah bobot:

   * Tanah dan Bangunan = 7;
   * Kendaraan = 7;
   * Elektronik = 6.
5. `aset.harga_pasar = hasil.harga_referensi_pasar`.
6. `hasil.nilai_limit = hasil.nilai_preferensi × hasil.harga_referensi_pasar`.
7. `aset.limit_value = hasil.nilai_limit`.
8. Terdapat tepat satu hasil aktif per aset.
9. Tidak ada hasil dengan harga referensi null.
10. Tidak ada bobot provisional yang aktif.

## 15. Acceptance criteria

Pekerjaan dinyatakan selesai hanya jika:

* seluruh test lama tetap lulus;
* seluruh test baru lulus;
* migrasi Prisma berhasil;
* tidak ada reset database;
* dry run tidak mengubah database;
* transaksi rollback ketika terjadi error;
* bobot dari versi berbeda tidak tercampur;
* total bobot setiap kategori = 1;
* CR <= 0,10;
* median tersimpan konsisten;
* perhitungan SAW menghasilkan ranking;
* harga referensi tersimpan pada hasil;
* nilai limit konsisten sampai dua desimal;
* endpoint median dan endpoint SAW tidak saling menimpa dengan harga lama;
* tidak ada placeholder bobot yang secara tidak sengaja dianggap final;
* dokumentasi penggunaan telah diperbarui.

## 16. Output akhir yang harus diberikan

Setelah selesai, tampilkan:

1. Ringkasan analisis arsitektur.
2. Daftar file yang diubah.
3. Daftar file baru.
4. Penjelasan migrasi database.
5. Penjelasan perubahan alur harga median.
6. Penjelasan perubahan versi bobot.
7. Hasil setiap test.
8. Hasil dry run.
9. Hasil validasi SQL.
10. Contoh response API final.
11. Risiko yang masih tersisa.
12. Perintah untuk rollback.
13. Diff penting dari setiap file.
14. Status akhir:

    * LULUS;
    * LULUS DENGAN CATATAN;
    * atau GAGAL.
15. Jangan menyatakan LULUS jika bobot Group AHP final belum dimasukkan. Dalam kondisi tersebut, nyatakan:
    “IMPLEMENTASI DAN PENGUJIAN STRUKTUR LULUS, EKSEKUSI DATA FINAL MENUNGGU BOBOT GROUP AHP.”

Jangan berhenti hanya karena menemukan masalah. Perbaiki masalah, jalankan ulang pengujian, dan dokumentasikan hasil akhirnya.

```
```
