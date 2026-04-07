import prisma from '../models/prisma.client.js';

const lelangDetailInclude = {
  aset: {
    include: {
      kategori: true,
      hasil: true,
      penjual: {
        include: {
          user: true,
        },
      },
    },
  },
  penawaran: {
    include: {
      user: {
        select: {
          id: true,
          nama: true,
          email: true,
        },
      },
    },
    orderBy: { nominal: 'desc' },
    take: 50,
  },
  pemenang: {
    select: {
      id: true,
      nama: true,
      email: true,
    },
  },
  verifikatorPembayaran: {
    select: {
      id: true,
      nama: true,
      email: true,
    },
  },
};

const adminFinishedInclude = {
  aset: {
    include: {
      kategori: true,
      hasil: true,
      penjual: {
        include: {
          user: {
            select: {
              id: true,
              nama: true,
              email: true,
            },
          },
        },
      },
    },
  },
  pemenang: {
    select: {
      id: true,
      nama: true,
      email: true,
    },
  },
  penawaran: {
    orderBy: { nominal: 'desc' },
    take: 1,
    include: {
      user: {
        select: {
          id: true,
          nama: true,
          email: true,
        },
      },
    },
  },
  verifikatorPembayaran: {
    select: {
      id: true,
      nama: true,
      email: true,
    },
  },
};

const invoiceInclude = {
  aset: {
    include: {
      kategori: true,
      hasil: true,
      penjual: {
        include: {
          user: true,
        },
      },
    },
  },
  penawaran: {
    orderBy: { nominal: 'desc' },
    take: 1,
    include: {
      user: {
        select: {
          id: true,
          nama: true,
          email: true,
        },
      },
    },
  },
  pemenang: {
    select: {
      id: true,
      nama: true,
      email: true,
    },
  },
  verifikatorPembayaran: {
    select: {
      id: true,
      nama: true,
      email: true,
    },
  },
};

const normalizeUploadPath = (filePath) => filePath?.replace(/\\/g, '/') || null;

const generateInvoiceNumber = (lelangId, date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const seq = String(lelangId).padStart(6, '0');
  return `INV-${y}${m}${d}-${seq}`;
};

const getPaymentDueDate = (lelang) => {
  if (lelang.paymentDueDate) return new Date(lelang.paymentDueDate);
  const baseDate = lelang.waktuTutup ? new Date(lelang.waktuTutup) : new Date();
  return new Date(baseDate.getTime() + 24 * 60 * 60 * 1000);
};

const canAccessInvoice = (lelang, userId, userRole) => {
  if (userRole === 'ADMIN') return true;
  if (lelang.pemenangId === userId) return true;
  if (lelang.aset?.penjual?.userId === userId) return true;
  return false;
};

const paymentStatusLabels = {
  UNPAID: 'UNPAID',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  LUNAS: 'LUNAS',
  DITOLAK: 'DITOLAK',
};

const buildInvoiceResponse = (lelang) => {
  const topBid = lelang.penawaran?.[0];
  const nilaiLimit = Number(lelang.aset?.hasil?.[0]?.nilaiLimit || 0);
  const nominalInvoice = Number(topBid?.nominal || 0);

  return {
    lelangId: lelang.id,
    invoiceNumber: lelang.invoiceNumber,
    invoiceGeneratedAt: lelang.invoiceGeneratedAt,
    paymentDueDate: lelang.paymentDueDate,
    statusPembayaran: lelang.statusPembayaran,
    catatanPembayaran: lelang.catatanPembayaran,
    tanggalUploadBukti: lelang.tanggalUploadBukti,
    tanggalVerifikasiPembayaran: lelang.tanggalVerifikasiPembayaran,
    buktiBayarUrl: lelang.buktiBayarUrl,
    verifiedBy: lelang.verifikatorPembayaran,
    aset: {
      id: lelang.aset?.id,
      nama: lelang.aset?.nama,
      kategori: lelang.aset?.kategori?.nama,
      deskripsi: lelang.aset?.deskripsi,
      nilaiLimit,
    },
    pemenang: lelang.pemenang,
    penjual: {
      nama: lelang.aset?.penjual?.user?.nama || 'Admin',
      email: lelang.aset?.penjual?.user?.email || '-',
      rekeningBank: lelang.aset?.penjual?.rekeningBank || '-',
      nomorRekening: lelang.aset?.penjual?.nomorRekening || '-',
    },
    transaksi: {
      nominalMenang: nominalInvoice,
      waktuMenang: lelang.waktuTutup,
      bidderName: topBid?.user?.nama || '-',
    },
  };
};

const ensureInvoiceMetadata = async (lelangId) => {
  const existing = await prisma.lelang.findUnique({
    where: { id: Number(lelangId) },
    select: {
      id: true,
      invoiceNumber: true,
      invoiceGeneratedAt: true,
      paymentDueDate: true,
      waktuTutup: true,
    },
  });

  if (!existing) return null;

  if (existing.invoiceNumber && existing.invoiceGeneratedAt && existing.paymentDueDate) {
    return existing;
  }

  return prisma.lelang.update({
    where: { id: Number(lelangId) },
    data: {
      invoiceNumber: existing.invoiceNumber || generateInvoiceNumber(Number(lelangId)),
      invoiceGeneratedAt: existing.invoiceGeneratedAt || new Date(),
      paymentDueDate: existing.paymentDueDate || getPaymentDueDate(existing),
    },
    select: {
      id: true,
      invoiceNumber: true,
      invoiceGeneratedAt: true,
      paymentDueDate: true,
    },
  });
};

// Helper: tutup lelang dan set pemenang
const tutupLelangJikaSudahHabis = async (lelang) => {
  if (lelang.status === 'ACTIVE' && new Date() > new Date(lelang.waktuTutup)) {
    const topBid = await prisma.penawaran.findFirst({
      where: { lelangId: lelang.id },
      orderBy: { nominal: 'desc' },
    });

    await prisma.lelang.update({
      where: { id: lelang.id },
      data: {
        status: 'FINISHED',
        pemenangId: topBid ? topBid.userId : null,
      },
    });

    await prisma.aset.update({
      where: { id: lelang.asetId },
      data: { statusLelang: 'FINISHED' },
    });

    return true;
  }

  return false;
};

export const getSemuaLelangAktif = async (req, res) => {
  try {
    const lelangList = await prisma.lelang.findMany({
      where: { status: { in: ['ACTIVE', 'FINISHED'] } },
      include: {
        aset: { include: { kategori: true, hasil: true } },
        pemenang: { select: { id: true, nama: true, email: true } },
      },
      orderBy: { waktuBuka: 'desc' },
    });

    for (const lelang of lelangList) {
      if (lelang.status === 'ACTIVE' && new Date() > new Date(lelang.waktuTutup)) {
        await tutupLelangJikaSudahHabis(lelang);
        lelang.status = 'FINISHED';
      }
    }

    res.json({ success: true, data: lelangList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLelangById = async (req, res) => {
  try {
    let lelang = await prisma.lelang.findUnique({
      where: { id: Number(req.params.id) },
      include: lelangDetailInclude,
    });

    if (!lelang) {
      return res.status(404).json({ success: false, message: 'Lelang tidak ditemukan' });
    }

    if (lelang.status === 'ACTIVE' && new Date() > new Date(lelang.waktuTutup)) {
      await tutupLelangJikaSudahHabis(lelang);
      lelang = await prisma.lelang.findUnique({
        where: { id: Number(req.params.id) },
        include: lelangDetailInclude,
      });
    }

    if (lelang.status === 'FINISHED' && lelang.pemenangId) {
      const invoiceMeta = await ensureInvoiceMetadata(lelang.id);
      if (invoiceMeta) {
        lelang.invoiceNumber = invoiceMeta.invoiceNumber;
        lelang.invoiceGeneratedAt = invoiceMeta.invoiceGeneratedAt;
        lelang.paymentDueDate = invoiceMeta.paymentDueDate;
      }
    }

    res.json({ success: true, data: lelang });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInvoiceLelang = async (req, res) => {
  try {
    const lelangId = Number(req.params.id);

    let lelang = await prisma.lelang.findUnique({
      where: { id: lelangId },
      include: invoiceInclude,
    });

    if (!lelang) {
      return res.status(404).json({ success: false, message: 'Lelang tidak ditemukan' });
    }

    if (lelang.status !== 'FINISHED') {
      return res.status(400).json({ success: false, message: 'Invoice hanya tersedia setelah lelang selesai' });
    }

    if (!lelang.pemenangId || !lelang.penawaran?.length) {
      return res.status(400).json({ success: false, message: 'Invoice belum tersedia karena tidak ada pemenang lelang' });
    }

    if (!canAccessInvoice(lelang, req.userId, req.userRole)) {
      return res.status(403).json({ success: false, message: 'Anda tidak berhak mengakses invoice lelang ini' });
    }

    const invoiceMeta = await ensureInvoiceMetadata(lelangId);
    lelang.invoiceNumber = invoiceMeta?.invoiceNumber || lelang.invoiceNumber;
    lelang.invoiceGeneratedAt = invoiceMeta?.invoiceGeneratedAt || lelang.invoiceGeneratedAt;
    lelang.paymentDueDate = invoiceMeta?.paymentDueDate || lelang.paymentDueDate;

    res.json({
      success: true,
      data: buildInvoiceResponse(lelang),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadBuktiPembayaran = async (req, res) => {
  try {
    const lelangId = Number(req.params.id);

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File bukti pembayaran wajib diunggah' });
    }

    const lelang = await prisma.lelang.findUnique({
      where: { id: lelangId },
      include: invoiceInclude,
    });

    if (!lelang) {
      return res.status(404).json({ success: false, message: 'Lelang tidak ditemukan' });
    }

    if (lelang.status !== 'FINISHED') {
      return res.status(400).json({ success: false, message: 'Bukti pembayaran hanya dapat diunggah setelah lelang selesai' });
    }

    if (!lelang.pemenangId || lelang.pemenangId !== req.userId) {
      return res.status(403).json({ success: false, message: 'Hanya pemenang lelang yang dapat mengunggah bukti pembayaran' });
    }

    if (lelang.statusPembayaran === paymentStatusLabels.LUNAS) {
      return res.status(400).json({ success: false, message: 'Pembayaran sudah diverifikasi sebagai LUNAS' });
    }

    await ensureInvoiceMetadata(lelangId);

    const updated = await prisma.lelang.update({
      where: { id: lelangId },
      data: {
        buktiBayarUrl: normalizeUploadPath(req.file.path),
        tanggalUploadBukti: new Date(),
        statusPembayaran: paymentStatusLabels.PENDING_VERIFICATION,
        tanggalVerifikasiPembayaran: null,
        verifiedBy: null,
        catatanPembayaran: null,
      },
      include: {
        pemenang: { select: { nama: true } },
      },
    });

    res.json({
      success: true,
      message: `Bukti pembayaran untuk lelang #${lelangId} berhasil diunggah dan menunggu verifikasi admin`,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifikasiPembayaran = async (req, res) => {
  try {
    const { id } = req.params;
    const { catatan } = req.body;

    if (req.userRole !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Hanya Admin yang bisa verifikasi pembayaran' });
    }

    const lelang = await prisma.lelang.findUnique({ where: { id: Number(id) } });
    if (!lelang) {
      return res.status(404).json({ success: false, message: 'Lelang tidak ditemukan' });
    }
    if (lelang.status !== 'FINISHED') {
      return res.status(400).json({ success: false, message: 'Lelang belum selesai' });
    }
    if (!lelang.buktiBayarUrl) {
      return res.status(400).json({ success: false, message: 'Belum ada bukti pembayaran yang diunggah' });
    }

    const updated = await prisma.lelang.update({
      where: { id: Number(id) },
      data: {
        statusPembayaran: paymentStatusLabels.LUNAS,
        tanggalVerifikasiPembayaran: new Date(),
        verifiedBy: req.userId,
        catatanPembayaran: catatan?.trim() || 'Bukti pembayaran telah diverifikasi admin.',
      },
      include: {
        pemenang: { select: { nama: true } },
        verifikatorPembayaran: { select: { nama: true } },
      },
    });

    res.json({
      success: true,
      message: `Pembayaran untuk lelang #${id} telah diverifikasi sebagai LUNAS`,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const tolakPembayaran = async (req, res) => {
  try {
    const { id } = req.params;
    const catatan = req.body?.catatan?.trim();

    if (!catatan) {
      return res.status(400).json({ success: false, message: 'Catatan penolakan pembayaran wajib diisi' });
    }

    const lelang = await prisma.lelang.findUnique({ where: { id: Number(id) } });
    if (!lelang) {
      return res.status(404).json({ success: false, message: 'Lelang tidak ditemukan' });
    }
    if (lelang.status !== 'FINISHED') {
      return res.status(400).json({ success: false, message: 'Lelang belum selesai' });
    }
    if (!lelang.buktiBayarUrl) {
      return res.status(400).json({ success: false, message: 'Belum ada bukti pembayaran yang bisa ditolak' });
    }

    const updated = await prisma.lelang.update({
      where: { id: Number(id) },
      data: {
        statusPembayaran: paymentStatusLabels.DITOLAK,
        tanggalVerifikasiPembayaran: new Date(),
        verifiedBy: req.userId,
        catatanPembayaran: catatan,
      },
      include: {
        pemenang: { select: { nama: true } },
        verifikatorPembayaran: { select: { nama: true } },
      },
    });

    res.json({
      success: true,
      message: `Pembayaran untuk lelang #${id} ditolak dan menunggu unggahan ulang bukti`,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const konfirmasiTerimaBarang = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const lelang = await prisma.lelang.findUnique({ where: { id: Number(id) } });
    if (!lelang) {
      return res.status(404).json({ success: false, message: 'Lelang tidak ditemukan' });
    }
    if (lelang.pemenangId !== userId) {
      return res.status(403).json({ success: false, message: 'Hanya pemenang yang bisa konfirmasi barang' });
    }
    if (lelang.statusPembayaran !== paymentStatusLabels.LUNAS) {
      return res.status(400).json({ success: false, message: 'Pembayaran belum diverifikasi oleh Admin' });
    }

    const updated = await prisma.lelang.update({
      where: { id: Number(id) },
      data: { statusBarang: 'DITERIMA' },
    });

    res.json({ success: true, message: 'Konfirmasi penerimaan barang berhasil', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLelangSelesai = async (req, res) => {
  try {
    if (req.userRole !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Hanya Admin' });
    }

    const list = await prisma.lelang.findMany({
      where: { status: 'FINISHED' },
      include: adminFinishedInclude,
      orderBy: { waktuTutup: 'desc' },
    });

    const enriched = await Promise.all(
      list.map(async (item) => {
        if (!item.pemenangId) return item;
        const meta = await ensureInvoiceMetadata(item.id);
        return {
          ...item,
          invoiceNumber: meta?.invoiceNumber || item.invoiceNumber,
          invoiceGeneratedAt: meta?.invoiceGeneratedAt || item.invoiceGeneratedAt,
          paymentDueDate: meta?.paymentDueDate || item.paymentDueDate,
        };
      })
    );

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLelangSayaMenang = async (req, res) => {
  try {
    const userId = req.userId;

    const list = await prisma.lelang.findMany({
      where: {
        status: 'FINISHED',
        pemenangId: userId,
      },
      include: adminFinishedInclude,
      orderBy: { waktuTutup: 'desc' },
    });

    const enriched = await Promise.all(
      list.map(async (item) => {
        const meta = await ensureInvoiceMetadata(item.id);
        return {
          ...item,
          invoiceNumber: meta?.invoiceNumber || item.invoiceNumber,
          invoiceGeneratedAt: meta?.invoiceGeneratedAt || item.invoiceGeneratedAt,
          paymentDueDate: meta?.paymentDueDate || item.paymentDueDate,
        };
      })
    );

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getNextLelang = async (req, res) => {
  try {
    const currentId = Number(req.params.currentId);

    const current = await prisma.lelang.findUnique({
      where: { id: currentId },
      select: { waktuTutup: true, waktuBuka: true },
    });

    if (!current) {
      return res.status(404).json({ success: false, message: 'Lelang tidak ditemukan' });
    }

    const waktuTutupCurrent = new Date(current.waktuTutup);
    const batasMaksimalNext = new Date(waktuTutupCurrent.getTime() + 60 * 60 * 1000);

    const nextLelang = await prisma.lelang.findFirst({
      where: {
        id: { not: currentId },
        waktuBuka: {
          gte: waktuTutupCurrent,
          lte: batasMaksimalNext,
        },
        status: { in: ['ACTIVE', 'PENDING'] },
      },
      include: {
        aset: { include: { kategori: true, hasil: true } },
      },
      orderBy: { waktuBuka: 'asc' },
    });

    res.json({ success: true, data: nextLelang || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLelangSummary = async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);

    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Format tanggal tidak valid (gunakan YYYY-MM-DD)' });
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const list = await prisma.lelang.findMany({
      where: {
        status: 'FINISHED',
        waktuBuka: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        aset: {
          include: {
            kategori: { select: { nama: true } },
            hasil: { select: { nilaiLimit: true, nilaiPreferensi: true } },
            penjual: { include: { user: { select: { nama: true } } } },
          },
        },
        pemenang: { select: { id: true, nama: true, email: true } },
        penawaran: {
          orderBy: { nominal: 'desc' },
          take: 3,
          include: { user: { select: { id: true, nama: true } } },
        },
      },
      orderBy: { waktuBuka: 'asc' },
    });

    const totalNilaiLimit = list.reduce((sum, item) => {
      const limit = parseFloat(item.aset?.hasil?.[0]?.nilaiLimit || 0);
      return sum + limit;
    }, 0);

    const totalPendapatan = list.reduce((sum, item) => {
      const highest = item.penawaran?.[0]?.nominal ? parseFloat(item.penawaran[0].nominal) : 0;
      return sum + highest;
    }, 0);

    const totalTerjual = list.filter((item) => item.pemenangId !== null).length;

    res.json({
      success: true,
      data: {
        date,
        totalLelang: list.length,
        totalTerjual,
        totalNilaiLimit,
        totalPendapatan,
        lelangList: list,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
