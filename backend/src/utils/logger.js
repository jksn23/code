/**
 * LOGGER: Menggunakan Winston untuk logging terpusat.
 * 
 * Level log:
 * - error: Kesalahan kritis yang harus segera ditangani
 * - warn:  Peringatan yang perlu diperhatikan
 * - info:  Informasi umum alur sistem (default production)
 * - debug: Detail debug (aktif hanya di development)
 * 
 * Penggunaan:
 *   import logger from '../utils/logger.js';
 *   logger.info('Pesan info');
 *   logger.error('Pesan error', { detail: err.message });
 *   logger.spk('Kalkulasi SPK', { asetId, hasil });
 */

import { createLogger, format, transports } from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pastikan folder logs ada
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const isDev = process.env.NODE_ENV !== 'production';

// Format console yang human-readable (Development)
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'HH:mm:ss' }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? '\n' + JSON.stringify(meta, null, 2) : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

// Format JSON untuk file (Production-friendly)
const fileFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.json()
);

const logger = createLogger({
  level: isDev ? 'debug' : 'info',
  defaultMeta: { service: 'lelang-spk-backend' },
  transports: [
    // Console log selalu aktif
    new transports.Console({
      format: isDev ? consoleFormat : fileFormat,
    }),
    // File log: error saja
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    }),
    // File log: semua level
    new transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 7,
    }),
    // File log khusus kalkulasi SPK
    new transports.File({
      filename: path.join(logDir, 'spk-kalkulasi.log'),
      level: 'info',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    }),
  ],
});

/**
 * Method tambahan khusus untuk logging kalkulasi SPK
 * Log disimpan ke spk-kalkulasi.log untuk validasi penelitian
 */
logger.spk = (message, meta = {}) => {
  logger.info(`[SPK] ${message}`, { ...meta, kategori: 'SPK_KALKULASI' });
};

/**
 * Log khusus untuk aktivitas dokumen (generate, download)
 */
logger.dokumen = (message, meta = {}) => {
  logger.info(`[DOKUMEN] ${message}`, { ...meta, kategori: 'DOKUMEN' });
};

/**
 * Log khusus untuk aktivitas lelang
 */
logger.lelang = (message, meta = {}) => {
  logger.info(`[LELANG] ${message}`, { ...meta, kategori: 'LELANG' });
};

export default logger;
