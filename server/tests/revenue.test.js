const { test } = require('node:test');
const assert = require('node:assert');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

test('Revenue Calculations', async (t) => {
  // Setup test customer and variants
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: { name: 'Test User', email: 'test@example.com', passwordHash: 'hash', role: 'ADMIN' }
    });
  }

  let variant = await prisma.productVariant.findFirst();
  if (!variant) {
    const product = await prisma.product.create({ data: { name: 'Test Prod' } });
    variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: 'TEST-SKU-1',
        barcode: 'TEST-BARCODE-1',
        mrp: 600,
        sellingPrice: 500,
        stock: 10
      }
    });
  }
  
  await t.test('1. Today revenue and zero-order period', async () => {
    // Check initial state
    const agg = await prisma.order.aggregate({
      where: { status: 'COMPLETED', payments: { some: { status: 'COMPLETED' } } },
      _sum: { total: true },
      _count: { id: true }
    });
    
    const initialRevenue = agg._sum.total ? parseFloat(agg._sum.total) : 0;
    const initialOrders = agg._count.id;
    
    // Create an order
    const order1 = await prisma.order.create({
      data: {
        orderNumber: 'TEST-0001',
        subtotal: 1000,
        total: 1000,
        status: 'COMPLETED',
        createdBy: user.id,
        payments: {
          create: {
            method: 'CASH',
            amount: 1000,
            status: 'COMPLETED'
          }
        },
        items: {
          create: {
            variantId: (await prisma.productVariant.findFirst()).id,
            quantity: 2,
            unitPrice: 500,
            total: 1000,
            productNameSnapshot: 'Test',
            skuSnapshot: 'TEST-1',
            barcodeSnapshot: 'BARCODE'
          }
        }
      }
    });

    const order2 = await prisma.order.create({
      data: {
        orderNumber: 'TEST-0002',
        subtotal: 2000,
        total: 2000,
        status: 'COMPLETED',
        createdBy: user.id,
        payments: {
          create: {
            method: 'QR',
            amount: 2000,
            status: 'COMPLETED'
          }
        }
      }
    });

    // FAILED ORDER
    const order3 = await prisma.order.create({
      data: {
        orderNumber: 'TEST-0003',
        subtotal: 5000,
        total: 5000,
        status: 'FAILED',
        createdBy: user.id,
        payments: {
          create: {
            method: 'CASH',
            amount: 5000,
            status: 'FAILED'
          }
        }
      }
    });

    // CANCELLED ORDER
    const order4 = await prisma.order.create({
      data: {
        orderNumber: 'TEST-0004',
        subtotal: 3000,
        total: 3000,
        status: 'CANCELLED',
        createdBy: user.id,
        payments: {
          create: {
            method: 'QR',
            amount: 3000,
            status: 'COMPLETED' // Payment completed but order cancelled
          }
        }
      }
    });

    const newAgg = await prisma.order.aggregate({
      where: { status: 'COMPLETED', payments: { some: { status: 'COMPLETED' } } },
      _sum: { total: true },
      _count: { id: true }
    });

    const newRevenue = parseFloat(newAgg._sum.total);
    const newOrders = newAgg._count.id;
    
    // Revenue should increase by 3000 (1000 + 2000)
    assert.strictEqual(newRevenue - initialRevenue, 3000);
    // Orders should increase by 2
    assert.strictEqual(newOrders - initialOrders, 2);

    // Cleanup test data
    await prisma.payment.deleteMany({ where: { orderId: { in: [order1.id, order2.id, order3.id, order4.id] } } });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: [order1.id, order2.id, order3.id, order4.id] } } });
    await prisma.order.deleteMany({ where: { id: { in: [order1.id, order2.id, order3.id, order4.id] } } });
  });
});
