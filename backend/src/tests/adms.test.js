/**
 * TEST SUITE: Auction Document Management System (ADMS)
 * 
 * Pengujian otomatis modul ADMS:
 * 1. Document Repository (Upload, Versioning v1->v2, Filtering)
 * 2. Document Workflow & Checklist Evaluator
 * 3. Multi-Format Generator (PDF & DOCX)
 * 4. Digital Archive ZIP Packager
 */

import prisma from '../models/prisma.client.js';
import { documentRepositoryService } from '../services/document_repository.service.js';
import { documentWorkflowService } from '../services/document_workflow.service.js';
import { dokumenGeneratorService } from '../services/dokumen.service.js';
import { documentArchiveService } from '../services/document_archive.service.js';

async function runADMSTests() {
  console.log('🚀 === MULAI PENGUJIAN ADMS (Auction Document Management System) ===\n');
  let passed = 0;
  let failed = 0;

  try {
    // 1. Ambil admin & aset contoh dari DB
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const asetSample = await prisma.aset.findFirst();
    const lelangSample = await prisma.lelang.findFirst();

    if (!adminUser || !asetSample) {
      console.log('⚠️ Data contoh (Admin / Aset) tidak cukup di database. Melewati test.');
      process.exit(0);
    }

    // ── TEST 1: Document Repository Upload & Versioning ───────────────────────
    console.log('📋 Test 1: Upload Dokumen Repository & Versioning (v1 -> v2)...');

    const docV1 = await documentRepositoryService.createDocument({
      assetId: asetSample.id,
      documentType: 'SURAT_PERMOHONAN_LELANG',
      fileName: 'surat_permohonan_v1.pdf',
      originalFileName: 'Surat Permohonan.pdf',
      storagePath: 'uploads/repository/test_v1.pdf',
      mimeType: 'application/pdf',
      fileSize: 1024,
      uploadedBy: adminUser.id,
    });

    const docV2 = await documentRepositoryService.createDocument({
      assetId: asetSample.id,
      documentType: 'SURAT_PERMOHONAN_LELANG',
      fileName: 'surat_permohonan_v2.pdf',
      originalFileName: 'Surat Permohonan Revisi.pdf',
      storagePath: 'uploads/repository/test_v2.pdf',
      mimeType: 'application/pdf',
      fileSize: 2048,
      uploadedBy: adminUser.id,
    });

    if (docV1.version === 1 && docV2.version === 2) {
      console.log(`✅ LULUS: Versioning otomatis berhasil! (v1: ${docV1.version}, v2: ${docV2.version})`);
      passed++;
    } else {
      console.error(`❌ GAGAL: Versioning tidak sesuai (v1: ${docV1.version}, v2: ${docV2.version})`);
      failed++;
    }

    // ── TEST 2: Workflow Verification (APPROVE / REJECT) ──────────────────────
    console.log('\n📋 Test 2: Workflow Status Verifikasi (Approve/Reject)...');

    const approvedDoc = await documentWorkflowService.verifyDocument(
      docV2.id,
      'APPROVED',
      'Dokumen lengkap & sah',
      adminUser.id
    );

    if (approvedDoc.status === 'APPROVED') {
      console.log('✅ LULUS: Status verifikasi berhasil diubah ke APPROVED!');
      passed++;
    } else {
      console.error('❌ GAGAL: Status verifikasi gagal diubah.');
      failed++;
    }

    // ── TEST 3: Asset Document Checklist Evaluator ────────────────────────────
    console.log('\n📋 Test 3: Asset Document Checklist Evaluator & Guard...');

    const checklist = await documentWorkflowService.evaluateAssetChecklist(asetSample.id);

    if (checklist && Array.isArray(checklist.items) && checklist.items.length === 7) {
      console.log(`✅ LULUS: Checklist 7 dokumen wajib ter-evaluasi! (Complete: ${checklist.isComplete}, CanApprove: ${checklist.canApproveAuction})`);
      passed++;
    } else {
      console.error('❌ GAGAL: Evaluasi checklist tidak mengembalikan 7 item wajib.');
      failed++;
    }

    // ── TEST 4: Multi-Format Document Generator (PDF) ─────────────────────────
    if (lelangSample) {
      console.log('\n📋 Test 4: PDF Document Generator (Puppeteer Render)...');

      const pdfDoc = await dokumenGeneratorService.generateDokumen({
        lelangId: lelangSample.id,
        tipe: 'SURAT_PENETAPAN_LELANG',
        format: 'pdf',
        generatedBy: adminUser.id,
      });

      if (pdfDoc && pdfDoc.namaFile.endsWith('.pdf')) {
        console.log(`✅ LULUS: Berkas PDF resmi berhasil digenerate: ${pdfDoc.namaFile}`);
        passed++;
      } else {
        console.error('❌ GAGAL: PDF Document Generator gagal.');
        failed++;
      }

      // ── TEST 5: Digital Archive ZIP Packager ─────────────────────────────────
      console.log('\n📋 Test 5: Digital Archive ZIP Packager...');

      const zipResult = await documentArchiveService.createAuctionArchiveZip(
        lelangSample.id,
        adminUser.id
      );

      if (zipResult && zipResult.archiveFilename.endsWith('.zip')) {
        console.log(`✅ LULUS: Paket ZIP Arsip lelang berhasil dibuat: ${zipResult.archiveFilename} (${zipResult.fileCount} berkas)`);
        passed++;
      } else {
        console.error('❌ GAGAL: Digital Archive ZIP Packager gagal.');
        failed++;
      }
    }

    // Cleanup test records
    await prisma.document.deleteMany({ where: { id: { in: [docV1.id, docV2.id] } } }).catch(() => null);

    console.log('\n===============================================================');
    console.log(`📊 RINGKASAN TEST ADMS: ${passed} LULUS, ${failed} GAGAL.`);
    console.log('===============================================================\n');
  } catch (err) {
    console.error('❌ Terjadi kesalahan pada test ADMS:', err.message, err.stack);
  } finally {
    await prisma.$disconnect();
  }
}

runADMSTests();
