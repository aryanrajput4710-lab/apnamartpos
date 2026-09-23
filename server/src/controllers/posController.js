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

const checkout = async (req, res) => {
  try {
    let { items, customerId, customerPhone, customerName, paymentMethod, idempotencyKey, extraDiscount } = req.body;

    if (!customerId && customerPhone) {
      const existingCustomer = await prisma.customer.findUnique({ where: { phone: customerPhone } });
      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const newCustomer = await prisma.customer.create({
          data: { phone: customerPhone, name: customerName || 'Unknown Customer' }
        });
        customerId = newCustomer.id;
      }
    }
    
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }
    if (!paymentMethod || (paymentMethod !== 'CASH' && paymentMethod !== 'QR')) {
      return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }

    if (idempotencyKey) {
      const existingOrder = await prisma.order.findUnique({
        where: { idempotencyKey },
        include: { items: true, payments: true, customer: true, user: { select: { name: true } } }
      });
      if (existingOrder) {
        return res.status(200).json({ success: true, data: existingOrder, message: 'Order already processed' });
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      let totalDiscount = parseFloat(extraDiscount) || 0;
      const orderItemsData = [];

      for (const item of items) {
        // Lock the variant row to prevent race conditions on stock
        const variants = await tx.$queryRaw`SELECT * FROM "ProductVariant" WHERE id = ${item.variantId} FOR UPDATE`;
        if (variants.length === 0) throw new Error(`Variant ${item.variantId} not found`);
        const variant = variants[0];

        if (!variant.isActive) throw new Error(`Variant ${variant.sku} is inactive`);
        if (variant.stock < item.quantity) throw new Error(`Insufficient stock for ${variant.sku}. Available: ${variant.stock}`);

        const price = parseFloat(variant.sellingPrice);
        const qty = item.quantity;
        const lineTotal = price * qty;
        
        let itemDiscount = 0;
        if (variant.discountType === 'FIXED') {
          itemDiscount = parseFloat(variant.discountValue) * qty;
        } else if (variant.discountType === 'PERCENTAGE') {
          itemDiscount = lineTotal * (parseFloat(variant.discountValue) / 100);
        }

        subtotal += lineTotal;
        totalDiscount += itemDiscount;

        // Also fetch product for snapshots
        const productData = await tx.product.findUnique({ where: { id: variant.productId } });

        orderItemsData.push({
          variantId: variant.id,
          quantity: qty,
          unitPrice: price,
          discount: itemDiscount,
          total: lineTotal - itemDiscount,
          previousStock: variant.stock,
          newStock: variant.stock - qty,
          
          productNameSnapshot: productData.name,
          skuSnapshot: variant.sku,
          barcodeSnapshot: variant.barcode,
          sizeSnapshot: variant.size,
          colorSnapshot: variant.color
        });
      }

      const total = Math.max(0, subtotal - totalDiscount);

      // Generate order number
      // In a very high concurrency environment, you'd want a DB sequence.
      // For this offline POS, a simple count + 1 padded is safe enough.
      const orderCount = await tx.order.count();
      const orderNumber = `STORE-${String(orderCount + 1).padStart(6, '0')}`;

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          idempotencyKey: idempotencyKey || null,
          customerId: customerId || null,
          subtotal,
          discount: totalDiscount,
          total,
          status: 'COMPLETED',
          createdBy: req.user.id,
          items: {
            create: orderItemsData.map(i => ({
              variantId: i.variantId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              discount: i.discount,
              total: i.total,
              productNameSnapshot: i.productNameSnapshot,
              skuSnapshot: i.skuSnapshot,
              barcodeSnapshot: i.barcodeSnapshot,
              sizeSnapshot: i.sizeSnapshot,
              colorSnapshot: i.colorSnapshot
            }))
          },
          payments: {
            create: {
              amount: total,
              method: paymentMethod,
              status: 'COMPLETED'
            }
          }
        },
        include: { items: true, payments: true, customer: true, user: { select: { name: true } } }
      });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'ORDER_CREATED',
          entityType: 'ORDER',
          entityId: newOrder.id,
          description: `Order ${orderNumber} created for total ${total}`,
          metadata: { total, paymentMethod, itemsCount: items.length }
        }
      });

      // Update Stock & Create Inventory Transactions
      for (const i of orderItemsData) {
        await tx.$queryRaw`UPDATE "ProductVariant" SET stock = ${i.newStock}, "updatedAt" = NOW() WHERE id = ${i.variantId}`;
        
        await tx.inventoryTransaction.create({
          data: {
            variantId: i.variantId,
            type: 'SALE',
            quantity: i.quantity,
            previousStock: i.previousStock,
            newStock: i.newStock,
            referenceType: 'ORDER',
            referenceId: newOrder.id,
            createdBy: req.user.id
          }
        });
      }

      // Update Customer Stats
      if (customerId) {
        await tx.$queryRaw`UPDATE "Customer" SET "totalOrders" = "totalOrders" + 1, "totalSpent" = "totalSpent" + ${total}, "updatedAt" = NOW() WHERE id = ${customerId}`;
      }

      return newOrder;
    });

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const getReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        payments: true,
        customer: true,
        user: { select: { name: true } }
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Receipt error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  scanProduct,
  searchProducts,
  checkout,
  getReceipt
};


