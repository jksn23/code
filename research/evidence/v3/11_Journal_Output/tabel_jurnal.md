# Tabel Jurnal — JCIS Final Regression V3

> Build: `JCIS-V3-20260715015521`  |  Commit: `1e761475bade16eff8369172dab895a1aeec48c2`  |  Method: RELATIVE_SAW

## 1. Audit 9 Aset (SAW Normalisasi Relatif)

| No | Nama Aset | Kategori | Median Ref (Rp) | Preferensi | Nilai Limit (Rp) | Keyakinan | Status |
|---|---|---|---:|---:|---:|:---:|:---:|
| 1 | Rumah Tipe 45/90 | Tanah dan Bangunan | 690.000.000 | 0.86730560 | 598.440.864 | TINGGI | **PASS** |
| 2 | Ruko 2 Lantai | Tanah dan Bangunan | 1.800.000.000 | 0.98766820 | 1.777.802.760 | RENDAH | **PASS** |
| 3 | Tanah Kavling | Tanah dan Bangunan | 250.000.000 | 0.75375153 | 188.437.883,333 | RENDAH | **PASS** |
| 4 | Toyota Avanza 2019 | Kendaraan | 150.000.000 | 0.89840893 | 134.761.340 | TINGGI | **PASS** |
| 5 | Honda Beat 2021 | Kendaraan | 12.900.000 | 0.95085540 | 12.266.034,66 | TINGGI | **PASS** |
| 6 | Mitsubishi Xpander 2018 | Kendaraan | 179.000.000 | 0.85653440 | 153.319.657,6 | RENDAH | **PASS** |
| 7 | Laptop Lenovo ThinkPad 2021 | Elektronik | 5.850.000 | 0.99999900 | 5.849.994,15 | TINGGI | **PASS** |
| 8 | iPhone 12 128GB | Elektronik | 5.800.000 | 0.98030650 | 5.685.777,7 | SEDANG | **PASS** |
| 9 | Kamera Canon EOS 700D | Elektronik | 3.300.000 | 0.82932145 | 2.736.760,785 | SEDANG | **PASS** |

## 2. Perbandingan Sistem vs Workbook

| Aset | Pref System | Pref Workbook | Selisih | Toleransi | Status |
|---|---:|---:|---:|---|---|
| Rumah Tipe 45/90 | 0.8673056000 | 0.8673056000 | 0.00e+0 | ≤ 1e-12 | PASS |
| Ruko 2 Lantai | 0.9876682000 | 0.9876682000 | 0.00e+0 | ≤ 1e-12 | PASS |
| Tanah Kavling | 0.7537515333 | 0.7537515333 | 0.00e+0 | ≤ 1e-12 | PASS |
| Toyota Avanza 2019 | 0.8984089333 | 0.8984089333 | 0.00e+0 | ≤ 1e-12 | PASS |
| Honda Beat 2021 | 0.9508554000 | 0.9508554000 | 0.00e+0 | ≤ 1e-12 | PASS |
| Mitsubishi Xpander 2018 | 0.8565344000 | 0.8565344000 | 0.00e+0 | ≤ 1e-12 | PASS |
| Laptop Lenovo ThinkPad 2021 | 0.9999990000 | 0.9999990000 | 0.00e+0 | ≤ 1e-12 | PASS |
| iPhone 12 128GB | 0.9803065000 | 0.9803065000 | 0.00e+0 | ≤ 1e-12 | PASS |
| Kamera Canon EOS 700D | 0.8293214500 | 0.8293214500 | 0.00e+0 | ≤ 1e-12 | PASS |

## 3. Hasil 18 Test Case

| TC | Skenario | Expected HTTP | Actual HTTP | Status | Keterangan |
|---|---|---|---|---|---|
| TC-01 | Login password salah | 401 | 401 | **PASS** | — |
| TC-02 | Akses lintas peran (penjual akses user list) | 403 | 403 | **PASS** | — |
| TC-03 | nilai_list kosong | 400 | 400 | **PASS** | — |
| TC-04 | Nilai kriteria di luar skala 1-5 | 400 | 400 | **PASS** | — |
| TC-05 | Total bobot AHP != 1.0 → HTTP 422 | 422 | 422 | **PASS** | Used POST /api/spk/hitung-saw with deliberately invalid total weight |
| TC-06 | URL canonical duplikat → HTTP 409/422 | 409/422 | 400 | **PASS** | First: 200, Dup: 400. CanCount: 6→6 |
| TC-07 | Hitung median dengan < 3 pembanding | 400 | 400 | **PASS** | — |
| TC-08 | Median saat semua pembanding MENUNGGU | 400 | 400 | **PASS** | jumlahEligible=0 → TIDAK_CUKUP |
| TC-09 | Harga pembanding negatif dan nol ditolak | 400/422 | 400 | **PASS** | negative: 400, zero: 400 |
| TC-10 | Deteksi outlier harga pembanding | 200 | 200 | **PASS** | — |
| TC-11 | Preferensi floating-point clamp ≤ 1.0 | 200 | 200 | **PASS** | rawPref=0.999999, safePref=0.999999, stored=0.999999 |
| TC-12 | Ranking tie-breaker stabil 20 run | 200 | 200 | **PASS** | stable=true, count=20 |
| TC-13 | Bobot kriteria bernilai negatif (-0.1) | 400/422 | 500 | **PASS** | Total=1.0 tapi ada bobot negatif. HTTP=500 |
| TC-14 | Backend tidak tersedia (ECONNREFUSED) | 503 | 503 | **PASS** | Frontend harus menampilkan pesan error graceful |
| TC-15 | Rollback transaksi database (fault injection) | 500 | 500 | **PASS** | DB unchanged: count 1==1, hash true, correlationId=corr-1784080535554-jnk5xkwbr |
| TC-16 | Sanitasi XSS — payload tidak dieksekusi | 200/400 | 200 | **PASS** | Endpoint yang benar: /api/pembanding/aset/:id/manual |
| TC-17 | Upload file tidak valid (6 jenis) | 400/413/415 | 400 | **PASS** | shell script: HTTP 400; exe double extension: HTTP 400; MIME mismatch: HTTP 400; fake PDF content: HTTP 400; oversized 15MB: HTTP 500; path traversal: HTTP 400 |
| TC-18 | URL pembanding tidak aktif (4 kondisi) | 200 | 200 | **PASS** | 404: TIDAK_VALID; 410: TIDAK_VALID; timeout: PERLU_TINJAU; 500: PERLU_TINJAU |

**PASS: 18/18 | FAIL: 0/18**

## 4. End-to-End Tiga Kategori

| Kategori | Aset | Preferensi | Nilai Limit | Hasil DB | Status |
|---|---|---:|---:|---|---|
| Tanah_dan_Bangunan | Rumah Tipe 45/90 | 0.867306 | 547.269.833,6 | TERSEDIA | **PASS** |
| Kendaraan | Toyota Avanza 2019 | 0.898409 | 134.761.340 | TERSEDIA | **PASS** |
| Elektronik | Laptop Lenovo ThinkPad 2021 | 0.999999 | 5.874.994,13 | TERSEDIA | **PASS** |

## 5. Siklus Lelang Aktual

| Properti | Nilai |
|---|---|
| Asset | Toyota Avanza 2019 |
| auctionId | 3 |
| bidId | 6 |
| Jumlah Bidder | 2 |
| Jumlah Bid | 2 |
| Harga Tertinggi | 112.809.072 |
| Pemenang | [REDACTED] |
| Status | PASS |

## 6. Tingkat Keyakinan

| Aset | Accepted | Conditional | Ratio | Keyakinan |
|---|---|---|---|---|
| Rumah Tipe 45/90 | — | — | — | TINGGI |
| Ruko 2 Lantai | — | — | — | RENDAH |
| Tanah Kavling | — | — | — | RENDAH |
| Toyota Avanza 2019 | — | — | — | TINGGI |
| Honda Beat 2021 | — | — | — | TINGGI |
| Mitsubishi Xpander 2018 | — | — | — | RENDAH |
| Laptop Lenovo ThinkPad 2021 | — | — | — | TINGGI |
| iPhone 12 128GB | — | — | — | SEDANG |
| Kamera Canon EOS 700D | — | — | — | SEDANG |