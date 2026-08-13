import { PrismaClient } from '@prisma/client';
import assert from 'node:assert';
import { hitungSAW } from '../services/saw.service.js';
import { hitungAHP } from '../services/ahp.service.js';
import { pembandingService } from '../services/pembanding.service.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Menjalankan Test Integrasi Final AHP & SAW...');
  
  await prisma.$transaction(async (tx) => {
    // 1. Test AHP
    console.log('[TEST] AHP Validations...');
    const matrixKonsisten = [[1, 2], [0.5, 1]];
    const ahpKonsisten = hitungAHP(matrixKonsisten);
    assert.strictEqual(ahpKonsisten.isConsistent, true);
    assert.ok(ahpKonsisten.CR <= 0.10);

    const sumBobot = ahpKonsisten.bobot.reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sumBobot - 1) < 0.0001);

    // 2. Test Median
    console.log('[TEST] Median & Outlier...');
    const pricesGanjil = [100, 200, 300, 400, 500];
    assert.strictEqual(pembandingService.calculateMedian(pricesGanjil), 300);

    const pricesGenap = [100, 200, 300, 400];
    assert.strictEqual(pembandingService.calculateMedian(pricesGenap), 250);

    const pricesOutlier = [100, 110, 105, 108, 10000]; // 10000 is outlier
    const filtered = pembandingService.removeOutliers(pricesOutlier);
    assert.strictEqual(filtered.includes(10000), false);
    assert.strictEqual(filtered.length, 4);

    // 3. Test Integrasi Database
    console.log('[TEST] Integrasi Database (Kategori, Kriteria, Versi Bobot, SAW)...');
    const kategori = await tx.kategori.create({ data: { nama: 'Test Kategori ' + Date.now() } });
    
    const kriteria1 = await tx.kriteria.create({ data: { kategoriId: kategori.id, nama: 'Krit 1 Benefit', tipe: 'benefit' } });
    const kriteria2 = await tx.kriteria.create({ data: { kategoriId: kategori.id, nama: 'Krit 2 Cost', tipe: 'cost' } });

    const bobotVersion = await tx.bobotVersion.create({
      data: {
        kategoriId: kategori.id,
        namaVersi: 'Test Version',
        cr: 0.05,
        aktif: true
      }
    });

    await tx.bobotAHP.createMany({
      data: [
        { versionId: bobotVersion.id, kriteriaId: kriteria1.id, bobot: 0.6 },
        { versionId: bobotVersion.id, kriteriaId: kriteria2.id, bobot: 0.4 }
      ]
    });

    const aset1 = await tx.aset.create({ data: { nama: 'Aset 1', kategoriId: kategori.id, hargaPasar: 1000 } });
    const aset2 = await tx.aset.create({ data: { nama: 'Aset 2', kategoriId: kategori.id, hargaPasar: 2000 } });

    await tx.nilaiAset.createMany({
      data: [
        { asetId: aset1.id, kriteriaId: kriteria1.id, nilai: 4 },
        { asetId: aset1.id, kriteriaId: kriteria2.id, nilai: 5 },
        { asetId: aset2.id, kriteriaId: kriteria1.id, nilai: 5 },
        { asetId: aset2.id, kriteriaId: kriteria2.id, nilai: 2 }, // Cost lower is better
      ]
    });

    const asetList = await tx.aset.findMany({ where: { kategoriId: kategori.id }, include: { nilaiAset: true } });
    
    const kriteriaWithBobot = [
      { id: kriteria1.id, nama: kriteria1.nama, tipe: kriteria1.tipe, bobot: 0.6 },
      { id: kriteria2.id, nama: kriteria2.nama, tipe: kriteria2.tipe, bobot: 0.4 }
    ];

    const sawResult = hitungSAW(asetList, kriteriaWithBobot);
    
    assert.strictEqual(sawResult.ranking.length, 2);
    // Fixed scale: benefit = score/5, cost = (6-score)/5.
    // Aset 1 = 0.8*0.6 + 0.2*0.4 = 0.56.
    // Aset 2 = 1.0*0.6 + 0.8*0.4 = 0.92 -> Rank 1.
    assert.strictEqual(sawResult.ranking[0].id, aset2.id); // Aset 2 must be rank 1
    assert.ok(sawResult.ranking[0].nilaiLimit > 0);

    console.log('[TEST] Rollback Transaksi (Semua Test Passed)');
    throw new Error('ROLLBACK_TRANSACTION');
  }).catch((err) => {
    if (err.message === 'ROLLBACK_TRANSACTION') {
      console.log('Test Integrasi Selesai (Rollback Aman). LULUS.');
    } else {
      throw err;
    }
  });
}

main().catch(err => {
  console.error('TEST GAGAL:', err);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
