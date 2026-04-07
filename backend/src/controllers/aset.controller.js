import prisma from '../models/prisma.client.js';

// GET semua aset (bisa filter by kategori_id. Jika role PENJUAL, otomatis filter by penjualId)
export const getAllAset = async (req, res) => {
  try {
    const { kategori_id } = req.query;
    const where = {};
    if (kategori_id) where.kategoriId = Number(kategori_id);

    // SECURITY: Jika Penjual login, paksa filter hanya aset milik sendiri
    if (req.userRole === 'PENJUAL') {
      const penjual = await prisma.penjual.findUnique({ where: { userId: req.userId } });
      if (!penjual) return res.status(403).json({ success: false, message: 'Profil penjual tidak ditemukan' });
      where.penjualId = penjual.id;
    }
    
    const data = await prisma.aset.findMany({
      where,
      include: {
        kategori: { select: { id: true, nama: true } },
        nilaiAset: { include: { kriteria: true } },
        hasil: true,
        penjual: { include: { user: { select: { nama: true } } } },
        lelang: true
      },
      orderBy: { id: 'desc' },
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET aset by ID
export const getAsetById = async (req, res) => {
  try {
    const data = await prisma.aset.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        kategori: true,
        nilaiAset: { include: { kriteria: true } },
        hasil: true,
      },
    });
    if (!data) return res.status(404).json({ success: false, message: 'Aset tidak ditemukan' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST - Tambah aset
export const createAset = async (req, res) => {
  try {
    const { nama, kategori_id, harga_pasar, deskripsi } = req.body;
    const dokumenUrl = req.file ? req.file.path : null;

    if (!nama || !kategori_id || harga_pasar === undefined) {
      return res.status(400).json({ success: false, message: 'nama, kategori_id, dan harga_pasar wajib diisi' });
    }
    if (isNaN(Number(harga_pasar)) || Number(harga_pasar) <= 0) {
      return res.status(400).json({ success: false, message: 'harga_pasar harus berupa angka positif' });
    }
    const kategori = await prisma.kategori.findUnique({ where: { id: Number(kategori_id) } });
    if (!kategori) return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });

    let penjualId = null;
    if (req.userRole === 'PENJUAL') {
      const penjual = await prisma.penjual.findUnique({ where: { userId: req.userId } });
      if (!penjual) return res.status(403).json({ success: false, message: "Akses ditolak. Profil penjual tidak ditemukan." });
      if (!penjual.isVerified) return res.status(403).json({ success: false, message: "Akun Anda belum diverifikasi oleh Admin. Silakan tunggu proses verifikasi." });
      penjualId = penjual.id;
    }

    const data = await prisma.aset.create({
      data: { 
        nama: nama.trim(), 
        kategoriId: Number(kategori_id), 
        hargaPasar: Number(harga_pasar),
        deskripsi: deskripsi || null,
        dokumenUrl,
        penjualId,
        statusLelang: 'DRAFT'
      },
      include: { kategori: { select: { id: true, nama: true } } },
    });
    res.status(201).json({ success: true, message: 'Aset berhasil ditambahkan', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT - Update aset
export const updateAset = async (req, res) => {
  try {
    const { nama, kategori_id, harga_pasar } = req.body;
    const existing = await prisma.aset.findUnique({ where: { id: Number(req.params.id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Aset tidak ditemukan' });

    if (harga_pasar !== undefined && (isNaN(Number(harga_pasar)) || Number(harga_pasar) <= 0)) {
      return res.status(400).json({ success: false, message: 'harga_pasar harus berupa angka positif' });
    }
    const data = await prisma.aset.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(nama && { nama: nama.trim() }),
        ...(kategori_id && { kategoriId: Number(kategori_id) }),
        ...(harga_pasar !== undefined && { hargaPasar: Number(harga_pasar) }),
      },
      include: { kategori: { select: { id: true, nama: true } } },
    });
    res.json({ success: true, message: 'Aset berhasil diperbarui', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE - Hapus aset
export const deleteAset = async (req, res) => {
  try {
    const existing = await prisma.aset.findUnique({ where: { id: Number(req.params.id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Aset tidak ditemukan' });
    
    // Verifikasi kepemilikan aset
    if (req.userRole === 'PENJUAL') {
      const penjual = await prisma.penjual.findUnique({ where: { userId: req.userId } });
      if (existing.penjualId !== penjual?.id) {
        return res.status(403).json({ success: false, message: 'Ini bukan aset Anda' });
      }
    }

    await prisma.aset.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true, message: 'Aset berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT - Penjual Mengajukan Lelang
export const ajukanLelang = async (req, res) => {
  try {
    const penjual = await prisma.penjual.findUnique({ where: { userId: req.userId } });
    if (!penjual) return res.status(403).json({ message: "Profil penjual tidak ditemukan" });

    const aset = await prisma.aset.findUnique({ where: { id: Number(req.params.id) } });
    if (!aset) return res.status(404).json({ message: "Aset tidak ditemukan" });
    if (aset.penjualId !== penjual.id) return res.status(403).json({ message: "Bukan milik Anda" });
    
    const hasil = await prisma.hasil.findFirst({ where: { asetId: aset.id } });
    if (!hasil) return res.status(400).json({ message: "Aset belum memiliki perhitungan SPK (Nilai Limit)" });

    await prisma.aset.update({
      where: { id: aset.id },
      data: { statusLelang: 'PENDING' }
    });
    res.json({ success: true, message: "Aset berhasil diajukan untuk dilelang" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST - Admin Menyetujui dan menerbitkan Lelang (dengan antrian bergilir)
export const createLelangOlehAdmin = async (req, res) => {
  try {
    const asetId = Number(req.params.id);
    const { waktuBuka, durasiMenit } = req.body;
    
    if (!waktuBuka || !durasiMenit) {
      return res.status(400).json({ success: false, message: "waktuBuka dan durasiMenit wajib diisi" });
    }

    const durasi = Number(durasiMenit);
    if (isNaN(durasi) || durasi <= 0) {
      return res.status(400).json({ success: false, message: "durasiMenit harus angka positif" });
    }

    const aset = await prisma.aset.findUnique({ where: { id: asetId } });
    if (!aset || aset.statusLelang !== 'PENDING') {
      return res.status(400).json({ success: false, message: "Status Aset tidak valid atau belum PENDING" });
    }

    const tBuka = new Date(waktuBuka);

    // Hitung posisi antrian: berapa banyak lelang yang sudah dijadwalkan dengan waktuBuka sama
    const existingAtSameTime = await prisma.lelang.count({
      where: {
        waktuBuka: tBuka,
        status: { in: ['PENDING', 'ACTIVE'] }
      }
    });

    // waktuBuka lelang ini = tBuka + (posisi * durasiMenit)
    const offset = existingAtSameTime * durasi;
    const actualWaktuBuka = new Date(tBuka.getTime() + offset * 60 * 1000);
    const actualWaktuTutup = new Date(actualWaktuBuka.getTime() + durasi * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      await tx.aset.update({ where: { id: asetId }, data: { statusLelang: 'ACTIVE' } });
      const lelang = await tx.lelang.create({
        data: {
          asetId,
          waktuBuka: actualWaktuBuka,
          waktuTutup: actualWaktuTutup,
          durasiMenit: durasi,
          status: 'ACTIVE'
        }
      });
      return lelang;
    });

    const io = req.app.get('io');
    if (io) io.emit('lelang_baru', result);

    res.json({ 
      success: true, 
      message: `Lelang berhasil diterbitkan. Antrian ke-${existingAtSameTime + 1}. Buka: ${actualWaktuBuka.toLocaleString('id-ID')}, Tutup: ${actualWaktuTutup.toLocaleString('id-ID')}`, 
      data: result 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

