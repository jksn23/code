-- Reconcile the historical baseline migration with the current Prisma schema.
-- The bobot_ahp backfill preserves legacy weights before making version_id required.

CREATE TABLE `bobot_version` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kategori_id` INTEGER NOT NULL,
    `namaVersi` VARCHAR(100) NOT NULL,
    `jumlah_pakar` INTEGER NULL,
    `lambdaMax` DECIMAL(10, 6) NULL,
    `ci` DECIMAL(10, 6) NULL,
    `ri` DECIMAL(10, 6) NULL,
    `cr` DECIMAL(10, 6) NOT NULL,
    `tanggal_validasi` DATETIME(3) NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT false,
    `catatan` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `bobot_ahp` ADD COLUMN `version_id` INTEGER NULL;

INSERT INTO `bobot_version`
    (`kategori_id`, `namaVersi`, `cr`, `aktif`, `catatan`, `createdAt`, `updatedAt`)
SELECT
    k.`kategori_id`, 'Migrasi Legacy', MAX(ba.`cr`), true,
    'Dibuat otomatis saat rekonsiliasi migration history', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `bobot_ahp` ba
JOIN `kriteria` k ON k.`id` = ba.`kriteria_id`
GROUP BY k.`kategori_id`;

UPDATE `bobot_ahp` ba
JOIN `kriteria` k ON k.`id` = ba.`kriteria_id`
JOIN `bobot_version` bv ON bv.`kategori_id` = k.`kategori_id` AND bv.`namaVersi` = 'Migrasi Legacy'
SET ba.`version_id` = bv.`id`;

ALTER TABLE `bobot_ahp`
    MODIFY `version_id` INTEGER NOT NULL,
    DROP COLUMN `cr`;

ALTER TABLE `hasil`
    ADD COLUMN `alasan_keyakinan` JSON NULL,
    ADD COLUMN `bobot_snapshot` JSON NULL,
    ADD COLUMN `bobot_version_id` INTEGER NULL,
    ADD COLUMN `calculated_at` DATETIME(3) NULL,
    ADD COLUMN `harga_referensi_pasar` DECIMAL(20, 2) NULL,
    ADD COLUMN `jumlah_domain_unik` INTEGER NULL,
    ADD COLUMN `jumlah_manual` INTEGER NULL,
    ADD COLUMN `jumlah_pembanding_valid` INTEGER NULL,
    ADD COLUMN `jumlah_scraped_real` INTEGER NULL,
    ADD COLUMN `metode_normalisasi` VARCHAR(50) NOT NULL DEFAULT 'LEGACY_DYNAMIC_SAW',
    ADD COLUMN `nilai_snapshot` JSON NULL,
    ADD COLUMN `normalisasi_snapshot` JSON NULL,
    ADD COLUMN `pembanding_snapshot` JSON NULL,
    ADD COLUMN `skor_keyakinan` DECIMAL(5, 2) NULL,
    ADD COLUMN `tingkat_keyakinan` ENUM('TINGGI', 'SEDANG', 'RENDAH', 'TIDAK_CUKUP') NULL,
    ADD COLUMN `versi_formula` VARCHAR(50) NOT NULL DEFAULT 'LIMIT_V1';

CREATE TABLE `data_pembanding` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `aset_id` INTEGER NOT NULL,
    `judul` VARCHAR(255) NOT NULL,
    `sumber` VARCHAR(100) NOT NULL,
    `source_url` TEXT NOT NULL,
    `harga` DECIMAL(20, 2) NOT NULL,
    `lokasi` VARCHAR(150) NULL,
    `tahun` INTEGER NULL,
    `kondisi` VARCHAR(100) NULL,
    `spesifikasi` TEXT NULL,
    `skor_kecocokan` DECIMAL(5, 2) NULL,
    `similarity` DECIMAL(5, 4) NULL,
    `is_outlier` BOOLEAN NOT NULL DEFAULT false,
    `status_validasi` ENUM('MENUNGGU', 'DITERIMA', 'DITOLAK') NOT NULL DEFAULT 'MENUNGGU',
    `dipilih_penjual` BOOLEAN NOT NULL DEFAULT false,
    `scraped_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `jenis_sumber` ENUM('SCRAPED_REAL', 'MANUAL', 'TEST_FIXTURE') NOT NULL DEFAULT 'SCRAPED_REAL',
    `status_integritas_url` ENUM('DETAIL_IKLAN', 'HALAMAN_PENCARIAN', 'TIDAK_VALID', 'BELUM_DIVERIFIKASI') NOT NULL DEFAULT 'BELUM_DIVERIFIKASI',
    `status_kecocokan` ENUM('LAYAK', 'PERLU_TINJAU', 'TIDAK_LAYAK') NOT NULL DEFAULT 'PERLU_TINJAU',
    `canonical_url` TEXT NULL,
    `canonical_url_hash` CHAR(64) NULL,
    `source_domain` VARCHAR(150) NULL,
    `alasan_kecocokan` JSON NULL,
    `validated_at` DATETIME(3) NULL,
    `validated_by` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `data_pembanding_aset_id_status_validasi_idx`(`aset_id`, `status_validasi`),
    INDEX `data_pembanding_aset_id_jenis_sumber_idx`(`aset_id`, `jenis_sumber`),
    INDEX `data_pembanding_aset_id_status_kecocokan_idx`(`aset_id`, `status_kecocokan`),
    UNIQUE INDEX `data_pembanding_aset_id_canonical_url_hash_key`(`aset_id`, `canonical_url_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `saran_pencarian_pembanding` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `aset_id` INTEGER NOT NULL,
    `marketplace` VARCHAR(100) NOT NULL,
    `query` VARCHAR(255) NOT NULL,
    `search_url` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `saran_pencarian_pembanding_aset_id_idx`(`aset_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `rubrik_kriteria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kriteria_id` INTEGER NOT NULL,
    `skor` INTEGER NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `deskripsi` TEXT NOT NULL,
    `contoh_bukti` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `rubrik_kriteria_kriteria_id_skor_key`(`kriteria_id`, `skor`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `validasi_nilai_limit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `aset_id` INTEGER NOT NULL,
    `hasil_id` INTEGER NOT NULL,
    `jenis_nilai_acuan` ENUM('NILAI_PAKAR', 'NILAI_LIMIT_AKTUAL', 'HARGA_TRANSAKSI', 'HASIL_LELANG') NOT NULL,
    `nilai_acuan` DECIMAL(20, 2) NOT NULL,
    `sumber_acuan` TEXT NOT NULL,
    `tanggal_acuan` DATETIME(3) NULL,
    `absolute_error` DECIMAL(20, 2) NULL,
    `percentage_error` DECIMAL(10, 4) NULL,
    `catatan` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `validasi_nilai_limit_aset_id_idx`(`aset_id`),
    INDEX `validasi_nilai_limit_hasil_id_idx`(`hasil_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `dokumen` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lelang_id` INTEGER NOT NULL,
    `tipe` ENUM('SURAT_PENETAPAN', 'BERITA_ACARA', 'DOKUMEN_HASIL_LELANG', 'SURAT_PERMOHONAN') NOT NULL,
    `nama_file` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `generated_by` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `documents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` INTEGER NULL,
    `auction_id` INTEGER NULL,
    `asset_id` INTEGER NULL,
    `document_type` ENUM('KTP_PENJUAL', 'NPWP_PENJUAL', 'SURAT_KUASA', 'SURAT_PERMOHONAN_LELANG', 'SURAT_PERNYATAAN', 'DAFTAR_BARANG', 'BUKTI_REKENING', 'FOTO_ASET', 'DOKUMEN_KEPEMILIKAN', 'BUKTI_PENGUMUMAN', 'KTP_PEMBELI', 'NPWP_PEMBELI', 'BUKTI_PEMBAYARAN', 'SURAT_PENETAPAN_LELANG', 'BERITA_ACARA', 'NOTA_PEMBAYARAN', 'RINGKASAN_HASIL_LELANG') NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `original_file_name` VARCHAR(255) NULL,
    `storage_path` VARCHAR(500) NOT NULL,
    `mime_type` VARCHAR(100) NULL,
    `file_size` INTEGER NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `status` ENUM('DRAFT', 'UPLOADED', 'PENDING_VERIFICATION', 'APPROVED', 'REJECTED', 'ARCHIVED') NOT NULL DEFAULT 'PENDING_VERIFICATION',
    `verification_note` TEXT NULL,
    `uploaded_by` INTEGER NOT NULL,
    `verified_by` INTEGER NULL,
    `verified_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `document_activities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `document_id` INTEGER NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `actor_id` INTEGER NOT NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `document_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `document_type` ENUM('KTP_PENJUAL', 'NPWP_PENJUAL', 'SURAT_KUASA', 'SURAT_PERMOHONAN_LELANG', 'SURAT_PERNYATAAN', 'DAFTAR_BARANG', 'BUKTI_REKENING', 'FOTO_ASET', 'DOKUMEN_KEPEMILIKAN', 'BUKTI_PENGUMUMAN', 'KTP_PEMBELI', 'NPWP_PEMBELI', 'BUKTI_PEMBAYARAN', 'SURAT_PENETAPAN_LELANG', 'BERITA_ACARA', 'NOTA_PEMBAYARAN', 'RINGKASAN_HASIL_LELANG') NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `placeholders` JSON NULL,
    `uploaded_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `bobot_ahp` ADD CONSTRAINT `bobot_ahp_version_id_fkey` FOREIGN KEY (`version_id`) REFERENCES `bobot_version`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `bobot_version` ADD CONSTRAINT `bobot_version_kategori_id_fkey` FOREIGN KEY (`kategori_id`) REFERENCES `kategori`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `hasil` ADD CONSTRAINT `hasil_bobot_version_id_fkey` FOREIGN KEY (`bobot_version_id`) REFERENCES `bobot_version`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `data_pembanding` ADD CONSTRAINT `data_pembanding_aset_id_fkey` FOREIGN KEY (`aset_id`) REFERENCES `aset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `saran_pencarian_pembanding` ADD CONSTRAINT `saran_pencarian_pembanding_aset_id_fkey` FOREIGN KEY (`aset_id`) REFERENCES `aset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `rubrik_kriteria` ADD CONSTRAINT `rubrik_kriteria_kriteria_id_fkey` FOREIGN KEY (`kriteria_id`) REFERENCES `kriteria`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `validasi_nilai_limit` ADD CONSTRAINT `validasi_nilai_limit_aset_id_fkey` FOREIGN KEY (`aset_id`) REFERENCES `aset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `validasi_nilai_limit` ADD CONSTRAINT `validasi_nilai_limit_hasil_id_fkey` FOREIGN KEY (`hasil_id`) REFERENCES `hasil`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `dokumen` ADD CONSTRAINT `dokumen_lelang_id_fkey` FOREIGN KEY (`lelang_id`) REFERENCES `lelang`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `dokumen` ADD CONSTRAINT `dokumen_generated_by_fkey` FOREIGN KEY (`generated_by`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `documents` ADD CONSTRAINT `documents_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `documents` ADD CONSTRAINT `documents_uploaded_by_fkey` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `documents` ADD CONSTRAINT `documents_verified_by_fkey` FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `documents` ADD CONSTRAINT `documents_auction_id_fkey` FOREIGN KEY (`auction_id`) REFERENCES `lelang`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `documents` ADD CONSTRAINT `documents_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `aset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `document_activities` ADD CONSTRAINT `document_activities_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `document_activities` ADD CONSTRAINT `document_activities_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `document_templates` ADD CONSTRAINT `document_templates_uploaded_by_fkey` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
