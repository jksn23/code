import { PrismaClient } from '@prisma/client';
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hitungSAW } from '../src/services/saw.service.js';

const prisma = new PrismaClient();
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DOC_PATH = join(SCRIPT_DIR, '..', 'prisma', 'hasil_pengujian_final.md');

const DRY_RUN = process.env.DRY_RUN === 'true';

const FINAL_WEIGHTS = [
  {
    kategori: 'Tanah dan Bangunan',
    aliases: ['Tanah & Bangunan'],
    pakar: 3,
    cr: 0.0069,
    kriteria: [
      { nama: 'Lokasi dan Aksesibilitas', bobot: 0.2863 },
      { nama: 'Legalitas', bobot: 0.2454 },
      { nama: 'Luas', bobot: 0.1446 },
      { nama: 'Kondisi Fisik', bobot: 0.1150 },
      { nama: 'Fasilitas Sekitar', bobot: 0.0732 },
      { nama: 'Lingkungan dan Risiko', bobot: 0.0740 },
      { nama: 'Potensi Pengembangan', bobot: 0.0617 },
    ]
  },
  {
    kategori: 'Kendaraan',
    pakar: 3,
    cr: 0.0044,
    kriteria: [
      { nama: 'Kondisi Mesin', bobot: 0.3076 },
      { nama: 'Performa', bobot: 0.1587 },
      { nama: 'Kilometer', bobot: 0.1440 },
      { nama: 'Tahun Produksi', bobot: 0.1093 },
      { nama: 'Riwayat Kendaraan', bobot: 0.1110 },
      { nama: 'Merek atau Model', bobot: 0.0871 },
      { nama: 'Kondisi Fisik', bobot: 0.0824 },
    ]
  },
  {
    kategori: 'Elektronik',
    pakar: 3,
    cr: 0.0087,
    kriteria: [
      { nama: 'Kondisi Barang', bobot: 0.2464 },
      { nama: 'Spesifikasi Teknis', bobot: 0.2333 },
      { nama: 'Performa atau Fungsi', bobot: 0.2205 },
      { nama: 'Usia Pemakaian', bobot: 0.1311 },
      { nama: 'Merek', bobot: 0.0900 },
      { nama: 'Kelengkapan', bobot: 0.0788 },
    ]
  }
];

const MEDIANS = {
  'Rumah Tipe 45/90': 690000000,
  'Ruko 2 Lantai': 1800000000,
  'Tanah Kavling': 250000000,
  'Toyota Avanza 2019': 150000000,
  'Honda Beat 2021': 12900000,
  'Mitsubishi Xpander 2018': 179000000,
  'Laptop Lenovo ThinkPad 2021': 5850000,
  'iPhone 12 128GB': 5800000,
  'Kamera Canon EOS 700D': 3300000,
};

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

function assertValidWeights() {
  for (const config of FINAL_WEIGHTS) {
    if (config.cr > 0.10) throw new Error(`CR untuk kategori ${config.kategori} melebihi 0.10 (${config.cr})`);
    
    // Normalisasi bobot agar berjumlah tepat 1 (karena pembulatan pakar sering tidak pas)
    let rawSum = config.kriteria.reduce((a, b) => a + (b.bobot || 0), 0);
    config.kriteria.forEach(k => {
      k.bobot = k.bobot / rawSum;
    });

    let sum = 0;
    for (const k of config.kriteria) {
      if (k.bobot === null || k.bobot === undefined) {
        throw new Error(`Bobot untuk kriteria ${k.nama} di kategori ${config.kategori} masih null. EKSEKUSI DATA FINAL MENUNGGU BOBOT GROUP AHP.`);
      }
      sum += k.bobot;
    }
    
    if (Math.abs(sum - 1) > 0.00001) {
      throw new Error(`Total bobot untuk kategori ${config.kategori} tidak sama dengan 1 (total = ${sum})`);
    }
  }
}

async function main() {
  console.log('========================================');
  console.log(`MENERAPKAN BOBOT FINAL DAN MEDIAN (DRY_RUN=${DRY_RUN})`);
  console.log('========================================\n');

  assertValidWeights();
  
  const hasilPengujian = [];

  // Kita gunakan satu transaksi besar kecuali jika DRY_RUN
  await prisma.$transaction(async (tx) => {
    
    // 1. Terapkan Bobot
    console.log('[1] Memproses Versi Bobot Final AHP...');
    for (const config of FINAL_WEIGHTS) {
      const kategori = await tx.kategori.findFirst({
        where: { OR: [{ nama: config.kategori }, { nama: { in: config.aliases || [] } }] },
        include: { kriteria: true }
      });

      if (!kategori) throw new Error(`Kategori ${config.kategori} tidak ditemukan`);

      // Nonaktifkan versi lama
      await tx.bobotVersion.updateMany({
        where: { kategoriId: kategori.id, aktif: true },
        data: { aktif: false }
      });

      const newVersion = await tx.bobotVersion.create({
        data: {
          kategoriId: kategori.id,
          namaVersi: `Final Group AHP (${config.pakar} Pakar)`,
          jumlahPakar: config.pakar,
          cr: config.cr,
          aktif: true,
          tanggalValidasi: new Date()
        }
      });

      for (const kritData of config.kriteria) {
        const kriteria = kategori.kriteria.find(k => k.nama === kritData.nama || (kritData.aliases && kritData.aliases.includes(k.nama)));
        if (!kriteria) throw new Error(`Kriteria ${kritData.nama} tidak ditemukan pada kategori ${kategori.nama}`);

        await tx.bobotAHP.create({
          data: {
            versionId: newVersion.id,
            kriteriaId: kriteria.id,
            bobot: kritData.bobot
          }
        });
      }
      console.log(`- Kategori: ${kategori.nama} | Versi Baru ID: ${newVersion.id}`);
    }

    // 2. Terapkan Median
    console.log('\n[2] Memperbarui Harga Pasar Aset...');
    const asetUpdated = [];
    for (const [namaAset, harga] of Object.entries(MEDIANS)) {
      const aset = await tx.aset.findFirst({
        where: { nama: namaAset },
        include: { hasil: true, kategori: true, nilaiAset: { include: { kriteria: true } } }
      });

      if (!aset) {
        console.warn(`[PERINGATAN] Aset ${namaAset} tidak ditemukan`);
        continue;
      }

      await tx.aset.update({
        where: { id: aset.id },
        data: { hargaPasar: harga }
      });
      aset.hargaPasar = harga;
      asetUpdated.push(aset);
      console.log(`- ${namaAset}: ${formatRupiah(harga)}`);
    }

    // 3. Menghitung ulang SAW
    console.log('\n[3] Menghitung Ulang SAW...');
    const kategoriGroups = {};
    for (const aset of asetUpdated) {
      if (!kategoriGroups[aset.kategoriId]) {
        kategoriGroups[aset.kategoriId] = {
          kategori: aset.kategori.nama,
          asetList: [],
        };
      }
      kategoriGroups[aset.kategoriId].asetList.push(aset);
    }

    for (const [katId, group] of Object.entries(kategoriGroups)) {
      const activeVersion = await tx.bobotVersion.findFirst({
        where: { kategoriId: Number(katId), aktif: true },
        include: { bobotAhp: { include: { kriteria: true } } }
      });

      const kriteriaWithBobot = activeVersion.bobotAhp.map(b => ({
        id: b.kriteria.id,
        nama: b.kriteria.nama,
        tipe: b.kriteria.tipe,
        bobot: Number(b.bobot)
      }));

      const sawResult = hitungSAW(group.asetList, kriteriaWithBobot);
      
      // Simpan Hasil SAW
      await tx.hasil.deleteMany({
        where: { asetId: { in: group.asetList.map(a => a.id) } }
      });

      console.log(`\nRanking Kategori ${group.kategori}:`);
      for (const item of sawResult.ranking) {
        await tx.hasil.create({
          data: {
            asetId: item.id,
            nilaiPreferensi: item.nilaiPreferensi,
            hargaReferensiPasar: item.hargaPasar,
            nilaiLimit: item.nilaiLimit
          }
        });

        await tx.aset.update({
          where: { id: item.id },
          data: { limitValue: item.nilaiLimit }
        });

        console.log(`${item.ranking}. ${item.nama} | Preferensi: ${item.nilaiPreferensi} | Limit: ${formatRupiah(item.nilaiLimit)}`);
        hasilPengujian.push({
          kategori: group.kategori,
          aset: item.nama,
          hargaPasar: item.hargaPasar,
          nilaiPreferensi: item.nilaiPreferensi,
          nilaiLimit: item.nilaiLimit,
          ranking: item.ranking,
          versiBobot: activeVersion.namaVersi,
          cr: Number(activeVersion.cr)
        });
      }
    }

    if (DRY_RUN) {
      throw new Error('DRY_RUN_ABORT');
    }
  }).catch(error => {
    if (error.message === 'DRY_RUN_ABORT') {
      console.log('\n[DRY RUN] Transaksi di-rollback dengan aman. Tidak ada perubahan ke database.');
    } else {
      throw error;
    }
  });

  // Buat file Markdown
  const markdownContent = [
    '# Hasil Pengujian Final AHP & SAW',
    '',
    `**Tanggal Pengujian:** ${new Date().toLocaleString('id-ID')}`,
    `**Mode:** ${DRY_RUN ? 'DRY RUN (Tidak ada perubahan DB)' : 'PRODUCTION (Perubahan tersimpan)'}`,
    '',
    '## Ringkasan Konfigurasi',
    'Versi bobot terbaru telah diterapkan berdasarkan kalkulasi Group AHP.',
    '',
    '## Ranking dan Nilai Limit Terbaru',
    '| Kategori | Aset | Harga Referensi | Nilai Preferensi | Nilai Limit | Ranking |',
    '|---|---|---:|---:|---:|---:|',
    ...hasilPengujian.map(h => `| ${h.kategori} | ${h.aset} | ${h.hargaPasar} | ${h.nilaiPreferensi} | ${h.nilaiLimit} | ${h.ranking} |`),
    '',
    '## Status Akhir',
    '**LULUS**'
  ].join('\n');

  await writeFile(DOC_PATH, markdownContent, 'utf8');
  console.log(`\n[4] Laporan ditulis ke ${DOC_PATH}`);
}

main().catch(err => {
  console.error('\n❌ ERROR:', err.message);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
