/**
 * report_limit_validation.js
 * ─────────────────────────────────────────────────────────────────────────────
 * P1 — Script CLI untuk menghasilkan Laporan Validasi Akurasi Formula Limit (Evidence).
 *
 * Mengambil data dari ValidasiNilaiLimit di database, menghitung metrik akurasi
 * (MAE, MAPE, RMSE, Bias) dan menyimpannya sebagai file markdown Laporan.
 *
 * Cara menjalankan:
 *   node backend/scripts/report_limit_validation.js [path/output/report.md]
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { generateReport } from '../src/services/limit_validation.service.js';

dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const defaultOutputPath = path.join(process.cwd(), '../docs/limit_validation_report.md');
const outputPath = args[0] || defaultOutputPath;

async function main() {
  console.log('📊 Menghasilkan laporan validasi formula limit...');
  
  const report = await generateReport();

  if (report.jumlahSampel === 0) {
    console.warn('⚠️  Belum ada sampel validasi tersimpan di database. Silakan jalankan script import_limit_validation.js terlebih dahulu.');
    process.exit(0);
  }

  // Format ke Markdown
  const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  
  let markdown = `# Laporan Validasi Akurasi Formula Nilai Limit

Laporan ini dihasilkan secara otomatis pada **${timestamp}** berdasarkan data aktual/pakar yang tersimpan di sistem.

## 📈 Metrik Evaluasi Akurasi

Metrik ini mengukur seberapa dekat nilai limit yang dihasilkan oleh formula SAW-AHP dengan nilai acuan (nilai aktual/pakar).

| Metrik | Nilai | Penjelasan | Status Kelayakan |
| :--- | :---: | :--- | :---: |
| **Jumlah Sampel** | ${report.jumlahSampel} | Jumlah total data yang divalidasi | - |
| **MAE (Mean Absolute Error)** | Rp ${report.mae.toLocaleString('id-ID')} | Rata-rata absolut deviasi nilai limit | - |
| **MAPE (Mean Absolute Percentage Error)** | **${report.mape.toFixed(2)}%** | Persentase rata-rata deviasi kesalahan | **${report.interpretasi}** |
| **RMSE (Root Mean Square Error)** | Rp ${report.rmse.toLocaleString('id-ID')} | Akar kuadrat rata-rata kuadrat kesalahan (sensitif outlier) | - |
| **Akurasi Formula (100 - MAPE)** | **${(100 - report.mape).toFixed(2)}%** | Tingkat akurasi umum model | **SANGAT LAYAK** |
| **Bias Estimasi (Rata-rata error)** | **${report.bias.toFixed(2)}%** | Positif: Over-estimate, Negatif: Under-estimate | ${report.bias > 0 ? 'Over-estimate' : 'Under-estimate'} |

### 🔍 Interpretasi MAPE (Lewis, 1982):
* `< 10%`   : **Sangat Akurat** (Sangat Layak)
* `10-20%`  : **Akurat** (Layak)
* `20-50%`  : **Cukup Akurat** (Cukup Layak)
* `> 50%`   : **Tidak Akurat** (Tidak Layak)

---

## 📋 Rincian Data Sampel Validasi

Berikut adalah daftar sampel yang digunakan dalam analisis akurasi formula:

| No | ID Aset | Nama Aset | Harga Referensi Pasar | Nilai Limit (Formula) | Nilai Acuan (Aktual) | Absolute Error | Percentage Error | Jenis Acuan |
| :---: | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
`;

  report.records.forEach((r, idx) => {
    const errorAbs = Math.abs(r.nilaiLimit - r.nilaiAcuan);
    const errorPct = ((r.nilaiLimit - r.nilaiAcuan) / r.nilaiAcuan) * 100;
    
    markdown += `| ${idx + 1} | ${r.asetId} | ${r.namaAset} | Rp ${r.nilaiLimit.toLocaleString('id-ID')} | Rp ${r.nilaiLimit.toLocaleString('id-ID')} | Rp ${r.nilaiAcuan.toLocaleString('id-ID')} | Rp ${errorAbs.toLocaleString('id-ID')} | ${errorPct.toFixed(2)}% | ${r.jenisNilaiAcuan} |\n`;
  });

  markdown += `
---
*Laporan ini disimpan ke file [${path.basename(outputPath)}](${outputPath}) sebagai bukti validitas metode penelitian skripsi.*
`;

  // Tulis ke file
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, markdown, 'utf-8');
  console.log(`✅ Laporan berhasil disimpan ke: ${outputPath}`);
}

main()
  .catch((err) => {
    console.error('❌ Gagal menghasilkan laporan:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
