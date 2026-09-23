const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const scanProduct = async (req, res) => {
  try {
    const { code } = req.params;

    // Search by exact barcode or SKU
    const variant = await prisma.productVariant.findFirst({
      where: {
        OR: [
          { barcode: code },
          { sku: code }
        ],
        isActive: true,
        product: {
          isActive: true
        }
      },
      include: {
        product: true
      }
    });

    if (!variant) {
      return res.status(404).json({ success: false, message: 'Product not found or inactive' });
    }

    if (variant.stock <= 0) {
      // Return 200 but flag as out of stock, letting POS show proper message
      return res.status(200).json({ 
        success: true, 
        message: 'Out of stock', 
        data: variant 
      });
    }

    res.status(200).json({ success: true, data: variant });
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const searchProducts = async (req, res) => {
  try {
    const { q = '' } = req.query;

    const variants = await prisma.productVariant.findMany({
      where: {
        isActive: true,
        product: {
          isActive: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { category: { contains: q, mode: 'insensitive' } }
          ]
        }
      },
      include: {
        product: true
      },
      take: 20
    });

    res.status(200).json({ success: true, data: variants });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  scanProduct,
  searchProducts
};
