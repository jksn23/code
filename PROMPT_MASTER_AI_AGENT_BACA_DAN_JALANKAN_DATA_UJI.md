# PROMPT MASTER UNTUK AI AGENT

## Tujuan
Anda adalah AI Agent koding yang bertugas membaca, memahami, dan menjalankan seluruh instruksi teknis pada file:

`PANDUAN_AGENT_DATA_UJI_JURNAL_AHP_SAW.md`

File tersebut berisi panduan lengkap untuk membuat data uji jurnal pada sistem SPK Lelang Online berbasis AHP-SAW. Tugas Anda adalah mengikuti seluruh instruksi di dalam file tersebut secara sistematis, aman, dan terverifikasi.

---

## Instruksi Utama untuk AI Agent

Baca terlebih dahulu seluruh isi file:

`PANDUAN_AGENT_DATA_UJI_JURNAL_AHP_SAW.md`

Setelah membaca file tersebut, lakukan hal berikut:

1. Pahami konteks sistem.
   - Sistem adalah aplikasi SPK penentuan nilai limit aset lelang.
   - Metode yang digunakan adalah AHP untuk bobot dan SAW untuk nilai preferensi.
   - Data uji harus mencakup 3 kategori aset: tanah dan bangunan, kendaraan, dan elektronik.
   - Total data uji minimal adalah 9 aset, yaitu 3 aset untuk setiap kategori.

2. Periksa struktur project terlebih dahulu.
   - Identifikasi lokasi backend.
   - Identifikasi konfigurasi Prisma.
   - Baca `schema.prisma`.
   - Baca `package.json` backend.
   - Jangan membuat asumsi nama model Prisma sebelum membaca schema aktual.

3. Cocokkan instruksi pada file Markdown dengan struktur database aktual.
   - Jika nama model atau field berbeda dari contoh prompt, sesuaikan dengan schema aktual.
   - Jangan mengubah schema database kecuali benar-benar diperlukan.
   - Jika perubahan schema diperlukan, jelaskan alasannya sebelum melakukan perubahan.

4. Buat seed script untuk data uji jurnal.
   - Seed script harus menyimpan data ke database.
   - Seed script harus membuat kategori, kriteria, bobot, aset, nilai kriteria, dan hasil perhitungan.
   - Seed script harus idempotent atau aman dijalankan ulang.
   - Jika data uji lama sudah ada, bersihkan hanya data uji jurnal yang relevan.
   - Jangan menghapus data lain di luar kategori data uji jurnal.

5. Implementasikan perhitungan SAW sesuai instruksi.
   - Untuk kriteria benefit: nilai_normalisasi = nilai / nilai_maksimum.
   - Untuk kriteria cost: nilai_normalisasi = nilai_minimum / nilai.
   - Nilai preferensi = jumlah dari nilai_normalisasi dikalikan bobot.
   - Nilai limit = nilai preferensi dikalikan harga pasar.

6. Pastikan bobot setiap kategori berjumlah 1.00.
   - Tanah dan bangunan: total bobot harus 1.00.
   - Kendaraan: total bobot harus 1.00.
   - Elektronik: total bobot harus 1.00.

7. Tambahkan terminal log yang jelas.
   Log minimal harus menampilkan:
   - proses mulai seed data,
   - pembersihan data lama,
   - kategori yang dibuat,
   - kriteria dan bobot yang dibuat,
   - aset yang dibuat,
   - nilai kriteria setiap aset,
   - nilai preferensi,
   - nilai limit,
   - ranking per kategori,
   - pesan selesai.

8. Tambahkan script npm untuk menjalankan seed.
   Contoh nama script yang direkomendasikan:

   ```json
   "seed:jurnal": "node prisma/seed_data_jurnal.js"
   ```

   Sesuaikan path apabila struktur project berbeda.

9. Jalankan validasi setelah implementasi.
   - Jalankan Prisma generate bila diperlukan.
   - Jalankan seed script.
   - Pastikan tidak ada error.
   - Pastikan data masuk ke database.
   - Pastikan hasil muncul di tampilan web.
   - Pastikan hasil di database sama dengan hasil log terminal.

10. Buat dokumentasi hasil pengujian.
    Buat file Markdown baru, misalnya:

    `HASIL_SEED_DATA_UJI_JURNAL_AHP_SAW.md`

    Isi file tersebut dengan:
    - daftar file yang dibuat/diubah,
    - ringkasan data uji,
    - tabel kategori,
    - tabel kriteria dan bobot,
    - tabel aset dan harga pasar,
    - tabel nilai preferensi dan nilai limit,
    - ranking per kategori,
    - cara menjalankan seed,
    - checklist screenshot untuk kebutuhan artikel jurnal.

---

## Data Uji Wajib

Gunakan data uji yang tercantum pada file:

`PANDUAN_AGENT_DATA_UJI_JURNAL_AHP_SAW.md`

Jangan mengganti data uji kecuali ada konflik langsung dengan struktur sistem. Jika harus menyesuaikan, dokumentasikan perubahan tersebut.

Data uji wajib terdiri dari:

1. Tanah dan Bangunan
   - Rumah Tipe 45/90
   - Ruko 2 Lantai
   - Tanah Kavling

2. Kendaraan
   - Toyota Avanza 2019
   - Honda Beat 2021
   - Mitsubishi Xpander 2018

3. Elektronik
   - Laptop Lenovo ThinkPad 2021
   - iPhone 12 128GB
   - Kamera Canon EOS 700D

---

## Aturan Keamanan Implementasi

1. Jangan menghapus seluruh database.
2. Jangan menjalankan `prisma migrate reset` tanpa izin eksplisit.
3. Jangan menghapus user, admin, atau data penting lain.
4. Jangan mengubah fitur utama aplikasi di luar kebutuhan seed data uji.
5. Jangan menonaktifkan validasi sistem.
6. Jangan membuat data random yang tidak sesuai dengan data uji jurnal.
7. Jangan melewati validasi hasil perhitungan.
8. Jangan menyelesaikan tugas sebelum semua checklist selesai.

---

## Checklist Wajib Sebelum Menyatakan Selesai

Pastikan semua poin berikut sudah terpenuhi:

- [ ] File instruksi `PANDUAN_AGENT_DATA_UJI_JURNAL_AHP_SAW.md` sudah dibaca penuh.
- [ ] Struktur database aktual sudah diperiksa dari `schema.prisma`.
- [ ] Seed script data uji sudah dibuat.
- [ ] Script npm untuk seed sudah ditambahkan.
- [ ] Seed berhasil dijalankan tanpa error.
- [ ] Data kategori berhasil masuk ke database.
- [ ] Data kriteria berhasil masuk ke database.
- [ ] Data bobot berhasil masuk ke database.
- [ ] Data aset berhasil masuk ke database.
- [ ] Data nilai kriteria berhasil masuk ke database.
- [ ] Data hasil nilai preferensi dan nilai limit berhasil masuk ke database.
- [ ] Terminal log menampilkan proses lengkap.
- [ ] Ranking per kategori ditampilkan di terminal.
- [ ] Data terlihat pada tampilan web.
- [ ] Dokumentasi hasil pengujian dibuat.
- [ ] Tidak ada data penting yang terhapus.

---

## Format Respons Akhir AI Agent

Setelah selesai, berikan laporan akhir dengan format berikut:

```markdown
# Laporan Implementasi Data Uji Jurnal AHP-SAW

## 1. File yang Dibuat atau Diubah
- ...

## 2. Perintah yang Dijalankan
```bash
...
```

## 3. Ringkasan Data yang Berhasil Dibuat
- Kategori: ...
- Kriteria: ...
- Aset: ...
- Hasil perhitungan: ...

## 4. Ringkasan Ranking
### Tanah dan Bangunan
1. ...
2. ...
3. ...

### Kendaraan
1. ...
2. ...
3. ...

### Elektronik
1. ...
2. ...
3. ...

## 5. Validasi
- Total bobot setiap kategori: valid/tidak valid
- Perhitungan SAW: valid/tidak valid
- Data masuk database: valid/tidak valid
- Data muncul di web: valid/tidak valid

## 6. Catatan
...
```

---

## Instruksi Penutup

Jalankan tugas secara bertahap dan hati-hati. Prioritaskan kesesuaian dengan schema database aktual, keamanan data, dan kebutuhan artikel jurnal. Jangan hanya membuat kode; pastikan data benar-benar tersimpan, dapat ditampilkan di web, dan dapat digunakan sebagai bukti hasil pengujian dalam naskah publikasi INSECT.
