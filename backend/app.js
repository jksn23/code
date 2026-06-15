import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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
import { syncAuctionLifecycleBatch, syncLelangLifecycle } from './src/controllers/lelang.controller.js';

import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

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
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDir));

// Health Check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', message: error.message });
  }
});

// Routes
app.use('/api/auth', authRoutes);
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

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.PORT || 5000;

// Setup Socket.io
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

io.on('connection', (socket) => {
  console.log('🔗 Client connected via WebSocket:', socket.id);
  
  socket.on('join_lelang', (lelangId) => {
    socket.join(`lelang_${lelangId}`);
    console.log(`Socket ${socket.id} joined room lelang_${lelangId}`);
  });

  socket.on('submit_bid', async (payload, callback) => {
    try {
       const { lelangId, userId, nominal } = payload;

       const user = await prisma.user.findUnique({
         where: { id: Number(userId) },
         select: {
           id: true,
           role: true,
           buyerVerificationStatus: true,
         },
       });

       if (!user || user.role !== 'PEMBELI') {
         throw new Error('Hanya pembeli yang dapat mengajukan penawaran');
       }

       if (user.buyerVerificationStatus !== 'APPROVED') {
         throw new Error('Akun pembeli Anda belum lolos verifikasi KYC. Bidding dikunci sampai admin menyetujui identitas Anda.');
       }

       await syncLelangLifecycle(lelangId);
       
       const lelang = await prisma.lelang.findUnique({ 
         where: { id: Number(lelangId) }, 
         include: { aset: { include: { hasil: true } } } 
       });
       
       if (!lelang) throw new Error("Lelang tidak ditemukan");
       if (lelang.status !== 'ACTIVE') throw new Error("Lelang belum aktif atau sudah ditutup");
       
       const now = new Date();
       if (lelang.waktuBuka && now < lelang.waktuBuka) throw new Error("Lelang belum dibuka");
       if (now > lelang.waktuTutup) throw new Error("Waktu lelang sudah habis");

       const limit = lelang.aset.hasil?.[0]?.nilaiLimit || 0;
       
       const highestBid = await prisma.penawaran.findFirst({
          where: { lelangId: lelang.id },
          orderBy: { nominal: 'desc' }
       });
       
       const currentMax = highestBid ? Number(highestBid.nominal) : Number(limit);
       if (Number(nominal) <= currentMax) {
          throw new Error(`Penawaran harus lebih tinggi dari ${new Intl.NumberFormat('id-ID', {currency: 'IDR', style:'currency'}).format(currentMax)}`);
       }
       
       const newBid = await prisma.penawaran.create({
          data: {
             lelangId: lelang.id,
             userId: Number(userId),
             nominal: Number(nominal)
          },
          include: { user: { select: { nama: true } } }
       });
       
       // Broadcast the new bid to everyone in the room
       io.to(`lelang_${lelangId}`).emit('new_bid', newBid);
       if (callback) callback({ success: true });
       
    } catch(err) {
       console.error('Bid error:', err.message);
       if (callback) callback({ success: false, message: err.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

app.set('io', io); // inject to express app

const AUCTION_SYNC_INTERVAL_MS = 15000;

setInterval(() => {
  syncAuctionLifecycleBatch().catch((error) => {
    console.error('Auction lifecycle sync error:', error.message);
  });
}, AUCTION_SYNC_INTERVAL_MS);

server.listen(PORT, () => {
  syncAuctionLifecycleBatch().catch((error) => {
    console.error('Initial auction lifecycle sync error:', error.message);
  });
  console.log(`✅ Server & WebSocket berjalan di http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
