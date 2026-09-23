const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

const generateUniqueSku = (productName, color, size) => {
  const shortName = productName.substring(0, 3).toUpperCase();
  const c = color ? color.substring(0, 3).toUpperCase() : 'XXX';
  const s = size ? size.toUpperCase() : 'XX';
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${shortName}-${c}-${s}-${random}`;
};

const generateUniqueBarcode = () => {
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `STOREPOS:${random}`;
};

const createProduct = async (req, res) => {
  try {
    const { name, description, category, brand, variants } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }

    const productData = {
      name: name.trim(),
      description: description || null,
      category: category || null,
      brand: brand || null,
    };

    if (variants && variants.length > 0) {
      // Validate variants
      for (const v of variants) {
        if (!v.mrp || !v.sellingPrice) {
          return res.status(400).json({ success: false, message: 'MRP and selling price are required for all variants' });
        }
      }

      // Use a transaction
      const product = await prisma.$transaction(async (tx) => {
        const p = await tx.product.create({
          data: productData
        });

        for (const v of variants) {
          const variant = await tx.productVariant.create({
            data: {
              productId: p.id,
              sku: v.sku || generateUniqueSku(p.name, v.color, v.size),
              barcode: generateUniqueBarcode(),
              color: v.color || null,
              size: v.size || null,
              mrp: v.mrp,
              sellingPrice: v.sellingPrice,
              discountType: v.discountType || 'NONE',
              discountValue: v.discountValue || 0,
              stock: v.stock || 0,
              lowStockThreshold: v.lowStockThreshold || 5,
            }
          });

          if (v.stock > 0) {
            await tx.inventoryTransaction.create({
              data: {
                variantId: variant.id,
                type: 'STOCK_IN',
                quantity: v.stock,
                previousStock: 0,
                newStock: v.stock,
                reason: 'OPENING_STOCK',
                createdBy: req.user.id
              }
            });
          }
        }
        
        return tx.product.findUnique({
          where: { id: p.id },
          include: { variants: true }
        });
      });

      return res.status(201).json({ success: true, data: product });
    } else {
      const product = await prisma.product.create({ data: productData });
      return res.status(201).json({ success: true, data: product });
    }
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
};

const getProducts = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { variants: { some: { sku: { contains: search, mode: 'insensitive' } } } },
        { variants: { some: { barcode: { contains: search, mode: 'insensitive' } } } }
      ];
    }
    if (category) {
      where.category = category;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: { _count: { select: { variants: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: products,
      pagination: { total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { variants: true }
    });

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { name, description, category, brand } = req.body;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { name, description, category, brand }
    });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
};

const toggleProductStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive }
    });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update product status' });
  }
};

const createVariant = async (req, res) => {
  try {
    const { productId } = req.params;
    const { color, size, mrp, sellingPrice, discountType, discountValue, stock, lowStockThreshold, sku } = req.body;

    if (!mrp || !sellingPrice) {
      return res.status(400).json({ success: false, message: 'MRP and selling price are required' });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    let actualSku = sku;
    if (!actualSku) {
      actualSku = generateUniqueSku(product.name, color, size);
    }

    const variant = await prisma.$transaction(async (tx) => {
      const v = await tx.productVariant.create({
        data: {
          productId,
          sku: actualSku,
          barcode: generateUniqueBarcode(),
          color: color || null,
          size: size || null,
          mrp,
          sellingPrice,
          discountType: discountType || 'NONE',
          discountValue: discountValue || 0,
          stock: stock || 0,
          lowStockThreshold: lowStockThreshold || 5
        }
      });

      if (v.stock > 0) {
        await tx.inventoryTransaction.create({
          data: {
            variantId: v.id,
            type: 'STOCK_IN',
            quantity: v.stock,
            previousStock: 0,
            newStock: v.stock,
            reason: 'OPENING_STOCK',
            createdBy: req.user.id
          }
        });
      }
      return v;
    });

    res.status(201).json({ success: true, data: variant });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'SKU or Barcode already exists' });
    }
    res.status(500).json({ success: false, message: 'Failed to create variant' });
  }
};

const getVariantsByProduct = async (req, res) => {
  try {
    const variants = await prisma.productVariant.findMany({
      where: { productId: req.params.productId }
    });
    res.status(200).json({ success: true, data: variants });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch variants' });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  toggleProductStatus,
  createVariant,
  getVariantsByProduct
};
