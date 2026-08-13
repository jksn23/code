# Panduan Pengujian Sistem untuk Kebutuhan Jurnal

**Cakupan:** 18 test case negatif, batas, keamanan, reliabilitas, dan integritas data  
**Tujuan:** menghasilkan bukti pengujian yang dapat direplikasi pada bagian Metode, Hasil, dan Lampiran artikel.

> Isi endpoint, branch, build, commit, dan hasil aktual berdasarkan eksekusi nyata. Jangan menyatakan PASS tanpa bukti.

## Prinsip

1. Gunakan database/storage khusus test.
2. Catat commit hash dan nomor build.
3. Screenshot UI bukan satu-satunya bukti.
4. Simpan request, response, status HTTP, log, dan DB before-after.
5. Redaksi token, password, KTP, NPWP, rekening, dan data pribadi.
6. Waktu menggunakan ISO 8601 dengan zona waktu.
7. PASS hanya jika semua expected result terpenuhi.
8. FAIL harus memiliki defect ID dan retest.

## Struktur Evidence

```text
Evidence/
├── _templates/
├── TC-01/
│   ├── metadata.json
│   ├── TC-01_20260714_1405_ui.png
│   ├── TC-01_20260714_1405_api_request.json
│   ├── TC-01_20260714_1405_api_response.json
│   ├── TC-01_20260714_1405_http_status.txt
│   ├── TC-01_20260714_1405_backend.log
│   ├── TC-01_20260714_1405_db_before.txt
│   ├── TC-01_20260714_1405_db_after.txt
│   ├── TC-01_20260714_1405_storage_before.txt
│   ├── TC-01_20260714_1405_storage_after.txt
│   └── execution_notes.md
└── TC-18/
```

## Metadata wajib

```json
{
  "testCaseId": "TC-01",
  "title": "Password salah",
  "executedAt": "2026-07-14T14:05:00+08:00",
  "tester": "Nama Penguji",
  "environment": "local-test",
  "os": "",
  "browser": "",
  "backendNodeVersion": "",
  "database": "",
  "branch": "",
  "commitHash": "",
  "buildNumber": "",
  "baseUrlFrontend": "",
  "baseUrlBackend": "",
  "result": "PASS",
  "defectId": null
}
```

## Status HTTP yang disarankan

| Kondisi | Status |
|---|---:|
| Kredensial salah | 401 |
| Tidak berhak | 403 |
| Input invalid | 400/422 |
| Duplikat | 409/422 |
| Payload terlalu besar | 413 |
| Media tidak didukung | 415 |
| Layanan tidak tersedia | 503 |
| Error internal tertangani | 500 |

## Matriks

| ID | Test case | Area | Prioritas |
|---|---|---|---|
| TC-01 | Password salah | Autentikasi | Tinggi |
| TC-02 | Akses lintas peran | Otorisasi | Kritis |
| TC-03 | Nilai kriteria kosong | Validasi penilaian | Tinggi |
| TC-04 | Nilai di luar rentang 1–5 | Validasi penilaian | Tinggi |
| TC-05 | Total bobot tidak sama dengan satu | AHP/versi bobot | Kritis |
| TC-06 | URL pembanding duplikat | Data pembanding | Tinggi |
| TC-07 | Jumlah pembanding valid kurang dari tiga | Harga referensi | Kritis |
| TC-08 | Seluruh pembanding bersyarat | Harga referensi | Kritis |
| TC-09 | Harga nol atau negatif | Data pembanding | Tinggi |
| TC-10 | Harga outlier | Data pembanding | Tinggi |
| TC-11 | Preferensi floating-point melebihi satu | SAW | Kritis |
| TC-12 | Hasil ranking seri | SAW/ranking | Sedang |
| TC-13 | Kategori hanya memiliki satu alternatif | SAW/workflow | Sedang |
| TC-14 | Backend tidak tersedia | Reliability/frontend | Tinggi |
| TC-15 | Kegagalan transaksi database | Integritas transaksi | Kritis |
| TC-16 | Input XSS atau karakter berbahaya | Keamanan input/output | Kritis |
| TC-17 | File upload tidak valid | Upload/dokumen | Kritis |
| TC-18 | URL pembanding sudah tidak aktif | Data pembanding/reliability | Tinggi |

# TC-01 — Password salah

**Area:** Autentikasi  
**Prioritas:** Tinggi

## Tujuan
Membuktikan kontrol autentikasi menolak kredensial tidak sah.

## Prasyarat
Akun aktif tersedia; email benar; backend dan database aktif.

## Langkah
1. Buka halaman login.
2. Masukkan email valid dan password salah.
3. Kirim form melalui UI.
4. Ulangi melalui API.
5. Periksa token/session dan database.

## Expected Result
1. Login ditolak.
2. HTTP 401 atau status autentikasi gagal yang konsisten.
3. Tidak ada token/session baru.
4. Pesan tidak membocorkan detail sensitif.
5. Database tidak berubah kecuali audit gagal-login.

## Bukti Database
Bandingkan user, session/token, dan audit log sebelum-sesudah.

## Otomasi
Integration/API test autentikasi.

## PASS
Semua expected result terpenuhi dan bukti minimum lengkap.

## FAIL
Salah satu expected result tidak terpenuhi, bukti tidak lengkap, atau ada perubahan data tak semestinya.

---


# TC-02 — Akses lintas peran

**Area:** Otorisasi  
**Prioritas:** Kritis

## Tujuan
Membuktikan pembatasan akses berbasis peran dan kepemilikan.

## Prasyarat
Tersedia akun Admin, Penjual, Pembeli; token tiap role aktif.

## Langkah
1. Login sebagai Penjual lalu akses endpoint Admin.
2. Login sebagai Pembeli lalu akses endpoint Penjual/Admin.
3. Ganti ID objek dengan milik pengguna lain.
4. Ulangi melalui UI dan API.

## Expected Result
1. Akses ditolak dengan HTTP 403; 404 boleh jika menjadi kebijakan penyamaran objek.
2. Tidak ada data sensitif dikembalikan.
3. Tidak ada perubahan database.
4. Frontend tidak membuka halaman terlarang.

## Bukti Database
Buktikan tabel target tidak berubah; simpan audit authorization failure bila tersedia.

## Otomasi
Integration test role middleware dan ownership check.

## PASS
Semua expected result terpenuhi dan bukti minimum lengkap.

## FAIL
Salah satu expected result tidak terpenuhi, bukti tidak lengkap, atau ada perubahan data tak semestinya.

---


# TC-03 — Nilai kriteria kosong

**Area:** Validasi penilaian  
**Prioritas:** Tinggi

## Tujuan
Membuktikan kelengkapan input sebelum perhitungan.

## Prasyarat
Aset mempunyai seluruh kriteria/rubrik dan pengguna berhak menilai.

## Langkah
1. Isi sebagian kriteria.
2. Biarkan satu kriteria kosong.
3. Kirim melalui UI.
4. Ulangi melalui API dengan field nilai dihilangkan.

## Expected Result
1. Submission ditolak.
2. HTTP 400/422.
3. Pesan menunjukkan kriteria yang belum diisi.
4. Tidak ada hasil SAW/snapshot final baru.
5. Draft parsial hanya boleh tersimpan bila desain mendukung.

## Bukti Database
Bandingkan NilaiAset, Hasil, dan status penilaian.

## Otomasi
Unit validator dan integration test submission.

## PASS
Semua expected result terpenuhi dan bukti minimum lengkap.

## FAIL
Salah satu expected result tidak terpenuhi, bukti tidak lengkap, atau ada perubahan data tak semestinya.

---


# TC-04 — Nilai di luar rentang 1–5

**Area:** Validasi penilaian  
**Prioritas:** Tinggi

## Tujuan
Membuktikan validasi skala diskrit 1–5.

## Prasyarat
Endpoint nilai tersedia.

## Langkah
1. Kirim nilai 0.
2. Kirim 6.
3. Kirim negatif.
4. Kirim 3.5.
5. Kirim string nonnumerik.

## Expected Result
1. Semua input ditolak.
2. HTTP 400/422.
3. Nilai valid lama tidak berubah.
4. SAW tidak dijalankan.

## Bukti Database
Buktikan tidak ada record invalid.

## Otomasi
Unit fixed-scale validator dan API test.

## PASS
Semua expected result terpenuhi dan bukti minimum lengkap.

## FAIL
Salah satu expected result tidak terpenuhi, bukti tidak lengkap, atau ada perubahan data tak semestinya.

---


# TC-05 — Total bobot tidak sama dengan satu

**Area:** AHP/versi bobot  
**Prioritas:** Kritis

## Tujuan
Membuktikan konsistensi parameter pembobotan.

## Prasyarat
Versi bobot uji dengan total 0.95 atau 1.05 tersedia.

## Langkah
1. Buat/impor versi bobot invalid.
2. Coba aktifkan.
3. Coba menjalankan penilaian dengan versi tersebut.

## Expected Result
1. Aktivasi/perhitungan ditolak.
2. HTTP 400/422 atau domain exception tertangani.
3. Versi valid sebelumnya tetap aktif.
4. Tidak ada hasil menggunakan bobot invalid.
5. Tolerance floating-point terdokumentasi.

## Bukti Database
Simpan BobotVersion/BobotAHP dan status aktif sebelum-sesudah.

## Otomasi
Unit weight validator dan transaction test.

## PASS
Semua expected result terpenuhi dan bukti minimum lengkap.

## FAIL
Salah satu expected result tidak terpenuhi, bukti tidak lengkap, atau ada perubahan data tak semestinya.

---


# TC-06 — URL pembanding duplikat

**Area:** Data pembanding  
**Prioritas:** Tinggi

## Tujuan
Membuktikan deduplikasi sumber harga.

## Prasyarat
Satu URL detail telah tersimpan untuk aset.

## Langkah
1. Tambahkan URL sama persis.
2. Tambahkan URL sama dengan tracking berbeda.
3. Tambahkan variasi trailing slash/fragment.

## Expected Result
1. Canonical URL/hash sama.
2. Input ditolak HTTP 409/422.
3. Tidak ada record duplikat.
4. Pesan menjelaskan duplikasi.

## Bukti Database
Query DataPembanding berdasarkan asetId dan canonicalUrlHash.

## Otomasi
Unit canonicalization dan integration unique constraint.

## PASS
Semua expected result terpenuhi dan bukti minimum lengkap.

## FAIL
Salah satu expected result tidak terpenuhi, bukti tidak lengkap, atau ada perubahan data tak semestinya.

---


# TC-07 — Jumlah pembanding valid kurang dari tiga

**Area:** Harga referensi  
**Prioritas:** Kritis

## Tujuan
Membuktikan persyaratan minimum data referensi.

## Prasyarat
Aset hanya memiliki dua pembanding eligible.

## Langkah
1. Pilih dua pembanding valid.
2. Jalankan median.
3. Coba lanjutkan nilai limit.

## Expected Result
1. Median dan hasil final diblokir.
2. HTTP 422 dengan kode data tidak cukup.
3. Confidence TIDAK_CUKUP.
4. Tidak ada Hasil final baru.

## Bukti Database
Buktikan eligible count=2 dan tidak ada hasil baru.

## Otomasi
Service median dan integration workflow.

## PASS
Semua expected result terpenuhi dan bukti minimum lengkap.

## FAIL
Salah satu expected result tidak terpenuhi, bukti tidak lengkap, atau ada perubahan data tak semestinya.

---


# TC-08 — Seluruh pembanding bersyarat

**Area:** Harga referensi  
**Prioritas:** Kritis

## Tujuan
Membuktikan data belum tervalidasi tidak dianggap faktual.

## Prasyarat
Minimal tiga pembanding semuanya MENUNGGU/PERLU_TINJAU/belum diterima Admin.

## Langkah
1. Pilih seluruh data bersyarat.
2. Jalankan median.
3. Periksa eligible count dan confidence.

## Expected Result
1. Tidak satu pun dipakai.
2. Perhitungan gagal, eligible count=0.
3. Confidence TIDAK_CUKUP.
4. UI membedakan data dipilih dan eligible.

## Bukti Database
Simpan statusValidasi, statusKecocokan, dipilihPenjual, dan query eligible.

## Otomasi
Integration accepted-only filter.

## PASS
Semua expected result terpenuhi dan bukti minimum lengkap.

## FAIL
Salah satu expected result tidak terpenuhi, bukti tidak lengkap, atau ada perubahan data tak semestinya.

---


# TC-09 — Harga nol atau negatif

**Area:** Data pembanding  
**Prioritas:** Tinggi

## Tujuan
Membuktikan validasi domain nilai moneter.

## Prasyarat
Endpoint manual/parser scraper dapat diberi harga uji.

## Langkah
1. Kirim 0.
2. Kirim -1.
3. Kirim negatif besar.
4. Kirim string/NaN bila memungkinkan.

## Expected Result
1. Input ditolak HTTP 400/422.
2. Tidak ada DataPembanding baru.
3. Median/confidence tidak berubah.

## Bukti Database
Query record uji sebelum-sesudah.

## Otomasi
Validation unit dan API test.

## PASS
Semua expected result terpenuhi dan bukti minimum lengkap.

## FAIL
Salah satu expected result tidak terpenuhi, bukti tidak lengkap, atau ada perubahan data tak semestinya.

---


# TC-10 — Harga outlier

**Area:** Data pembanding  
**Prioritas:** Tinggi

## Tujuan
Membuktikan ketahanan harga referensi terhadap nilai ekstrem.

## Prasyarat
Sekumpulan harga normal dan satu harga ekstrem tersedia.

## Langkah
1. Masukkan 95,100,105,1000 dalam satuan sama.
2. Jalankan outlier detection.
3. Hitung median/confidence.

## Expected Result
1. Harga ekstrem ditandai outlier sesuai IQR.
2. Outlier tidak masuk median.
3. Tidak digunakan sebagai fallback.
4. Batas IQR dapat ditelusuri.

## Bukti Database
Simpan Q1,Q3,IQR,batas,flag,used IDs.

## Otomasi
Unit IQR dan integration median.

## PASS
Semua expected result terpenuhi dan bukti minimum lengkap.

## FAIL
Salah satu expected result tidak terpenuhi, bukti tidak lengkap, atau ada perubahan data tak semestinya.

---


# TC-11 — Preferensi floating-point melebihi satu

**Area:** SAW  
**Prioritas:** Kritis

## Tujuan
Membuktikan batas matematis keluaran SAW.

## Prasyarat
Bobot valid dengan floating-point dan seluruh skor terbaik tersedia.

## Langkah
1. Jalankan perhitungan skor terbaik.
2. Periksa nilai mentah, tersimpan, API.
3. Gunakan bobot desimal dalam tolerance.

## Expected Result
1. Preferensi tetap 0..1.
2. Deviasi epsilon boleh di-clamp ke 1.
3. Deviasi substantif ditolak.
4. Nilai limit tidak melebihi harga referensi akibat preferensi >1.

## Bukti Database
Simpan snapshot normalisasi, weighted score, preferensi raw/stored.

## Otomasi
Unit precision dan invariant test.

## PASS
Semua expected result terpenuhi dan bukti minimum lengkap.

## FAIL
Salah satu expected result tidak terpenuhi, bukti tidak lengkap, atau ada perubahan data tak semestinya.

---


# TC-12 — Hasil ranking seri

**Area:** SAW/ranking  
**Prioritas:** Sedang

## Tujuan
Membuktikan perilaku deterministik saat nilai sama.

## Prasyarat
Dua alternatif menghasilkan preferensi identik dalam tolerance.

## Langkah
1. Buat dua alternatif identik.
2. Jalankan ranking.
3. Ulangi beberapa kali.

## Expected Result
1. Sistem menandai seri atau memakai tie-breaker terdokumentasi.
2. Urutan deterministik.
3. Tie-breaker tampilan tidak diklaim sebagai keunggulan metodologis.

## Bukti Database
Simpan nilai mentah, ranking, tie status/tie-breaker.

## Otomasi
Unit deterministic sort.

## PASS
Semua expected result terpenuhi dan bukti minimum lengkap.

## FAIL
Salah satu expected result tidak terpenuhi, bukti tidak lengkap, atau ada perubahan data tak semestinya.

---


# TC-13 — Kategori hanya memiliki satu alternatif

**Area:** SAW/workflow  
**Prioritas:** Sedang

## Tujuan
Membuktikan metode tidak bergantung jumlah alternatif.

## Prasyarat
Satu kategori hanya mempunyai satu aset lengkap.

## Langkah
1. Jalankan perhitungan.
2. Periksa fixed-scale tidak membutuhkan aset lain.
3. Periksa ranking.

## Expected Result
1. Perhitungan berhasil jika data valid.
2. Preferensi tidak otomatis 1.
3. Ranking 1 dari 1 diberi catatan tidak ada pembanding alternatif.

## Bukti Database
Simpan skor, normalisasi, bobot, preferensi, jumlah alternatif.

## Otomasi
Integration fixed-scale independence.

## PASS
Semua expected result terpenuhi dan bukti minimum lengkap.

## FAIL
Salah satu expected result tidak terpenuhi, bukti tidak lengkap, atau ada perubahan data tak semestinya.

---


# TC-14 — Backend tidak tersedia

**Area:** Reliability/frontend  
**Prioritas:** Tinggi

## Tujuan
Membuktikan penanganan kegagalan layanan.

## Prasyarat
Frontend aktif; backend dapat dihentikan atau diarahkan ke port mati.

## Langkah
1. Buka halaman API-dependent.
2. Hentikan backend.
3. Lakukan login/load/submit.
4. Aktifkan lagi dan cek retry bila ada.

## Expected Result
1. Frontend tidak crash/tidak menampilkan sukses semu.
2. Pesan layanan tidak tersedia jelas.
3. Input tidak hilang tanpa peringatan bila memungkinkan.
4. Database tidak berubah.

## Bukti Database
Buktikan tidak ada request sukses/record berubah.

## Otomasi
Frontend mock network failure; manual evidence wajib.

## PASS
Semua expected result terpenuhi dan bukti minimum lengkap.

## FAIL
Salah satu expected result tidak terpenuhi, bukti tidak lengkap, atau ada perubahan data tak semestinya.

---


# TC-15 — Kegagalan transaksi database

**Area:** Integritas transaksi  
**Prioritas:** Kritis

## Tujuan
Membuktikan atomicity transaksi.

## Prasyarat
Test database dan fault injection tersedia; jangan gunakan produksi.

## Langkah
1. Mulai proses multi-table.
2. Paksa exception setelah satu operasi transaksi.
3. Periksa seluruh tabel.

## Expected Result
1. Seluruh perubahan rollback.
2. HTTP 500/503 tertangani.
3. Tidak ada partial/orphan record.
4. Log memiliki context/correlation ID.

## Bukti Database
Dump tabel terkait sebelum-sesudah; harus identik.

## Otomasi
Integration rollback dengan fault injection.

## PASS
Semua expected result terpenuhi dan bukti minimum lengkap.

## FAIL
Salah satu expected result tidak terpenuhi, bukti tidak lengkap, atau ada perubahan data tak semestinya.

---


# TC-16 — Input XSS atau karakter berbahaya

**Area:** Keamanan input/output  
**Prioritas:** Kritis

## Tujuan
Membuktikan mitigasi stored/reflected XSS.

## Prasyarat
Field teks tersedia.

## Langkah
1. Kirim <script>alert(1)</script>.
2. Kirim img onerror payload.
3. Kirim karakter SQL/HTML dan teks panjang.
4. Buka semua halaman penampil.

## Expected Result
1. Tidak ada JavaScript dieksekusi.
2. Input ditolak atau dirender ter-escape.
3. Tidak ada SQL error/perubahan di luar target.
4. Sanitization/CSP behavior tercatat.

## Bukti Database
Simpan nilai raw/sanitized dan buktikan tabel lain tidak berubah.

## Otomasi
API security dan frontend render test.

## PASS
Semua expected result terpenuhi dan bukti minimum lengkap.

## FAIL
Salah satu expected result tidak terpenuhi, bukti tidak lengkap, atau ada perubahan data tak semestinya.

---


# TC-17 — File upload tidak valid

**Area:** Upload/dokumen  
**Prioritas:** Kritis

## Tujuan
Membuktikan validasi tipe, ukuran, dan jalur file.

## Prasyarat
Endpoint upload tersedia; gunakan file uji nonrahasia.

## Langkah
1. Upload ekstensi tidak diizinkan.
2. Upload ekstensi valid dengan MIME/signature salah.
3. Upload melebihi ukuran.
4. Upload nama traversal ../../test.pdf.
5. Periksa storage.

## Expected Result
1. Ditolak HTTP 400/413/415.
2. Tidak ada file tersimpan atau temp dibersihkan.
3. Tidak ada path traversal.
4. DB tidak menyimpan referensi invalid.
5. Log mencatat alasan.

## Bukti Database
Simpan record dokumen sebelum-sesudah.

## Otomasi
Upload integration test; storage evidence wajib.

## PASS
Semua expected result terpenuhi dan bukti minimum lengkap.

## FAIL
Salah satu expected result tidak terpenuhi, bukti tidak lengkap, atau ada perubahan data tak semestinya.

---


# TC-18 — URL pembanding sudah tidak aktif

**Area:** Data pembanding/reliability  
**Prioritas:** Tinggi

## Tujuan
Membuktikan penanganan sumber yang tidak lagi tersedia.

## Prasyarat
Gunakan mock URL 404/410/timeout; jangan bergantung eksternal untuk otomatisasi.

## Langkah
1. Tambahkan URL valid.
2. Ubah mock menjadi 404/410/timeout/redirect invalid.
3. Jalankan recheck.
4. Coba median.

## Expected Result
1. URL ditandai tidak aktif/invalid.
2. Dikeluarkan dari eligible median.
3. Sistem tidak crash.
4. Confidence diperbarui.
5. Jika valid <3 hasil baru diblokir, hasil historis immutable.

## Bukti Database
Simpan status URL, lastCheckedAt bila ada, eligible count, hasil historis.

## Otomasi
Mock HTTP dan integration median.

## PASS
Semua expected result terpenuhi dan bukti minimum lengkap.

## FAIL
Salah satu expected result tidak terpenuhi, bukti tidak lengkap, atau ada perubahan data tak semestinya.

---

# Prosedur Eksekusi

## Sebelum
1. Catat `git rev-parse HEAD` dan `git status`.
2. Catat versi Node, npm, Prisma, MySQL, browser, OS.
3. Backup database test.
4. Bersihkan storage test.
5. Jalankan migration dan seed fixture.
6. Aktifkan backend log.
7. Isi metadata build.

## Saat
1. Ambil DB before.
2. Jalankan test.
3. Simpan request/response/status.
4. Ambil screenshot pesan dan keadaan UI.
5. Simpan log relevan.
6. Ambil DB after.
7. Ambil storage before-after untuk upload.
8. Isi expected vs actual.
9. Tandai PASS/FAIL dan defect.

## Setelah
1. Reset fixture/rollback.
2. Jalankan regression test.
3. Pastikan tidak ada data invalid tertinggal.
4. Buat rekap hasil.
5. Opsional: checksum bukti.

# Rekap Jurnal

\[
Persentase\ PASS = \frac{Jumlah\ PASS}{18}\times100\%
\]

Persentase PASS hanya menunjukkan kelulusan terhadap 18 kasus yang didefinisikan. Angka tersebut bukan bukti sistem bebas kesalahan dan bukan validasi akurasi nilai limit.

# Kritik Akademik

Delapan belas kasus ini menguji validasi, otorisasi, integritas transaksi, keamanan input, dan reliabilitas. Pengujian ini belum menggantikan:

- validasi nilai limit terhadap pakar/data aktual;
- UAT;
- performa dan concurrency bidding;
- penetration test penuh;
- sensitivitas bobot;
- kompatibilitas browser.

Pisahkan **pengujian fungsional** dari **validasi model** dalam artikel.

# Definition of Done

- [ ] 18 test dijalankan.
- [ ] Metadata lengkap.
- [ ] Request/response/status tersedia.
- [ ] DB before-after tersedia.
- [ ] Screenshot tersedia.
- [ ] Storage evidence TC-17 tersedia.
- [ ] Log relevan tersedia.
- [ ] Data sensitif disamarkan.
- [ ] FAIL memiliki defect.
- [ ] Retest tercatat.
- [ ] Regression test lulus.
- [ ] Rekap final dan commit hash tersedia.
