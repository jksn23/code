/**
 * SEED: Predefined AHP Weights
 *
 * Berdasarkan panduan_pengembangan_ahp_statis.md
 * Memasukkan data Kategori, Kriteria, dan BobotAHP statis ke database.
 *
 * Jalankan dengan: node prisma/seedAhp.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  {
    namaKategori: 'Kendaraan',
    kriteria: [
      { nama: 'Kondisi Mesin',    tipe: 'benefit', bobot: 0.25 },
      { nama: 'Performa',         tipe: 'benefit', bobot: 0.18 },
      { nama: 'Kilometer',        tipe: 'cost',    bobot: 0.15 },
      { nama: 'Tahun Produksi',   tipe: 'benefit', bobot: 0.12 },
      { nama: 'Riwayat Kendaraan',tipe: 'benefit', bobot: 0.10 },
      { nama: 'Merek/Model',      tipe: 'benefit', bobot: 0.10 },
      { nama: 'Kondisi Fisik',    tipe: 'benefit', bobot: 0.10 },
    ],
  },
  {
    namaKategori: 'Elektronik',
    kriteria: [
      { nama: 'Kondisi Barang',     tipe: 'benefit', bobot: 0.25 },
      { nama: 'Spesifikasi Teknis', tipe: 'benefit', bobot: 0.20 },
      { nama: 'Performa/Fungsi',    tipe: 'benefit', bobot: 0.18 },
      { nama: 'Usia Pemakaian',     tipe: 'cost',    bobot: 0.15 },
      { nama: 'Merek',              tipe: 'benefit', bobot: 0.12 },
      { nama: 'Kelengkapan',        tipe: 'benefit', bobot: 0.10 },
    ],
  },
];

// CR = 0 karena ini bobot yang sudah ditentukan expert (tidak perlu consistency check)
const CR_STATIS = 0.0;

async function main() {
  console.log('🚀 Memulai seed data AHP statis...\n');

  for (const data of DATA_STATIS) {
    console.log(`📂 Memproses kategori: ${data.namaKategori}`);

    // 1. Upsert kategori
    const kategori = await prisma.kategori.upsert({
      where: { nama: data.namaKategori },
      update: {},
      create: { nama: data.namaKategori },
    });
    console.log(`   ✅ Kategori "${kategori.nama}" (ID: ${kategori.id})`);

    // 2. HAPUS semua kriteria lama beserta turunannya (NilaiAset, BobotAHP) via Cascade
    const hapusKriteria = await prisma.kriteria.deleteMany({
      where: { kategoriId: kategori.id },
    });
    if (hapusKriteria.count > 0) {
      console.log(`   🗑️  Menghapus ${hapusKriteria.count} kriteria lama pada kategori ini...`);
    }

    for (const krit of data.kriteria) {
      // 3. Buat kriteria baru
      const kriteria = await prisma.kriteria.create({
        data: {
          kategoriId: kategori.id,
          nama: krit.nama,
          tipe: krit.tipe,
        },
      });
      console.log(`   ➕ Kriteria dibuat: "${kriteria.nama}" (${kriteria.tipe})`);

      // 4. Hapus bobot lama untuk kriteria ini, kemudian buat bobot statis baru
      await prisma.bobotAHP.deleteMany({
        where: { kriteriaId: kriteria.id },
      });

      await prisma.bobotAHP.create({
        data: {
          kriteriaId: kriteria.id,
          bobot: krit.bobot,
          cr: CR_STATIS,
        },
      });
      console.log(`   🎯 Bobot "${kriteria.nama}" = ${krit.bobot} (CR=${CR_STATIS})`);
    }

    console.log('');
  }

  console.log('✅ Seed data AHP statis berhasil diselesaikan!');
  console.log('ℹ️  Sistem sekarang menggunakan bobot predefined — tidak perlu hitung AHP lagi.');
}

main()
  .catch((e) => {
    console.error('❌ Error saat seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
