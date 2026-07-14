/**
 * import_limit_validation.js
 * ─────────────────────────────────────────────────────────────────────────────
 * P1 — Script CLI untuk mengimpor data acuan validasi formula dari file CSV.
 *
 * Format CSV:
 *   nama_aset,nilai_acuan,jenis_nilai_acuan,sumber_acuan,tanggal_acuan,catatan
 *
 * Contoh Baris CSV:
 *   "Honda Beat 2021",11500000,"NILAI_LIMIT_AKTUAL","Katalog Risalah Lelang 2026","2026-05-10","Validasi sampel ke-1"
 *
 * Cara menjalankan:
 *   node backend/scripts/import_limit_validation.js path/to/data.csv
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { addValidasi } from '../src/services/limit_validation.service.js';

dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const csvPath = args[0];

if (!csvPath) {
  console.error('❌ Harap berikan path file CSV sebagai argumen.');
  console.log('   Contoh: node backend/scripts/import_limit_validation.js data_validasi.csv');
  process.exit(1);
}

// Helper untuk parse baris CSV sederhana (termasuk handling quote)
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function main() {
  const fullPath = path.resolve(csvPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ File CSV tidak ditemukan di: ${fullPath}`);
    process.exit(1);
  }

  console.log(`📖 Membaca file CSV: ${fullPath}`);
  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length <= 1) {
    console.error('❌ File CSV kosong atau hanya berisi header.');
    process.exit(1);
  }

  // Parse header
  const header = parseCsvLine(lines[0]);
  console.log('Header CSV:', header);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length < 4) {
      console.warn(`⚠️  Baris ${i + 1} dilewati karena format tidak lengkap:`, lines[i]);
      errorCount++;
      continue;
    }

    const [namaAset, rawNilaiAcuan, jenisNilaiAcuan, sumberAcuan, rawTanggalAcuan, catatan] = row;
    const nilaiAcuan = parseFloat(rawNilaiAcuan);

    if (isNaN(nilaiAcuan) || nilaiAcuan <= 0) {
      console.warn(`⚠️  Baris ${i + 1} dilewati karena nilai acuan tidak valid: ${rawNilaiAcuan}`);
      errorCount++;
      continue;
    }

    try {
      // Cari aset berdasarkan nama
      const aset = await prisma.aset.findFirst({
        where: { nama: { contains: namaAset } },
        include: { hasil: { orderBy: { id: 'desc' }, take: 1 } },
      });

      if (!aset) {
        console.warn(`⚠️  Aset dengan nama "${namaAset}" (Baris ${i + 1}) tidak ditemukan di database — skip`);
        errorCount++;
        continue;
      }

      if (!aset.hasil || aset.hasil.length === 0) {
        console.warn(`⚠️  Aset "${namaAset}" (Baris ${i + 1}) belum memiliki hasil penilaian SAW — skip`);
        errorCount++;
        continue;
      }

      const hasil = aset.hasil[0];
      const tanggalAcuan = rawTanggalAcuan ? new Date(rawTanggalAcuan) : null;

      // Panggil service untuk menyimpan validasi
      const saved = await addValidasi({
        asetId: aset.id,
        hasilId: hasil.id,
        jenisNilaiAcuan,
        nilaiAcuan,
        sumberAcuan,
        tanggalAcuan,
        catatan: catatan || `Imported dari CSV (Baris ${i + 1})`,
      });

      console.log(`   ✅ Berhasil memvalidasi Aset: "${aset.nama}" | Limit: Rp ${Number(hasil.nilaiLimit).toLocaleString()} | Acuan: Rp ${nilaiAcuan.toLocaleString()}`);
      successCount++;
    } catch (err) {
      console.error(`   ❌ Gagal memproses Baris ${i + 1} (${namaAset}):`, err.message);
      errorCount++;
    }
  }

  console.log('\n══════════════════════════════════════════');
  console.log('📈 RINGKASAN IMPORT VALIDASI LIMIT');
  console.log('══════════════════════════════════════════');
  console.log(`Berhasil diimpor : ${successCount} baris`);
  console.log(`Gagal/Dilewati   : ${errorCount} baris`);
  console.log('══════════════════════════════════════════\n');
}

main()
  .catch((err) => {
    console.error('❌ Error fatal saat menjalankan import:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
