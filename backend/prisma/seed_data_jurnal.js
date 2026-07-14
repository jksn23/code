import { PrismaClient } from '@prisma/client';
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const prisma = new PrismaClient();
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DOC_PATH = join(SCRIPT_DIR, 'hasil_pengujian_jurnal.md');
const CR_STATIS = 0;
const EPSILON = 0.000001;

const DATA_UJI = [
  {
    nama: 'Tanah dan Bangunan',
    aliases: ['Tanah & Bangunan'],
    kriteria: [
      { nama: 'Lokasi dan Aksesibilitas', aliases: ['Lokasi & Aksesibilitas'], tipe: 'benefit', bobot: 0.25 },
      { nama: 'Legalitas', tipe: 'benefit', bobot: 0.2 },
      { nama: 'Luas', tipe: 'benefit', bobot: 0.15 },
      { nama: 'Kondisi Fisik', tipe: 'benefit', bobot: 0.12 },
      { nama: 'Fasilitas Sekitar', tipe: 'benefit', bobot: 0.1 },
      { nama: 'Lingkungan dan Risiko', aliases: ['Lingkungan & Risiko'], tipe: 'cost', bobot: 0.1 },
      { nama: 'Potensi Pengembangan', tipe: 'benefit', bobot: 0.08 },
    ],
    aset: [
      {
        kode: 'TB01',
        nama: 'Rumah Tipe 45/90',
        hargaPasar: 450000000,
        nilai: {
          'Lokasi dan Aksesibilitas': 4,
          Legalitas: 5,
          Luas: 3,
          'Kondisi Fisik': 4,
          'Fasilitas Sekitar': 4,
          'Lingkungan dan Risiko': 2,
          'Potensi Pengembangan': 3,
        },
      },
      {
        kode: 'TB02',
        nama: 'Ruko 2 Lantai',
        hargaPasar: 850000000,
        nilai: {
          'Lokasi dan Aksesibilitas': 5,
          Legalitas: 5,
          Luas: 4,
          'Kondisi Fisik': 4,
          'Fasilitas Sekitar': 5,
          'Lingkungan dan Risiko': 2,
          'Potensi Pengembangan': 4,
        },
      },
      {
        kode: 'TB03',
        nama: 'Tanah Kavling',
        hargaPasar: 300000000,
        nilai: {
          'Lokasi dan Aksesibilitas': 3,
          Legalitas: 4,
          Luas: 4,
          'Kondisi Fisik': 3,
          'Fasilitas Sekitar': 3,
          'Lingkungan dan Risiko': 3,
          'Potensi Pengembangan': 5,
        },
      },
    ],
  },
  {
    nama: 'Kendaraan',
    kriteria: [
      { nama: 'Kondisi Mesin', tipe: 'benefit', bobot: 0.25 },
      { nama: 'Performa', tipe: 'benefit', bobot: 0.18 },
      { nama: 'Kilometer', tipe: 'cost', bobot: 0.15 },
      { nama: 'Tahun Produksi', tipe: 'benefit', bobot: 0.12 },
      { nama: 'Riwayat Kendaraan', tipe: 'benefit', bobot: 0.1 },
      { nama: 'Merek atau Model', aliases: ['Merek/Model'], tipe: 'benefit', bobot: 0.1 },
      { nama: 'Kondisi Fisik', tipe: 'benefit', bobot: 0.1 },
    ],
    aset: [
      {
        kode: 'KD01',
        nama: 'Toyota Avanza 2019',
        hargaPasar: 165000000,
        nilai: {
          'Kondisi Mesin': 4,
          Performa: 4,
          Kilometer: 3,
          'Tahun Produksi': 4,
          'Riwayat Kendaraan': 4,
          'Merek atau Model': 5,
          'Kondisi Fisik': 4,
        },
      },
      {
        kode: 'KD02',
        nama: 'Honda Beat 2021',
        hargaPasar: 14000000,
        nilai: {
          'Kondisi Mesin': 4,
          Performa: 4,
          Kilometer: 2,
          'Tahun Produksi': 5,
          'Riwayat Kendaraan': 4,
          'Merek atau Model': 4,
          'Kondisi Fisik': 4,
        },
      },
      {
        kode: 'KD03',
        nama: 'Mitsubishi Xpander 2018',
        hargaPasar: 185000000,
        nilai: {
          'Kondisi Mesin': 4,
          Performa: 5,
          Kilometer: 4,
          'Tahun Produksi': 3,
          'Riwayat Kendaraan': 3,
          'Merek atau Model': 5,
          'Kondisi Fisik': 4,
        },
      },
    ],
  },
  {
    nama: 'Elektronik',
    kriteria: [
      { nama: 'Kondisi Barang', tipe: 'benefit', bobot: 0.25 },
      { nama: 'Spesifikasi Teknis', tipe: 'benefit', bobot: 0.2 },
      { nama: 'Performa atau Fungsi', aliases: ['Performa/Fungsi'], tipe: 'benefit', bobot: 0.18 },
      { nama: 'Usia Pemakaian', tipe: 'cost', bobot: 0.15 },
      { nama: 'Merek', tipe: 'benefit', bobot: 0.12 },
      { nama: 'Kelengkapan', tipe: 'benefit', bobot: 0.1 },
    ],
    aset: [
      {
        kode: 'EL01',
        nama: 'Laptop Lenovo ThinkPad 2021',
        hargaPasar: 6500000,
        nilai: {
          'Kondisi Barang': 4,
          'Spesifikasi Teknis': 4,
          'Performa atau Fungsi': 4,
          'Usia Pemakaian': 3,
          Merek: 5,
          Kelengkapan: 4,
        },
      },
      {
        kode: 'EL02',
        nama: 'iPhone 12 128GB',
        hargaPasar: 5800000,
        nilai: {
          'Kondisi Barang': 4,
          'Spesifikasi Teknis': 4,
          'Performa atau Fungsi': 4,
          'Usia Pemakaian': 3,
          Merek: 5,
          Kelengkapan: 3,
        },
      },
      {
        kode: 'EL03',
        nama: 'Kamera Canon EOS 700D',
        hargaPasar: 4000000,
        nilai: {
          'Kondisi Barang': 3,
          'Spesifikasi Teknis': 3,
          'Performa atau Fungsi': 4,
          'Usia Pemakaian': 4,
          Merek: 4,
          Kelengkapan: 4,
        },
      },
    ],
  },
];

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 0,
});

function formatRupiah(value) {
  return `Rp${rupiahFormatter.format(Number(value))}`;
}

function formatDecimal(value, digits = 6) {
  return Number(value).toFixed(digits);
}

function allAssetNames() {
  return DATA_UJI.flatMap((kategori) => kategori.aset.map((aset) => aset.nama));
}

function assertBobotValid() {
  for (const kategori of DATA_UJI) {
    const total = kategori.kriteria.reduce((sum, item) => sum + item.bobot, 0);
    if (Math.abs(total - 1) > EPSILON) {
      throw new Error(`Total bobot kategori ${kategori.nama} tidak sama dengan 1.00: ${total}`);
    }
  }
}

function hitungSAW(asetList, kriteriaList) {
  const matriks = asetList.map((aset) =>
    kriteriaList.map((kriteria) => {
      const nilai = aset.nilaiAset.find((item) => item.kriteriaId === kriteria.id);
      if (!nilai) {
        throw new Error(`Nilai aset "${aset.nama}" untuk kriteria "${kriteria.nama}" belum tersedia`);
      }
      return Number(nilai.nilai);
    })
  );

  const maxPerKriteria = kriteriaList.map((_, index) => Math.max(...matriks.map((row) => row[index])));
  const minPerKriteria = kriteriaList.map((_, index) => Math.min(...matriks.map((row) => row[index])));

  const ranking = asetList.map((aset, asetIndex) => {
    const detailNormalisasi = kriteriaList.map((kriteria, kriteriaIndex) => {
      const nilaiAsli = matriks[asetIndex][kriteriaIndex];
      const nilaiNormalisasi =
        kriteria.tipe === 'benefit'
          ? nilaiAsli / maxPerKriteria[kriteriaIndex]
          : minPerKriteria[kriteriaIndex] / nilaiAsli;
      const kontribusi = nilaiNormalisasi * Number(kriteria.bobot);

      return {
        kriteriaId: kriteria.id,
        namaKriteria: kriteria.nama,
        tipe: kriteria.tipe,
        nilaiAsli,
        nilaiNormalisasi,
        bobot: Number(kriteria.bobot),
        kontribusi,
      };
    });

    const nilaiPreferensi = detailNormalisasi.reduce((sum, item) => sum + item.kontribusi, 0);
    const nilaiLimit = nilaiPreferensi * Number(aset.hargaPasar);

    return {
      id: aset.id,
      kode: aset.kode,
      nama: aset.nama,
      kategori: aset.kategori,
      hargaPasar: Number(aset.hargaPasar),
      nilaiPreferensi: Number(nilaiPreferensi.toFixed(6)),
      nilaiLimit: Number(nilaiLimit.toFixed(2)),
      detailNormalisasi,
    };
  });

  ranking.sort((a, b) => b.nilaiPreferensi - a.nilaiPreferensi);
  ranking.forEach((item, index) => {
    item.ranking = index + 1;
  });

  return {
    detailKriteria: kriteriaList.map((kriteria, index) => ({
      id: kriteria.id,
      nama: kriteria.nama,
      tipe: kriteria.tipe,
      bobot: Number(kriteria.bobot),
      max: maxPerKriteria[index],
      min: minPerKriteria[index],
    })),
    ranking,
  };
}

async function hapusDataUjiLama() {
  const asetLama = await prisma.aset.findMany({
    where: { nama: { in: allAssetNames() } },
    select: { id: true, nama: true },
  });
  const asetIds = asetLama.map((aset) => aset.id);

  if (asetIds.length === 0) {
    console.log('Tidak ada aset uji jurnal lama yang perlu dibersihkan.');
    return { aset: 0, nilaiAset: 0, hasil: 0, lelang: 0, penawaran: 0 };
  }

  const lelangLama = await prisma.lelang.findMany({
    where: { asetId: { in: asetIds } },
    select: { id: true },
  });
  const lelangIds = lelangLama.map((lelang) => lelang.id);

  const penawaran = lelangIds.length
    ? await prisma.penawaran.deleteMany({ where: { lelangId: { in: lelangIds } } })
    : { count: 0 };
  const lelang = await prisma.lelang.deleteMany({ where: { asetId: { in: asetIds } } });
  const hasil = await prisma.hasil.deleteMany({ where: { asetId: { in: asetIds } } });
  const nilaiAset = await prisma.nilaiAset.deleteMany({ where: { asetId: { in: asetIds } } });
  const aset = await prisma.aset.deleteMany({ where: { id: { in: asetIds } } });

  return {
    aset: aset.count,
    nilaiAset: nilaiAset.count,
    hasil: hasil.count,
    lelang: lelang.count,
    penawaran: penawaran.count,
  };
}

async function ensureKategori(kategoriData) {
  const exact = await prisma.kategori.findUnique({ where: { nama: kategoriData.nama } });
  if (exact) return exact;

  const alias = await prisma.kategori.findFirst({
    where: { nama: { in: kategoriData.aliases || [] } },
  });

  if (alias) {
    return prisma.kategori.update({
      where: { id: alias.id },
      data: { nama: kategoriData.nama },
    });
  }

  return prisma.kategori.create({ data: { nama: kategoriData.nama } });
}

async function ensureKriteria(kategoriId, kriteriaData) {
  const exact = await prisma.kriteria.findFirst({
    where: { kategoriId, nama: kriteriaData.nama },
    orderBy: { id: 'asc' },
  });

  let kriteria = exact;
  if (!kriteria && kriteriaData.aliases?.length) {
    kriteria = await prisma.kriteria.findFirst({
      where: { kategoriId, nama: { in: kriteriaData.aliases } },
      orderBy: { id: 'asc' },
    });
  }

  if (kriteria) {
    kriteria = await prisma.kriteria.update({
      where: { id: kriteria.id },
      data: { nama: kriteriaData.nama, tipe: kriteriaData.tipe },
    });
  } else {
    kriteria = await prisma.kriteria.create({
      data: {
        kategoriId,
        nama: kriteriaData.nama,
        tipe: kriteriaData.tipe,
      },
    });
  }

  // Cari versi bobot aktif untuk kategori ini. Jika belum ada, buat.
  let activeVersion = await prisma.bobotVersion.findFirst({
    where: { kategoriId, aktif: true }
  });

  if (!activeVersion) {
    activeVersion = await prisma.bobotVersion.create({
      data: {
        kategoriId,
        namaVersi: `Seed Provisional ${kategoriId}`,
        jumlahPakar: 1,
        cr: CR_STATIS,
        aktif: true,
        tanggalValidasi: new Date()
      }
    });
  }

  await prisma.bobotAHP.deleteMany({ where: { kriteriaId: kriteria.id, versionId: activeVersion.id } });
  const bobot = await prisma.bobotAHP.create({
    data: {
      versionId: activeVersion.id,
      kriteriaId: kriteria.id,
      bobot: kriteriaData.bobot,
    },
  });

  return { ...kriteria, bobot: Number(bobot.bobot), cr: Number(activeVersion.cr) };
}

async function buatAset(kategori, asetData, kriteriaMap) {
  const aset = await prisma.aset.create({
    data: {
      nama: asetData.nama,
      kategoriId: kategori.id,
      hargaPasar: asetData.hargaPasar,
      deskripsi: `Data uji jurnal AHP-SAW ${asetData.kode} untuk kategori ${kategori.nama}.`,
      statusLelang: 'DRAFT',
    },
  });

  const nilaiAset = [];
  for (const [namaKriteria, nilai] of Object.entries(asetData.nilai)) {
    const kriteria = kriteriaMap.get(namaKriteria);
    if (!kriteria) {
      throw new Error(`Kriteria "${namaKriteria}" tidak ditemukan untuk aset "${asetData.nama}"`);
    }

    const nilaiRecord = await prisma.nilaiAset.create({
      data: {
        asetId: aset.id,
        kriteriaId: kriteria.id,
        nilai,
      },
    });
    nilaiAset.push(nilaiRecord);
  }

  return {
    ...aset,
    kode: asetData.kode,
    kategori: kategori.nama,
    hargaPasar: Number(aset.hargaPasar),
    nilaiAset,
  };
}

async function simpanHasil(hasilSAW) {
  for (const item of hasilSAW.ranking) {
    await prisma.hasil.create({
      data: {
        asetId: item.id,
        nilaiPreferensi: item.nilaiPreferensi,
        nilaiLimit: item.nilaiLimit,
      },
    });
  }
}

async function validasiDatabase() {
  const kategoriNames = DATA_UJI.map((kategori) => kategori.nama);
  const targetCriteria = DATA_UJI.flatMap((kategori) =>
    kategori.kriteria.map((kriteria) => ({
      kategori: kategori.nama,
      nama: kriteria.nama,
    }))
  );
  const targetAssetNames = allAssetNames();

  const kategori = await prisma.kategori.findMany({
    where: { nama: { in: kategoriNames } },
    include: { kriteria: true },
  });
  const aset = await prisma.aset.findMany({
    where: { nama: { in: targetAssetNames } },
    include: { nilaiAset: true, hasil: true, kategori: true },
  });
  const kriteria = await prisma.kriteria.findMany({
    where: {
      OR: targetCriteria.map((item) => ({
        nama: item.nama,
        kategori: { nama: item.kategori },
      })),
    },
    include: { bobotAhp: true, kategori: true },
  });

  const nilaiAsetCount = aset.reduce((sum, item) => sum + item.nilaiAset.length, 0);
  const hasilCount = aset.reduce((sum, item) => sum + item.hasil.length, 0);
  const bobotCount = kriteria.reduce((sum, item) => sum + item.bobotAhp.length, 0);
  const expectedNilaiAset = DATA_UJI.reduce((sum, kategoriData) => sum + kategoriData.aset.length * kategoriData.kriteria.length, 0);

  return {
    kategoriCount: kategori.length,
    kriteriaCount: kriteria.length,
    asetCount: aset.length,
    nilaiAsetCount,
    hasilCount,
    bobotCount,
    expectedNilaiAset,
    valid:
      kategori.length === 3 &&
      kriteria.length === 20 &&
      aset.length === 9 &&
      nilaiAsetCount === expectedNilaiAset &&
      hasilCount === 9 &&
      bobotCount === 20,
  };
}

async function validasiSAW() {
  let maxSelisih = 0;

  for (const kategoriData of DATA_UJI) {
    const kategori = await prisma.kategori.findUnique({
      where: { nama: kategoriData.nama },
    });

    const kriteria = await prisma.kriteria.findMany({
      where: {
        kategoriId: kategori.id,
        nama: { in: kategoriData.kriteria.map((item) => item.nama) },
      },
      include: { bobotAhp: { 
        where: { version: { aktif: true } },
        take: 1
      } },
      orderBy: { id: 'asc' },
    });

    const kriteriaWithBobot = kriteria.map((item) => ({
      id: item.id,
      nama: item.nama,
      tipe: item.tipe,
      bobot: Number(item.bobotAhp[0].bobot),
    }));

    const aset = await prisma.aset.findMany({
      where: {
        kategoriId: kategori.id,
        nama: { in: kategoriData.aset.map((item) => item.nama) },
      },
      include: { nilaiAset: true, hasil: true },
    });

    const hasilHitung = hitungSAW(aset, kriteriaWithBobot);
    for (const item of hasilHitung.ranking) {
      const hasilDb = aset.find((asetItem) => asetItem.id === item.id).hasil[0];
      const selisihPreferensi = Math.abs(Number(hasilDb.nilaiPreferensi) - item.nilaiPreferensi);
      const selisihLimit = Math.abs(Number(hasilDb.nilaiLimit) - item.nilaiLimit);
      maxSelisih = Math.max(maxSelisih, selisihPreferensi, selisihLimit);
    }
  }

  return {
    maxSelisih,
    valid: maxSelisih <= EPSILON,
  };
}

function buildDokumentasi({ hasilPerKategori, validasiDb, validasiSaw }) {
  const tanggal = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date());

  const kriteriaRows = DATA_UJI.flatMap((kategori) =>
    kategori.kriteria.map(
      (kriteria) => `| ${kategori.nama} | ${kriteria.nama} | ${kriteria.tipe} | ${formatDecimal(kriteria.bobot, 2)} |`
    )
  ).join('\n');

  const asetRows = DATA_UJI.flatMap((kategori) =>
    kategori.aset.map((aset) => `| ${kategori.nama} | ${aset.kode} | ${aset.nama} | ${aset.hargaPasar} |`)
  ).join('\n');

  const hasilRows = hasilPerKategori.flatMap((kategori) =>
    kategori.hasil.ranking.map(
      (item) =>
        `| ${kategori.nama} | ${item.nama} | ${item.hargaPasar} | ${formatDecimal(item.nilaiPreferensi)} | ${item.nilaiLimit.toFixed(2)} | ${item.ranking} |`
    )
  ).join('\n');

  const rankingSections = hasilPerKategori
    .map((kategori) => {
      const rows = kategori.hasil.ranking
        .map(
          (item) =>
            `${item.ranking}. ${item.nama} - Preferensi ${formatDecimal(item.nilaiPreferensi)} - Nilai Limit ${formatRupiah(item.nilaiLimit)}`
        )
        .join('\n');
      return `### ${kategori.nama}\n${rows}`;
    })
    .join('\n\n');

  return `# Hasil Pengujian Data Uji Jurnal AHP-SAW

Tanggal pengujian: ${tanggal}

## File yang Dibuat atau Diubah
- backend/prisma/seed_data_jurnal.js
- backend/package.json
- backend/prisma/hasil_pengujian_jurnal.md

## Ringkasan Data Uji
- Jumlah kategori: ${validasiDb.kategoriCount}
- Jumlah kriteria: ${validasiDb.kriteriaCount}
- Jumlah aset: ${validasiDb.asetCount}
- Jumlah nilai kriteria aset: ${validasiDb.nilaiAsetCount}
- Jumlah bobot AHP: ${validasiDb.bobotCount}
- Jumlah hasil perhitungan: ${validasiDb.hasilCount}

## Tabel Kategori
| No | Kategori |
|---:|---|
${DATA_UJI.map((kategori, index) => `| ${index + 1} | ${kategori.nama} |`).join('\n')}

## Tabel Kriteria dan Bobot
| Kategori | Kriteria | Tipe | Bobot |
|---|---|---|---:|
${kriteriaRows}

## Tabel Aset dan Harga Pasar
| Kategori | Kode | Aset | Harga Pasar |
|---|---|---|---:|
${asetRows}

## Tabel Nilai Preferensi dan Nilai Limit
| Kategori | Aset | Harga Pasar | Nilai Preferensi | Nilai Limit | Ranking |
|---|---|---:|---:|---:|---:|
${hasilRows}

## Ranking Per Kategori
${rankingSections}

## Cara Menjalankan Seed
\`\`\`bash
cd backend
npm install
npx prisma generate
npm run seed:jurnal
\`\`\`

## Status Validasi
- Validasi database: ${validasiDb.valid ? 'BERHASIL' : 'GAGAL'}
- Validasi SAW: ${validasiSaw.valid ? 'BERHASIL' : 'GAGAL'}
- Selisih maksimum perhitungan SAW vs database: ${formatDecimal(validasiSaw.maxSelisih)}

## Checklist Screenshot Artikel Jurnal
- [ ] 01_dashboard.png - Halaman login/admin dashboard
- [ ] 02_kategori.png - Halaman daftar kategori
- [ ] 03_kriteria.png - Halaman daftar kriteria per kategori
- [ ] 04_aset.png - Halaman daftar aset uji
- [ ] 05_detail_aset.png - Halaman detail aset dan nilai kriteria
- [ ] 06_hasil_perhitungan.png - Halaman hasil nilai preferensi dan nilai limit
- [ ] 07_terminal_seed.png - Terminal log saat seed berhasil dijalankan
- [ ] 08_terminal_validasi.png - Terminal log validasi SAW berhasil

## Catatan
- Seed membersihkan ulang hanya aset uji jurnal berdasarkan nama aset wajib, beserta nilai, hasil, lelang, dan penawaran yang terkait aset tersebut.
- Script tidak menjalankan reset database dan tidak menghapus user, admin, atau data lain di luar aset uji jurnal.
- Jika halaman web tertentu belum tersedia, gunakan endpoint API kategori, kriteria, aset, dan hasil SPK sebagai bukti data tersimpan.
`;
}

async function main() {
  assertBobotValid();

  console.log('========================================');
  console.log('SEED DATA UJI JURNAL AHP-SAW LELANG');
  console.log('========================================');

  console.log('\n[1] Membersihkan data uji lama...');
  const hasilHapus = await hapusDataUjiLama();
  console.log(
    `Data uji lama berhasil dibersihkan. Aset: ${hasilHapus.aset}, Nilai: ${hasilHapus.nilaiAset}, Hasil: ${hasilHapus.hasil}, Lelang: ${hasilHapus.lelang}, Penawaran: ${hasilHapus.penawaran}`
  );

  const hasilPerKategori = [];

  for (const [index, kategoriData] of DATA_UJI.entries()) {
    console.log(`\n[${index + 2}] Membuat kategori: ${kategoriData.nama}`);
    const kategori = await ensureKategori(kategoriData);
    console.log(`Kategori berhasil dibuat/diperbarui. ID: ${kategori.id}`);

    console.log('\nKriteria:');
    const kriteriaRecords = [];
    const kriteriaMap = new Map();
    for (const kriteriaData of kategoriData.kriteria) {
      const kriteria = await ensureKriteria(kategori.id, kriteriaData);
      kriteriaRecords.push(kriteria);
      kriteriaMap.set(kriteria.nama, kriteria);
      console.log(`- ${kriteria.nama} | ${kriteria.tipe} | bobot ${formatDecimal(kriteria.bobot, 2)}`);
    }

    console.log('\nAset:');
    const asetRecords = [];
    for (const asetData of kategoriData.aset) {
      const aset = await buatAset(kategori, asetData, kriteriaMap);
      asetRecords.push(aset);
      console.log(`- ${aset.nama}`);
      console.log(`  Kode: ${aset.kode}`);
      console.log(`  Harga Pasar: ${formatRupiah(aset.hargaPasar)}`);
      console.log('  Nilai Kriteria:');
      for (const [namaKriteria, nilai] of Object.entries(asetData.nilai)) {
        console.log(`  - ${namaKriteria}: ${nilai}`);
      }
    }

    const hasilSAW = hitungSAW(asetRecords, kriteriaRecords);
    await simpanHasil(hasilSAW);

    console.log(`\nHasil perhitungan kategori ${kategoriData.nama}:`);
    for (const item of hasilSAW.ranking) {
      console.log(`- ${item.nama}`);
      console.log(`  Nilai Preferensi: ${formatDecimal(item.nilaiPreferensi)}`);
      console.log(`  Nilai Limit: ${formatRupiah(item.nilaiLimit)}`);
    }

    console.log(`\nRanking kategori ${kategoriData.nama}:`);
    for (const item of hasilSAW.ranking) {
      console.log(
        `${item.ranking}. ${item.nama} | Preferensi: ${formatDecimal(item.nilaiPreferensi)} | Nilai Limit: ${formatRupiah(item.nilaiLimit)}`
      );
    }

    hasilPerKategori.push({ nama: kategoriData.nama, hasil: hasilSAW });
  }

  console.log('\n[5] Validasi database...');
  const validasiDb = await validasiDatabase();
  console.log(`Kategori: ${validasiDb.kategoriCount}/3`);
  console.log(`Kriteria: ${validasiDb.kriteriaCount}/20`);
  console.log(`Bobot AHP: ${validasiDb.bobotCount}/20`);
  console.log(`Aset: ${validasiDb.asetCount}/9`);
  console.log(`Nilai kriteria aset: ${validasiDb.nilaiAsetCount}/${validasiDb.expectedNilaiAset}`);
  console.log(`Hasil perhitungan: ${validasiDb.hasilCount}/9`);
  console.log(`Validasi database: ${validasiDb.valid ? 'BERHASIL' : 'GAGAL'}`);

  console.log('\n[6] Validasi SAW...');
  const validasiSaw = await validasiSAW();
  console.log(`Validasi SAW: ${validasiSaw.valid ? 'BERHASIL' : 'GAGAL'}`);
  console.log(`Selisih maksimum: ${formatDecimal(validasiSaw.maxSelisih)}`);

  if (!validasiDb.valid || !validasiSaw.valid) {
    throw new Error('Validasi seed data jurnal gagal. Periksa log di atas.');
  }

  const dokumentasi = buildDokumentasi({ hasilPerKategori, validasiDb, validasiSaw });
  await writeFile(DOC_PATH, dokumentasi, 'utf8');
  console.log(`\n[7] Dokumentasi hasil pengujian dibuat: ${DOC_PATH}`);

  console.log('\n========================================');
  console.log('SEED DATA UJI JURNAL SELESAI');
  console.log('========================================');
}

main()
  .catch((error) => {
    console.error('\nSeed data uji jurnal gagal:');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
