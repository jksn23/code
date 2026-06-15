import prisma from '../models/prisma.client.js';

export const getQuickBids = async (req, res) => {
  try {
    const { auctionId } = req.query;
    if (!auctionId) {
      return res.status(400).json({ success: false, message: 'auctionId diperlukan' });
    }

    const quickBids = await prisma.quickBid.findUnique({
      where: {
        buyerId_auctionId: {
          buyerId: req.userId,
          auctionId: Number(auctionId)
        }
      }
    });

    res.json({ success: true, data: quickBids });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveQuickBids = async (req, res) => {
  try {
    const { auctionId, quickBid1, quickBid2, quickBid3 } = req.body;
    
    if (!auctionId || !quickBid1 || !quickBid2 || !quickBid3) {
      return res.status(400).json({ success: false, message: 'Data Quick Bid tidak lengkap' });
    }

    const quickBids = await prisma.quickBid.upsert({
      where: {
        buyerId_auctionId: {
          buyerId: req.userId,
          auctionId: Number(auctionId)
        }
      },
      update: {
        quickBid1: Number(quickBid1),
        quickBid2: Number(quickBid2),
        quickBid3: Number(quickBid3)
      },
      create: {
        buyerId: req.userId,
        auctionId: Number(auctionId),
        quickBid1: Number(quickBid1),
        quickBid2: Number(quickBid2),
        quickBid3: Number(quickBid3)
      }
    });

    res.status(200).json({ success: true, message: 'Quick Bid berhasil disimpan', data: quickBids });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
