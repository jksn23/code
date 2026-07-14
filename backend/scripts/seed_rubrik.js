/**
 * seed_rubrik.js
 * ─────────────────────────────────────────────────────────────────────────────
 * P1 — Seed rubrik penilaian kriteria skala 1-5 untuk 3 kategori aset.
 *
 * Menghubungkan kriteria riil yang ada di database dengan panduan rubrik skor 1-5.
 *
 * Cara menjalankan:
 *   node backend/scripts/seed_rubrik.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

const prisma = new PrismaClient();

const RUBRIK_BY_KATEGORI = {
  // === KENDARAAN ===
  kendaraan: {
    'Kondisi Fisik': [
      { skor: 1, label: 'Rusak Berat', deskripsi: 'Bodi penyok parah, cat mengelupas semua, kaca pecah, atau interior hancur.', contohBukti: 'Foto bodi penyok/kerusakan parah eksterior.' },
      { skor: 2, label: 'Rusak Ringan', deskripsi: 'Banyak baret dalam, penyok kecil di beberapa tempat, interior kotor/sobek.', contohBukti: 'Foto baret/penyok sedang.' },
      { skor: 3, label: 'Cukup Baik', deskripsi: 'Ada baret wajar bekas pemakaian, interior bersih, AC kurang dingin.', contohBukti: 'Foto kondisi bodi umum wajar.' },
      { skor: 4, label: 'Baik', deskripsi: 'Sangat mulus, cat original, interior terawat, AC dingin, semua panel berfungsi.', contohBukti: 'Foto eksterior & interior mulus.' },
      { skor: 5, label: 'Sangat Baik', deskripsi: 'Kondisi mulus seperti baru keluar dari showroom, tanpa cacat sama sekali.', contohBukti: 'Foto detail bodi & interior prima.' },
    ],
    'Tahun Produksi': [
      { skor: 1, label: '> 15 Tahun', deskripsi: 'Kendaraan diproduksi lebih dari 15 tahun lalu.', contohBukti: 'Foto STNK/BPKB kolom tahun.' },
      { skor: 2, label: '10-15 Tahun', deskripsi: 'Usia kendaraan berkisar antara 10 hingga 15 tahun.', contohBukti: 'Foto STNK/BPKB.' },
      { skor: 3, label: '5-10 Tahun', deskripsi: 'Usia kendaraan berkisar antara 5 hingga 10 tahun.', contohBukti: 'Foto STNK/BPKB.' },
      { skor: 4, label: '2-5 Tahun', deskripsi: 'Usia kendaraan berkisar antara 2 hingga 5 tahun.', contohBukti: 'Foto STNK/BPKB.' },
      { skor: 5, label: '0-2 Tahun', deskripsi: 'Kendaraan sangat baru, diproduksi kurang dari 2 tahun lalu.', contohBukti: 'Foto STNK/BPKB.' },
    ],
    'Kondisi Mesin': [
      { skor: 1, label: 'Mogok / Rusak Berat', deskripsi: 'Mesin tidak bisa hidup atau mati total, komponen utama rusak.', contohBukti: 'Hasil diagnosa bengkel.' },
      { skor: 2, label: 'Kasar / Bermasalah', deskripsi: 'Mesin hidup tapi suara kasar, berasap tebal, atau pincang.', contohBukti: 'Video suara mesin atau asap knalpot.' },
      { skor: 3, label: 'Normal Halus wajar', deskripsi: 'Suara mesin normal wajar, ada sedikit rembesan oli minor yang tidak mengganggu performa.', contohBukti: 'Foto area mesin & video suara.' },
      { skor: 4, label: 'Halus / Kering', deskripsi: 'Suara mesin halus, tarikan enteng, area mesin kering bebas rembesan oli.', contohBukti: 'Foto area mesin bersih kering.' },
      { skor: 5, label: 'Sangat Prima', deskripsi: 'Mesin sangat halus, prima, bergaransi resmi, berkinerja sempurna.', contohBukti: 'Video suara mesin stasioner.' },
    ],
    'Kilometer': [
      { skor: 1, label: '> 150.000 km', deskripsi: 'Jarak tempuh kendaraan sangat tinggi.', contohBukti: 'Foto odometer.' },
      { skor: 2, label: '100.000 - 150.000 km', deskripsi: 'Jarak tempuh cukup tinggi.', contohBukti: 'Foto odometer.' },
      { skor: 3, label: '50.000 - 100.000 km', deskripsi: 'Jarak tempuh sedang/wajar.', contohBukti: 'Foto odometer.' },
      { skor: 4, label: '10.000 - 50.000 km', deskripsi: 'Jarak tempuh rendah.', contohBukti: 'Foto odometer.' },
      { skor: 5, label: '< 10.000 km', deskripsi: 'Jarak tempuh sangat rendah, jarang dipakai.', contohBukti: 'Foto odometer.' },
    ],
    'Riwayat Kendaraan': [
      { skor: 1, label: 'Pernah Tabrakan / Banjir', deskripsi: 'Kendaraan memiliki riwayat tabrakan berat atau terendam banjir.', contohBukti: 'Laporan asuransi/foto kerusakan masa lalu.' },
      { skor: 2, label: 'Pernah Turun Mesin', deskripsi: 'Pernah overhaul mesin besar atau cat ulang seluruh bodi bukan ori.', contohBukti: 'Faktur perbaikan bengkel.' },
      { skor: 3, label: 'Servis Tidak Rutin', deskripsi: 'Riwayat servis ada tapi tidak berkala secara teratur.', contohBukti: 'Buku servis setengah terisi.' },
      { skor: 4, label: 'Servis Rutin Berkala', deskripsi: 'Riwayat servis teratur di bengkel umum terpercaya atau bengkel resmi.', contohBukti: 'Nota-nota servis lengkap.' },
      { skor: 5, label: 'Tangan Pertama & Servis Resmi', deskripsi: 'Kepemilikan tangan pertama dari baru, servis selalu di bengkel resmi teratur.', contohBukti: 'Buku servis resmi terstempel penuh.' },
    ],
    'Merek atau Model': [
      { skor: 1, label: 'Kurang Populer / Depresiasi Tinggi', deskripsi: 'Merek kurang diminati di pasar lokal, suku cadang sulit.', contohBukti: 'Analisis pasar.' },
      { skor: 2, label: 'Populer Rendah', deskripsi: 'Merek cukup dikenal tetapi model kurang laku.', contohBukti: 'Analisis pasar.' },
      { skor: 3, label: 'Populer Sedang', deskripsi: 'Merek and model standar yang banyak digunakan masyarakat umum.', contohBukti: 'Populasi jalanan wajar.' },
      { skor: 4, label: 'Sangat Populer', deskripsi: 'Merek terlaris, harga jual kembali stabil, suku cadang melimpah.', contohBukti: 'Statistik penjualan mobil.' },
      { skor: 5, label: 'Premium / Likuiditas Sangat Tinggi', deskripsi: 'Merek premium papan atas yang sangat dicari, likuiditas instan.', contohBukti: 'Analisis pasar premium.' },
    ],
    'Performa': [
      { skor: 1, label: 'Sangat Buruk', deskripsi: 'Uji jalan menunjukkan banyak masalah suspensi, transmisi slip parah.', contohBukti: 'Hasil uji jalan.' },
      { skor: 2, label: 'Kurang Nyaman', deskripsi: 'Kaki-kaki bunyi, perpindahan gigi agak kasar/keras.', contohBukti: 'Laporan keluhan kaki-kaki.' },
      { skor: 3, label: 'Normal Nyaman', deskripsi: 'Kemudi stabil, suspensi meredam getaran wajar, transmisi normal.', contohBukti: 'Hasil uji berkendara.' },
      { skor: 4, label: 'Sangat Nyaman', deskripsi: 'Suspensi empuk senyap, transmisi sangat responsif, kabin kedap.', contohBukti: 'Laporan kelayakan berkendara.' },
      { skor: 5, label: 'Sempurna', deskripsi: 'Performa berkendara luar biasa layaknya mobil baru keluar pabrik.', contohBukti: 'Uji performa komprehensif.' },
    ],
  },

  // === ELEKTRONIK ===
  elektronik: {
    'Kondisi Barang': [
      { skor: 1, label: 'Rusak Parah / Mati', deskripsi: 'Layar pecah, mati total, casing retak/pecah.', contohBukti: 'Foto fisik pecah.' },
      { skor: 2, label: 'Rusak Ringan', deskripsi: 'Banyak baret dalam, tombol ada yang lepas/tidak merespon, baterai bocor parah.', contohBukti: 'Foto baret parah/baterai kembung.' },
      { skor: 3, label: 'Cukup Baik', deskripsi: 'Bekas pemakaian wajar, baret halus di bodi, layar bersih dari goresan dalam.', contohBukti: 'Foto sudut-sudut casing.' },
      { skor: 4, label: 'Baik', deskripsi: 'Mulus terawat, baterai health di atas 80%, semua fitur (WiFi, kamera, port) aktif.', contohBukti: 'Screenshot battery health & foto mulus.' },
      { skor: 5, label: 'Sangat Baik / Seperti Baru', deskripsi: 'Kondisi 99% mulus tanpa baret sedikit pun, baterai health 95%+, segel utuh.', contohBukti: 'Foto mulus tanpa cela.' },
    ],
    'Spesifikasi Teknis': [
      { skor: 1, label: 'Sangat Rendah / Jadul', deskripsi: 'Spesifikasi ketinggalan zaman, tidak kompatibel dengan aplikasi modern.', contohBukti: 'Screenshot spesifikasi sistem.' },
      { skor: 2, label: 'Entry Level', deskripsi: 'Spesifikasi basic untuk kebutuhan dasar kantor/sekolah saja.', contohBukti: 'Screenshot spesifikasi.' },
      { skor: 3, label: 'Mid Range', deskripsi: 'Spesifikasi menengah, lancar untuk multitasking harian & game ringan.', contohBukti: 'Screenshot spesifikasi.' },
      { skor: 4, label: 'High End', deskripsi: 'Spesifikasi tinggi, prosesor kelas atas, RAM besar, cocok untuk editing/gaming berat.', contohBukti: 'Screenshot spesifikasi.' },
      { skor: 5, label: 'Flagship / Tertinggi', deskripsi: 'Teknologi termutakhir, spesifikasi tertinggi di kelasnya saat ini.', contohBukti: 'Screenshot spesifikasi.' },
    ],
    'Performa atau Fungsi': [
      { skor: 1, label: 'Mati Total', deskripsi: 'Perangkat tidak merespon tombol power sama sekali.', contohBukti: 'Video usaha menyalakan.' },
      { skor: 2, label: 'Sering Hang / Overheat', deskripsi: 'Dapat menyala tapi lambat sekali, sering hang, cepat panas berlebih.', contohBukti: 'Video lag/freeze.' },
      { skor: 3, label: 'Lancar Standar', deskripsi: 'Bekerja normal untuk aplikasi harian tanpa kendala berarti.', contohBukti: 'Video fungsi dasar.' },
      { skor: 4, label: 'Sangat Lancar', deskripsi: 'Sangat responsif, booting cepat, suhu operasional dingin.', contohBukti: 'Video booting & load program.' },
      { skor: 5, label: 'Sempurna', deskripsi: 'Kecepatan luar biasa, stabilitas tinggi di bawah beban kerja maksimal.', contohBukti: 'Hasil benchmark resmi.' },
    ],
    'Usia Pemakaian': [
      { skor: 1, label: '> 5 Tahun', deskripsi: 'Perangkat telah digunakan lebih dari 5 tahun.', contohBukti: 'Foto nota/faktur pembelian.' },
      { skor: 2, label: '3 - 5 Tahun', deskripsi: 'Usia pemakaian berkisar antara 3 hingga 5 tahun.', contohBukti: 'Foto nota.' },
      { skor: 3, label: '2 - 3 Tahun', deskripsi: 'Usia pemakaian berkisar antara 2 hingga 3 tahun.', contohBukti: 'Foto nota.' },
      { skor: 4, label: '1 - 2 Tahun', deskripsi: 'Usia pemakaian berkisar antara 1 hingga 2 tahun.', contohBukti: 'Foto nota.' },
      { skor: 5, label: '< 1 Tahun', deskripsi: 'Sangat baru, pemakaian kurang dari 1 tahun.', contohBukti: 'Nota pembelian & kartu garansi.' },
    ],
    'Merek': [
      { skor: 1, label: 'Kurang Dikenal / Reputasi Rendah', deskripsi: 'Merek non-branded, sulit servis & suku cadang.', contohBukti: 'Foto label merek.' },
      { skor: 2, label: 'Merek Standar', deskripsi: 'Merek lokal atau merek global kelas bawah.', contohBukti: 'Merek tertera.' },
      { skor: 3, label: 'Merek Populer', deskripsi: 'Merek terkenal dengan jaringan servis luas di kota-kota besar.', contohBukti: 'Merek tertera.' },
      { skor: 4, label: 'Merek Terkemuka', deskripsi: 'Merek global dengan reputasi kualitas dan layanan purna jual sangat baik.', contohBukti: 'Merek tertera.' },
      { skor: 5, label: 'Premium Global', deskripsi: 'Merek premium tier-1 (misal Apple, Sony kelas atas) dengan resale value sangat tinggi.', contohBukti: 'Merek tertera.' },
    ],
    'Kelengkapan': [
      { skor: 1, label: 'Batangan', deskripsi: 'Hanya unit utama saja tanpa charger/aksesoris apa pun.', contohBukti: 'Foto unit saja.' },
      { skor: 2, label: 'Unit + Charger Non-Ori', deskripsi: 'Ada unit dan charger tetapi bukan bawaan asli (third party).', contohBukti: 'Foto unit dan charger.' },
      { skor: 3, label: 'Unit + Charger Original', deskripsi: 'Unit dengan kelengkapan pokok original bawaan pabrik.', contohBukti: 'Foto charger bawaan.' },
      { skor: 4, label: 'Lengkap minus Box', deskripsi: 'Seluruh aksesoris original ada lengkap, hanya box/dus yang hilang.', contohBukti: 'Foto unit dan aksesoris lengkap.' },
      { skor: 5, label: 'Fullset Original Lengkap Box', deskripsi: 'Sama persis seperti kondisi pembelian baru (Box, buku, struk, aksesoris lengkap).', contohBukti: 'Foto fullset lengkap box.' },
    ],
  },

  // === TANAH DAN BANGUNAN ===
  tanah: {
    'Lokasi dan Aksesibilitas': [
      { skor: 1, label: 'Akses Sangat Sulit', deskripsi: 'Hanya bisa dilalui jalan kaki, jalan setapak tanah sempit.', contohBukti: 'Foto akses jalan.' },
      { skor: 2, label: 'Jalan Sempit / Motor', deskripsi: 'Bisa dilalui motor, mobil tidak bisa masuk.', contohBukti: 'Foto akses jalan masuk.' },
      { skor: 3, label: 'Jalan Mobil Pas-pasan', deskripsi: 'Bisa dilalui 1 mobil, jalan aspal/paving sempit.', contohBukti: 'Foto jalan perumahan.' },
      { skor: 4, label: 'Jalan Lebar / 2 Mobil', deskripsi: 'Akses jalan 2 mobil berpapasan dengan mudah, dekat jalan raya.', contohBukti: 'Foto jalan depan properti.' },
      { skor: 5, label: 'Pinggir Jalan Utama / Protokol', deskripsi: 'Terletak langsung di tepi jalan arteri utama atau pusat kota komersial.', contohBukti: 'Google Street View properti.' },
    ],
    'Legalitas': [
      { skor: 1, label: 'Girik / Letter C / Adat', deskripsi: 'Belum terdaftar di BPN, bukti kepemilikan berupa surat adat.', contohBukti: 'Foto dokumen Girik/Letter C.' },
      { skor: 2, label: 'Sertifikat Girik dalam Proses', deskripsi: 'Sedang dalam pengajuan sertifikasi ke BPN.', contohBukti: 'Surat tanda terima berkas BPN.' },
      { skor: 3, label: 'Sertifikat Hak Guna Bangunan (SHGB)', deskripsi: 'Sertifikat HGB aktif berjangka waktu panjang.', contohBukti: 'Foto sertifikat HGB.' },
      { skor: 4, label: 'Sertifikat Hak Milik (SHM)', deskripsi: 'Kepemilikan mutlak tertinggi terdaftar resmi BPN tanpa sengketa.', contohBukti: 'Foto sertifikat SHM.' },
      { skor: 5, label: 'SHM + IMB/PBG Lengkap', deskripsi: 'SHM atas nama pemilik asli disertai IMB/PBG bangunan, PBB lunas.', contohBukti: 'Foto SHM, IMB/PBG, dan PBB terbaru.' },
    ],
    'Kondisi Fisik': [
      { skor: 1, label: 'Rusak Total / Tanah Kosong', deskripsi: 'Bangunan roboh/tidak layak huni sama sekali atau hanya tanah kosong.', contohBukti: 'Foto kondisi bangunan/tanah kosong.' },
      { skor: 2, label: 'Butuh Renovasi Besar', deskripsi: 'Atap bocor parah, dinding retak, butuh perbaikan masif sebelum dihuni.', contohBukti: 'Foto retak dinding/atap rusak.' },
      { skor: 3, label: 'Cukup Layak', deskripsi: 'Dapat langsung dihuni, ada kerusakan kosmetik minor seperti cat kusam.', contohBukti: 'Foto kondisi ruang utama.' },
      { skor: 4, label: 'Mulus Terawat', deskripsi: 'Kondisi bangunan kokoh, cat rapi, instalasi air/listrik berfungsi baik.', contohBukti: 'Foto eksterior & interior rapi.' },
      { skor: 5, label: 'Baru / Mewah', deskripsi: 'Bangunan baru gres dengan material premium, desain modern minimalis.', contohBukti: 'Foto interior modern gres.' },
    ],
    'Fasilitas Sekitar': [
      { skor: 1, label: 'Sangat Minim', deskripsi: 'Tidak ada fasilitas umum terdekat dalam radius 5 km.', contohBukti: 'Google Maps area.' },
      { skor: 2, label: 'Fasilitas Terbatas', deskripsi: 'Hanya ada warung kecil/tempat ibadah terdekat.', contohBukti: 'Google Maps.' },
      { skor: 3, label: 'Fasilitas Cukup', deskripsi: 'Dekat pasar tradisional, sekolah dasar, dan klinik kesehatan.', contohBukti: 'Google Maps.' },
      { skor: 4, label: 'Fasilitas Lengkap', deskripsi: 'Dekat minimarket, sekolah menengah, rumah sakit, akses tol.', contohBukti: 'Google Maps.' },
      { skor: 5, label: 'Sangat Lengkap / Pusat Bisnis', deskripsi: 'Dekat mall, universitas ternama, stasiun/terminal utama, pusat kuliner.', contohBukti: 'Google Maps.' },
    ],
    'Lingkungan dan Risiko': [
      { skor: 1, label: 'Rawan Bencana / Kumuh', deskripsi: 'Kawasan langganan banjir tinggi setiap hujan, dekat TPA, atau kawasan kumuh.', contohBukti: 'Foto genangan banjir/lingkungan sekitar.' },
      { skor: 2, label: 'Keamanan Kurang', deskripsi: 'Gang sempit, rawan kriminalitas, tidak ada pos satpam.', contohBukti: 'Foto jalan akses kumuh.' },
      { skor: 3, label: 'Aman & Bebas Banjir', deskripsi: 'Kawasan aman, bebas banjir, lingkungan warga tertib.', contohBukti: 'Foto lingkungan sekitar bersih.' },
      { skor: 4, label: 'Asri & Nyaman', deskripsi: 'Lingkungan perumahan tenang, banyak pohon pelindung, jalan paving rapi.', contohBukti: 'Foto jalan depan rumah rimbun asri.' },
      { skor: 5, label: 'Elite / Pengamanan 24 Jam', deskripsi: 'Kawasan perumahan elite, one gate system, sekuriti 24 jam dengan CCTV.', contohBukti: 'Foto gerbang masuk pos satpam.' },
    ],
    'Potensi Pengembangan': [
      { skor: 1, label: 'Zona Hijau / Jalur Hijau', deskripsi: 'Tidak boleh dibangun bangunan permanen secara regulasi tata ruang.', contohBukti: 'Dokumen RTRW daerah.' },
      { skor: 2, label: 'Hanya Rumah Tinggal Sederhana', deskripsi: 'Regulasi membatasi hanya untuk hunian kecil, koefisien lantai rendah.', contohBukti: 'Dokumen ITR.' },
      { skor: 3, label: 'Rumah Tinggal / Kost', deskripsi: 'Dapat dibangun rumah tinggal bertingkat atau kos-kosan.', contohBukti: 'Zonasi perumahan.' },
      { skor: 4, label: 'Komersial / Ruko', deskripsi: 'Cocok dibangun ruko, kantor kecil, atau tempat usaha karena keramaian tinggi.', contohBukti: 'Zonasi komersial.' },
      { skor: 5, label: 'Premium / Multi-Story', deskripsi: 'Lokasi premium komersial untuk hotel, apartemen, atau perkantoran bertingkat.', contohBukti: 'Zonasi komersial campuran.' },
    ],
    'Luas': [
      { skor: 1, label: 'Sangat Kecil (< 50 m2)', deskripsi: 'Luas tanah/bangunan sangat terbatas.', contohBukti: 'Foto sertifikat kolom luas.' },
      { skor: 2, label: 'Kecil (50 - 100 m2)', deskripsi: 'Luas tanah/bangunan kecil.', contohBukti: 'Foto sertifikat.' },
      { skor: 3, label: 'Sedang (100 - 200 m2)', deskripsi: 'Luas tanah/bangunan sedang.', contohBukti: 'Foto sertifikat.' },
      { skor: 4, label: 'Besar (200 - 500 m2)', deskripsi: 'Luas tanah/bangunan besar.', contohBukti: 'Foto sertifikat.' },
      { skor: 5, label: 'Sangat Besar (> 500 m2)', deskripsi: 'Luas tanah/bangunan sangat lapang.', contohBukti: 'Foto sertifikat.' },
    ],
  },
};

async function main() {
  console.log('🌱 Mulai seeding rubrik kriteria...\n');

  const categories = await prisma.kategori.findMany({
    include: { kriteria: true },
  });

  if (!categories.length) {
    console.error('❌ Tidak ada kategori di database. Jalankan seed kategori terlebih dahulu.');
    process.exit(1);
  }

  let totalInserted = 0;
  let totalSkipped = 0;

  for (const kategori of categories) {
    const kategoriName = kategori.nama.toLowerCase();

    // Cari rubrik yang relevan berdasarkan nama kategori
    let rubrikConfig = null;
    for (const [key, config] of Object.entries(RUBRIK_BY_KATEGORI)) {
      if (kategoriName.includes(key.substring(0, 4))) {
        rubrikConfig = config;
        break;
      }
    }

    if (!rubrikConfig) {
      console.log(`⚠️  Kategori "${kategori.nama}" tidak memiliki rubrik template — skip`);
      continue;
    }

    console.log(`📋 Seeding rubrik untuk kategori: ${kategori.nama}`);

    for (const kriteria of kategori.kriteria) {
      const rubrikItems = rubrikConfig[kriteria.nama];
      if (!rubrikItems) {
        console.log(`   ⚠️  Kriteria "${kriteria.nama}" tidak ada di rubrik template — skip`);
        continue;
      }

      for (const rubrik of rubrikItems) {
        try {
          await prisma.rubrikKriteria.upsert({
            where: {
              kriteriaId_skor: {
                kriteriaId: kriteria.id,
                skor: rubrik.skor,
              },
            },
            update: {
              label: rubrik.label,
              deskripsi: rubrik.deskripsi,
              contohBukti: rubrik.contohBukti || null,
            },
            create: {
              kriteriaId: kriteria.id,
              skor: rubrik.skor,
              label: rubrik.label,
              deskripsi: rubrik.deskripsi,
              contohBukti: rubrik.contohBukti || null,
            },
          });
          totalInserted++;
          console.log(`   ✅ Kriteria "${kriteria.nama}" skor ${rubrik.skor}: ${rubrik.label}`);
        } catch (err) {
          totalSkipped++;
          console.log(`   ❌ Error: Kriteria "${kriteria.nama}" skor ${rubrik.skor}: ${err.message}`);
        }
      }
    }
  }

  console.log(`\n✅ Seeding selesai!`);
  console.log(`   Inserted/Updated: ${totalInserted}`);
  console.log(`   Skipped: ${totalSkipped}`);
}

main()
  .catch((err) => {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
