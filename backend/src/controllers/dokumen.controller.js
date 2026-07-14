/**
 * CONTROLLER: Auction Document Management System (ADMS)
 * 
 * Comprehensive Controller untuk:
 * - Document Repository (Upload, Download, Soft Delete)
 * - Workflow Verification & Checklist Evaluator
 * - Multi-Format Generator (DOCX & PDF)
 * - Digital Archive ZIP Packager
 * - Activity Audit Trail
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import prisma from '../models/prisma.client.js';
import { documentRepositoryService } from '../services/document_repository.service.js';
import { documentWorkflowService } from '../services/document_workflow.service.js';
import { documentArchiveService } from '../services/document_archive.service.js';
import { dokumenGeneratorService } from '../services/dokumen.service.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── 1. UPLOAD DOKUMEN REPOSITORY ─────────────────────────────────────────────

export const uploadDocumentController = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'Harap lampirkan berkas dokumen.' });
    }

    documentRepositoryService.validateFile(file);

    const { ownerId, auctionId, assetId, documentType, verificationNote } = req.body;
    const uploadedBy = req.userId;

    if (!documentType) {
      return res.status(400).json({ success: false, message: 'DocumentType wajib diisi.' });
    }

    const publicPath = `uploads/repository/${file.filename}`;

    const doc = await documentRepositoryService.createDocument({
      ownerId: ownerId || null,
      auctionId: auctionId || null,
      assetId: assetId || null,
      documentType,
      fileName: file.filename,
      originalFileName: file.originalname,
      storagePath: publicPath,
      mimeType: file.mimetype,
      fileSize: file.size,
      uploadedBy,
      status: req.userRole === 'ADMIN' ? 'APPROVED' : 'PENDING_VERIFICATION',
      verificationNote,
    });

    return res.status(201).json({
      success: true,
      message: `Dokumen ${documentType} (v${doc.version}) berhasil diunggah.`,
      data: doc,
    });
  } catch (error) {
    logger.error('[ADMS Controller] Upload Gagal', { error: error.message });
    return res.status(error.status || 400).json({ success: false, message: error.message });
  }
};

// ─── 2. GET REPOSITORY LIST ───────────────────────────────────────────────────

export const getDocumentsRepositoryController = async (req, res) => {
  try {
    const { ownerId, assetId, auctionId, documentType, status, search } = req.query;

    const docs = await documentRepositoryService.getDocuments({
      ownerId: req.userRole === 'PENJUAL' ? req.userId : ownerId,
      assetId,
      auctionId,
      documentType,
      status,
      search,
    });

    return res.json({ success: true, data: docs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 3. VERIFIKASI DOKUMEN (ADMIN) ───────────────────────────────────────────

export const verifyDocumentController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const verifierId = req.userId;

    const updated = await documentWorkflowService.verifyDocument(id, status, note, verifierId);

    return res.json({
      success: true,
      message: `Status dokumen berhasil diubah menjadi ${status}.`,
      data: updated,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ─── 4. ASSET CHECKLIST EVALUATOR ────────────────────────────────────────────

export const getAssetChecklistController = async (req, res) => {
  try {
    const { assetId } = req.params;
    const result = await documentWorkflowService.evaluateAssetChecklist(assetId);

    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 5. GENERATE MULTI-FORMAT (PDF & DOCX) ───────────────────────────────────

export const generateMultiFormatDokumenController = async (req, res) => {
  try {
    const { lelangId } = req.params;
    const { tipe, format = 'pdf' } = req.body;
    const generatedBy = req.userId;

    if (!tipe) {
      return res.status(400).json({ success: false, message: 'Tipe dokumen wajib diisi.' });
    }

    const doc = await dokumenGeneratorService.generateDokumen({
      lelangId: Number(lelangId),
      tipe,
      format,
      generatedBy,
    });

    return res.status(201).json({
      success: true,
      message: `Dokumen ${tipe} (${format.toUpperCase()}) berhasil digenerate.`,
      data: doc,
    });
  } catch (error) {
    logger.error('[ADMS Generator Controller] Error', { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 6. DOWNLOAD DIGITAL ARCHIVE ZIP ──────────────────────────────────────────

export const downloadArchiveZipController = async (req, res) => {
  try {
    const { lelangId } = req.params;
    const actorId = req.userId;

    const archive = await documentArchiveService.createAuctionArchiveZip(lelangId, actorId);

    res.setHeader('Content-Disposition', `attachment; filename="${archive.archiveFilename}"`);
    res.setHeader('Content-Type', 'application/zip');
    return res.sendFile(archive.archivePath);
  } catch (error) {
    logger.error('[ADMS Archive Controller] Error', { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 7. ACTIVITY AUDIT LOG ────────────────────────────────────────────────────

export const getActivityLogsController = async (req, res) => {
  try {
    const logs = await prisma.documentActivity.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { nama: true, email: true, role: true } },
        document: { select: { fileName: true, documentType: true } },
      },
    });

    return res.json({ success: true, data: logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── LEGACY CONTROLLERS (COMPATIBILITY) ────────────────────────────────────────

export const generateDokumenController = generateMultiFormatDokumenController;

export const getDokumenController = async (req, res) => {
  try {
    const { lelangId } = req.params;
    const docs = await prisma.dokumen.findMany({
      where: { lelangId: Number(lelangId) },
      include: { generator: { select: { nama: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: docs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const downloadDokumenController = async (req, res) => {
  try {
    const { dokumenId } = req.params;
    const doc = await prisma.dokumen.findUnique({ where: { id: Number(dokumenId) } });

    if (!doc) {
      // Cek ke tabel documents
      const admsDoc = await prisma.document.findUnique({ where: { id: Number(dokumenId) } });
      if (!admsDoc) return res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan' });
      const fullPath = path.join(__dirname, '../../', admsDoc.storagePath);
      return res.sendFile(fullPath);
    }

    const fullPath = path.join(__dirname, '../../', doc.filePath);
    return res.sendFile(fullPath);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDokumenController = async (req, res) => {
  try {
    const { dokumenId } = req.params;
    await prisma.dokumen.delete({ where: { id: Number(dokumenId) } }).catch(() => null);
    await documentRepositoryService.softDeleteDocument(dokumenId, req.userId).catch(() => null);
    return res.json({ success: true, message: 'Dokumen berhasil dihapus' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
