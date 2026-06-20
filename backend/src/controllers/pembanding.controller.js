import prisma from '../models/prisma.client.js';
import { pembandingService } from '../services/pembanding.service.js';

export const getPembandingByAset = async (req, res) => {
  try {
    const asetId = Number(req.params.asetId);
    if (isNaN(asetId)) return res.status(400).json({ success: false, message: 'ID Aset tidak valid' });

    const pembanding = await prisma.dataPembanding.findMany({
      where: { asetId },
      orderBy: { createdAt: 'desc' }
    });

    const aset = await prisma.aset.findUnique({
      where: { id: asetId },
      include: { hasil: true }
    });

    const hargaReferensi = aset?.hasil?.[0]?.hargaReferensiPasar || null;

    res.json({ success: true, data: pembanding, hargaReferensiPasar: hargaReferensi });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const searchPembanding = async (req, res) => {
  try {
    const asetId = Number(req.params.asetId);
    if (isNaN(asetId)) return res.status(400).json({ success: false, message: 'ID Aset tidak valid' });

    const aset = await prisma.aset.findUnique({
      where: { id: asetId },
      include: { assetVehicle: true, assetProperty: true, assetElectronic: true }
    });

    if (!aset) return res.status(404).json({ success: false, message: 'Aset tidak ditemukan' });

    // Cek apakah penjual berhak atau admin
    if (req.userRole !== 'ADMIN') {
      const penjual = await prisma.penjual.findUnique({ where: { userId: req.userId } });
      if (!penjual || penjual.id !== aset.penjualId) {
        return res.status(403).json({ success: false, message: 'Akses ditolak' });
      }
    }

    const mockData = await pembandingService.findComparableAssets(aset);

    const savedData = await Promise.all(
      mockData.map(async (data) => {
        return await prisma.dataPembanding.create({
          data: {
            ...data,
            asetId
          }
        });
      })
    );

    res.json({ success: true, data: savedData, message: 'Berhasil mencari data pembanding' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addManualPembanding = async (req, res) => {
  try {
    const asetId = Number(req.params.asetId);
    if (isNaN(asetId)) return res.status(400).json({ success: false, message: 'ID Aset tidak valid' });

    const { judul, sumber, sourceUrl, harga, lokasi, tahun, kondisi, spesifikasi } = req.body;

    const pembanding = await prisma.dataPembanding.create({
      data: {
        asetId,
        judul,
        sumber,
        sourceUrl,
        harga,
        lokasi,
        tahun: tahun ? Number(tahun) : null,
        kondisi,
        spesifikasi,
        skorKecocokan: 100, // Manual diasumsikan sangat cocok
        dipilihPenjual: true
      }
    });

    res.json({ success: true, data: pembanding, message: 'Data pembanding manual berhasil ditambahkan' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const selectPembanding = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID Pembanding tidak valid' });

    const { dipilihPenjual } = req.body;

    const pembanding = await prisma.dataPembanding.update({
      where: { id },
      data: { dipilihPenjual }
    });

    res.json({ success: true, data: pembanding, message: 'Status seleksi diperbarui' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const validasiPembanding = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID Pembanding tidak valid' });

    const { statusValidasi } = req.body; // DITERIMA atau DITOLAK

    if (!['DITERIMA', 'DITOLAK', 'MENUNGGU'].includes(statusValidasi)) {
      return res.status(400).json({ success: false, message: 'Status validasi tidak valid' });
    }

    const pembanding = await prisma.dataPembanding.update({
      where: { id },
      data: { statusValidasi }
    });

    res.json({ success: true, data: pembanding, message: 'Status validasi diperbarui' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const hitungMedian = async (req, res) => {
  try {
    const asetId = Number(req.params.asetId);
    if (isNaN(asetId)) return res.status(400).json({ success: false, message: 'ID Aset tidak valid' });

    // Ambil data yang dipilih penjual
    const selectedPembanding = await prisma.dataPembanding.findMany({
      where: { asetId, dipilihPenjual: true, statusValidasi: { not: 'DITOLAK' } }
    });

    if (selectedPembanding.length < 3) {
      return res.status(400).json({ success: false, message: 'Minimal pilih 3 data pembanding' });
    }

    const prices = selectedPembanding.map(p => Number(p.harga));
    const filteredPrices = pembandingService.removeOutliers(prices);
    
    if (filteredPrices.length === 0) {
      return res.status(400).json({ success: false, message: 'Data harga tidak valid untuk dihitung' });
    }

    const median = pembandingService.calculateMedian(filteredPrices);

    // Update di model Hasil
    let hasil = await prisma.hasil.findFirst({
      where: { asetId }
    });

    if (!hasil) {
      // Jika belum ada hasil SAW, kita simpan sementara (atau reject)
      // Tergantung workflow. Kita asumsikan SAW sudah jalan, tapi kalau belum:
      hasil = await prisma.hasil.create({
        data: {
          asetId,
          nilaiPreferensi: 0,
          hargaReferensiPasar: median,
          nilaiLimit: 0
        }
      });
    } else {
      const nilaiPreferensi = Number(hasil.nilaiPreferensi);
      const nilaiLimit = nilaiPreferensi * median;
      
      hasil = await prisma.hasil.update({
        where: { id: hasil.id },
        data: {
          hargaReferensiPasar: median,
          nilaiLimit: nilaiLimit
        }
      });

      // Update nilai limit aset juga agar konsisten
      await prisma.aset.update({
        where: { id: asetId },
        data: { limitValue: nilaiLimit }
      });
    }

    res.json({ success: true, data: { median, hasil }, message: 'Harga referensi pasar berhasil dihitung' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
