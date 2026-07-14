/**
 * SERVICE: Document Workflow & Verification Checklist (ADMS)
 * 
 * Pengelolaan workflow status dokumen:
 *   Draft -> Uploaded -> Pending Verification -> Approved / Rejected -> Archived
 * 
 * Serta evaluator checklist kelengkapan dokumen pengajuan aset:
 * - KTP Penjual
 * - NPWP Penjual
 * - Surat Permohonan Lelang
 * - Surat Pernyataan
 * - Dokumen Kepemilikan (Sertifikat / BPKB / STNK)
 * - Foto Aset
 * - Bukti Pengumuman
 */

import prisma from '../models/prisma.client.js';
import logger from '../utils/logger.js';

// Tipe dokumen wajib yang dipersyaratkan untuk kelengkapan pengajuan lelang
const REQUIRED_ASSET_DOCUMENTS = [
  { type: 'KTP_PENJUAL', label: 'KTP Penjual' },
  { type: 'NPWP_PENJUAL', label: 'NPWP Penjual' },
  { type: 'SURAT_PERMOHONAN_LELANG', label: 'Surat Permohonan Lelang' },
  { type: 'SURAT_PERNYATAAN', label: 'Surat Pernyataan' },
  { type: 'DOKUMEN_KEPEMILIKAN', label: 'Dokumen Kepemilikan (BPKB/STNK/Sertifikat)' },
  { type: 'FOTO_ASET', label: 'Foto Aset' },
  { type: 'BUKTI_PENGUMUMAN', label: 'Bukti Pengumuman Lelang' },
];

class DocumentWorkflowService {
  /**
   * Evaluasi kelengkapan dan status checklist dokumen untuk sebuah aset
   * @param {number} assetId
   */
  async evaluateAssetChecklist(assetId) {
    const aset = await prisma.aset.findUnique({
      where: { id: Number(assetId) },
      include: {
        penjual: { select: { id: true, userId: true, user: { select: { nama: true } } } },
        assetVehicle: true,
        assetProperty: true,
        assetElectronic: true,
      },
    });

    if (!aset) throw new Error(`Aset tidak ditemukan: id=${assetId}`);

    // Ambil dokumen-dokumen terbaru (deletedAt: null) yang terkait aset / owner
    const docs = await prisma.document.findMany({
      where: {
        OR: [
          { assetId: Number(assetId) },
          { ownerId: aset.penjual?.userId },
        ],
        deletedAt: null,
      },
      orderBy: { version: 'desc' },
    });

    // Map tipe -> dokumen versi tertinggi
    const docMap = new Map();
    docs.forEach((d) => {
      if (!docMap.has(d.documentType)) {
        docMap.set(d.documentType, d);
      }
    });

    // Periksa fallback dari tabel legacy Penjual / Asset Vehicle jika belum ada di tabel `documents`
    if (!docMap.has('KTP_PENJUAL') && aset.penjual?.userId) {
      const u = await prisma.user.findUnique({ where: { id: aset.penjual.userId } });
      if (u?.ktpUrl) {
        docMap.set('KTP_PENJUAL', {
          id: -1,
          documentType: 'KTP_PENJUAL',
          fileName: 'KTP Penjual (Profil)',
          storagePath: u.ktpUrl,
          status: aset.penjual.isVerified ? 'APPROVED' : 'PENDING_VERIFICATION',
          version: 1,
        });
      }
    }

    if (!docMap.has('NPWP_PENJUAL') && aset.penjual?.npwpUrl) {
      docMap.set('NPWP_PENJUAL', {
        id: -2,
        documentType: 'NPWP_PENJUAL',
        fileName: 'NPWP Penjual (Profil)',
        storagePath: aset.penjual.npwpUrl,
        status: aset.penjual.isVerified ? 'APPROVED' : 'PENDING_VERIFICATION',
        version: 1,
      });
    }

    if (!docMap.has('DOKUMEN_KEPEMILIKAN') && aset.assetVehicle?.bpkbFile) {
      docMap.set('DOKUMEN_KEPEMILIKAN', {
        id: -3,
        documentType: 'DOKUMEN_KEPEMILIKAN',
        fileName: 'BPKB Kendaraan',
        storagePath: aset.assetVehicle.bpkbFile,
        status: 'APPROVED',
        version: 1,
      });
    }

    if (!docMap.has('FOTO_ASET') && aset.assetVehicle?.vehiclePhoto) {
      docMap.set('FOTO_ASET', {
        id: -4,
        documentType: 'FOTO_ASET',
        fileName: 'Foto Kendaraan',
        storagePath: aset.assetVehicle.vehiclePhoto,
        status: 'APPROVED',
        version: 1,
      });
    }

    // Evaluasi setiap item checklist
    const checklistItems = REQUIRED_ASSET_DOCUMENTS.map((req) => {
      const existingDoc = docMap.get(req.type);

      return {
        type: req.type,
        label: req.label,
        isPresent: !!existingDoc,
        document: existingDoc || null,
        status: existingDoc ? existingDoc.status : 'MISSING', // APPROVED, PENDING_VERIFICATION, REJECTED, MISSING
        isApproved: existingDoc?.status === 'APPROVED',
      };
    });

    const isComplete = checklistItems.every((item) => item.isPresent);
    const allApproved = checklistItems.every((item) => item.isApproved);

    return {
      assetId: Number(assetId),
      assetName: aset.nama,
      isComplete,
      allApproved,
      canApproveAuction: allApproved, // Hard Guard: Tombol verifikasi hanya aktif jika 100% APPROVED
      items: checklistItems,
    };
  }

  /**
   * Verifikasi dokumen (Approve / Reject) oleh Admin
   */
  async verifyDocument(documentId, status, note, verifierId) {
    if (!['APPROVED', 'REJECTED', 'PENDING_VERIFICATION'].includes(status)) {
      throw new Error(`Status validasi tidak valid: ${status}`);
    }

    const doc = await prisma.document.findUnique({ where: { id: Number(documentId) } });
    if (!doc) throw new Error('Dokumen tidak ditemukan');

    const updated = await prisma.document.update({
      where: { id: Number(documentId) },
      data: {
        status,
        verificationNote: note || null,
        verifiedBy: Number(verifierId),
        verifiedAt: new Date(),
      },
      include: {
        verifier: { select: { nama: true } },
      },
    });

    // Catat activity log
    const action = status === 'APPROVED' ? 'VERIFY' : status === 'REJECTED' ? 'REJECT' : 'PENDING';
    await prisma.documentActivity.create({
      data: {
        documentId: Number(documentId),
        action,
        actorId: Number(verifierId),
        note: note || `Status dokumen diubah menjadi ${status}.`,
      },
    });

    logger.dokumen(`[ADMS Workflow] Verifikasi dokumen: ${status}`, {
      documentId,
      status,
      verifierId,
    });

    return updated;
  }
}

export const documentWorkflowService = new DocumentWorkflowService();
