/**
 * migrate_legacy_comparables.js
 * ─────────────────────────────────────────────────────────────────────────────
 * P0 — Migrasi data pembanding legacy ke format P0 yang valid.
 *
 * Strategi migrasi:
 *  1. URL bertipe HALAMAN_PENCARIAN → statusKecocokan=TIDAK_LAYAK, statusValidasi=DITOLAK
 *  2. URL TIDAK_VALID atau tidak dapat diparsing → idem
 *  3. URL DETAIL_IKLAN → pertahankan, jalankan matching ulang
 *  4. Harga = 0 atau negatif → statusKecocokan=TIDAK_LAYAK
 *  5. Set jenisSumber=SCRAPED_REAL untuk data lama (asumsi dari scraper)
 *  6. Hitung canonicalUrl dan canonicalUrlHash untuk semua data
 *
 * Cara menjalankan:
 *   node backend/scripts/migrate_legacy_comparables.js [--dry-run] [--aset-id=123]
 *
 * --dry-run : tampilkan perubahan tanpa menyimpan ke database
 * --aset-id : hanya proses satu aset tertentu
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { processUrl } from '../src/services/url_integrity.js';
dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ASET_ID_ARG = args.find((a) => a.startsWith('--aset-id='));
const SPECIFIC_ASET_ID = ASET_ID_ARG ? parseInt(ASET_ID_ARG.split('=')[1]) : null;

const BATCH_SIZE = 100;

// ── Stats ─────────────────────────────────────────────────────────────────────

const stats = {
  total: 0,
  detailIklan: 0,
  halamanPencarian: 0,
  tidakValid: 0,
  hargaTidakValid: 0,
  statusDitolak: 0,
  dipertahankan: 0,
  errors: 0,
};

// ── Migration Logic ───────────────────────────────────────────────────────────

async function migrateBatch(pembandingBatch) {
  for (const p of pembandingBatch) {
    stats.total++;

    try {
      // Proses URL
      const urlInfo = processUrl(p.sourceUrl);

      // Tentukan apakah data ini layak dipertahankan
      const harga = parseFloat(p.harga);
      const hargaInvalid = !harga || harga <= 0;

      let statusValidasi = p.statusValidasi;
      let statusKecocokan;
      let alasanMigrasi = [];

      // Klasifikasi berdasarkan URL
      if (urlInfo.statusIntegritasUrl === 'DETAIL_IKLAN') {
        stats.detailIklan++;

        if (hargaInvalid) {
          stats.hargaTidakValid++;
          statusKecocokan = 'TIDAK_LAYAK';
          alasanMigrasi.push('Harga tidak valid (0 atau negatif)');
          if (statusValidasi === 'MENUNGGU') statusValidasi = 'DITOLAK';
        } else {
          statusKecocokan = p.statusKecocokan || 'PERLU_TINJAU';
          stats.dipertahankan++;
          alasanMigrasi.push('URL valid (detail iklan), dipertahankan');
        }
      } else if (urlInfo.statusIntegritasUrl === 'HALAMAN_PENCARIAN') {
        stats.halamanPencarian++;
        statusKecocokan = 'TIDAK_LAYAK';
        statusValidasi = 'DITOLAK';
        stats.statusDitolak++;
        alasanMigrasi.push(`URL halaman pencarian (bukan detail iklan): ${urlInfo.alasan}`);
      } else {
        // TIDAK_VALID atau BELUM_DIVERIFIKASI
        stats.tidakValid++;
        statusKecocokan = 'TIDAK_LAYAK';
        if (statusValidasi === 'MENUNGGU') statusValidasi = 'DITOLAK';
        stats.statusDitolak++;
        alasanMigrasi.push(`URL tidak valid: ${urlInfo.alasan}`);
      }

      const updateData = {
        jenisSumber: p.jenisSumber || 'SCRAPED_REAL',
        statusIntegritasUrl: urlInfo.statusIntegritasUrl,
        statusKecocokan,
        canonicalUrl: urlInfo.canonicalUrl,
        canonicalUrlHash: urlInfo.canonicalUrlHash,
        sourceDomain: urlInfo.sourceDomain,
        statusValidasi,
        alasanKecocokan: {
          ...(p.alasanKecocokan && typeof p.alasanKecocokan === 'object' ? p.alasanKecocokan : {}),
          migrasi: {
            tanggal: new Date().toISOString(),
            alasan: alasanMigrasi,
            urlAsli: p.sourceUrl,
          },
        },
      };

      if (DRY_RUN) {
        console.log(`[DRY-RUN] ID=${p.id} | Aset=${p.asetId} | ` +
          `URL: ${urlInfo.statusIntegritasUrl} | ` +
          `Kecocokan: ${statusKecocokan} | ` +
          `Validasi: ${p.statusValidasi}→${statusValidasi}`);
        console.log(`          Alasan: ${alasanMigrasi.join('; ')}`);
      } else {
        // Handle duplicate canonical URL
        if (urlInfo.canonicalUrlHash) {
          const existing = await prisma.dataPembanding.findFirst({
            where: {
              asetId: p.asetId,
              canonicalUrlHash: urlInfo.canonicalUrlHash,
              id: { not: p.id },
            },
          });

          if (existing) {
            console.log(`⚠️  Duplikat URL ditemukan: ID=${p.id} duplikat dari ID=${existing.id} (aset=${p.asetId})`);
            // Tandai yang lama (p) sebagai DITOLAK, pertahankan yang paling baru
            updateData.statusKecocokan = 'TIDAK_LAYAK';
            updateData.statusValidasi = 'DITOLAK';
            alasanMigrasi.push(`Duplikat dari ID=${existing.id}`);
            updateData.alasanKecocokan.migrasi.alasan = alasanMigrasi;
            updateData.canonicalUrlHash = null; // Hapus hash agar tidak conflict
          }
        }

        await prisma.dataPembanding.update({
          where: { id: p.id },
          data: updateData,
        });
      }
    } catch (err) {
      stats.errors++;
      console.error(`❌ Error ID=${p.id}:`, err.message);
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔄 Mulai migrasi data pembanding legacy...');
  if (DRY_RUN) console.log('⚠️  MODE DRY-RUN — tidak ada yang akan disimpan ke database\n');
  if (SPECIFIC_ASET_ID) console.log(`🎯 Hanya memproses aset ID: ${SPECIFIC_ASET_ID}\n`);

  const where = {};
  if (SPECIFIC_ASET_ID) where.asetId = SPECIFIC_ASET_ID;

  // Hitung total
  const total = await prisma.dataPembanding.count({ where });
  console.log(`📊 Total data pembanding yang akan diproses: ${total}\n`);

  let offset = 0;
  while (true) {
    const batch = await prisma.dataPembanding.findMany({
      where,
      skip: offset,
      take: BATCH_SIZE,
      orderBy: { id: 'asc' },
    });

    if (!batch.length) break;

    console.log(`Processing batch ${Math.floor(offset / BATCH_SIZE) + 1} (${batch.length} records)...`);
    await migrateBatch(batch);
    offset += BATCH_SIZE;
  }

  console.log('\n══════════════════════════════════════════');
  console.log('📊 RINGKASAN MIGRASI');
  console.log('══════════════════════════════════════════');
  console.log(`Total diproses    : ${stats.total}`);
  console.log(`URL Detail Iklan  : ${stats.detailIklan} (valid)`);
  console.log(`URL Pencarian     : ${stats.halamanPencarian} (ditolak)`);
  console.log(`URL Tidak Valid   : ${stats.tidakValid} (ditolak)`);
  console.log(`Harga Tidak Valid : ${stats.hargaTidakValid}`);
  console.log(`Status DITOLAK    : ${stats.statusDitolak}`);
  console.log(`Dipertahankan     : ${stats.dipertahankan}`);
  console.log(`Errors            : ${stats.errors}`);
  if (DRY_RUN) console.log('\n⚠️  Semua di atas hanya simulasi. Jalankan tanpa --dry-run untuk menyimpan.');
  console.log('══════════════════════════════════════════\n');
}

main()
  .catch((err) => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
