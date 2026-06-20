ALTER TABLE `aset`
  ADD COLUMN `status_penilaian` ENUM('DRAFT', 'MENUNGGU_VERIFIKASI', 'DISETUJUI', 'PERLU_REVISI', 'DITOLAK') NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN `catatan_penilaian` TEXT NULL,
  ADD COLUMN `penilaian_submitted_at` DATETIME(3) NULL,
  ADD COLUMN `penilaian_reviewed_at` DATETIME(3) NULL,
  ADD COLUMN `penilaian_reviewed_by` INTEGER NULL;

CREATE TABLE `penilaian_audit_log` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `aset_id` INTEGER NOT NULL,
  `user_id` INTEGER NOT NULL,
  `role` ENUM('ADMIN', 'PENJUAL', 'PEMBELI') NOT NULL,
  `aksi` VARCHAR(100) NOT NULL,
  `nilai_sebelum` JSON NULL,
  `nilai_sesudah` JSON NULL,
  `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `penilaian_audit_log_aset_id_idx`(`aset_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
