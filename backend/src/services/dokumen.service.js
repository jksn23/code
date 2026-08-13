/**
 * SERVICE: Dokumen Generator & Multi-Format Render (DOCX & PDF)
 * 
 * Mendukung 2 Format Output:
 * 1. DOCX: docxtemplater + pizzip (mengisi placeholder {{var}} pada template .docx)
 * 2. PDF : PDFKit rendering tanpa browser/Chromium
 * 
 * Dokumen Sistem yang Didukung:
 * - SURAT_PENETAPAN_LELANG
 * - BERITA_ACARA
 * - NOTA_PEMBAYARAN (Buyer, Seller, Asset, Winning Price, Admin Fee, Total, Due Date)
 * - RINGKASAN_HASIL_LELANG (Hasil SPK AHP-SAW + Median + Bid Log)
 */

import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import * as cheerio from 'cheerio';
import prisma from '../models/prisma.client.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_DIR = path.join(__dirname, '../../templates');
const OUTPUT_DIR = path.join(__dirname, '../../uploads/dokumen');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const TEMPLATE_MAP = {
  SURAT_PENETAPAN_LELANG: 'surat_penetapan.docx',
  BERITA_ACARA: 'berita_acara.docx',
  NOTA_PEMBAYARAN: 'nota_pembayaran.docx',
  RINGKASAN_HASIL_LELANG: 'ringkasan_hasil_lelang.docx',
};

const formatRupiah = (angka) => {
  if (!angka && angka !== 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(angka));
};

const formatTanggal = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

class DokumenGeneratorService {
  /**
   * Ambil data lelang komprehensif untuk pengisian placeholder dokumen
   */
  async getLelangData(lelangId) {
    const lelang = await prisma.lelang.findUnique({
      where: { id: Number(lelangId) },
      include: {
        aset: {
          include: {
            kategori: true,
            hasil: { orderBy: { id: 'desc' }, take: 1 },
            penjual: {
              include: { user: { select: { id: true, nama: true, email: true } } },
            },
          },
        },
        pemenang: { select: { id: true, nama: true, email: true } },
        penawaran: {
          orderBy: { nominal: 'desc' },
          take: 5,
          include: { user: { select: { nama: true, email: true } } },
        },
      },
    });

    if (!lelang) throw new Error(`Lelang dengan ID ${lelangId} tidak ditemukan`);
    return lelang;
  }

  /**
   * Susun data placeholder & variabel administrasi
   */
  buildVariables(lelang, adminName = 'Pejabat Lelang') {
    const aset = lelang.aset;
    const hasil = aset?.hasil?.[0];
    const topBid = lelang.penawaran?.[0];
    const now = new Date();

    const hargaTerjual = Number(topBid?.nominal || aset?.hargaPasar || 0);
    const biayaAdmin = Math.round(hargaTerjual * 0.025); // Biaya admin 2.5%
    const totalPembayaran = hargaTerjual + biayaAdmin;
    const paymentDueDate = lelang.paymentDueDate || new Date(now.getTime() + 48 * 3600 * 1000);

    return {
      nomor_surat: lelang.invoiceNumber || `LEL-${lelang.id}-${now.getFullYear()}`,
      tanggal: formatTanggal(now),
      tahun: String(now.getFullYear()),

      // Penjual
      nama_penjual: aset?.penjual?.user?.nama || 'Penjual Lelang',
      email_penjual: aset?.penjual?.user?.email || '-',

      // Aset & SPK
      nama_aset: aset?.nama || '-',
      kategori_aset: aset?.kategori?.nama || '-',
      harga_referensi: formatRupiah(aset?.hargaPasar),
      nilai_limit: formatRupiah(hasil?.nilaiLimit || aset?.limitValue),
      nilai_preferensi: hasil?.nilaiPreferensi ? Number(hasil.nilaiPreferensi).toFixed(6) : '-',

      // Jadwal
      waktu_buka: lelang.waktuBuka ? formatTanggal(lelang.waktuBuka) : '-',
      waktu_tutup: lelang.waktuTutup ? formatTanggal(lelang.waktuTutup) : '-',

      // Pemenang & Pembayaran (Nota)
      nama_pemenang: lelang.pemenang?.nama || topBid?.user?.nama || 'Belum Ada Pemenang',
      email_pemenang: lelang.pemenang?.email || topBid?.user?.email || '-',
      harga_terjual: formatRupiah(hargaTerjual),
      biaya_admin: formatRupiah(biayaAdmin),
      total_pembayaran: formatRupiah(totalPembayaran),
      deadline_pelunasan: formatTanggal(paymentDueDate),
      status_pembayaran: lelang.statusPembayaran || 'UNPAID',

      // Admin
      nama_admin: adminName,
    };
  }

  /**
   * Render HTML Template untuk PDF resmi
   */
  renderHTMLTemplate(tipe, v) {
    const headerHTML = `
      <div style="text-align: center; border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #1e40af; text-transform: uppercase;">SISTEM LELANG ONLINE BERBASIS SPK AHP-SAW</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #4b5563;">Auction Document Management System (ADMS) — Berkas Resmi</p>
      </div>
    `;

    const footerHTML = `
      <div style="margin-top: 40px; text-align: right;">
        <p style="margin-bottom: 60px;">Ditandatangani secara digital oleh,<br><strong>${v.nama_admin}</strong><br>Pejabat Lelang</p>
      </div>
    `;

    if (tipe === 'SURAT_PENETAPAN_LELANG') {
      return `
        <html>
        <head><style>body { font-family: sans-serif; margin: 40px; color: #111; line-height: 1.6; }</style></head>
        <body>
          ${headerHTML}
          <h3 style="text-align: center; text-decoration: underline;">SURAT PENETAPAN LELANG</h3>
          <p style="text-align: center; font-size: 13px;">Nomor: ${v.nomor_surat}</p>

          <p>Berdasarkan hasil pelaksanaan SPK AHP-SAW dan verifikasi administrasi lelang, menetapkan bahwa:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr><td style="width: 200px; padding: 4px;">Nama Aset</td><td>: <strong>${v.nama_aset}</strong></td></tr>
            <tr><td style="padding: 4px;">Kategori Aset</td><td>: ${v.kategori_aset}</td></tr>
            <tr><td style="padding: 4px;">Penjual</td><td>: ${v.nama_penjual}</td></tr>
            <tr><td style="padding: 4px;">Nilai Referensi Pasar</td><td>: ${v.harga_referensi}</td></tr>
            <tr><td style="padding: 4px;">Nilai Limit Lelang</td><td>: <strong>${v.nilai_limit}</strong></td></tr>
            <tr><td style="padding: 4px;">Waktu Pelaksanaan</td><td>: ${v.waktu_buka} s.d. ${v.waktu_tutup}</td></tr>
          </table>

          <p>Telah ditetapkan jadwal dan ketentuan lelang secara resmi sesuai dengan standar operasional prosedur yang berlaku.</p>
          ${footerHTML}
        </body>
        </html>
      `;
    }

    if (tipe === 'NOTA_PEMBAYARAN') {
      return `
        <html>
        <head><style>body { font-family: sans-serif; margin: 40px; color: #111; line-height: 1.6; } .box { border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin: 15px 0; }</style></head>
        <body>
          ${headerHTML}
          <h3 style="text-align: center; text-decoration: underline;">NOTA PEMBAYARAN KEMENANGAN LELANG</h3>
          <p style="text-align: center; font-size: 13px;">Invoice No: ${v.nomor_surat}</p>

          <div class="box">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #1e40af;">Rincian Pemenang & Aset</p>
            <table style="width: 100%;">
              <tr><td style="width: 180px;">Nama Pemenang</td><td>: <strong>${v.nama_pemenang}</strong> (${v.email_pemenang})</td></tr>
              <tr><td>Nama Penjual</td><td>: ${v.nama_penjual}</td></tr>
              <tr><td>Barang / Aset</td><td>: ${v.nama_aset} (${v.kategori_aset})</td></tr>
            </table>
          </div>

          <div class="box">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #16a34a;">Rincian Pembayaran</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #eee;"><td style="padding: 6px 0;">Harga Terjual (Winning Bid)</td><td style="text-align: right;"><strong>${v.harga_terjual}</strong></td></tr>
              <tr style="border-bottom: 1px solid #eee;"><td style="padding: 6px 0;">Biaya Administrasi Lelang (2.5%)</td><td style="text-align: right;">${v.biaya_admin}</td></tr>
              <tr style="font-size: 16px; font-weight: bold; color: #1e40af;"><td style="padding: 10px 0;">TOTAL PEMBAYARAN</td><td style="text-align: right; color: #16a34a;">${v.total_pembayaran}</td></tr>
            </table>
          </div>

          <p style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px; font-size: 13px;">
            ⚠️ <strong>Batas Waktu Pelunasan:</strong> ${v.deadline_pelunasan}. Harap melakukan transfer sesuai total nominal dan mengunggah bukti pembayaran pada portal lelang.
          </p>

          ${footerHTML}
        </body>
        </html>
      `;
    }

    // Default: BERITA_ACARA / RINGKASAN_HASIL_LELANG
    return `
      <html>
      <head><style>body { font-family: sans-serif; margin: 40px; color: #111; line-height: 1.6; }</style></head>
      <body>
        ${headerHTML}
        <h3 style="text-align: center; text-decoration: underline;">BERITA ACARA & RINGKASAN HASIL LELANG</h3>
        <p style="text-align: center; font-size: 13px;">Nomor: ${v.nomor_surat}</p>

        <p>Pada hari ini tanggal <strong>${v.tanggal}</strong>, telah diselesaikan rangkaian lelang online untuk aset berikut:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr><td style="width: 200px; padding: 4px;">Nama Aset</td><td>: <strong>${v.nama_aset}</strong></td></tr>
          <tr><td style="padding: 4px;">Penjual</td><td>: ${v.nama_penjual}</td></tr>
          <tr><td style="padding: 4px;">Nilai Preferensi SPK</td><td>: ${v.nilai_preferensi}</td></tr>
          <tr><td style="padding: 4px;">Nilai Limit Awal</td><td>: ${v.nilai_limit}</td></tr>
          <tr><td style="padding: 4px;">Pemenang Lelang</td><td>: <strong>${v.nama_pemenang}</strong></td></tr>
          <tr><td style="padding: 4px;">Harga Penawaran Tertinggi</td><td>: <strong style="color: #16a34a;">${v.harga_terjual}</strong></td></tr>
          <tr><td style="padding: 4px;">Status Pembayaran</td><td>: ${v.status_pembayaran}</td></tr>
        </table>

        <p>Demikian Berita Acara Hasil Lelang ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.</p>
        ${footerHTML}
      </body>
      </html>
    `;
  }

  /**
   * Generate PDF menggunakan PDFKit agar kompatibel dengan shared hosting.
   */
  async generatePDF(htmlContent, outputFilename) {
    const outputPath = path.join(OUTPUT_DIR, outputFilename);
    const $ = cheerio.load(htmlContent);
    $('br').replaceWith('\n');
    $('h1, h2, h3, p, tr, li').each((_, element) => {
      $(element).append('\n');
    });
    const text = $('body').text()
      .replace(/\r/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/ *\n */g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const document = new PDFDocument({ size: 'A4', margins: { top: 56, right: 56, bottom: 56, left: 56 } });
      output.on('finish', resolve);
      output.on('error', reject);
      document.on('error', reject);
      document.pipe(output);
      document.font('Helvetica').fontSize(10).lineGap(4).text(text, { align: 'left' });
      document.end();
    });

    return outputPath;
  }

  /**
   * Main Function: Generate Dokumen (Format PDF atau DOCX)
   */
  async generateDokumen({ lelangId, tipe, format = 'pdf', generatedBy }) {
    const lelang = await this.getLelangData(lelangId);
    const adminUser = await prisma.user.findUnique({
      where: { id: Number(generatedBy) },
      select: { nama: true },
    });

    const vars = this.buildVariables(lelang, adminUser?.nama);
    const timestamp = Date.now();

    let outputFilename = '';
    let publicPath = '';

    if (format === 'pdf') {
      outputFilename = `${tipe.toLowerCase()}_lelang_${lelangId}_${timestamp}.pdf`;
      publicPath = `uploads/dokumen/${outputFilename}`;
      const html = this.renderHTMLTemplate(tipe, vars);
      await this.generatePDF(html, outputFilename);
    } else {
      // Format DOCX via docxtemplater
      outputFilename = `${tipe.toLowerCase()}_lelang_${lelangId}_${timestamp}.docx`;
      publicPath = `uploads/dokumen/${outputFilename}`;

      const templateFile = TEMPLATE_MAP[tipe] || 'surat_penetapan.docx';
      const templatePath = path.join(TEMPLATE_DIR, templateFile);

      if (fs.existsSync(templatePath)) {
        const content = fs.readFileSync(templatePath, 'binary');
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
        doc.render(vars);
        const buf = doc.getZip().generate({ type: 'nodebuffer' });
        fs.writeFileSync(path.join(OUTPUT_DIR, outputFilename), buf);
      } else {
        // Fallback PDF jika template DOCX tidak ada
        outputFilename = `${tipe.toLowerCase()}_lelang_${lelangId}_${timestamp}.pdf`;
        publicPath = `uploads/dokumen/${outputFilename}`;
        const html = this.renderHTMLTemplate(tipe, vars);
        await this.generatePDF(html, outputFilename);
      }
    }

    // Map ke enum legacy TipeDokumen untuk tabel legacy `dokumen`
    const legacyTypeMap = {
      SURAT_PENETAPAN_LELANG: 'SURAT_PENETAPAN',
      SURAT_PENETAPAN: 'SURAT_PENETAPAN',
      BERITA_ACARA: 'BERITA_ACARA',
      NOTA_PEMBAYARAN: 'DOKUMEN_HASIL_LELANG',
      RINGKASAN_HASIL_LELANG: 'DOKUMEN_HASIL_LELANG',
      DOKUMEN_HASIL_LELANG: 'DOKUMEN_HASIL_LELANG',
      SURAT_PERMOHONAN: 'SURAT_PERMOHONAN',
    };

    const legacyTipe = legacyTypeMap[tipe] || 'SURAT_PENETAPAN';

    // Simpan record ke database (tabel legacy `dokumen`)
    const dokumenRecord = await prisma.dokumen.create({
      data: {
        lelangId: Number(lelangId),
        tipe: legacyTipe,
        namaFile: outputFilename,
        filePath: publicPath,
        generatedBy: Number(generatedBy),
      },
      include: { generator: { select: { nama: true } } },
    });

    // Simpan juga ke `documents` repository ADMS jika memungkinkan
    try {
      const docTypeMapped = tipe === 'SURAT_PENETAPAN' ? 'SURAT_PENETAPAN_LELANG' : tipe;
      await prisma.document.create({
        data: {
          auctionId: Number(lelangId),
          assetId: lelang.asetId,
          documentType: docTypeMapped,
          fileName: outputFilename,
          originalFileName: outputFilename,
          storagePath: publicPath,
          mimeType: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          status: 'APPROVED',
          uploadedBy: Number(generatedBy),
          verifiedBy: Number(generatedBy),
          verifiedAt: new Date(),
        },
      });
    } catch {
      // Ignore if documentType enum mismatch
    }

    logger.dokumen(`[ADMS Generator] Dokumen ${tipe} (${format.toUpperCase()}) berhasil digenerate`, {
      lelangId,
      outputFilename,
    });

    return dokumenRecord;
  }
}

export const dokumenGeneratorService = new DokumenGeneratorService();
export const generateDokumen = (lelangId, tipe, generatedBy) =>
  dokumenGeneratorService.generateDokumen({ lelangId, tipe, format: 'pdf', generatedBy });
