
const prisma = require('../utils/prisma');

const getVariantById = async (req, res) => {
  try {
    const variant = await prisma.productVariant.findUnique({
      where: { id: req.params.id },
      include: { product: true }
    });
    if (!variant) return res.status(404).json({ success: false, message: 'Variant not found' });
    res.status(200).json({ success: true, data: variant });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch variant' });
  }
};

const updateVariant = async (req, res) => {
  try {
    const { color, size, mrp, sellingPrice, discountType, discountValue, lowStockThreshold } = req.body;
    
    // Admins cannot change SKU/Barcode or stock here per rules (stock is managed later)
    const variant = await prisma.productVariant.update({
      where: { id: req.params.id },
      data: { color, size, mrp, sellingPrice, discountType, discountValue, lowStockThreshold }
    });
    res.status(200).json({ success: true, data: variant });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update variant' });
  }
};

const toggleVariantStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const variant = await prisma.productVariant.update({
      where: { id: req.params.id },
      data: { isActive }
    });
    res.status(200).json({ success: true, data: variant });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update variant status' });
  }
};

module.exports = {
  getVariantById,
  updateVariant,
  toggleVariantStatus
};
