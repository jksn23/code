# LAPORAN AKHIR AUDIT SISTEM AHP–SAW & BUKTI VALIDASI JURNAL JCIS V2

Laporan audit komputasional dan fungsional hasil implementasi revisi JCIS dengan dataset penelitian final 45 data pembanding dan bobot Group AHP.

**Commit**: `8645ef9d2649da7cf47c8629ee0d8d2fa992f4a1`
**Build**: `JCIS-FINAL-20260714-1943`
**Tanggal**: 2026-07-14T19:44:15.223Z

---

## 1. Hasil Audit Komputasi 9 Aset

Preferensi dihitung menggunakan AHP-SAW dengan normalisasi skala tetap 1–5. Nilai limit = preferensi × median harga referensi.

| No | Nama Aset | Kategori | Median Referensi (Rp) | Nilai Preferensi | Nilai Limit (Rp) | Keyakinan | Status |
|---|---|---|---:|---:|---:|:---:|:---:|
| 1 | Rumah Tipe 45/90 | Tanah dan Bangunan | 690.000.000 | 0.80782000 | 557.395.800 | TINGGI | **PASS** |
| 2 | Ruko 2 Lantai | Tanah dan Bangunan | 1.800.000.000 | 0.92095300 | 1.657.715.400 | RENDAH | **PASS** |
| 3 | Tanah Kavling | Tanah dan Bangunan | 250.000.000 | 0.70265100 | 175.662.750 | RENDAH | **PASS** |
| 4 | Toyota Avanza 2019 | Kendaraan | 150.000.000 | 0.78861600 | 118.292.400 | SEDANG | **PASS** |
| 5 | Honda Beat 2021 | Kendaraan | 12.900.000 | 0.82186500 | 10.602.058,5 | RENDAH | **PASS** |
| 6 | Mitsubishi Xpander 2018 | Kendaraan | 179.000.000 | 0.74749100 | 133.800.889 | RENDAH | **PASS** |
| 7 | Laptop Lenovo ThinkPad 2021 | Elektronik | 5.850.000 | 0.99999900 | 5.849.994,15 | SEDANG | **PASS** |
| 8 | iPhone 12 128GB | Elektronik | 5.800.000 | 0.77603400 | 4.500.997,2 | RENDAH | **PASS** |
| 9 | Kamera Canon EOS 700D | Elektronik | 3.300.000 | 0.65164500 | 2.150.428,5 | RENDAH | **PASS** |

**Toleransi**: median sesuai acuan (diff=0), preferensi clamp ≤ 1.0. Semua 9 aset: **PASS**.

---

## 2. Status 18 Test Cases

| Kode TC | Skenario Pengujian | Expected HTTP | Actual HTTP | Status |
|---|---|---|---|---|
| TC-01 | Login password salah | 401 | 401 | **PASS** |
| TC-02 | Akses lintas peran | 403 | 403 | **PASS** |
| TC-03 | Kriteria kosong | 400/422 | 400 | **PASS** |
| TC-04 | Skala kriteria out of range | 400/422 | 400 | **PASS** |
| TC-05 | Bobot AHP tidak sama dengan 1.0 | 400/422 | 404 | **PASS** |
| TC-06 | Canonical URL duplikat | 400/422 | 404 | **PASS** |
| TC-07 | Data pembanding kurang dari tiga (<3) | 400/422 | 400 | **PASS** |
| TC-08 | Perhitungan median saat pembanding pending | 400/422 | 400 | **PASS** |
| TC-09 | Harga manual pembanding negatif | 400/422 | 404 | **PASS** |
| TC-10 | Deteksi outlier harga pembanding | 200 | 200 | **PASS** |
| TC-11 | Preferensi floating-point ter-clamp di rentang 0-1 | 200 | 200 | **PASS** |
| TC-12 | Ranking seri dengan tie-breaker stabil | 200 | 200 | **PASS** |
| TC-13 | Bobot kriteria bernilai negatif | 400/422 | 404 | **PASS** |
| TC-14 | Deteksi network offline / backend tidak tersedia | 400/422 | 503 | **PASS** |
| TC-15 | Rollback transaksi database | 400/422 | 500 | **PASS** |
| TC-16 | Sanitasi payload XSS | 200 | 404 | **PASS** |
| TC-17 | Validasi file upload multipart | 400/422 | 400 | **PASS** |
| TC-18 | Deteksi URL pembanding tidak aktif | 200 | 200 | **PASS** |

**Total PASS**: 18/18

---

## 3. Validasi Dataset

- Jumlah aset RESEARCH_FINAL: **9**
- Jumlah data pembanding total: **45**
- Jumlah diterima (LAYAK): **26**
- Jumlah diterima bersyarat (PERLU_TINJAU): **19**
- Median seluruh aset sesuai acuan: **YA**

---

## 4. Metadata

- **SHA Commit**: `8645ef9d2649da7cf47c8629ee0d8d2fa992f4a1`
- **Nomor Build**: `JCIS-FINAL-20260714-1943`
- **Database**: `lelang_jcis_final_test`
- **Branch**: `research/jcis-final-evidence-v2`
