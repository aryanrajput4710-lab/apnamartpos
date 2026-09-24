const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cache = require('../utils/cache');

exports.getOffers = async (req, res) => {
  try {
    const { active } = req.query;
    const cacheKey = `offers_${active || 'all'}`;
    
    const cachedOffers = cache.get(cacheKey);
    if (cachedOffers) {
      return res.json({ success: true, data: cachedOffers });
    }

    const where = active === 'true' ? { isActive: true } : {};
    const offers = await prisma.storeOffer.findMany({ where, orderBy: { createdAt: 'desc' } });
    
    cache.set(cacheKey, offers);
    res.json({ success: true, data: offers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const invalidateOfferCache = () => {
  cache.del('offers_true');
  cache.del('offers_all');
  cache.del('offers_false');
};

exports.createOffer = async (req, res) => {
  try {
    const { title, description, discountType, discountValue, minCartValue } = req.body;
    const offer = await prisma.storeOffer.create({
      data: {
        title,
        description,
        discountType,
        discountValue: parseFloat(discountValue),
        minCartValue: parseFloat(minCartValue || 0)
      }
    });
    invalidateOfferCache();
    res.status(201).json({ success: true, data: offer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.toggleOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const offer = await prisma.storeOffer.update({
      where: { id },
      data: { isActive }
    });
    invalidateOfferCache();
    res.json({ success: true, data: offer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.storeOffer.delete({ where: { id } });
    invalidateOfferCache();
    res.json({ success: true, message: 'Offer deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
