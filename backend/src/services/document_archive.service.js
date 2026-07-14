/**
 * SERVICE: Digital Archive & ZIP Packager (ADMS)
 * 
 * Mengumpulkan seluruh berkas administrasi lelang yang telah selesai:
 * - Dokumen Terupload (KTP, NPWP, Kepemilikan, Foto, Pengumuman)
 * - Dokumen Digenerate (Surat Penetapan, Berita Acara, Nota Pembayaran, Ringkasan Hasil)
 * - Log Aktivitas Dokumen & Riwayat Bidding
 * 
 * Mengompresi seluruh berkas menjadi file .zip siap unduh (Download ZIP).
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { ZipArchive } = require('archiver');
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../models/prisma.client.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARCHIVE_DIR = path.join(__dirname, '../../uploads/archives');

if (!fs.existsSync(ARCHIVE_DIR)) {
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
}

class DocumentArchiveService {
  /**
   * Membuat bundel ZIP arsip lelang komprehensif
   * @param {number} auctionId - ID Lelang
   * @param {number} actorId   - ID user yang meminta arsip (Admin)
   * @returns {Promise<{ archivePath: string, archiveFilename: string, fileCount: number }>}
   */
  async createAuctionArchiveZip(auctionId, actorId) {
    const lelang = await prisma.lelang.findUnique({
      where: { id: Number(auctionId) },
      include: {
        aset: {
          include: {
            penjual: { include: { user: true } },
            hasil: { orderBy: { id: 'desc' }, take: 1 },
          },
        },
        pemenang: { select: { nama: true, email: true } },
        penawaran: { orderBy: { nominal: 'desc' }, include: { user: { select: { nama: true } } } },
      },
    });

    if (!lelang) throw new Error(`Lelang dengan ID ${auctionId} tidak ditemukan`);

    // Ambil seluruh dokumen repository yang terkait lelang / aset
    const repoDocs = await prisma.document.findMany({
      where: {
        OR: [
          { auctionId: Number(auctionId) },
          { assetId: lelang.asetId },
          { ownerId: lelang.aset.penjual?.userId },
        ],
        deletedAt: null,
      },
    });

    // Ambil dokumen generated legacy jika ada
    const legacyDocs = await prisma.dokumen.findMany({
      where: { lelangId: Number(auctionId) },
    });

    const timestamp = Date.now();
    const invoiceNum = lelang.invoiceNumber || `LEL-${auctionId}`;
    const archiveFilename = `Arsip_Lelang_${invoiceNum}_${timestamp}.zip`;
    const archivePath = path.join(ARCHIVE_DIR, archiveFilename);

    const output = fs.createWriteStream(archivePath);
    const archive = new ZipArchive({ zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
      let fileCount = 0;

      output.on('close', async () => {
        logger.dokumen(`[ADMS Archive] ZIP Arsip lelang ${auctionId} berhasil dibuat`, {
          archiveFilename,
          sizeBytes: archive.pointer(),
          fileCount,
        });

        // Update status dokumen ke ARCHIVED
        await prisma.document.updateMany({
          where: {
            OR: [
              { auctionId: Number(auctionId) },
              { assetId: lelang.asetId },
            ],
          },
          data: { status: 'ARCHIVED' },
        });

        resolve({
          archivePath,
          archiveFilename,
          fileSize: archive.pointer(),
          fileCount,
          publicUrl: `uploads/archives/${archiveFilename}`,
        });
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      // 1. Tambahkan berkas dari Document Repository
      repoDocs.forEach((doc) => {
        const fullPath = path.join(__dirname, '../../', doc.storagePath);
        if (fs.existsSync(fullPath)) {
          const zipFolderName = doc.documentType.toLowerCase();
          archive.file(fullPath, { name: `${zipFolderName}/${doc.fileName}` });
          fileCount++;
        }
      });

      // 2. Tambahkan berkas dari Legacy Generated Dokumen
      legacyDocs.forEach((doc) => {
        const fullPath = path.join(__dirname, '../../', doc.filePath);
        if (fs.existsSync(fullPath)) {
          archive.file(fullPath, { name: `sistem_generated/${doc.namaFile}` });
          fileCount++;
        }
      });

      // 3. Tambahkan Ringkasan PDF / Teks Hasil Lelang & SPK
      const summaryText = `
=================================================================
             RINGKASAN ARSIP LELANG ONLINE (ADMS)
=================================================================
ID Lelang             : ${lelang.id}
Invoice / No. Surat   : ${lelang.invoiceNumber || '-'}
Status Lelang         : ${lelang.status}
Tanggal Buka          : ${lelang.waktuBuka ? new Date(lelang.waktuBuka).toLocaleString('id-ID') : '-'}
Tanggal Tutup         : ${lelang.waktuTutup ? new Date(lelang.waktuTutup).toLocaleString('id-ID') : '-'}

-----------------------------------------------------------------
DATA ASET & SPK AHP-SAW
-----------------------------------------------------------------
Nama Aset             : ${lelang.aset?.nama || '-'}
Harga Pasaran Median  : Rp ${Number(lelang.aset?.hargaPasar || 0).toLocaleString('id-ID')}
Nilai Limit SPK       : Rp ${Number(lelang.aset?.limitValue || 0).toLocaleString('id-ID')}
Nilai Preferensi SAW  : ${lelang.aset?.hasil?.[0]?.nilaiPreferensi || '-'}

-----------------------------------------------------------------
HASIL BIDDING & PEMENANG
-----------------------------------------------------------------
Pemenang Lelang       : ${lelang.pemenang?.nama || '-'} (${lelang.pemenang?.email || '-'})
Harga Terjual Akhir   : Rp ${Number(lelang.penawaran?.[0]?.nominal || 0).toLocaleString('id-ID')}
Status Pembayaran     : ${lelang.statusPembayaran}
Total Bidding Masuk   : ${lelang.penawaran.length} penawaran

-----------------------------------------------------------------
Tanggal Dibuat Arsip  : ${new Date().toLocaleString('id-ID')}
=================================================================
      `.trim();

      archive.append(summaryText, { name: 'ringkasan_arsip_lelang.txt' });
      fileCount++;

      archive.finalize();
    });
  }
}

export const documentArchiveService = new DocumentArchiveService();
