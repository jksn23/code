import prisma from '../models/prisma.client.js';
import { hitungSAW } from '../services/saw.service.js';

export const hitungSAWController = async (req, res) => {
  try {
    const { kategori_id } = req.body;

    if (!kategori_id) {
      return res.status(400).json({ success: false, message: 'kategori_id wajib diisi' });
    }

    // Ambil semua aset dengan kategori tersebut beserta nilai aset
    const asetList = await prisma.aset.findMany({
      where: { kategoriId: Number(kategori_id) },
      include: {
        nilaiAset: { include: { kriteria: true } },
        hasil: { orderBy: { id: 'desc' }, take: 1 }
      },
    });

    if (asetList.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada aset pada kategori ini' });
    }

    // Validasi harga pasar
    const invalidAset = asetList.find(a => Number(a.hargaPasar) <= 0);
    if (invalidAset) {
      return res.status(400).json({ success: false, message: `Aset ${invalidAset.nama} memiliki harga pasar 0 atau negatif` });
    }

    // Ambil versi bobot aktif
    const activeVersion = await prisma.bobotVersion.findFirst({
      where: { kategoriId: Number(kategori_id), aktif: true },
      include: { bobotAhp: { include: { kriteria: true } } }
    });

    if (!activeVersion) {
      return res.status(400).json({ success: false, message: 'Tidak ada versi bobot aktif untuk kategori ini. Harap validasi AHP terlebih dahulu.' });
    }

    if (Number(activeVersion.cr) > 0.10) {
      return res.status(400).json({ success: false, message: `Versi bobot aktif memiliki CR > 0.10 (${Number(activeVersion.cr)}). Validasi AHP gagal.` });
    }

    // Ambil kriteria untuk cek kelengkapan
    const kriteriaList = await prisma.kriteria.findMany({
      where: { kategoriId: Number(kategori_id) },
      orderBy: { id: 'asc' },
    });

    if (activeVersion.bobotAhp.length !== kriteriaList.length) {
      return res.status(400).json({ success: false, message: 'Jumlah bobot tidak sesuai dengan jumlah kriteria.' });
    }

    const totalBobot = activeVersion.bobotAhp.reduce((sum, item) => sum + Number(item.bobot), 0);
    const tolerance = 1e-9;
    if (Math.abs(totalBobot - 1) > tolerance) {
      return res.status(422).json({
        success: false,
        code: 'INVALID_TOTAL_WEIGHT',
        message: 'Total bobot harus sama dengan 1.',
        totalWeight: totalBobot
      });
    }

    const kriteriaWithBobot = kriteriaList.map((k) => {
      const bobotRecord = activeVersion.bobotAhp.find(b => b.kriteriaId === k.id);
      return {
        id: k.id,
        nama: k.nama,
        tipe: k.tipe,
        bobot: parseFloat(bobotRecord.bobot),
      };
    });

    // Jalankan SAW
    const hasilSAW = hitungSAW(asetList, kriteriaWithBobot);

    await prisma.$transaction(async (tx) => {
      // Simpan hasil ke database (hapus hasil lama untuk kategori ini)
      await tx.hasil.deleteMany({
        where: { aset: { kategoriId: Number(kategori_id) } },
      });

      await Promise.all(
        hasilSAW.ranking.map(async (item) => {
          await tx.hasil.create({
            data: { 
              asetId: item.id, 
              nilaiPreferensi: item.nilaiPreferensi, 
              hargaReferensiPasar: item.hargaPasar,
              nilaiLimit: item.nilaiLimit 
            },
          });
          await tx.aset.update({
            where: { id: item.id },
            data: { limitValue: item.nilaiLimit }
          });
        })
      );
    });

    res.json({ 
      success: true, 
      message: 'Perhitungan SAW berhasil', 
      data: {
        versiBobot: activeVersion.namaVersi,
        cr: Number(activeVersion.cr),
        ...hasilSAW
      } 
    });
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

