import prisma from '../models/prisma.client.js';

// POST - Input/Update nilai aset per kriteria (bulk)
export const inputNilaiAset = async (req, res) => {
  try {
    const { aset_id, nilai_list } = req.body;
    // nilai_list: [{ kriteria_id, nilai }]
    if (!aset_id || !Array.isArray(nilai_list) || nilai_list.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'aset_id dan nilai_list (array) wajib diisi',
      });
    }

    const aset = await prisma.aset.findUnique({
      where: { id: Number(aset_id) },
      include: { kategori: { include: { kriteria: true } } },
    });
    if (!aset) return res.status(404).json({ success: false, message: 'Aset tidak ditemukan' });

    // Validasi: kriteria harus sesuai kategori aset
    const kriteriaKategoriIds = aset.kategori.kriteria.map((k) => k.id);
    for (const item of nilai_list) {
      if (!kriteriaKategoriIds.includes(Number(item.kriteria_id))) {
        return res.status(400).json({
          success: false,
          message: `Kriteria ID ${item.kriteria_id} tidak sesuai kategori aset ini`,
        });
      }
      if (isNaN(Number(item.nilai))) {
        return res.status(400).json({ success: false, message: `Nilai untuk kriteria ID ${item.kriteria_id} harus berupa angka` });
      }
    }

    // Upsert setiap nilai
    const results = await Promise.all(
      nilai_list.map((item) =>
        prisma.nilaiAset.upsert({
          where: { asetId_kriteriaId: { asetId: Number(aset_id), kriteriaId: Number(item.kriteria_id) } },
          update: { nilai: Number(item.nilai) },
          create: { asetId: Number(aset_id), kriteriaId: Number(item.kriteria_id), nilai: Number(item.nilai) },
          include: { kriteria: { select: { id: true, nama: true, tipe: true } } },
        })
      )
    );

    res.json({ success: true, message: 'Nilai aset berhasil disimpan', data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET - Lihat semua nilai aset
export const getNilaiByAset = async (req, res) => {
  try {
    const { aset_id } = req.params;
    const data = await prisma.nilaiAset.findMany({
      where: { asetId: Number(aset_id) },
      include: { kriteria: true },
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
