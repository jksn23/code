# 📘 PANDUAN PERUBAHAN ARSITEKTUR SISTEM

## Implementasi Predefined AHP Weighting pada SPK AHP–SAW

---

# 🧠 1. LATAR BELAKANG PERUBAHAN

Pada sistem sebelumnya, metode **Analytical Hierarchy Process (AHP)** diimplementasikan secara dinamis, di mana pengguna (admin/pejabat lelang) harus melakukan input **pairwise comparison matrix**.

Namun, berdasarkan analisis usability dan literatur:

* AHP membutuhkan perbandingan sebanyak:
  [
  \frac{n(n-1)}{2}
  ]
* Rentan inkonsistensi (CR > 0.1)
* Tidak user-friendly untuk pengguna awam

---

## 🎯 Solusi

Mengubah arsitektur menjadi:

> ✅ **Predefined Weighting (AHP Offline + SAW Online)**

Artinya:

* AHP dihitung **di luar sistem (offline)**
* Bobot disimpan langsung di dalam kode (hardcoded / database)
* User hanya menginput nilai kriteria (untuk SAW)

---

# 🔄 2. PERUBAHAN ARSITEKTUR SISTEM

## 🔴 Sebelum (Dynamic AHP)

* Input pairwise comparison
* Hitung eigen vector
* Hitung consistency ratio
* Lanjut SAW

---

## 🟢 Sesudah (Static AHP)

### Flow Baru:

1. User input nilai kriteria
2. Sistem ambil bobot (predefined)
3. Normalisasi SAW
4. Hitung nilai preferensi
5. Konversi ke nilai limit

---

# 🧩 3. STRUKTUR KATEGORI DAN KRITERIA

---

## 🟢 A. TANAH & BANGUNAN

### Kriteria & Bobot

| Kode | Kriteria               | Bobot |
| ---- | ---------------------- | ----- |
| K1   | Lokasi & Aksesibilitas | 0.25  |
| K2   | Legalitas              | 0.20  |
| K3   | Luas                   | 0.15  |
| K4   | Kondisi Fisik          | 0.12  |
| K5   | Fasilitas Sekitar      | 0.10  |
| K6   | Lingkungan & Risiko    | 0.10  |
| K7   | Potensi Pengembangan   | 0.08  |

---

## 🔵 B. KENDARAAN

### Kriteria & Bobot

| Kode | Kriteria          | Bobot |
| ---- | ----------------- | ----- |
| K1   | Kondisi Mesin     | 0.25  |
| K2   | Performa          | 0.18  |
| K3   | Kilometer         | 0.15  |
| K4   | Tahun Produksi    | 0.12  |
| K5   | Riwayat Kendaraan | 0.10  |
| K6   | Merek/Model       | 0.10  |
| K7   | Kondisi Fisik     | 0.10  |

---

## 🟡 C. ELEKTRONIK

### Kriteria & Bobot

| Kode | Kriteria           | Bobot |
| ---- | ------------------ | ----- |
| K1   | Kondisi Barang     | 0.25  |
| K2   | Spesifikasi Teknis | 0.20  |
| K3   | Performa/Fungsi    | 0.18  |
| K4   | Usia Pemakaian     | 0.15  |
| K5   | Merek              | 0.12  |
| K6   | Kelengkapan        | 0.10  |

---

# 💻 4. IMPLEMENTASI DALAM KODE

---

## 🔹 A. Representasi Bobot (Contoh JSON)

```json
{
  "tanah": {
    "lokasi": 0.25,
    "legalitas": 0.20,
    "luas": 0.15,
    "kondisi": 0.12,
    "fasilitas": 0.10,
    "lingkungan": 0.10,
    "potensi": 0.08
  },
  "kendaraan": {
    "mesin": 0.25,
    "performa": 0.18,
    "kilometer": 0.15,
    "tahun": 0.12,
    "riwayat": 0.10,
    "merek": 0.10,
    "fisik": 0.10
  },
  "elektronik": {
    "kondisi": 0.25,
    "spesifikasi": 0.20,
    "performa": 0.18,
    "usia": 0.15,
    "merek": 0.12,
    "kelengkapan": 0.10
  }
}
```

---

## 🔹 B. Pseudocode SAW

```python
for setiap_kriteria:
    if benefit:
        normalisasi = nilai / max(nilai)
    else:
        normalisasi = min(nilai) / nilai

nilai_preferensi += bobot * normalisasi
```

---

## 🔹 C. Perhitungan Nilai Limit

```python
nilai_limit = nilai_preferensi * harga_pasar
```

---

# 🗃️ 5. PERUBAHAN DATABASE

## ❌ Hapus / Tidak Digunakan Lagi

* tabel_pairwise
* tabel_ahp_matrix
* tabel_consistency_ratio

---

## ✅ Tetap Digunakan

* tabel_kategori
* tabel_kriteria
* tabel_nilai_aset
* tabel_aset

---

## ➕ Opsional (Jika Tidak Hardcode)

* tabel_bobot_kriteria

---

# 🔄 6. PERUBAHAN USER FLOW

---

## 🔴 Sebelumnya:

User → Input AHP → Validasi CR → SAW

---

## 🟢 Sekarang:

User → Input nilai kriteria → SAW → Output

---

# 🎯 7. KEUNTUNGAN PERUBAHAN

## ✔ Dari sisi sistem:

* Lebih sederhana
* Lebih cepat
* Lebih stabil

## ✔ Dari sisi user:

* Tidak perlu memahami AHP
* Tidak ada error CR
* Lebih mudah digunakan

## ✔ Dari sisi akademis:

* Tetap valid (AHP dilakukan oleh expert)
* Sesuai pendekatan Hybrid MCDM

---

# 🧠 8. KESIMPULAN

Perubahan dari AHP dinamis ke predefined weighting:

> ✅ Meningkatkan usability
> ✅ Mengurangi kompleksitas
> ✅ Tetap mempertahankan validitas ilmiah

---

# 🚀 9. NEXT DEVELOPMENT (OPSIONAL)

* Tambahkan fitur update bobot oleh admin (expert mode)
* Tambahkan visualisasi hasil SPK
* Tambahkan audit log perhitungan

---

# 📌 END OF DOCUMENT
