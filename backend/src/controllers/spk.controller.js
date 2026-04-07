import prisma from '../models/prisma.client.js';
import { hitungAHP } from '../services/ahp.service.js';
import { hitungSAW } from '../services/saw.service.js';

// POST /api/spk/hitung-ahp
export const hitungAHPController = async (req, res) => {
  try {
    const { kategori_id, matrix } = req.body;

    if (!kategori_id || !matrix) {
      return res.status(400).json({ success: false, message: 'kategori_id dan matrix wajib diisi' });
    }

    // Ambil kriteria berdasarkan kategori
    const kriteria = await prisma.kriteria.findMany({
      where: { kategoriId: Number(kategori_id) },
      orderBy: { id: 'asc' },
    });

    if (kriteria.length < 2) {
      return res.status(400).json({ success: false, message: 'Minimal 2 kriteria diperlukan untuk AHP' });
    }

    if (matrix.length !== kriteria.length) {
      return res.status(400).json({
        success: false,
        message: `Ukuran matriks (${matrix.length}x${matrix.length}) harus sesuai jumlah kriteria (${kriteria.length})`,
      });
    }

    // Jalankan kalkulasi AHP
    const hasilAHP = hitungAHP(matrix);

    // Jika tidak konsisten, STOP dan kembalikan error
    if (!hasilAHP.isConsistent) {
      return res.status(422).json({
        success: false,
        message: hasilAHP.pesan,
        data: hasilAHP,
      });
    }

    // Simpan bobot ke database (hapus bobot lama untuk kategori ini dulu)
    await prisma.bobotAHP.deleteMany({
      where: { kriteria: { kategoriId: Number(kategori_id) } },
    });

    await Promise.all(
      kriteria.map((krit, i) =>
        prisma.bobotAHP.create({
          data: { kriteriaId: krit.id, bobot: hasilAHP.bobot[i], cr: hasilAHP.CR },
        })
      )
    );

    // Kembalikan hasil lengkap + nama kriteria
    res.json({
      success: true,
      message: hasilAHP.pesan,
      data: {
        ...hasilAHP,
        kriteria: kriteria.map((k, i) => ({
          id: k.id,
          nama: k.nama,
          tipe: k.tipe,
          bobot: hasilAHP.bobot[i],
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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

    // Ambil kriteria + bobot dari hasil AHP
    const kriteriaList = await prisma.kriteria.findMany({
      where: { kategoriId: Number(kategori_id) },
      include: { bobotAhp: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { id: 'asc' },
    });

    // Validasi bobot AHP sudah ada
    const tidakAdaBobot = kriteriaList.filter((k) => k.bobotAhp.length === 0);
    if (tidakAdaBobot.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Hitung AHP terlebih dahulu. Bobot belum ada untuk kriteria: ${tidakAdaBobot.map((k) => k.nama).join(', ')}`,
      });
    }

    // Gabungkan kriteria dengan bobotnya
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
      hasilSAW.ranking.map((item) =>
        prisma.hasil.create({
          data: { asetId: item.id, nilaiPreferensi: item.nilaiPreferensi, nilaiLimit: item.nilaiLimit },
        })
      )
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
