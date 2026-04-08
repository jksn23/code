import prisma from '../models/prisma.client.js';

const buildAdminSummary = async () => {
  const [
    sellerPending,
    lelangAktif,
    pembayaranPending,
    totalLelangSelesai,
    lelangRevenue,
    latestPendingSellers,
    latestFinishedAuctions,
  ] = await Promise.all([
    prisma.penjual.count({ where: { isVerified: false } }),
    prisma.lelang.count({ where: { status: { in: ['ACTIVE', 'PENDING'] } } }),
    prisma.lelang.count({ where: { statusPembayaran: 'PENDING_VERIFICATION' } }),
    prisma.lelang.count({ where: { status: 'FINISHED' } }),
    prisma.lelang.findMany({
      where: { status: 'FINISHED' },
      select: {
        penawaran: {
          orderBy: { nominal: 'desc' },
          take: 1,
          select: { nominal: true },
        },
      },
    }),
    prisma.penjual.findMany({
      where: { isVerified: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: { select: { id: true, nama: true, email: true, createdAt: true } },
      },
    }),
    prisma.lelang.findMany({
      where: { status: 'FINISHED' },
      orderBy: { waktuTutup: 'desc' },
      take: 5,
      include: {
        aset: { select: { id: true, nama: true } },
        pemenang: { select: { id: true, nama: true } },
      },
    }),
  ]);

  const totalPendapatan = lelangRevenue.reduce((sum, item) => {
    const highest = item.penawaran?.[0]?.nominal ? Number(item.penawaran[0].nominal) : 0;
    return sum + highest;
  }, 0);

  return {
    stats: {
      sellerPending,
      lelangAktif,
      pembayaranPending,
      totalLelangSelesai,
      totalPendapatan,
    },
    highlights: {
      sellerPendingList: latestPendingSellers,
      recentAuctions: latestFinishedAuctions,
    },
  };
};

const buildSellerSummary = async (userId) => {
  const seller = await prisma.penjual.findUnique({
    where: { userId },
    select: { id: true, isVerified: true, rekeningBank: true, nomorRekening: true },
  });

  if (!seller) {
    return {
      stats: {
        totalAset: 0,
        asetPendingVerifikasi: 0,
        asetAktifLelang: 0,
        asetTerjual: 0,
      },
      highlights: {
        recentAssets: [],
        sellerProfile: null,
      },
    };
  }

  const [assets, soldAuctions] = await Promise.all([
    prisma.aset.findMany({
      where: { penjualId: seller.id },
      orderBy: { createdAt: 'desc' },
      include: {
        kategori: { select: { nama: true } },
        lelang: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            statusPembayaran: true,
            waktuBuka: true,
            waktuTutup: true,
            pemenangId: true,
          },
        },
      },
    }),
    prisma.lelang.count({
      where: {
        aset: { penjualId: seller.id },
        pemenangId: { not: null },
      },
    }),
  ]);

  return {
    stats: {
      totalAset: assets.length,
      asetPendingVerifikasi: assets.filter((item) => item.statusLelang === 'PENDING').length,
      asetAktifLelang: assets.filter((item) => item.statusLelang === 'ACTIVE').length,
      asetTerjual: soldAuctions,
    },
    highlights: {
      recentAssets: assets.slice(0, 5),
      sellerProfile: seller,
    },
  };
};

const buildBuyerSummary = async (userId) => {
  const [joinedAuctions, wonAuctions, paymentPending, pendingReceive, recentWins, buyer] = await Promise.all([
    prisma.penawaran.findMany({
      where: { userId },
      distinct: ['lelangId'],
      select: { lelangId: true },
    }),
    prisma.lelang.count({
      where: { pemenangId: userId },
    }),
    prisma.lelang.count({
      where: {
        pemenangId: userId,
        statusPembayaran: { in: ['UNPAID', 'PENDING_VERIFICATION', 'DITOLAK'] },
      },
    }),
    prisma.lelang.count({
      where: {
        pemenangId: userId,
        statusPembayaran: 'LUNAS',
        statusBarang: { not: 'DITERIMA' },
      },
    }),
    prisma.lelang.findMany({
      where: { pemenangId: userId },
      orderBy: { waktuTutup: 'desc' },
      take: 5,
      include: {
        aset: { select: { id: true, nama: true } },
        penawaran: {
          orderBy: { nominal: 'desc' },
          take: 1,
          select: { nominal: true },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        buyerVerificationStatus: true,
        buyerVerificationNote: true,
        buyerVerifiedAt: true,
      },
    }),
  ]);

  return {
    stats: {
      lelangDiikuti: joinedAuctions.length,
      lelangDimenangkan: wonAuctions,
      pembayaranPending: paymentPending,
      barangBelumDikonfirmasi: pendingReceive,
    },
    highlights: {
      recentWins,
      buyerProfile: buyer,
    },
  };
};

export const getDashboardSummary = async (req, res) => {
  try {
    let summary;

    if (req.userRole === 'ADMIN') {
      summary = await buildAdminSummary();
    } else if (req.userRole === 'PENJUAL') {
      summary = await buildSellerSummary(req.userId);
    } else {
      summary = await buildBuyerSummary(req.userId);
    }

    const unreadNotifications = await prisma.notifikasi.count({
      where: { userId: req.userId, isRead: false },
    });

    res.json({
      success: true,
      data: {
        role: req.userRole,
        unreadNotifications,
        ...summary,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
