import prisma from '../models/prisma.client.js';
import { createNotification } from '../utils/notification.util.js';
import { isSellerApproved } from '../utils/seller-verification.util.js';
import { getUploadedFilePath } from '../middleware/upload.middleware.js';

const calculateQueueSchedule = async (requestedStart, durasiDetik) => {
  const scheduled = await prisma.lelang.findMany({
    where: {
      status: { in: ['PENDING', 'ACTIVE'] },
      waktuTutup: { not: null },
    },
    orderBy: { waktuBuka: 'asc' },
    select: {
      id: true,
      waktuBuka: true,
      waktuTutup: true,
    },
  });

  let actualWaktuBuka = new Date(requestedStart);
  let queuePosition = 1;

  for (const item of scheduled) {
    const existingStart = new Date(item.waktuBuka);
    const existingEnd = new Date(item.waktuTutup);

    if (actualWaktuBuka >= existingStart && actualWaktuBuka < existingEnd) {
      actualWaktuBuka = new Date(existingEnd);
      queuePosition += 1;
    }
  }

  const actualWaktuTutup = new Date(actualWaktuBuka.getTime() + durasiDetik * 1000);
  return { actualWaktuBuka, actualWaktuTutup, queuePosition };
};

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
        lelang: true,
        assetProperty: true,
        assetVehicle: true,
        assetElectronic: true
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
        assetProperty: true,
        assetVehicle: true,
        assetElectronic: true,
        penjual: { include: { user: { select: { nama: true } } } },
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
    const dokumenUrl = getUploadedFilePath(req.file);

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
      if (!isSellerApproved(penjual)) return res.status(403).json({ success: false, message: "Akun seller Anda belum disetujui admin. Selesaikan verifikasi terlebih dahulu." });
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
    if (!isSellerApproved(penjual)) {
      return res.status(403).json({ message: "Akun seller Anda belum aktif. Pengajuan lelang dikunci sampai verifikasi disetujui admin." });
    }

    const aset = await prisma.aset.findUnique({ where: { id: Number(req.params.id) } });
    if (!aset) return res.status(404).json({ message: "Aset tidak ditemukan" });
    if (aset.penjualId !== penjual.id) return res.status(403).json({ message: "Bukan milik Anda" });

    const hasil = await prisma.hasil.findFirst({ where: { asetId: aset.id } });
    if (!hasil) return res.status(400).json({ message: "Aset belum memiliki perhitungan SPK (Nilai Limit)" });
    if (aset.statusPenilaian !== 'DISETUJUI') {
      return res.status(400).json({ message: "Penilaian aset belum disetujui admin" });
    }

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
    const { waktuBuka, durasiDetik, durasiMenit } = req.body;
    const rawDurasiDetik = durasiDetik ?? durasiMenit;

    if (!waktuBuka || rawDurasiDetik === undefined) {
      return res.status(400).json({ success: false, message: "waktuBuka dan durasiDetik wajib diisi" });
    }

    const durasi = Number(rawDurasiDetik);
    if (!Number.isInteger(durasi) || durasi <= 0) {
      return res.status(400).json({ success: false, message: "durasiDetik harus berupa angka bulat positif" });
    }

    const aset = await prisma.aset.findUnique({ where: { id: asetId } });
    if (!aset || aset.statusLelang !== 'PENDING') {
      return res.status(400).json({ success: false, message: "Status Aset tidak valid atau belum PENDING" });
    }

    const tBuka = new Date(waktuBuka);
    if (isNaN(tBuka.getTime())) {
      return res.status(400).json({ success: false, message: "Format waktuBuka tidak valid" });
    }
    if (tBuka.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: "Waktu buka tidak boleh di masa lalu" });
    }

    const { actualWaktuBuka, actualWaktuTutup, queuePosition } = await calculateQueueSchedule(tBuka, durasi);

    const result = await prisma.$transaction(async (tx) => {
      const updatedAset = await tx.aset.update({
        where: { id: asetId },
        data: { statusLelang: 'ACTIVE' },
        include: {
          penjual: {
            include: {
              user: { select: { id: true, nama: true } },
            },
          },
        },
      });

      const lelang = await tx.lelang.create({
        data: {
          asetId,
          waktuBuka: actualWaktuBuka,
          waktuTutup: actualWaktuTutup,
          durasiMenit: durasi,
          status: actualWaktuBuka.getTime() > Date.now() ? 'PENDING' : 'ACTIVE'
        },
      });

      return { lelang, updatedAset };
    });

    const io = req.app.get('io');
    if (io) io.emit('lelang_baru', result.lelang);

    if (result.updatedAset.penjual?.user?.id) {
      await createNotification({
        userId: result.updatedAset.penjual.user.id,
        judul: 'Aset Dijadwalkan ke Lelang',
        pesan: `Aset "${aset.nama}" telah dijadwalkan lelang pada ${actualWaktuBuka.toLocaleString('id-ID')}.`,
        tipe: 'ASET_SCHEDULED',
        referenceType: 'LELANG',
        referenceId: result.lelang.id,
      });
    }

    res.json({
      success: true,
      message: `Lelang berhasil diterbitkan. Slot antrean ke-${queuePosition}. Durasi: ${durasi} detik. Buka: ${actualWaktuBuka.toLocaleString('id-ID')}, Tutup: ${actualWaktuTutup.toLocaleString('id-ID')}`,
      data: {
        ...result.lelang,
        queuePosition,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- SPECIFIC ASSET CREATION ---

export const createAsetProperty = async (req, res) => {
  try {
    const { nama, kategori_id, deskripsi, certificate_number, owner_name, land_area, building_area, village, district, city, province, njop_per_m2 } = req.body;
    
    if (!nama || !kategori_id || !certificate_number || !owner_name || !land_area || !njop_per_m2) {
      return res.status(400).json({ success: false, message: 'Data properti tidak lengkap' });
    }

    const penjual = await prisma.penjual.findUnique({ where: { userId: req.userId } });
    if (!penjual) return res.status(403).json({ success: false, message: 'Profil penjual tidak ditemukan' });

    const property_photo = req.files['property_photo'] ? getUploadedFilePath(req.files['property_photo'][0]) : null;
    const certificate_file = req.files['certificate_file_pdf'] ? getUploadedFilePath(req.files['certificate_file_pdf'][0]) : null;

    const area = Number(land_area) + (Number(building_area) || 0);
    const basePropertyValue = Number(njop_per_m2) * area;

    const data = await prisma.aset.create({
      data: {
        nama: nama.trim(),
        kategoriId: Number(kategori_id),
        hargaPasar: basePropertyValue, // Base value used as temporary market value
        deskripsi: deskripsi || null,
        penjualId: penjual.id,
        statusLelang: 'DRAFT',
        assetProperty: {
          create: {
            certificateNumber: certificate_number,
            ownerName: owner_name,
            landArea: Number(land_area),
            buildingArea: building_area ? Number(building_area) : null,
            village,
            district,
            city,
            province,
            njopPerM2: Number(njop_per_m2),
            basePropertyValue: basePropertyValue,
            certificateFile: certificate_file,
            propertyPhoto: property_photo
          }
        }
      },
      include: { assetProperty: true }
    });
    res.status(201).json({ success: true, message: 'Aset properti berhasil ditambahkan', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAssetVehicle = async (req, res) => {
  try {
    const { nama, kategori_id, deskripsi, harga_pasar, brand, type, year, color, plate_number, engine_number, chassis_number } = req.body;
    
    if (!nama || !kategori_id || !harga_pasar || !brand || !type || !year || !plate_number) {
      return res.status(400).json({ success: false, message: 'Data kendaraan tidak lengkap' });
    }

    const penjual = await prisma.penjual.findUnique({ where: { userId: req.userId } });
    if (!penjual) return res.status(403).json({ success: false, message: 'Profil penjual tidak ditemukan' });

    const vehicle_photo = req.files['vehicle_photo'] ? getUploadedFilePath(req.files['vehicle_photo'][0]) : null;
    const bpkb_file = req.files['vehicle_bpkb'] ? getUploadedFilePath(req.files['vehicle_bpkb'][0]) : null;
    const stnk_file = req.files['vehicle_stnk'] ? getUploadedFilePath(req.files['vehicle_stnk'][0]) : null;

    const data = await prisma.aset.create({
      data: {
        nama: nama.trim(),
        kategoriId: Number(kategori_id),
        hargaPasar: Number(harga_pasar),
        deskripsi: deskripsi || null,
        penjualId: penjual.id,
        statusLelang: 'DRAFT',
        assetVehicle: {
          create: {
            brand,
            type,
            year: Number(year),
            color,
            plateNumber: plate_number,
            engineNumber: engine_number,
            chassisNumber: chassis_number,
            vehiclePhoto: vehicle_photo,
            bpkbFile: bpkb_file,
            stnkFile: stnk_file
          }
        }
      },
      include: { assetVehicle: true }
    });
    res.status(201).json({ success: true, message: 'Aset kendaraan berhasil ditambahkan', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAssetElectronic = async (req, res) => {
  try {
    const { nama, kategori_id, deskripsi, harga_pasar, brand, series, type } = req.body;
    
    if (!nama || !kategori_id || !harga_pasar || !brand || !type) {
      return res.status(400).json({ success: false, message: 'Data elektronik tidak lengkap' });
    }

    const penjual = await prisma.penjual.findUnique({ where: { userId: req.userId } });
    if (!penjual) return res.status(403).json({ success: false, message: 'Profil penjual tidak ditemukan' });

    const item_photo = req.file ? getUploadedFilePath(req.file) : null;

    const data = await prisma.aset.create({
      data: {
        nama: nama.trim(),
        kategoriId: Number(kategori_id),
        hargaPasar: Number(harga_pasar),
        deskripsi: deskripsi || null,
        penjualId: penjual.id,
        statusLelang: 'DRAFT',
        assetElectronic: {
          create: {
            brand,
            series,
            type,
            itemPhoto: item_photo
          }
        }
      },
      include: { assetElectronic: true }
    });
    res.status(201).json({ success: true, message: 'Aset elektronik berhasil ditambahkan', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- SPECIFIC ASSET VERIFICATION (ADMIN) ---

export const verifyProperty = async (req, res) => {
  try {
    const aset = await prisma.aset.findUnique({ where: { id: Number(req.params.id) }, include: { assetProperty: true } });
    if (!aset || !aset.assetProperty) return res.status(404).json({ success: false, message: 'Aset properti tidak ditemukan' });
    
    res.json({ success: true, message: 'Verifikasi dokumen properti berhasil dicatat' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyVehicle = async (req, res) => {
  try {
    const aset = await prisma.aset.findUnique({ where: { id: Number(req.params.id) }, include: { assetVehicle: true } });
    if (!aset || !aset.assetVehicle) return res.status(404).json({ success: false, message: 'Aset kendaraan tidak ditemukan' });
    
    res.json({ success: true, message: 'Verifikasi dokumen kendaraan berhasil dicatat' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyElectronic = async (req, res) => {
  try {
    const aset = await prisma.aset.findUnique({ where: { id: Number(req.params.id) }, include: { assetElectronic: true } });
    if (!aset || !aset.assetElectronic) return res.status(404).json({ success: false, message: 'Aset elektronik tidak ditemukan' });
    
    res.json({ success: true, message: 'Verifikasi dokumen elektronik berhasil dicatat' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
