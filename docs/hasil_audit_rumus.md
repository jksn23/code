# Hasil Audit Rumus AHP-SAW

## Ringkasan Audit

Audit dilakukan berdasarkan panduan pada `docs/audit_rumus.md` dengan fokus pada kesesuaian rumus AHP-SAW terhadap benchmark Excel.

Hasil utama:

- Implementasi SAW aktif ditemukan di `backend/src/services/saw.service.js`.
- Perhitungan nilai limit aktif ditemukan di `backend/src/services/saw.service.js`.
- Implementasi AHP runtime tidak ditemukan di source aktif.
- File `backend/src/tests/test_algoritma.js` masih mengimpor `backend/src/services/ahp.service.js`, tetapi file tersebut tidak ada.
- Bobot AHP saat ini bersifat predefined/statis melalui `backend/prisma/seedAhp.js`, bukan dihitung dari pairwise comparison matrix di sistem.

## 1. Source Code Terkait Perhitungan

### File yang Relevan

| File | Keterangan |
| --- | --- |
| `backend/src/services/saw.service.js` | Service utama perhitungan SAW, nilai preferensi, ranking, dan nilai limit |
| `backend/src/controllers/spk.controller.js` | Controller yang mengambil data aset, kriteria, bobot AHP statis, menjalankan SAW, lalu menyimpan hasil |
| `backend/prisma/seedAhp.js` | Seed bobot AHP predefined/statis |
| `backend/prisma/schema.prisma` | Struktur tabel `bobot_ahp`, `nilai_aset`, dan `hasil` |
| `backend/src/routes/spk.routes.js` | Route SPK aktif hanya menyediakan endpoint SAW dan hasil |
| `backend/src/tests/test_algoritma.js` | Test lama AHP-SAW, tetapi saat ini gagal karena `ahp.service.js` tidak ada |
| `frontend/src/pages/SAWPage.jsx` | UI untuk memanggil perhitungan SAW dan menampilkan hasil normalisasi |
| `frontend/src/services/api.js` | API client untuk endpoint `/spk/hitung-saw` dan `/spk/hasil/:kategori_id` |

## 2. Lokasi Rumus Dalam Kode

| File | Function | Baris Kode | Jenis Rumus | Status |
| --- | --- | ---: | --- | --- |
| `backend/src/services/saw.service.js` | `hitungSAW()` | 38-39 | Max/min per kriteria | BENAR |
| `backend/src/services/saw.service.js` | `hitungSAW()` | 45-46 | Normalisasi benefit `Rij = Xij / max(Xj)` | BENAR |
| `backend/src/services/saw.service.js` | `hitungSAW()` | 47-50 | Normalisasi cost `Rij = min(Xj) / Xij` | BENAR, dengan catatan nilai 0 |
| `backend/src/services/saw.service.js` | `hitungSAW()` | 55-57 | Nilai preferensi `Vi = Σ(Wj * Rij)` | BENAR |
| `backend/src/services/saw.service.js` | `hitungSAW()` | 59-65 | Nilai limit `Vi * hargaPasar` | BENAR |
| `backend/src/services/saw.service.js` | `hitungSAW()` | 77-79 | Ranking berdasarkan nilai preferensi descending | BENAR |
| `backend/prisma/seedAhp.js` | `DATA_STATIS` | 14-52 | Bobot AHP statis | TIDAK SESUAI benchmark Excel runtime |
| `backend/prisma/seedAhp.js` | `CR_STATIS` | 52-53 | Consistency Ratio | ERROR untuk audit rumus, karena hardcoded `0.0` |
| `backend/src/routes/spk.routes.js` | route | 5-6 | Endpoint SPK | Tidak ada endpoint `/hitung-ahp` |
| `backend/src/tests/test_algoritma.js` | test | 10 | Import AHP | ERROR, file `ahp.service.js` tidak ditemukan |

## 3. Audit Rumus AHP

### Benchmark Excel

Rumus AHP yang diminta pada panduan:

```text
normalized[i][j] = matrix[i][j] / sumColumn[j]
weight[i] = average(normalizedRow[i])
lambda[i] = weightedSumRow[i] / weight[i]
lambdaMax = average(lambda[i])
CI = (lambdaMax - n) / (n - 1)
CR = CI / RI
```

### Temuan Source Code

Implementasi rumus AHP runtime tidak ditemukan.

Source aktif tidak memiliki:

- pairwise comparison matrix
- sum column
- normalization matrix
- eigen vector / priority weight dari matriks
- lambda max
- consistency index (CI)
- consistency ratio (CR)
- endpoint `POST /api/spk/hitung-ahp`

File test lama masih mengacu ke service AHP:

```js
import { hitungAHP } from '../services/ahp.service.js';
```

Namun file berikut tidak ada:

```text
backend/src/services/ahp.service.js
```

### Status AHP

**ERROR / TIDAK VALID terhadap benchmark Excel runtime.**

Alasannya: sistem saat ini tidak menghitung bobot AHP dari matriks pairwise di source code aktif. Bobot langsung di-seed dari nilai statis.

## 4. Audit Bobot AHP Statis

Bobot predefined berada di:

```js
const DATA_STATIS = [
  {
    namaKategori: 'Tanah & Bangunan',
    kriteria: [
      { nama: 'Lokasi & Aksesibilitas', tipe: 'benefit', bobot: 0.25 },
      { nama: 'Legalitas',              tipe: 'benefit', bobot: 0.20 },
      { nama: 'Luas',                   tipe: 'benefit', bobot: 0.15 },
      { nama: 'Kondisi Fisik',          tipe: 'benefit', bobot: 0.12 },
      { nama: 'Fasilitas Sekitar',      tipe: 'benefit', bobot: 0.10 },
      { nama: 'Lingkungan & Risiko',    tipe: 'benefit', bobot: 0.10 },
      { nama: 'Potensi Pengembangan',   tipe: 'benefit', bobot: 0.08 },
    ],
  },
];
```

Nilai CR dibuat statis:

```js
const CR_STATIS = 0.0;
```

### Penilaian

Bobot statis boleh digunakan jika arsitektur sistem memang menetapkan AHP dilakukan secara offline oleh expert. Namun, terhadap panduan audit `docs/audit_rumus.md`, pendekatan ini tidak bisa diverifikasi sebagai rumus AHP di source code karena tidak ada proses perhitungan pairwise, eigen vector, lambda max, CI, dan CR.

### Catatan

Total bobot pada seed sudah berjumlah 1.0 untuk setiap kategori:

| Kategori | Total Bobot |
| --- | ---: |
| Tanah & Bangunan | 1.000000 |
| Kendaraan | 1.000000 |
| Elektronik | 1.000000 |

## 5. Audit Rumus SAW

### Benchmark Excel

```text
Benefit:
Rij = Xij / max(Xj)

Cost:
Rij = min(Xj) / Xij

Nilai Preferensi:
Vi = Σ(weight[j] × Rij)
```

### Implementasi Source Code

#### Matriks Keputusan

```js
const matriksKeputusan = asetList.map((aset) =>
  kriteria.map((krit) => {
    const nilaiObj = aset.nilaiAset.find((nv) => nv.kriteriaId === krit.id);
    if (!nilaiObj) throw new Error(`Nilai aset "${aset.nama}" untuk kriteria "${krit.nama}" belum diisi`);
    return parseFloat(nilaiObj.nilai);
  })
);
```

Fungsi:

- Mengubah data nilai aset menjadi matriks keputusan.
- Setiap baris mewakili aset.
- Setiap kolom mewakili kriteria.
- Jika nilai kriteria belum diisi, sistem menghentikan proses dengan error.

Status: **BENAR**.

#### Max dan Min Per Kriteria

```js
const maxPerKriteria = kriteria.map((_, j) => Math.max(...matriksKeputusan.map((row) => row[j])));
const minPerKriteria = kriteria.map((_, j) => Math.min(...matriksKeputusan.map((row) => row[j])));
```

Fungsi:

- Mengambil nilai maksimum per kolom kriteria untuk normalisasi benefit.
- Mengambil nilai minimum per kolom kriteria untuk normalisasi cost.

Status: **BENAR**.

#### Normalisasi Benefit

```js
if (tipe === 'benefit') {
  return maxPerKriteria[j] === 0 ? 0 : val / maxPerKriteria[j];
}
```

Perbandingan dengan Excel:

```text
Rij = Xij / max(Xj)
```

Status: **BENAR**.

Catatan: jika semua nilai benefit 0, sistem mengembalikan 0 untuk menghindari pembagian nol.

#### Normalisasi Cost

```js
return val === 0 ? 0 : minPerKriteria[j] / val;
```

Perbandingan dengan Excel:

```text
Rij = min(Xj) / Xij
```

Status: **BENAR, dengan catatan**.

Catatan risiko:

- Jika `val = 0`, rumus Excel akan menghasilkan pembagian nol.
- Kode mengembalikan 0 untuk menghindari crash.
- Jika dalam domain bisnis nilai cost 0 berarti kondisi terbaik, hasil sistem dapat berbeda dari Excel.
- Disarankan validasi nilai cost harus lebih besar dari 0, atau tetapkan aturan eksplisit untuk nilai 0.

#### Nilai Preferensi

```js
const nilaiPreferensi = matriksNorm.map((row) =>
  row.reduce((sum, rij, j) => sum + rij * parseFloat(kriteria[j].bobot), 0)
);
```

Perbandingan dengan Excel:

```text
Vi = Σ(weight[j] × Rij)
```

Status: **BENAR**.

#### Nilai Limit

```js
nilaiLimit: parseFloat((nilaiPreferensi[i] * parseFloat(aset.hargaPasar)).toFixed(2)),
```

Perbandingan dengan benchmark:

```text
limit = Vi × hargaPasar
```

Status: **BENAR**.

Catatan:

- Pembulatan nilai limit dilakukan pada akhir perhitungan ke 2 desimal.
- Ini aman untuk penyimpanan nominal rupiah.

#### Ranking

```js
hasilSAW.sort((a, b) => b.nilaiPreferensi - a.nilaiPreferensi);
hasilSAW.forEach((item, index) => { item.ranking = index + 1; });
```

Fungsi:

- Mengurutkan hasil dari nilai preferensi tertinggi ke terendah.
- Ranking 1 diberikan ke nilai preferensi terbesar.

Status: **BENAR**.

## 6. Audit Controller SPK

Controller SAW berada di:

```js
export const hitungSAWController = async (req, res) => {
  const { kategori_id } = req.body;
  ...
  const hasilSAW = hitungSAW(asetList, kriteriaWithBobot);
  ...
};
```

Fungsi utama:

- Mengambil aset berdasarkan kategori.
- Mengambil kriteria berdasarkan kategori.
- Mengambil bobot predefined terbaru dari tabel `bobot_ahp`.
- Menjalankan `hitungSAW()`.
- Menghapus hasil lama untuk kategori tersebut.
- Menyimpan hasil baru ke tabel `hasil`.

Status: **BENAR untuk SAW**.

Catatan:

- Tidak ada controller AHP aktif.
- Bobot diambil dari tabel `bobot_ahp`, bukan dihitung saat request.

## 7. Audit Frontend

Frontend tidak melakukan perhitungan rumus AHP-SAW. Frontend hanya:

- Memilih kategori.
- Memanggil endpoint backend `/spk/hitung-saw`.
- Menampilkan bobot, max, min, nilai normalisasi, kontribusi, nilai preferensi, ranking, dan nilai limit.

Contoh pemanggilan API:

```js
const res = await hitungSAW({ kategori_id: selectedKategori });
```

Status: **BENAR**, karena perhitungan tetap berada di backend.

## 8. Hasil Verifikasi Test

Perintah yang dijalankan:

```bash
npm test
```

Lokasi:

```text
backend
```

Hasil:

```text
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
'backend/src/services/ahp.service.js'
imported from backend/src/tests/test_algoritma.js
```

Kesimpulan:

- Test resmi backend saat ini gagal.
- Penyebabnya bukan rumus SAW, tetapi file AHP yang direferensikan test tidak tersedia.
- Ini memperkuat temuan bahwa implementasi AHP runtime sudah hilang atau belum dibuat ulang.

## 9. Smoke Test SAW Manual

Data uji:

| Aset | Benefit K1 | Cost K2 | Harga Pasar |
| --- | ---: | ---: | ---: |
| A | 80 | 10 | 1000 |
| B | 100 | 20 | 2000 |

Bobot:

| Kriteria | Tipe | Bobot |
| --- | --- | ---: |
| K1 | benefit | 0.6 |
| K2 | cost | 0.4 |

Hitungan:

```text
A:
K1 = 80 / 100 = 0.8
K2 = 10 / 10 = 1
Vi = (0.6 * 0.8) + (0.4 * 1) = 0.88
Limit = 0.88 * 1000 = 880

B:
K1 = 100 / 100 = 1
K2 = 10 / 20 = 0.5
Vi = (0.6 * 1) + (0.4 * 0.5) = 0.8
Limit = 0.8 * 2000 = 1600
```

Output sistem:

| Aset | Nilai Preferensi | Nilai Limit | Ranking |
| --- | ---: | ---: | ---: |
| A | 0.88 | 880 | 1 |
| B | 0.8 | 1600 | 2 |

Status: **SAW cocok dengan rumus Excel**.

## 10. Risiko Perbedaan Dengan Excel

| Area | Risiko | Dampak |
| --- | --- | --- |
| AHP runtime tidak ada | Tidak bisa membuktikan bobot berasal dari pairwise matrix | Output tidak bisa diaudit sebagai AHP-SAW runtime |
| `CR_STATIS = 0.0` | CR tidak dihitung dari matriks | Validasi konsistensi AHP tidak benar-benar terjadi di sistem |
| Test mengimpor `ahp.service.js` yang tidak ada | Test backend gagal | Kualitas algoritma tidak terverifikasi otomatis |
| Nilai cost 0 | Kode mengembalikan 0, Excel akan pembagian nol | Output bisa berbeda jika data mengandung 0 |
| Bobot tidak divalidasi saat runtime | Jika data DB berubah dan total bobot bukan 1, preferensi bias | Hasil ranking bisa menyimpang |
| Dokumentasi lama tidak sinkron | README dan docs masih menyebut AHP runtime | Membingungkan saat audit/presentasi |

## 11. Kesimpulan Final

| Komponen | Status |
| --- | --- |
| AHP | ERROR |
| SAW | VALID |
| Nilai Limit | VALID |
| Struktur Algoritma | PERLU REVISI |

### Penilaian Akhir

Implementasi SAW dan nilai limit sudah sesuai dengan rumus benchmark Excel.

Namun, implementasi AHP runtime tidak tersedia. Sistem saat ini lebih tepat disebut menggunakan:

```text
AHP offline / predefined weighting + SAW online
```

bukan AHP-SAW runtime penuh, karena bobot AHP tidak dihitung dari pairwise comparison matrix di source code aktif.

## 12. Rekomendasi Refactor

### Jika Targetnya AHP-SAW Runtime Sesuai Excel

Tambahkan kembali file:

```text
backend/src/services/ahp.service.js
```

Isi minimal yang diperlukan:

- validasi matriks persegi
- validasi diagonal bernilai 1
- validasi reciprocal matrix
- hitung sum column
- hitung normalized matrix
- hitung eigen vector / priority weight
- hitung weighted sum row
- hitung lambda per kriteria
- hitung lambda max
- hitung CI
- hitung CR dengan RI table
- return status konsistensi `CR <= 0.1`

Tambahkan endpoint:

```text
POST /api/spk/hitung-ahp
```

Kemudian simpan bobot ke tabel `bobot_ahp` hanya jika:

```text
CR <= 0.1
```

### Jika Targetnya AHP Offline + SAW Online

Perbaiki dokumentasi dan test agar sesuai arsitektur aktual:

- Hapus klaim bahwa sistem menghitung AHP runtime.
- Ubah README agar menyebut bobot predefined dari expert.
- Ubah `backend/src/tests/test_algoritma.js` agar tidak mengimpor `ahp.service.js`.
- Tambahkan test khusus SAW.
- Tambahkan test validasi total bobot per kategori harus 1.0.
- Simpan dokumen sumber bobot AHP offline, misalnya hasil Excel, supaya bobot predefined tetap bisa diaudit.

### Perbaikan SAW yang Disarankan

Tambahkan validasi:

```js
const totalBobot = kriteria.reduce((sum, item) => sum + Number(item.bobot), 0);
if (Math.abs(totalBobot - 1) > 0.000001) {
  throw new Error('Total bobot kriteria harus 1.0');
}
```

Tambahkan validasi cost:

```js
if (tipe === 'cost' && val <= 0) {
  throw new Error(`Nilai cost untuk kriteria "${kriteria[j].nama}" harus lebih besar dari 0`);
}
```

Dengan dua validasi ini, hasil SAW akan lebih stabil dan lebih mudah disamakan dengan Excel.
