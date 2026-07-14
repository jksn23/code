/**
 * SERVICE: Digital Document Repository (ADMS)
 * 
 * Pengelolaan terpusat seluruh dokumen (Uploaded & Generated)
 * dengan fitur:
 * - Version control otomatis (v1 -> v2 -> v3)
 * - Soft delete
 * - Validasi MIME type & ukuran file (maks 10MB)
 * - Filtering komprehensif berdasarkan owner, asset, auction, type, status
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../models/prisma.client.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_BASE_DIR = path.join(__dirname, '../../uploads/repository');

if (!fs.existsSync(UPLOAD_BASE_DIR)) {
  fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });
}

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

class DocumentRepositoryService {
  /**
   * Validasi tipe dan ukuran file
   */
  validateFile(file) {
    if (!file) throw new Error('File tidak ditemukan');

    const cleanName = path.basename(file.originalname);
    const ext = path.extname(cleanName).toLowerCase();
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx'];
    
    // Whitelist ekstensi
    if (!allowedExtensions.includes(ext)) {
      if (file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (e) {}
      }
      const err = new Error(`Ekstensi file "${ext}" tidak diizinkan. Format yang diperbolehkan: PDF, JPG, PNG, WEBP, DOC, DOCX`);
      err.status = 400;
      throw err;
    }

    // Pengecekan ukuran file
    if (file.size > MAX_FILE_SIZE) {
      if (file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (e) {}
      }
      const err = new Error(`Ukuran file melebihi batas maksimal 10MB (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      err.status = 413;
      throw err;
    }

    // Pengecekan MIME type
    if (file.mimetype && !ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      if (file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (e) {}
      }
      const err = new Error(`Tipe file "${file.mimetype}" tidak didukung. Format yang diperbolehkan: PDF, JPG, PNG, WEBP, DOC, DOCX`);
      err.status = 415;
      throw err;
    }

    // Validasi Magic Bytes (khusus PDF)
    if (ext === '.pdf' && file.path && fs.existsSync(file.path)) {
      try {
        const buffer = fs.readFileSync(file.path);
        const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46; // %PDF
        if (!isPdf) {
          try { fs.unlinkSync(file.path); } catch (e) {}
          const err = new Error('Berkas PDF tidak valid (magic bytes mismatch).');
          err.status = 400;
          throw err;
        }
      } catch (err) {
        if (file.path && fs.existsSync(file.path)) {
          try { fs.unlinkSync(file.path); } catch (e) {}
        }
        if (!err.status) err.status = 400;
        throw err;
      }
    }
  }

  /**
   * Simpan dokumen baru ke repository dengan versioning otomatis
   */
  async createDocument({
    ownerId = null,
    auctionId = null,
    assetId = null,
    documentType,
    fileName,
    originalFileName,
    storagePath,
    mimeType,
    fileSize,
    uploadedBy,
    status = 'PENDING_VERIFICATION',
    verificationNote = null,
  }) {
    // Cari versi tertinggi sebelumnya untuk kombinasi ownerId/assetId/auctionId + documentType
    const existingVersions = await prisma.document.findMany({
      where: {
        documentType,
        ...(ownerId && { ownerId: Number(ownerId) }),
        ...(assetId && { assetId: Number(assetId) }),
        ...(auctionId && { auctionId: Number(auctionId) }),
        deletedAt: null,
      },
      orderBy: { version: 'desc' },
      take: 1,
    });

    const nextVersion = existingVersions.length > 0 ? existingVersions[0].version + 1 : 1;

    const document = await prisma.document.create({
      data: {
        ownerId: ownerId ? Number(ownerId) : null,
        auctionId: auctionId ? Number(auctionId) : null,
        assetId: assetId ? Number(assetId) : null,
        documentType,
        fileName,
        originalFileName: originalFileName || fileName,
        storagePath,
        mimeType: mimeType || 'application/octet-stream',
        fileSize: fileSize ? Number(fileSize) : null,
        version: nextVersion,
        status,
        verificationNote,
        uploadedBy: Number(uploadedBy),
      },
      include: {
        uploader: { select: { id: true, nama: true, email: true, role: true } },
        owner: { select: { id: true, nama: true } },
        verifier: { select: { id: true, nama: true } },
      },
    });

    // Catat activity log UPLOAD / REUPLOAD
    const actionName = nextVersion > 1 ? 'REUPLOAD' : 'UPLOAD';
    await prisma.documentActivity.create({
      data: {
        documentId: document.id,
        action: actionName,
        actorId: Number(uploadedBy),
        note: `Dokumen versi v${nextVersion} diunggah.`,
      },
    });

    logger.dokumen(`[ADMS Repository] Dokumen v${nextVersion} berhasil disimpan`, {
      documentId: document.id,
      documentType,
      version: nextVersion,
    });

    return document;
  }

  /**
   * Cari dokumen dengan filter
   */
  async getDocuments({
    ownerId,
    assetId,
    auctionId,
    documentType,
    status,
    search,
    includeDeleted = false,
  }) {
    const where = {
      ...(!includeDeleted && { deletedAt: null }),
      ...(ownerId && { ownerId: Number(ownerId) }),
      ...(assetId && { assetId: Number(assetId) }),
      ...(auctionId && { auctionId: Number(auctionId) }),
      ...(documentType && { documentType }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { fileName: { contains: search } },
          { originalFileName: { contains: search } },
        ],
      }),
    };

    const dbDocs = await prisma.document.findMany({
      where,
      include: {
        uploader: { select: { id: true, nama: true, role: true } },
        verifier: { select: { id: true, nama: true } },
        aset: { select: { id: true, nama: true } },
        lelang: { select: { id: true, invoiceNumber: true } },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { actor: { select: { nama: true } } },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { version: 'desc' }],
    });

    // Jika dipanggil oleh Penjual (ownerId ada), agregasikan juga file yang diunggah dari Form Aset & Profile
    if (ownerId) {
      const synthesizedDocs = [];
      const userObj = await prisma.user.findUnique({
        where: { id: Number(ownerId) },
        include: {
          penjual: true,
        },
      });

      if (userObj) {
        // 1. KTP Penjual
        if (userObj.ktpUrl) {
          synthesizedDocs.push({
            id: 'ktp-' + userObj.id,
            originalFileName: path.basename(userObj.ktpUrl),
            fileName: path.basename(userObj.ktpUrl),
            documentType: 'KTP_PENJUAL',
            storagePath: userObj.ktpUrl,
            mimeType: 'image/jpeg',
            fileSize: null,
            version: 1,
            status: userObj.penjual?.isVerified ? 'APPROVED' : 'PENDING_VERIFICATION',
            uploader: { id: userObj.id, nama: userObj.nama, role: userObj.role },
            createdAt: userObj.createdAt,
          });
        }
        // 2. NPWP Penjual
        if (userObj.penjual?.npwpUrl) {
          synthesizedDocs.push({
            id: 'npwp-' + userObj.id,
            originalFileName: path.basename(userObj.penjual.npwpUrl),
            fileName: path.basename(userObj.penjual.npwpUrl),
            documentType: 'NPWP_PENJUAL',
            storagePath: userObj.penjual.npwpUrl,
            mimeType: 'image/jpeg',
            fileSize: null,
            version: 1,
            status: userObj.penjual.isVerified ? 'APPROVED' : 'PENDING_VERIFICATION',
            uploader: { id: userObj.id, nama: userObj.nama, role: userObj.role },
            createdAt: userObj.createdAt,
          });
        }

        // 3. Dokumen Aset milik Penjual
        const assets = await prisma.aset.findMany({
          where: { penjual: { userId: Number(ownerId) } },
          include: {
            assetProperty: true,
            assetVehicle: true,
            assetElectronic: true,
            lelang: {
              include: { dokumen: true },
            },
          },
        });

        assets.forEach((ast) => {
          const statusAset = ast.statusPenilaian === 'DISETUJUI' ? 'APPROVED' : 'PENDING_VERIFICATION';

          if (ast.dokumenUrl) {
            synthesizedDocs.push({
              id: `ast-doc-${ast.id}`,
              originalFileName: path.basename(ast.dokumenUrl),
              fileName: path.basename(ast.dokumenUrl),
              documentType: 'SURAT_PERMOHONAN_LELANG',
              storagePath: ast.dokumenUrl,
              mimeType: 'application/pdf',
              fileSize: null,
              version: 1,
              status: statusAset,
              uploader: { id: userObj.id, nama: userObj.nama, role: userObj.role },
              aset: { id: ast.id, nama: ast.nama },
              createdAt: ast.createdAt,
            });
          }

          if (ast.assetProperty?.certificateFile) {
            synthesizedDocs.push({
              id: `prop-cert-${ast.id}`,
              originalFileName: path.basename(ast.assetProperty.certificateFile),
              fileName: path.basename(ast.assetProperty.certificateFile),
              documentType: 'DOKUMEN_KEPEMILIKAN',
              storagePath: ast.assetProperty.certificateFile,
              mimeType: 'application/pdf',
              fileSize: null,
              version: 1,
              status: statusAset,
              uploader: { id: userObj.id, nama: userObj.nama, role: userObj.role },
              aset: { id: ast.id, nama: ast.nama },
              createdAt: ast.createdAt,
            });
          }

          if (ast.assetVehicle?.bpkbFile) {
            synthesizedDocs.push({
              id: `veh-bpkb-${ast.id}`,
              originalFileName: path.basename(ast.assetVehicle.bpkbFile),
              fileName: path.basename(ast.assetVehicle.bpkbFile),
              documentType: 'DOKUMEN_KEPEMILIKAN',
              storagePath: ast.assetVehicle.bpkbFile,
              mimeType: 'application/pdf',
              fileSize: null,
              version: 1,
              status: statusAset,
              uploader: { id: userObj.id, nama: userObj.nama, role: userObj.role },
              aset: { id: ast.id, nama: ast.nama },
              createdAt: ast.createdAt,
            });
          }

          if (ast.assetVehicle?.stnkFile) {
            synthesizedDocs.push({
              id: `veh-stnk-${ast.id}`,
              originalFileName: path.basename(ast.assetVehicle.stnkFile),
              fileName: path.basename(ast.assetVehicle.stnkFile),
              documentType: 'DOKUMEN_KEPEMILIKAN',
              storagePath: ast.assetVehicle.stnkFile,
              mimeType: 'application/pdf',
              fileSize: null,
              version: 1,
              status: statusAset,
              uploader: { id: userObj.id, nama: userObj.nama, role: userObj.role },
              aset: { id: ast.id, nama: ast.nama },
              createdAt: ast.createdAt,
            });
          }

          if (ast.assetVehicle?.vehiclePhoto) {
            synthesizedDocs.push({
              id: `veh-photo-${ast.id}`,
              originalFileName: path.basename(ast.assetVehicle.vehiclePhoto),
              fileName: path.basename(ast.assetVehicle.vehiclePhoto),
              documentType: 'FOTO_ASET',
              storagePath: ast.assetVehicle.vehiclePhoto,
              mimeType: 'image/jpeg',
              fileSize: null,
              version: 1,
              status: statusAset,
              uploader: { id: userObj.id, nama: userObj.nama, role: userObj.role },
              aset: { id: ast.id, nama: ast.nama },
              createdAt: ast.createdAt,
            });
          }

          if (ast.assetElectronic?.itemPhoto) {
            synthesizedDocs.push({
              id: `elec-photo-${ast.id}`,
              originalFileName: path.basename(ast.assetElectronic.itemPhoto),
              fileName: path.basename(ast.assetElectronic.itemPhoto),
              documentType: 'FOTO_ASET',
              storagePath: ast.assetElectronic.itemPhoto,
              mimeType: 'image/jpeg',
              fileSize: null,
              version: 1,
              status: statusAset,
              uploader: { id: userObj.id, nama: userObj.nama, role: userObj.role },
              aset: { id: ast.id, nama: ast.nama },
              createdAt: ast.createdAt,
            });
          }

          // 4. Dokumen generated lelang legacy
          ast.lelang.forEach((l) => {
            l.dokumen.forEach((d) => {
              synthesizedDocs.push({
                id: `leg-doc-${d.id}`,
                originalFileName: d.namaFile,
                fileName: d.namaFile,
                documentType: d.tipe === 'SURAT_PENETAPAN' ? 'SURAT_PENETAPAN_LELANG' : d.tipe,
                storagePath: d.filePath,
                mimeType: d.namaFile.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                fileSize: null,
                version: 1,
                status: 'APPROVED',
                uploader: { id: userObj.id, nama: 'Sistem Lelang', role: 'ADMIN' },
                aset: { id: ast.id, nama: ast.nama },
                lelang: { id: l.id, invoiceNumber: l.invoiceNumber },
                createdAt: d.createdAt,
              });
            });
          });
        });
      }

      // Hindari duplikat jika storagePath sudah ada di dbDocs
      const existingPaths = new Set(dbDocs.map((d) => d.storagePath));
      const newSynths = synthesizedDocs.filter((d) => !existingPaths.has(d.storagePath));

      return [...dbDocs, ...newSynths];
    }

    return dbDocs;
  }

  /**
   * Ambil detail dokumen berdasarkan ID beserta riwayat versi
   */
  async getDocumentById(id) {
    const doc = await prisma.document.findUnique({
      where: { id: Number(id) },
      include: {
        uploader: { select: { id: true, nama: true, role: true } },
        verifier: { select: { id: true, nama: true } },
        owner: { select: { id: true, nama: true, email: true } },
        aset: { select: { id: true, nama: true } },
        lelang: { select: { id: true, invoiceNumber: true } },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: { actor: { select: { id: true, nama: true, role: true } } },
        },
      },
    });

    if (!doc || doc.deletedAt) throw new Error('Dokumen tidak ditemukan');

    // Cari versi-versi lainnya dari dokumen ini
    const versions = await prisma.document.findMany({
      where: {
        documentType: doc.documentType,
        ...(doc.ownerId && { ownerId: doc.ownerId }),
        ...(doc.assetId && { assetId: doc.assetId }),
        ...(doc.auctionId && { auctionId: doc.auctionId }),
        deletedAt: null,
      },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        version: true,
        fileName: true,
        storagePath: true,
        status: true,
        createdAt: true,
      },
    });

    return { ...doc, versionHistory: versions };
  }

  /**
   * Soft delete dokumen
   */
  async softDeleteDocument(id, actorId) {
    const doc = await prisma.document.findUnique({ where: { id: Number(id) } });
    if (!doc) throw new Error('Dokumen tidak ditemukan');

    const updated = await prisma.document.update({
      where: { id: Number(id) },
      data: { deletedAt: new Date() },
    });

    await prisma.documentActivity.create({
      data: {
        documentId: Number(id),
        action: 'DELETE',
        actorId: Number(actorId),
        note: 'Dokumen di-soft delete.',
      },
    });

    return updated;
  }
}

export const documentRepositoryService = new DocumentRepositoryService();
