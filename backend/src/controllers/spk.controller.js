import prisma from '../models/prisma.client.js';
import { hitungSAW } from '../services/saw.service.js';

// POST /api/spk/hitung-saw
export const hitungSAWController = async (req, res) => {
  try {
    const { kategori_id } = req.body;

    if (!kategori_id) {
      return res.status(400).json({ success: false, message: 'kategori_id wajib diisi' });
    }

    // Ambil semua aset dengan kategori tersebut beserta nilai aset
    const asetList = await prisma.aset.findMany({
      where: { kategoriId: Number(kategori_id) },
      include: { nilaiAset: { include: { kriteria: true } } },
    });

    if (asetList.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada aset pada kategori ini' });
    }

    // Ambil kriteria + bobot predefined dari tabel BobotAHP (statis)
    const kriteriaList = await prisma.kriteria.findMany({
      where: { kategoriId: Number(kategori_id) },
      include: { bobotAhp: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { id: 'asc' },
    });

    // Validasi bobot predefined sudah tersedia
    const tidakAdaBobot = kriteriaList.filter((k) => k.bobotAhp.length === 0);
    if (tidakAdaBobot.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Bobot predefined belum tersedia untuk kriteria: ${tidakAdaBobot.map((k) => k.nama).join(', ')}. Hubungi administrator untuk menjalankan seed data.`,
      });
    }

    // Gabungkan kriteria dengan bobot predefined
    const kriteriaWithBobot = kriteriaList.map((k) => ({
      id: k.id,
      nama: k.nama,
      tipe: k.tipe,
      bobot: parseFloat(k.bobotAhp[0].bobot),
    }));

    // Jalankan SAW
    const hasilSAW = hitungSAW(asetList, kriteriaWithBobot);

    // Simpan hasil ke database (hapus hasil lama untuk kategori ini)
    await prisma.hasil.deleteMany({
      where: { aset: { kategoriId: Number(kategori_id) } },
    });

    await Promise.all(
      hasilSAW.ranking.map(async (item) => {
        await prisma.hasil.create({
          data: { asetId: item.id, nilaiPreferensi: item.nilaiPreferensi, nilaiLimit: item.nilaiLimit },
        });
        await prisma.aset.update({
          where: { id: item.id },
          data: { limitValue: item.nilaiLimit }
        });
      })
    );

    res.json({ success: true, message: 'Perhitungan SAW berhasil', data: hasilSAW });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/spk/hasil/:kategori_id
export const getHasil = async (req, res) => {
  try {
    const data = await prisma.hasil.findMany({
      where: { aset: { kategoriId: Number(req.params.kategori_id) } },
      include: { aset: { include: { kategori: true } } },
      orderBy: { nilaiPreferensi: 'desc' },
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

