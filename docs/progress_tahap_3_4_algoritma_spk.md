# 📋 Progress Tahap 3 & 4: Algoritma AHP & SAW + Endpoint SPK

**Tanggal:** 2026-04-06  
**Status:** ✅ SELESAI — Semua test LULUS

---

## 🎯 Tujuan
- Implementasi logika AHP (bobot + validasi CR)
- Implementasi logika SAW (normalisasi + nilai limit)
- Integrasi ke endpoint API `/api/spk/`

---

## ✅ Yang Dikerjakan

### 1. Service AHP (`src/services/ahp.service.js`)

**Input**: Matriks Pairwise Comparison n x n

**Langkah Perhitungan**:
| Langkah | Rumus | Keterangan |
|---|---|---|
| Jumlah Kolom | `Σ aij` | Jumlahkan setiap kolom matriks |
| Normalisasi | `Nij = aij / jumlah_kolom_j` | Setiap elemen dibagi total kolomnya |
| Bobot (Wi) | `Wi = rata-rata baris Nij` | Eigen vector aproksimasi |
| λmax | `(Σ(matrik*bobot) / bobot) / n` | Nilai eigen maksimum |
| CI | `(λmax - n) / (n - 1)` | Consistency Index |
| CR | `CI / RI` | Consistency Ratio |
| Validasi | `CR < 0.1` | Konsisten jika < 0.1 |

**Tabel RI (Random Index)**:
| n | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| RI | 0 | 0 | 0.58 | 0.90 | 1.12 | 1.24 | 1.32 | 1.41 | 1.45 | 1.49 |

### 2. Service SAW (`src/services/saw.service.js`)

**Input**: Array aset (dengan nilai kriteria) + Array kriteria (dengan bobot dari AHP)

**Langkah Perhitungan**:
| Langkah | Rumus | Keterangan |
|---|---|---|
| Matriks Keputusan | `Xij` | Nilai aset i pada kriteria j |
| Max/Min per Kriteria | `max(Xj)`, `min(Xj)` | Untuk normalisasi |
| Normalisasi Benefit | `Rij = Xij / max(Xj)` | Criteria benefit |
| Normalisasi Cost | `Rij = min(Xj) / Xij` | Criteria cost |
| Nilai Preferensi | `Vi = Σ(Wj × Rij)` | Skor akhir per aset |
| **Nilai Limit** | `Nilai Limit = Vi × Harga Pasar` | **Output utama dalam Rupiah** |

**Output**: Ranking aset + detail normalisasi transparan setiap langkah

### 3. Controller SPK (`src/controllers/spk.controller.js`)

**`POST /api/spk/hitung-ahp`**:
1. Ambil kriteria berdasarkan `kategori_id`
2. Validasi ukuran matriks = jumlah kriteria
3. Jalankan `hitungAHP(matrix)`
4. **Jika CR ≥ 0.1 → Return HTTP 422 (STOP, minta perbaiki matriks)**
5. Jika konsisten → Simpan bobot ke tabel `bobot_ahp`
6. Return hasil lengkap + nama kriteria

**`POST /api/spk/hitung-saw`**:
1. Validasi bobot AHP sudah ada untuk kategori
2. Ambil semua aset + nilai aset dari kategori
3. Gabungkan kriteria + bobot terbaru
4. Jalankan `hitungSAW(asetList, kriteriaWithBobot)`
5. Simpan hasil ke tabel `hasil`
6. Return ranking + detail normalisasi

---

## 🧪 Hasil Test Algoritma

**Perintah**: `node src/tests/test_algoritma.js`

```
============================================================
🧪 TEST ALGORITMA AHP & SAW
============================================================

📌 TEST 1: AHP (Matriks 3x3 - Konsisten)
✅ Bobot Kriteria: [ 0.633346, 0.260498, 0.106156 ]
   λmax: 3.038715
   CI  : 0.019357
   CR  : 0.033374
   Status: ✅ Konsisten (CR = 0.0334 < 0.1). Bobot dapat digunakan.
✅ TEST 1 PASSED

📌 TEST 2: AHP (Tidak Konsisten - CR harus > 0.1)
   CR: [nilai > 0.1]
   Status: ❌ Tidak konsisten. Perbaiki matriks perbandingan!
✅ TEST 2 PASSED (CR terdeteksi > 0.1, sistem STOP)

📌 TEST 3: SAW (2 Aset, 3 Kriteria)
✅ Hasil Perankingan SAW:
   Rank 1: Laptop A
           Nilai Preferensi : 1
           Nilai Limit      : Rp 8.000.000
   Rank 2: Laptop B
           Nilai Preferensi : 0.707134
           Nilai Limit      : Rp 3.535.670,07
✅ TEST 3 PASSED

✅ SEMUA TEST SELESAI
```

**Hasil**: ✅ 3/3 Test LULUS

---

## 🔐 Validasi Logika Wajib (dari Panduan)
| Aturan | Implementasi |
|---|---|
| Kriteria harus sesuai kategori | ✅ `nilai.controller.js` — validasi `kriteriaKategoriIds` |
| SAW hanya pakai kriteria kategori terkait | ✅ `spk.controller.js` — filter `kategoriId` |
| CR > 0.1 → proses dihentikan | ✅ Return HTTP 422 dengan pesan error |
| Hasil harus transparan | ✅ `detailNormalisasi` dikirim dalam setiap response SAW |
