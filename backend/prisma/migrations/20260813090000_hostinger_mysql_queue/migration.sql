CREATE TABLE `scraping_jobs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `aset_id` INTEGER NOT NULL,
    `status` ENUM('WAITING', 'ACTIVE', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'WAITING',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `max_attempts` INTEGER NOT NULL DEFAULT 2,
    `result` JSON NULL,
    `fail_reason` TEXT NULL,
    `started_at` DATETIME(3) NULL,
    `finished_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `scraping_jobs_status_created_at_idx`(`status`, `created_at`),
    INDEX `scraping_jobs_aset_id_created_at_idx`(`aset_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `scraping_jobs`
    ADD CONSTRAINT `scraping_jobs_aset_id_fkey`
    FOREIGN KEY (`aset_id`) REFERENCES `aset`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
