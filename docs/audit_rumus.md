Saya ingin Anda bertindak sebagai **AI Code Auditor / Algorithm Verifier** untuk proyek skripsi saya.

## 🎯 Tujuan Audit

Periksa apakah **rumus perhitungan AHP–SAW pada source code sistem saya** sudah benar dan sudah sesuai dengan **model pengujian Microsoft Excel** yang saya gunakan sebagai benchmark.

Sistem saya adalah:

> Sistem Pendukung Keputusan Penentuan Nilai Aset dan Sistem Lelang Online menggunakan metode AHP–SAW

Metode kerja sistem:

* AHP digunakan untuk menentukan bobot kriteria
* SAW digunakan untuk menghitung nilai preferensi alternatif
* Nilai Limit = Nilai Preferensi × Harga Pasar

---

# 📌 Tugas Anda

## 1. Identifikasi Semua Source Code yang Berkaitan Dengan Perhitungan

Telusuri seluruh project dan temukan file / function / method yang berkaitan dengan:

### AHP

* pairwise comparison matrix
* sum column
* normalization matrix
* eigen vector / priority weight
* lambda max
* consistency index (CI)
* consistency ratio (CR)

### SAW

* normalisasi benefit
* normalisasi cost
* weighted sum
* ranking

### Nilai Limit

* perhitungan nilai limit dari hasil SAW

---

## 2. Tunjukkan Lokasi Rumus Dalam Kode

Untuk setiap rumus yang ditemukan, tampilkan:

| File | Function | Baris Kode | Jenis Rumus | Status |
| ---- | -------- | ---------- | ----------- | ------ |

Contoh:

| app/Services/AHPService.php | calculateWeights() | line 44–68 | Eigen Vector | BENAR |

---

## 3. Bandingkan Dengan Rumus Excel (Benchmark)

Gunakan standar rumus berikut:

### AHP

Normalisasi:
normalized[i][j] = matrix[i][j] / sumColumn[j]

Bobot:
weight[i] = average(normalizedRow[i])

Lambda:
lambda[i] = weightedSumRow[i] / weight[i]

Lambda Max:
average(lambda[i])

CI:
(lambdaMax - n) / (n - 1)

CR:
CI / RI

---

### SAW

Benefit:
Rij = Xij / max(Xj)

Cost:
Rij = min(Xj) / Xij

Nilai Preferensi:
Vi = Σ(weight[j] × Rij)

---

### Nilai Limit

limit = Vi × hargaPasar

---

## 4. Audit Kesesuaian Rumus

Berikan penilaian:

### ✅ Jika sesuai:

Jelaskan kenapa sesuai

### ⚠️ Jika kurang tepat:

Jelaskan:

* rumus salah
* urutan salah
* pembulatan terlalu cepat
* cost/benefit salah
* variabel tertukar
* array index salah
* hardcode berbahaya

---

## 5. Tunjukkan Potongan Kode Penting

Jika menemukan bagian perhitungan, tampilkan snippet kode dan jelaskan fungsinya.

Contoh:

```php
$weight[$i] = array_sum($normalized[$i]) / $n;
```

Penjelasan:
Menghitung eigen vector dengan rata-rata baris normalisasi.

---

## 6. Berikan Kesimpulan Final

Nilai audit:

| Komponen           | Status              |
| ------------------ | ------------------- |
| AHP                | VALID / ERROR       |
| SAW                | VALID / ERROR       |
| Nilai Limit        | VALID / ERROR       |
| Struktur Algoritma | BAIK / PERLU REVISI |

---

## 7. Berikan Rekomendasi Refactor

Jika ada kekurangan, berikan saran:

* file mana diperbaiki
* rumus mana diperbaiki
* cara meningkatkan akurasi
* cara menyamakan output dengan Excel

---

# 📌 Cara Kerja yang Saya Inginkan

* Scan seluruh codebase
* Fokus pada logika perhitungan
* Jangan hanya cek syntax
* Prioritaskan validasi matematika
* Jika ada lebih dari satu implementasi rumus, tunjukkan semuanya

---

# 📌 Output Yang Saya Harapkan

Saya ingin hasil audit seperti reviewer profesional:

1. Lokasi rumus di source code
2. Rumus cocok / tidak cocok dengan Excel
3. Bagian mana yang salah
4. Risiko hasil berbeda dengan Excel
5. Cara memperbaiki

---

# 📌 Catatan Penting

Jika project memakai Laravel / PHP / JavaScript / TypeScript:
tetap telusuri semua service, controller, helper, composable, util, hook, model, API route.

Jika rumus tersebar di frontend dan backend:
jelaskan semuanya.

Jika tidak menemukan rumus:
katakan file mana yang kemungkinan belum selesai.

Mulai audit sekarang secara menyeluruh dan teknis.
