const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const runIntegrityChecks = async (req, res) => {
  try {
    const issues = [];

    // 1. Negative stock
    const negativeStock = await prisma.productVariant.findMany({
      where: { stock: { lt: 0 } }
    });
    if (negativeStock.length > 0) {
      issues.push(\Found \ variants with negative stock.\);
    }

    // 2. Orders without items
    const emptyOrders = await prisma.order.findMany({
      where: { items: { none: {} } }
    });
    if (emptyOrders.length > 0) {
      issues.push(\Found \ orders without any items.\);
    }

    // 3. Paid orders without payment
    const unrecordedPayments = await prisma.order.findMany({
      where: { status: 'COMPLETED', payments: { none: {} } }
    });
    if (unrecordedPayments.length > 0) {
      issues.push(\Found \ completed orders with no payment record.\);
    }

    // 4. Duplicate SKUs
    const duplicateSkus = await prisma.\\
      SELECT sku, COUNT(*) as count 
      FROM "ProductVariant" 
      WHERE sku IS NOT NULL 
      GROUP BY sku 
      HAVING COUNT(*) > 1
    \;
    if (duplicateSkus.length > 0) {
      issues.push(\Found \ duplicate SKUs.\);
    }

    // 5. Duplicate Barcodes
    const duplicateBarcodes = await prisma.\\
      SELECT barcode, COUNT(*) as count 
      FROM "ProductVariant" 
      WHERE barcode IS NOT NULL 
      GROUP BY barcode 
      HAVING COUNT(*) > 1
    \;
    if (duplicateBarcodes.length > 0) {
      issues.push(\Found \ duplicate Barcodes (2D Codes).\);
    }

    res.status(200).json({ 
      success: true, 
      data: issues, 
      message: issues.length === 0 ? 'No integrity issues found.' : \\ integrity issues found.\ 
    });
  } catch (error) {
    console.error('Integrity check error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  runIntegrityChecks
};
