const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getInventory = async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const where = { isActive: true };
    if (search) {
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [variants, total] = await Promise.all([
      prisma.productVariant.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: { product: true },
        orderBy: [{ product: { name: 'asc' } }, { size: 'asc' }]
      }),
      prisma.productVariant.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: variants,
      pagination: { total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch inventory' });
  }
};

const getLowStock = async (req, res) => {
  try {
    const variants = await prisma.productVariant.findMany({
      where: {
        isActive: true,
        stock: { gt: 0 },
        // Use raw query logic if needed, but Prisma can compare fields if we use raw, 
        // or we fetch and filter in JS if not too big, or just use raw query.
        // Actually, stock <= lowStockThreshold can be queried by comparing fields in newer Prisma (using sql or extensions)
        // For simplicity, we can fetch where stock > 0, then filter in memory if the dataset is small,
        // but better to use raw SQL for performance on large tables.
      },
      include: { product: true }
    });
    
    const lowStock = variants.filter(v => v.stock <= v.lowStockThreshold);
    res.status(200).json({ success: true, data: lowStock });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch low stock' });
  }
};

const getOutOfStock = async (req, res) => {
  try {
    const variants = await prisma.productVariant.findMany({
      where: { isActive: true, stock: 0 },
      include: { product: true }
    });
    res.status(200).json({ success: true, data: variants });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch out of stock' });
  }
};

const getVariantHistory = async (req, res) => {
  try {
    const { variantId } = req.params;
    const history = await prisma.inventoryTransaction.findMany({
      where: { variantId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch history' });
  }
};

const getGlobalHistory = async (req, res) => {
  try {
    const { page = 1, limit = 50, type } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (type) where.type = type;

    const [history, total] = await Promise.all([
      prisma.inventoryTransaction.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: { 
          user: { select: { name: true } },
          variant: { include: { product: { select: { name: true } } } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.inventoryTransaction.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: history,
      pagination: { total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch global history' });
  }
};

// Generic stock update logic wrapped in a transaction
const performStockOperation = async (variantId, quantity, reason, userId, type, isAdjustment = false) => {
  if (quantity <= 0 && !isAdjustment) throw new Error('Quantity must be greater than zero');
  if (isAdjustment && quantity === 0) throw new Error('Adjustment quantity cannot be zero');

  return prisma.$transaction(async (tx) => {
    // Read the current stock and lock the row
    const variants = await tx.$queryRaw`
      SELECT id, stock FROM "ProductVariant" WHERE id = ${variantId} FOR UPDATE
    `;
    if (!variants.length) throw new Error('Variant not found');
    const variant = variants[0];
    const previousStock = variant.stock;
    
    let newStock = previousStock;
    if (type === 'STOCK_IN') newStock += quantity;
    else if (type === 'STOCK_OUT') newStock -= quantity;
    else if (type === 'ADJUSTMENT') newStock += quantity; // adjustment quantity can be positive or negative

    if (newStock < 0) throw new Error('Insufficient stock');

    // Update variant stock
    await tx.$queryRaw`
      UPDATE "ProductVariant" SET stock = ${newStock}, "updatedAt" = NOW() WHERE id = ${variantId}
    `;

    // Create transaction record
    const txn = await tx.inventoryTransaction.create({
      data: {
        variantId,
        type,
        quantity: Math.abs(quantity),
        previousStock,
        newStock,
        reason,
        referenceType: 'MANUAL',
        createdBy: userId
      }
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: `STOCK_${type.split('_').pop()}`, // e.g., STOCK_IN
        entityType: 'INVENTORY',
        entityId: variantId,
        description: `Manual ${type} of ${quantity}`,
        metadata: { previousStock, newStock, reason }
      }
    });

    return txn;
  });
};

const stockIn = async (req, res) => {
  try {
    const { variantId, quantity, reason } = req.body;
    if (!variantId || !quantity || !reason) return res.status(400).json({ success: false, message: 'Missing required fields' });

    const txn = await performStockOperation(variantId, quantity, reason, req.user.id, 'STOCK_IN');
    res.status(200).json({ success: true, data: txn });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const stockOut = async (req, res) => {
  try {
    const { variantId, quantity, reason } = req.body;
    if (!variantId || !quantity || !reason) return res.status(400).json({ success: false, message: 'Missing required fields' });

    const txn = await performStockOperation(variantId, quantity, reason, req.user.id, 'STOCK_OUT');
    res.status(200).json({ success: true, data: txn });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const adjustStock = async (req, res) => {
  try {
    const { variantId, physicalStock, reason } = req.body;
    if (!variantId || physicalStock === undefined || !reason) return res.status(400).json({ success: false, message: 'Missing required fields' });

    if (physicalStock < 0) return res.status(400).json({ success: false, message: 'Physical stock cannot be negative' });

    // Lock and check current stock to calculate difference
    const txn = await prisma.$transaction(async (tx) => {
      const variants = await tx.$queryRaw`
        SELECT id, stock FROM "ProductVariant" WHERE id = ${variantId} FOR UPDATE
      `;
      if (!variants.length) throw new Error('Variant not found');
      
      const previousStock = variants[0].stock;
      const difference = physicalStock - previousStock;
      
      if (difference === 0) throw new Error('Physical stock matches current system stock');

      await tx.$queryRaw`
        UPDATE "ProductVariant" SET stock = ${physicalStock}, "updatedAt" = NOW() WHERE id = ${variantId}
      `;

      const txn = await tx.inventoryTransaction.create({
        data: {
          variantId,
          type: 'ADJUSTMENT',
          quantity: Math.abs(difference),
          previousStock,
          newStock: physicalStock,
          reason,
          referenceType: 'MANUAL',
          createdBy: req.user.id
        }
      });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'STOCK_ADJUSTED',
          entityType: 'INVENTORY',
          entityId: variantId,
          description: `Manual stock adjustment to ${physicalStock}`,
          metadata: { previousStock, newStock: physicalStock, reason }
        }
      });

      return txn;
    });

    res.status(200).json({ success: true, data: txn });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getDashboardSummary = async (req, res) => {
  try {
    const variants = await prisma.productVariant.findMany({ where: { isActive: true } });
    const productsCount = await prisma.product.count({ where: { isActive: true } });

    let totalUnits = 0;
    let potentialValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const v of variants) {
      totalUnits += v.stock;
      potentialValue += v.stock * parseFloat(v.sellingPrice);
      if (v.stock === 0) outOfStockCount++;
      else if (v.stock <= v.lowStockThreshold) lowStockCount++;
    }

    res.status(200).json({
      success: true,
      data: {
        totalProducts: productsCount,
        totalVariants: variants.length,
        totalUnits,
        potentialValue,
        lowStockCount,
        outOfStockCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch summary' });
  }
};

module.exports = {
  getInventory,
  getLowStock,
  getOutOfStock,
  getVariantHistory,
  getGlobalHistory,
  stockIn,
  stockOut,
  adjustStock,
  getDashboardSummary
};
