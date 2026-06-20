-- Baseline for an existing database that was previously managed with db push.
-- Mark this migration as applied on existing databases before running later migrations.

CREATE TABLE `kategori` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(100) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `kategori_nama_key`(`nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `kriteria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kategori_id` INTEGER NOT NULL,
    `nama` VARCHAR(150) NOT NULL,
    `tipe` ENUM('benefit', 'cost') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `nama` VARCHAR(150) NOT NULL,
    `role` ENUM('ADMIN', 'PENJUAL', 'PEMBELI') NOT NULL DEFAULT 'PEMBELI',
    `ktp_url` VARCHAR(255) NULL,
    `buyer_verification_status` ENUM('UNVERIFIED', 'PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'UNVERIFIED',
    `buyer_verification_note` TEXT NULL,
    `buyer_verified_at` DATETIME(3) NULL,
    `buyer_verified_by` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `penjual` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `ktp_url` VARCHAR(255) NULL,
    `npwp_url` VARCHAR(255) NULL,
    `rekening_bank` VARCHAR(100) NULL,
    `nomor_rekening` VARCHAR(100) NULL,
    `is_verified` BOOLEAN NOT NULL DEFAULT false,
    `verification_status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `verification_note` TEXT NULL,
    `verified_at` DATETIME(3) NULL,
    `verified_by` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `penjual_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `aset` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(200) NOT NULL,
    `kategori_id` INTEGER NOT NULL,
    `penjual_id` INTEGER NULL,
    `deskripsi` TEXT NULL,
    `dokumen_url` VARCHAR(255) NULL,
    `status_lelang` ENUM('DRAFT', 'PENDING', 'ACTIVE', 'FINISHED') NOT NULL DEFAULT 'DRAFT',
    `harga_pasar` DECIMAL(20, 2) NOT NULL,
    `limit_value` DECIMAL(20, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `nilai_aset` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `aset_id` INTEGER NOT NULL,
    `kriteria_id` INTEGER NOT NULL,
    `nilai` DECIMAL(15, 4) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `nilai_aset_aset_id_kriteria_id_key`(`aset_id`, `kriteria_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `bobot_ahp` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kriteria_id` INTEGER NOT NULL,
    `bobot` DECIMAL(10, 6) NOT NULL,
    `cr` DECIMAL(10, 6) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `hasil` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `aset_id` INTEGER NOT NULL,
    `nilai_preferensi` DECIMAL(15, 6) NOT NULL,
    `nilai_limit` DECIMAL(20, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `lelang` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `aset_id` INTEGER NOT NULL,
    `waktu_buka` DATETIME(3) NULL,
    `waktu_tutup` DATETIME(3) NULL,
    `durasi_menit` INTEGER NOT NULL DEFAULT 60,
    `status` ENUM('DRAFT', 'PENDING', 'ACTIVE', 'FINISHED') NOT NULL DEFAULT 'PENDING',
    `pemenang_id` INTEGER NULL,
    `status_pembayaran` VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
    `invoice_number` VARCHAR(80) NULL,
    `invoice_generated_at` DATETIME(3) NULL,
    `payment_due_date` DATETIME(3) NULL,
    `bukti_bayar_url` VARCHAR(255) NULL,
    `tanggal_upload_bukti` DATETIME(3) NULL,
    `tanggal_verifikasi_pembayaran` DATETIME(3) NULL,
    `catatan_pembayaran` TEXT NULL,
    `verified_by` INTEGER NULL,
    `status_barang` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lelang_invoice_number_key`(`invoice_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `penawaran` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lelang_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `nominal` DECIMAL(20, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `notifikasi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `judul` VARCHAR(150) NOT NULL,
    `pesan` TEXT NOT NULL,
    `tipe` VARCHAR(50) NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `reference_type` VARCHAR(50) NULL,
    `reference_id` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `notifikasi_user_id_is_read_idx`(`user_id`, `is_read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `asset_properties` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `aset_id` INTEGER NOT NULL,
    `certificate_number` VARCHAR(100) NOT NULL,
    `owner_name` VARCHAR(150) NOT NULL,
    `land_area` DECIMAL(10, 2) NOT NULL,
    `building_area` DECIMAL(10, 2) NULL,
    `village` VARCHAR(100) NOT NULL,
    `district` VARCHAR(100) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `province` VARCHAR(100) NOT NULL,
    `njop_per_m2` DECIMAL(20, 2) NOT NULL,
    `base_property_value` DECIMAL(20, 2) NOT NULL,
    `certificate_file` VARCHAR(255) NOT NULL,
    `property_photo` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `asset_properties_aset_id_key`(`aset_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `asset_vehicles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `aset_id` INTEGER NOT NULL,
    `brand` VARCHAR(100) NOT NULL,
    `type` VARCHAR(100) NOT NULL,
    `year` INTEGER NOT NULL,
    `color` VARCHAR(50) NOT NULL,
    `plate_number` VARCHAR(20) NOT NULL,
    `engine_number` VARCHAR(50) NOT NULL,
    `chassis_number` VARCHAR(50) NOT NULL,
    `vehicle_photo` VARCHAR(255) NOT NULL,
    `bpkb_file` VARCHAR(255) NOT NULL,
    `stnk_file` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `asset_vehicles_aset_id_key`(`aset_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `asset_electronics` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `aset_id` INTEGER NOT NULL,
    `brand` VARCHAR(100) NOT NULL,
    `series` VARCHAR(100) NOT NULL,
    `type` VARCHAR(100) NOT NULL,
    `item_photo` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `asset_electronics_aset_id_key`(`aset_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `quick_bids` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `buyer_id` INTEGER NOT NULL,
    `auction_id` INTEGER NOT NULL,
    `quick_bid_1` DECIMAL(20, 2) NOT NULL,
    `quick_bid_2` DECIMAL(20, 2) NOT NULL,
    `quick_bid_3` DECIMAL(20, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `quick_bids_buyer_id_auction_id_key`(`buyer_id`, `auction_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `kriteria` ADD CONSTRAINT `kriteria_kategori_id_fkey` FOREIGN KEY (`kategori_id`) REFERENCES `kategori`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `users` ADD CONSTRAINT `users_buyer_verified_by_fkey` FOREIGN KEY (`buyer_verified_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `penjual` ADD CONSTRAINT `penjual_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `penjual` ADD CONSTRAINT `penjual_verified_by_fkey` FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `aset` ADD CONSTRAINT `aset_kategori_id_fkey` FOREIGN KEY (`kategori_id`) REFERENCES `kategori`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `aset` ADD CONSTRAINT `aset_penjual_id_fkey` FOREIGN KEY (`penjual_id`) REFERENCES `penjual`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `nilai_aset` ADD CONSTRAINT `nilai_aset_aset_id_fkey` FOREIGN KEY (`aset_id`) REFERENCES `aset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `nilai_aset` ADD CONSTRAINT `nilai_aset_kriteria_id_fkey` FOREIGN KEY (`kriteria_id`) REFERENCES `kriteria`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `bobot_ahp` ADD CONSTRAINT `bobot_ahp_kriteria_id_fkey` FOREIGN KEY (`kriteria_id`) REFERENCES `kriteria`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `hasil` ADD CONSTRAINT `hasil_aset_id_fkey` FOREIGN KEY (`aset_id`) REFERENCES `aset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lelang` ADD CONSTRAINT `lelang_aset_id_fkey` FOREIGN KEY (`aset_id`) REFERENCES `aset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lelang` ADD CONSTRAINT `lelang_pemenang_id_fkey` FOREIGN KEY (`pemenang_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `lelang` ADD CONSTRAINT `lelang_verified_by_fkey` FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `penawaran` ADD CONSTRAINT `penawaran_lelang_id_fkey` FOREIGN KEY (`lelang_id`) REFERENCES `lelang`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `penawaran` ADD CONSTRAINT `penawaran_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `notifikasi` ADD CONSTRAINT `notifikasi_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `asset_properties` ADD CONSTRAINT `asset_properties_aset_id_fkey` FOREIGN KEY (`aset_id`) REFERENCES `aset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `asset_vehicles` ADD CONSTRAINT `asset_vehicles_aset_id_fkey` FOREIGN KEY (`aset_id`) REFERENCES `aset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `asset_electronics` ADD CONSTRAINT `asset_electronics_aset_id_fkey` FOREIGN KEY (`aset_id`) REFERENCES `aset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `quick_bids` ADD CONSTRAINT `quick_bids_buyer_id_fkey` FOREIGN KEY (`buyer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `quick_bids` ADD CONSTRAINT `quick_bids_auction_id_fkey` FOREIGN KEY (`auction_id`) REFERENCES `lelang`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
