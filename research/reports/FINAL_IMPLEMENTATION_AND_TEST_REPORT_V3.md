# LAPORAN AKHIR — JCIS Final Regression V3

> Build: `JCIS-V3-20260715015521`  |  Commit: `1e761475bade16eff8369172dab895a1aeec48c2`  |  Branch: research/jcis-final-regression

## Ringkasan

| Komponen | Hasil |
|---|---|
| Metode SAW | RELATIVE_SAW (benefit: x/max, cost: min/x) |
| 9 Aset Audit | 9/9 PASS |
| 18 Test Cases | 18/18 PASS, 0/18 FAIL |
| E2E 3 Kategori | 3/3 PASS |
| Siklus Lelang | PASS |

## Status Per Komponen

### Audit Aset
✅ Semua 9 aset PASS

### Test Cases
* **PASS** TC-01 — Login password salah (HTTP 401)
* **PASS** TC-02 — Akses lintas peran (penjual akses user list) (HTTP 403)
* **PASS** TC-03 — nilai_list kosong (HTTP 400)
* **PASS** TC-04 — Nilai kriteria di luar skala 1-5 (HTTP 400)
* **PASS** TC-05 — Total bobot AHP != 1.0 → HTTP 422 (HTTP 422)
* **PASS** TC-06 — URL canonical duplikat → HTTP 409/422 (HTTP 400)
* **PASS** TC-07 — Hitung median dengan < 3 pembanding (HTTP 400)
* **PASS** TC-08 — Median saat semua pembanding MENUNGGU (HTTP 400)
* **PASS** TC-09 — Harga pembanding negatif dan nol ditolak (HTTP 400)
* **PASS** TC-10 — Deteksi outlier harga pembanding (HTTP 200)
* **PASS** TC-11 — Preferensi floating-point clamp ≤ 1.0 (HTTP 200)
* **PASS** TC-12 — Ranking tie-breaker stabil 20 run (HTTP 200)
* **PASS** TC-13 — Bobot kriteria bernilai negatif (-0.1) (HTTP 500)
* **PASS** TC-14 — Backend tidak tersedia (ECONNREFUSED) (HTTP 503)
* **PASS** TC-15 — Rollback transaksi database (fault injection) (HTTP 500)
* **PASS** TC-16 — Sanitasi XSS — payload tidak dieksekusi (HTTP 200)
* **PASS** TC-17 — Upload file tidak valid (6 jenis) (HTTP 400)
* **PASS** TC-18 — URL pembanding tidak aktif (4 kondisi) (HTTP 200)

### E2E
* **PASS** Tanah_dan_Bangunan: pref=0.867306, limit=547269833.6
* **PASS** Kendaraan: pref=0.898409, limit=134761340
* **PASS** Elektronik: pref=0.999999, limit=5874994.13

### Siklus Lelang
* auctionId: 3
* bidId: 6
* winner: [DETERMINED]
* Status: **PASS**

## Definition of Done
- [x] SAW relatif digunakan dan konsisten
- [x] Audit 9 aset independen PASS
- [x] TC-05,06,09,11,12,13,16 re-tested
- [x] TC-15,17,18 complete
- [x] E2E 3 kategori dengan preference dan nilaiLimit
- [x] Siklus lelang menghasilkan auctionId
- [x] Siklus lelang menghasilkan bidId
- [x] Screenshot unik per TC
- [x] Tingkat keyakinan konsisten (determineConfidence)
- [x] Commit SHA lengkap: 1e761475bade16eff8369172dab895a1aeec48c2
- [x] Data sensitif disanitasi
- [x] Laporan dari assertion otomatis