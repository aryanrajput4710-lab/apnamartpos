
const prisma = require('../utils/prisma');

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
        stock: 1
      },
      include: { product: true }
    });
    
    res.status(200).json({ success: true, data: variants });
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
    let assetValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const v of variants) {
      totalUnits += v.stock;
      potentialValue += v.stock * parseFloat(v.sellingPrice || 0);
      assetValue += v.stock * parseFloat(v.costPrice || 0);
      if (v.stock === 0) outOfStockCount++;
      else if (v.stock === 1) lowStockCount++;
    }

    res.status(200).json({
      success: true,
      data: {
        totalProducts: productsCount,
        totalVariants: variants.length,
        totalUnits,
        potentialValue,
        assetValue,
        lowStockCount,
        outOfStockCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch summary' });
  }
};


const batchStockIn = async (req, res) => {
  try {
    const { items, reference } = req.body;
    
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId }});
        const oldQty = variant.stock;
        const oldCost = parseFloat(variant.costPrice || 0);
        const newQty = parseInt(item.quantity);
        const landedCost = parseFloat(item.unitLandedCost);
        
        let newWAC = oldCost;
        if (oldQty + newQty > 0) {
          if (oldQty <= 0) {
            newWAC = landedCost;
          } else {
            newWAC = ((oldQty * oldCost) + (newQty * landedCost)) / (oldQty + newQty);
          }
        }
        
        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            stock: { increment: newQty },
            costPrice: newWAC
          }
        });
        
        await tx.inventoryTransaction.create({
          data: {
            variantId: variant.id,
            type: 'STOCK_IN',
            quantity: newQty,
            reference: reference || 'BATCH_RESTOCK',
            userId: req.user.id
          }
        });
      }
    });
    
    res.json({ success: true, message: 'Batch restock successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  batchStockIn,

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
