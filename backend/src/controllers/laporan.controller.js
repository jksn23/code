import prisma from '../models/prisma.client.js';

// GET Laporan Aset - daftar semua aset beserta hasil SPK
export const getLaporanAset = async (req, res) => {
  try {
    const data = await prisma.aset.findMany({
      include: {
        kategori: { select: { nama: true } },
        penjual: { include: { user: { select: { nama: true, email: true } } } },
        hasil: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const laporan = data.map(a => ({
      id: a.id,
      nama: a.nama,
      kategori: a.kategori?.nama || '-',
      penjual: a.penjual?.user?.nama || 'Admin',
      hargaPasar: Number(a.hargaPasar),
      nilaiLimit: a.hasil?.[0]?.nilaiLimit ? Number(a.hasil[0].nilaiLimit) : null,
      nilaiPreferensi: a.hasil?.[0]?.nilaiPreferensi ? Number(a.hasil[0].nilaiPreferensi) : null,
      statusLelang: a.statusLelang,
      tanggalDibuat: a.createdAt,
    }));

    res.json({ success: true, data: laporan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET Laporan Lelang - daftar semua lelang dengan info pemenang
export const getLaporanLelang = async (req, res) => {
  try {
    const data = await prisma.lelang.findMany({
      include: {
        aset: {
          include: {
            kategori: { select: { nama: true } },
            penjual: { include: { user: { select: { nama: true } } } },
            hasil: true,
          }
        },
        penawaran: {
          include: { user: { select: { nama: true, email: true } } },
          orderBy: { nominal: 'desc' },
          take: 1, // Hanya ambil pemenang (bid tertinggi)
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    const laporan = data.map(l => {
      const pemenang = l.penawaran?.[0];
      const isSelesai = l.waktuTutup && new Date() > new Date(l.waktuTutup);
      return {
        id: l.id,
        invoiceNumber: l.invoiceNumber,
        namaAset: l.aset?.nama,
        kategori: l.aset?.kategori?.nama || '-',
        penjual: l.aset?.penjual?.user?.nama || 'Admin',
        nilaiLimit: l.aset?.hasil?.[0]?.nilaiLimit ? Number(l.aset.hasil[0].nilaiLimit) : 0,
        waktuBuka: l.waktuBuka,
        waktuTutup: l.waktuTutup,
        status: isSelesai ? 'SELESAI' : l.status,
        statusPembayaran: l.statusPembayaran,
        pemenang: pemenang?.user?.nama || '-',
        hargaTerjual: pemenang?.nominal ? Number(pemenang.nominal) : 0,
        emailPemenang: pemenang?.user?.email || '-',
        tanggalLelang: l.createdAt,
      };
    });

    res.json({ success: true, data: laporan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET Laporan Transaksi - semua penawaran / bidding yang pernah terjadi
export const getLaporanTransaksi = async (req, res) => {
  try {
    const data = await prisma.penawaran.findMany({
      include: {
        user: { select: { nama: true, email: true } },
        lelang: {
          include: {
            aset: {
              include: { kategori: { select: { nama: true } } }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    const laporan = data.map(p => ({
      id: p.id,
      penawar: p.user?.nama || '-',
      emailPenawar: p.user?.email || '-',
      namaAset: p.lelang?.aset?.nama || '-',
      kategori: p.lelang?.aset?.kategori?.nama || '-',
      nominal: Number(p.nominal),
      lelangId: p.lelangId,
      waktuBid: p.createdAt,
    }));

    res.json({ success: true, data: laporan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
