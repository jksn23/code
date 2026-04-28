import prisma from '../models/prisma.client.js';

const CONFIRM_TEXT = 'HAPUS DATA';
const MAX_IMPORT_ROWS = 1000;

const normalizeKey = (key) =>
  String(key || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

const getValue = (row, aliases) => {
  const normalizedAliases = aliases.map(normalizeKey);
  const entry = Object.entries(row).find(([key]) => normalizedAliases.includes(normalizeKey(key)));
  return entry ? entry[1] : undefined;
};

const toText = (value) => (value == null ? '' : String(value).trim());

const toNumber = (value) => {
  if (typeof value === 'number') return value;

  const raw = toText(value);
  if (!raw) return NaN;

  let cleaned = raw.replace(/[^\d,.-]/g, '');
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  if (lastComma > -1 && lastDot > -1) {
    cleaned = lastComma > lastDot
      ? cleaned.replace(/\./g, '').replace(',', '.')
      : cleaned.replace(/,/g, '');
  } else if (lastComma > -1) {
    cleaned = cleaned.replace(',', '.');
  }

  return Number(cleaned);
};

const toPositiveInt = (value) => {
  const number = Number(toText(value));
  return Number.isInteger(number) && number > 0 ? number : null;
};

const requireConfirmText = (confirmText) => {
  if (confirmText !== CONFIRM_TEXT) {
    return {
      ok: false,
      message: `Ketik "${CONFIRM_TEXT}" untuk melanjutkan aksi ini`,
    };
  }
  return { ok: true };
};

const getSummaryCounts = async (client = prisma) => {
  const [
    kategori,
    kriteria,
    aset,
    nilaiAset,
    bobotAHP,
    hasil,
    lelang,
    penawaran,
    notifikasi,
    totalUsers,
    admin,
    penjualUsers,
    pembeli,
    penjualProfiles,
    usersNonAdmin,
  ] = await Promise.all([
    client.kategori.count(),
    client.kriteria.count(),
    client.aset.count(),
    client.nilaiAset.count(),
    client.bobotAHP.count(),
    client.hasil.count(),
    client.lelang.count(),
    client.penawaran.count(),
    client.notifikasi.count(),
    client.user.count(),
    client.user.count({ where: { role: 'ADMIN' } }),
    client.user.count({ where: { role: 'PENJUAL' } }),
    client.user.count({ where: { role: 'PEMBELI' } }),
    client.penjual.count(),
    client.user.count({ where: { role: { not: 'ADMIN' } } }),
  ]);

  return {
    kategori,
    kriteria,
    aset,
    nilaiAset,
    bobotAHP,
    hasil,
    lelang,
    penawaran,
    notifikasi,
    totalUsers,
    admin,
    penjual: penjualUsers,
    pembeli,
    penjualProfiles,
    usersNonAdmin,
  };
};

const validateImportRows = (target, rows) => {
  if (!['kategori', 'kriteria', 'aset', 'nilai_aset'].includes(target)) {
    return { ok: false, message: 'Target import tidak valid' };
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, message: 'Data import kosong' };
  }

  if (rows.length > MAX_IMPORT_ROWS) {
    return { ok: false, message: `Maksimal ${MAX_IMPORT_ROWS} baris per proses import` };
  }

  return { ok: true };
};

const findKategori = async (tx, row, rowNumber, errors) => {
  const kategoriId = toText(getValue(row, ['kategori_id', 'id_kategori']));
  const kategoriName = toText(getValue(row, ['kategori', 'nama_kategori']));

  if (kategoriId) {
    const id = toPositiveInt(kategoriId);
    if (!id) {
      errors.push({ row: rowNumber, message: `Kategori ID "${kategoriId}" tidak valid` });
      return null;
    }

    const kategori = await tx.kategori.findUnique({ where: { id } });
    if (!kategori) errors.push({ row: rowNumber, message: `Kategori ID ${kategoriId} tidak ditemukan` });
    return kategori;
  }

  if (!kategoriName) {
    errors.push({ row: rowNumber, message: 'Kolom kategori atau kategori_id wajib diisi' });
    return null;
  }

  const kategori = await tx.kategori.findUnique({ where: { nama: kategoriName } });
  if (!kategori) errors.push({ row: rowNumber, message: `Kategori "${kategoriName}" tidak ditemukan` });
  return kategori;
};

const importKategori = async (tx, rows) => {
  const errors = [];
  const records = [];
  const seen = new Set();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const nama = toText(getValue(row, ['nama', 'nama_kategori', 'kategori']));
    const key = nama.toLowerCase();

    if (!nama) {
      errors.push({ row: rowNumber, message: 'Nama kategori wajib diisi' });
      return;
    }

    if (seen.has(key)) {
      errors.push({ row: rowNumber, message: `Kategori "${nama}" duplikat di file import` });
      return;
    }

    seen.add(key);
    records.push({ nama });
  });

  if (errors.length) return { errors };

  let created = 0;
  let updated = 0;

  for (const record of records) {
    const existing = await tx.kategori.findUnique({ where: { nama: record.nama } });
    if (existing) {
      updated += 1;
    } else {
      await tx.kategori.create({ data: record });
      created += 1;
    }
  }

  return { created, updated, total: records.length };
};

const importKriteria = async (tx, rows) => {
  const errors = [];
  const records = [];

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    const nama = toText(getValue(row, ['nama', 'nama_kriteria', 'kriteria']));
    const tipe = toText(getValue(row, ['tipe', 'tipe_kriteria'])).toLowerCase();
    const bobotRaw = getValue(row, ['bobot', 'bobot_ahp']);
    const bobot = bobotRaw === undefined || toText(bobotRaw) === '' ? null : toNumber(bobotRaw);
    const kategori = await findKategori(tx, row, rowNumber, errors);

    if (!nama) errors.push({ row: rowNumber, message: 'Nama kriteria wajib diisi' });
    if (!['benefit', 'cost'].includes(tipe)) {
      errors.push({ row: rowNumber, message: 'Tipe kriteria harus benefit atau cost' });
    }
    if (bobot !== null && (Number.isNaN(bobot) || bobot < 0)) {
      errors.push({ row: rowNumber, message: 'Bobot harus berupa angka positif' });
    }

    if (kategori && nama && ['benefit', 'cost'].includes(tipe)) {
      records.push({ kategoriId: kategori.id, nama, tipe, bobot });
    }
  }

  if (errors.length) return { errors };

  let created = 0;
  let updated = 0;

  for (const record of records) {
    const existing = await tx.kriteria.findFirst({
      where: { kategoriId: record.kategoriId, nama: record.nama },
    });

    const kriteria = existing
      ? await tx.kriteria.update({
          where: { id: existing.id },
          data: { tipe: record.tipe },
        })
      : await tx.kriteria.create({
          data: {
            kategoriId: record.kategoriId,
            nama: record.nama,
            tipe: record.tipe,
          },
        });

    if (existing) updated += 1;
    else created += 1;

    if (record.bobot !== null) {
      await tx.bobotAHP.deleteMany({ where: { kriteriaId: kriteria.id } });
      await tx.bobotAHP.create({
        data: {
          kriteriaId: kriteria.id,
          bobot: record.bobot,
          cr: 0,
        },
      });
    }
  }

  return { created, updated, total: records.length };
};

const resolvePenjualId = async (tx, row, rowNumber, errors) => {
  const penjualId = toText(getValue(row, ['penjual_id', 'id_penjual']));
  const emailPenjual = toText(getValue(row, ['email_penjual', 'penjual_email']));

  if (penjualId) {
    const id = toPositiveInt(penjualId);
    if (!id) {
      errors.push({ row: rowNumber, message: `Penjual ID "${penjualId}" tidak valid` });
      return null;
    }

    const penjual = await tx.penjual.findUnique({ where: { id } });
    if (!penjual) errors.push({ row: rowNumber, message: `Penjual ID ${penjualId} tidak ditemukan` });
    return penjual?.id || null;
  }

  if (!emailPenjual) return null;

  const user = await tx.user.findUnique({
    where: { email: emailPenjual },
    include: { penjual: true },
  });

  if (!user || user.role !== 'PENJUAL' || !user.penjual) {
    errors.push({ row: rowNumber, message: `Email penjual "${emailPenjual}" tidak ditemukan` });
    return null;
  }

  return user.penjual.id;
};

const importAset = async (tx, rows) => {
  const errors = [];
  const records = [];

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    const nama = toText(getValue(row, ['nama', 'nama_aset', 'aset']));
    const hargaPasar = toNumber(getValue(row, ['harga_pasar', 'hargaPasar', 'harga']));
    const deskripsi = toText(getValue(row, ['deskripsi', 'keterangan'])) || null;
    const kategori = await findKategori(tx, row, rowNumber, errors);
    const penjualId = await resolvePenjualId(tx, row, rowNumber, errors);

    if (!nama) errors.push({ row: rowNumber, message: 'Nama aset wajib diisi' });
    if (Number.isNaN(hargaPasar) || hargaPasar <= 0) {
      errors.push({ row: rowNumber, message: 'Harga pasar harus berupa angka positif' });
    }

    if (kategori && nama && !Number.isNaN(hargaPasar) && hargaPasar > 0) {
      records.push({
        kategoriId: kategori.id,
        penjualId,
        nama,
        hargaPasar,
        deskripsi,
      });
    }
  }

  if (errors.length) return { errors };

  let created = 0;
  let updated = 0;

  for (const record of records) {
    const existing = await tx.aset.findFirst({
      where: { kategoriId: record.kategoriId, nama: record.nama },
    });

    if (existing) {
      await tx.aset.update({
        where: { id: existing.id },
        data: {
          hargaPasar: record.hargaPasar,
          deskripsi: record.deskripsi,
          penjualId: record.penjualId,
        },
      });
      updated += 1;
    } else {
      await tx.aset.create({
        data: {
          nama: record.nama,
          kategoriId: record.kategoriId,
          hargaPasar: record.hargaPasar,
          deskripsi: record.deskripsi,
          penjualId: record.penjualId,
          statusLelang: 'DRAFT',
        },
      });
      created += 1;
    }
  }

  return { created, updated, total: records.length };
};

const findAset = async (tx, row, rowNumber, errors) => {
  const asetId = toText(getValue(row, ['aset_id', 'id_aset']));
  const asetName = toText(getValue(row, ['aset', 'nama_aset']));

  if (asetId) {
    const id = toPositiveInt(asetId);
    if (!id) {
      errors.push({ row: rowNumber, message: `Aset ID "${asetId}" tidak valid` });
      return null;
    }

    const aset = await tx.aset.findUnique({ where: { id } });
    if (!aset) errors.push({ row: rowNumber, message: `Aset ID ${asetId} tidak ditemukan` });
    return aset;
  }

  if (!asetName) {
    errors.push({ row: rowNumber, message: 'Kolom aset atau aset_id wajib diisi' });
    return null;
  }

  let kategoriId;
  const kategoriName = toText(getValue(row, ['kategori', 'nama_kategori']));
  if (kategoriName) {
    const kategori = await tx.kategori.findUnique({ where: { nama: kategoriName } });
    if (!kategori) {
      errors.push({ row: rowNumber, message: `Kategori "${kategoriName}" tidak ditemukan` });
      return null;
    }
    kategoriId = kategori.id;
  }

  const matches = await tx.aset.findMany({
    where: {
      nama: asetName,
      ...(kategoriId ? { kategoriId } : {}),
    },
    take: 2,
  });

  if (matches.length === 0) {
    errors.push({ row: rowNumber, message: `Aset "${asetName}" tidak ditemukan` });
    return null;
  }

  if (matches.length > 1) {
    errors.push({ row: rowNumber, message: `Aset "${asetName}" duplikat. Gunakan aset_id atau kategori` });
    return null;
  }

  return matches[0];
};

const findKriteria = async (tx, row, aset, rowNumber, errors) => {
  const kriteriaId = toText(getValue(row, ['kriteria_id', 'id_kriteria']));
  const kriteriaName = toText(getValue(row, ['kriteria', 'nama_kriteria']));

  if (kriteriaId) {
    const id = toPositiveInt(kriteriaId);
    if (!id) {
      errors.push({ row: rowNumber, message: `Kriteria ID "${kriteriaId}" tidak valid` });
      return null;
    }

    const kriteria = await tx.kriteria.findUnique({ where: { id } });
    if (!kriteria) {
      errors.push({ row: rowNumber, message: `Kriteria ID ${kriteriaId} tidak ditemukan` });
      return null;
    }
    if (aset && kriteria.kategoriId !== aset.kategoriId) {
      errors.push({ row: rowNumber, message: `Kriteria ID ${kriteriaId} tidak sesuai kategori aset` });
      return null;
    }
    return kriteria;
  }

  if (!kriteriaName) {
    errors.push({ row: rowNumber, message: 'Kolom kriteria atau kriteria_id wajib diisi' });
    return null;
  }

  if (!aset) return null;

  const kriteria = await tx.kriteria.findFirst({
    where: { kategoriId: aset.kategoriId, nama: kriteriaName },
  });

  if (!kriteria) {
    errors.push({ row: rowNumber, message: `Kriteria "${kriteriaName}" tidak ditemukan pada kategori aset` });
  }

  return kriteria;
};

const importNilaiAset = async (tx, rows) => {
  const errors = [];
  const records = [];

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    const nilai = toNumber(getValue(row, ['nilai', 'nilai_aset']));
    const aset = await findAset(tx, row, rowNumber, errors);
    const kriteria = await findKriteria(tx, row, aset, rowNumber, errors);

    if (Number.isNaN(nilai)) {
      errors.push({ row: rowNumber, message: 'Nilai harus berupa angka' });
    }

    if (aset && kriteria && !Number.isNaN(nilai)) {
      records.push({ asetId: aset.id, kriteriaId: kriteria.id, nilai });
    }
  }

  if (errors.length) return { errors };

  let created = 0;
  let updated = 0;

  for (const record of records) {
    const existing = await tx.nilaiAset.findUnique({
      where: {
        asetId_kriteriaId: {
          asetId: record.asetId,
          kriteriaId: record.kriteriaId,
        },
      },
    });

    await tx.nilaiAset.upsert({
      where: {
        asetId_kriteriaId: {
          asetId: record.asetId,
          kriteriaId: record.kriteriaId,
        },
      },
      update: { nilai: record.nilai },
      create: record,
    });

    if (existing) updated += 1;
    else created += 1;
  }

  return { created, updated, total: records.length };
};

const runImport = async (target, rows) => {
  return prisma.$transaction(async (tx) => {
    if (target === 'kategori') return importKategori(tx, rows);
    if (target === 'kriteria') return importKriteria(tx, rows);
    if (target === 'aset') return importAset(tx, rows);
    return importNilaiAset(tx, rows);
  });
};

const purgeModule = async (tx, moduleName) => {
  const result = {};

  if (moduleName === 'kategori') {
    result.kategori = (await tx.kategori.deleteMany()).count;
    return result;
  }

  if (moduleName === 'kriteria') {
    result.hasil = (await tx.hasil.deleteMany()).count;
    result.kriteria = (await tx.kriteria.deleteMany()).count;
    return result;
  }

  if (moduleName === 'aset') {
    result.aset = (await tx.aset.deleteMany()).count;
    return result;
  }

  if (moduleName === 'nilai') {
    result.hasil = (await tx.hasil.deleteMany()).count;
    result.nilaiAset = (await tx.nilaiAset.deleteMany()).count;
    result.bobotAHP = (await tx.bobotAHP.deleteMany()).count;
    return result;
  }

  if (moduleName === 'lelang') {
    result.penawaran = (await tx.penawaran.deleteMany()).count;
    result.lelang = (await tx.lelang.deleteMany()).count;
    result.asetDikembalikan = (await tx.aset.updateMany({ data: { statusLelang: 'DRAFT' } })).count;
    return result;
  }

  if (moduleName === 'pembeli') {
    result.pembeli = (await tx.user.deleteMany({ where: { role: 'PEMBELI' } })).count;
    return result;
  }

  if (moduleName === 'penjual') {
    result.penjual = (await tx.user.deleteMany({ where: { role: 'PENJUAL' } })).count;
    return result;
  }

  if (moduleName === 'notifikasi') {
    result.notifikasi = (await tx.notifikasi.deleteMany()).count;
    return result;
  }

  if (moduleName === 'users_non_admin') {
    result.users = (await tx.user.deleteMany({ where: { role: { not: 'ADMIN' } } })).count;
    return result;
  }

  throw new Error('Module penghapusan tidak valid');
};

const resetAllData = async (tx, currentUserId) => {
  const result = {};

  result.notifikasi = (await tx.notifikasi.deleteMany()).count;
  result.penawaran = (await tx.penawaran.deleteMany()).count;
  result.lelang = (await tx.lelang.deleteMany()).count;
  result.hasil = (await tx.hasil.deleteMany()).count;
  result.nilaiAset = (await tx.nilaiAset.deleteMany()).count;
  result.bobotAHP = (await tx.bobotAHP.deleteMany()).count;
  result.aset = (await tx.aset.deleteMany()).count;
  result.kriteria = (await tx.kriteria.deleteMany()).count;
  result.kategori = (await tx.kategori.deleteMany()).count;
  result.penjualProfiles = (await tx.penjual.deleteMany()).count;
  result.users = (await tx.user.deleteMany({ where: { id: { not: Number(currentUserId) } } })).count;

  await tx.user.update({
    where: { id: Number(currentUserId) },
    data: {
      role: 'ADMIN',
      buyerVerificationStatus: 'UNVERIFIED',
      buyerVerificationNote: null,
      buyerVerifiedAt: null,
      buyerVerifiedBy: null,
    },
  });

  return result;
};

export const getSettingsSummary = async (req, res) => {
  try {
    const counts = await getSummaryCounts();
    res.json({ success: true, data: { counts, confirmText: CONFIRM_TEXT } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const importSettingsData = async (req, res) => {
  try {
    const { target, rows } = req.body;
    const validation = validateImportRows(target, rows);
    if (!validation.ok) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const result = await runImport(target, rows);
    if (result.errors?.length) {
      return res.status(400).json({
        success: false,
        message: 'Import dibatalkan karena ada data yang tidak valid',
        errors: result.errors.slice(0, 50),
      });
    }

    res.json({ success: true, message: 'Import data berhasil', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const purgeSettingsModule = async (req, res) => {
  try {
    const { module } = req.params;
    const confirmation = requireConfirmText(req.body?.confirmText);
    if (!confirmation.ok) {
      return res.status(400).json({ success: false, message: confirmation.message });
    }

    const allowedModules = [
      'kategori',
      'kriteria',
      'aset',
      'nilai',
      'lelang',
      'pembeli',
      'penjual',
      'notifikasi',
      'users_non_admin',
    ];

    if (!allowedModules.includes(module)) {
      return res.status(400).json({ success: false, message: 'Module penghapusan tidak valid' });
    }

    const before = await getSummaryCounts();
    const deleted = await prisma.$transaction((tx) => purgeModule(tx, module));
    const after = await getSummaryCounts();

    res.json({
      success: true,
      message: 'Penghapusan data berhasil',
      data: { module, before, after, deleted },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetSettingsData = async (req, res) => {
  try {
    const confirmation = requireConfirmText(req.body?.confirmText);
    if (!confirmation.ok) {
      return res.status(400).json({ success: false, message: confirmation.message });
    }

    const before = await getSummaryCounts();
    const deleted = await prisma.$transaction((tx) => resetAllData(tx, req.userId));
    const after = await getSummaryCounts();

    res.json({
      success: true,
      message: 'Reset data sistem berhasil',
      data: { before, after, deleted },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
