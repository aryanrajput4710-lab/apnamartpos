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
    const { name, description, category, subcategory, brand, variants } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }

    const productData = {
      name: name.trim(),
      description: description || null,
      category: category || null,
      subcategory: subcategory || null,
      brand: brand || null,
    };

    if (variants && variants.length > 0) {
      // Validate variants
      for (const v of variants) {
        if (v.costPrice === undefined || v.costPrice === null || v.costPrice === '' || !v.mrp || !v.sellingPrice) {
          return res.status(400).json({ success: false, message: 'Cost Price, MRP, and selling price are required for all variants' });
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
              costPrice: v.costPrice || 0,
              costPrice: v.costPrice || 0,
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
    const { search, category, subcategory, page = 1, limit = 50 } = req.query;
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
    if (subcategory) {
      where.subcategory = subcategory;
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
    const { name, description, category, subcategory, brand } = req.body;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { name, description, category, subcategory, brand }
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
    const { color, size, costPrice, mrp, sellingPrice, discountType, discountValue, stock, lowStockThreshold, sku } = req.body;

    if (costPrice === undefined || costPrice === null || costPrice === '' || !mrp || !sellingPrice) {
      return res.status(400).json({ success: false, message: 'Cost Price, MRP, and selling price are required' });
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
          costPrice: costPrice || 0,
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



const exportCatalog = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        variants: true
      }
    });
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const importCatalog = async (req, res) => {
  try {
    const { products } = req.body;
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }

    const imported = await prisma.$transaction(async (tx) => {
      let count = 0;
      for (const p of products) {
        if (!p.name) throw new Error('Product name is required');
        
        const newProduct = await tx.product.create({
          data: {
            name: p.name,
            description: p.description || null,
            category: p.category || null,
            subcategory: p.subcategory || null,
            brand: p.brand || null,
            isActive: p.isActive !== undefined ? p.isActive : true,
            variants: {
              create: (p.variants || []).map(v => {
                if (!v.sku || !v.barcode || v.mrp === undefined || v.sellingPrice === undefined) {
                  throw new Error(`Variant missing required fields for product ${p.name}`);
                }
                return {
                  sku: v.sku,
                  barcode: v.barcode,
                  color: v.color || null,
                  size: v.size || null,
                  mrp: v.mrp,
                  sellingPrice: v.sellingPrice,
                  discountType: v.discountType || 'NONE',
                  discountValue: v.discountValue || 0,
                  stock: 0, // Never import stock! Must use opening stock transactions.
                  lowStockThreshold: v.lowStockThreshold || 5,
                  isActive: v.isActive !== undefined ? v.isActive : true,
                };
              })
            }
          }
        });
        count++;
      }
      return count;
    });

    res.status(200).json({ success: true, message: `Successfully imported ${imported} products.` });
  } catch (error) {
    console.error('Import error:', error);
    res.status(400).json({ success: false, message: error.message || 'Import failed' });
  }
};
module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  toggleProductStatus,
  createVariant,
  getVariantsByProduct,
  exportCatalog,
  importCatalog
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if it has any orders
    const variants = await prisma.productVariant.findMany({ where: { productId: id } });
    const variantIds = variants.map(v => v.id);
    const orderItems = await prisma.orderItem.findFirst({ where: { variantId: { in: variantIds } } });
    
    if (orderItems) {
      return res.status(400).json({ success: false, message: 'Cannot delete a product that has been sold in orders. Please deactivate it instead.' });
    }
    
    await prisma.$transaction(async (tx) => {
      // Delete inventory transactions
      await tx.inventoryTransaction.deleteMany({ where: { variantId: { in: variantIds } } });
      // Delete variants
      await tx.productVariant.deleteMany({ where: { productId: id } });
      // Delete product
      await tx.product.delete({ where: { id } });
    });
    
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
};
module.exports.deleteProduct = deleteProduct;

const updateVariant = async (req, res) => {
  try {
    const { variantId } = req.params;
    const { color, size, costPrice, mrp, sellingPrice, discountType, discountValue, lowStockThreshold, sku } = req.body;
    
    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        sku: sku || undefined,
        color,
        size,
        costPrice,
        mrp,
        sellingPrice,
        discountType,
        discountValue,
        lowStockThreshold
      }
    });
    res.json({ success: true, data: variant });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update variant' });
  }
};
module.exports.updateVariant = updateVariant;
