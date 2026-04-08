import prisma from '../models/prisma.client.js';

export const createNotification = async ({
  userId,
  judul,
  pesan,
  tipe,
  referenceType = null,
  referenceId = null,
}) => {
  if (!userId || !judul || !pesan || !tipe) return null;

  return prisma.notifikasi.create({
    data: {
      userId: Number(userId),
      judul,
      pesan,
      tipe,
      referenceType,
      referenceId: referenceId ? Number(referenceId) : null,
    },
  });
};

export const createNotifications = async (items = []) => {
  const validItems = items.filter((item) => item?.userId && item?.judul && item?.pesan && item?.tipe);
  if (!validItems.length) return { count: 0 };

  return prisma.notifikasi.createMany({
    data: validItems.map((item) => ({
      userId: Number(item.userId),
      judul: item.judul,
      pesan: item.pesan,
      tipe: item.tipe,
      referenceType: item.referenceType || null,
      referenceId: item.referenceId ? Number(item.referenceId) : null,
    })),
  });
};
