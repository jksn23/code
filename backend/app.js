import './src/config/load_env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';

// Routes
import authRoutes from './src/routes/auth.routes.js';
import penjualRoutes from './src/routes/penjual.routes.js';
import kategoriRoutes from './src/routes/kategori.routes.js';
import kriteriaRoutes from './src/routes/kriteria.routes.js';
import asetRoutes from './src/routes/aset.routes.js';
import nilaiRoutes from './src/routes/nilai.routes.js';
import spkRoutes from './src/routes/spk.routes.js';
import lelangRoutes from './src/routes/lelang.routes.js';
import laporanRoutes from './src/routes/laporan.routes.js';
import dashboardRoutes from './src/routes/dashboard.routes.js';
import notifikasiRoutes from './src/routes/notifikasi.routes.js';
import pembeliRoutes from './src/routes/pembeli.routes.js';
import userRoutes from './src/routes/user.routes.js';
import settingsRoutes from './src/routes/settings.routes.js';
import quickBidRoutes from './src/routes/quick_bid.routes.js';
import sellerPenilaianRoutes from './src/routes/seller_penilaian.routes.js';
import adminPenilaianRoutes from './src/routes/admin_penilaian.routes.js';
import pembandingRoutes from './src/routes/pembanding.routes.js';
import dokumenRoutes from './src/routes/dokumen.routes.js';
import limitValidationRoutes from './src/routes/limit_validation.routes.js';
import { syncAuctionLifecycleBatch } from './src/controllers/lelang.controller.js';
import logger from './src/utils/logger.js';
import { initScrapingQueue, stopScrapingQueue } from './src/services/scraping_queue.service.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL,
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()) : []),
].filter(Boolean);
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');

// Middleware
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
}));
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/uploads', express.static(uploadDir, {
  dotfiles: 'deny',
  index: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  },
}));

// Health Check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Database unavailable',
    });
  }
});

// Routes
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
}), authRoutes);
app.use('/api/penjual', penjualRoutes);
app.use('/api/kategori', kategoriRoutes);
app.use('/api/kriteria', kriteriaRoutes);
app.use('/api/aset', asetRoutes);
app.use('/api/nilai', nilaiRoutes);
app.use('/api/spk', spkRoutes);
app.use('/api/lelang', lelangRoutes);
app.use('/api/laporan', laporanRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifikasi', notifikasiRoutes);
app.use('/api/pembeli', pembeliRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/quick-bids', quickBidRoutes);
app.use('/api/seller/aset', sellerPenilaianRoutes);
app.use('/api/admin/penilaian-aset', adminPenilaianRoutes);
app.use('/api/pembanding', pembandingRoutes);
app.use('/api/dokumen', dokumenRoutes);
app.use('/api/limit-validation', limitValidationRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error('Unhandled Express Error', { message: err.message, stack: err.stack, url: req.originalUrl });
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.PORT || 5001;

const AUCTION_SYNC_INTERVAL_MS = 15000;

const auctionTimer = setInterval(() => {
  syncAuctionLifecycleBatch().catch((error) => {
    console.error('Auction lifecycle sync error:', error.message);
  });
}, AUCTION_SYNC_INTERVAL_MS);
auctionTimer.unref?.();

const server = app.listen(PORT, async () => {
  syncAuctionLifecycleBatch().catch((error) => {
    logger.error('Initial auction lifecycle sync error', { message: error.message });
  });

  try {
    await initScrapingQueue();
  } catch (queueErr) {
    logger.error('MySQL scraping queue gagal diinisialisasi.', {
      message: queueErr.message
    });
  }

  logger.info(`✅ Server REST berjalan di http://localhost:${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

const shutdown = (signal) => {
  logger.info(`${signal} diterima, menghentikan server.`);
  clearInterval(auctionTimer);
  stopScrapingQueue();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));

export default app;
