const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to get date bounds in IST (Asia/Kolkata)
const getDateBounds = (range, customFrom, customTo) => {
  // We use standard Date, but force the calculation to use IST time.
  // The easiest way to get boundaries in IST is to use Intl.DateTimeFormat
  // or explicitly adjust the UTC date.
  
  const getISTDate = () => {
    const d = new Date();
    // Offset by +5:30 to get local time representation in a UTC object
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 5.5));
  };

  const getUTCFromIST = (istYear, istMonth, istDate, h, m, s, ms) => {
    // Construct the exact moment in IST, then subtract 5.5 hours to get real UTC
    const istMs = Date.UTC(istYear, istMonth, istDate, h, m, s, ms);
    return new Date(istMs - (3600000 * 5.5));
  };

  const nowIST = getISTDate();
  const year = nowIST.getUTCFullYear();
  const month = nowIST.getUTCMonth();
  const date = nowIST.getUTCDate();

  let start;
  let end = getUTCFromIST(year, month, date, 23, 59, 59, 999);
  
  if (range === 'Today') {
    start = getUTCFromIST(year, month, date, 0, 0, 0, 0);
  } else if (range === 'Yesterday') {
    start = getUTCFromIST(year, month, date - 1, 0, 0, 0, 0);
    end = getUTCFromIST(year, month, date - 1, 23, 59, 59, 999);
  } else if (range === 'Last 7 Days') {
    start = getUTCFromIST(year, month, date - 6, 0, 0, 0, 0);
  } else if (range === 'Last 30 Days') {
    start = getUTCFromIST(year, month, date - 29, 0, 0, 0, 0);
  } else if (range === 'This Month') {
    start = getUTCFromIST(year, month, 1, 0, 0, 0, 0);
  } else if (range === 'Custom Range' && customFrom && customTo) {
    const fromParts = customFrom.split('-');
    const toParts = customTo.split('-');
    start = getUTCFromIST(parseInt(fromParts[0]), parseInt(fromParts[1]) - 1, parseInt(fromParts[2]), 0, 0, 0, 0);
    end = getUTCFromIST(parseInt(toParts[0]), parseInt(toParts[1]) - 1, parseInt(toParts[2]), 23, 59, 59, 999);
  } else {
    start = getUTCFromIST(year, month, date, 0, 0, 0, 0);
  }
  
  return { start, end };
};

const getDashboardSummary = async (req, res) => {
  try {
    const { range, customFrom, customTo } = req.query;
    const { start, end } = getDateBounds(range, customFrom, customTo);

    const successfulOrderWhere = {
      createdAt: { gte: start, lte: end },
      status: 'COMPLETED',
      payments: { some: { status: 'COMPLETED' } }
    };

    // Execute all independent queries concurrently
    const [
      orderAgg,
      itemsAgg,
      payments,
      lowStockVariants,
      topItemsAgg,
      totalCustomers,
      newCustomers,
      returningCustomersAgg,
      chartData,
      returnAgg,
      recentReturns
    ] = await Promise.all([
      // 1. Summary Cards (Revenue, Orders, Tax, Discount)
      prisma.order.aggregate({
        where: successfulOrderWhere,
        _sum: { total: true, subtotal: true, discount: true },
        _count: { id: true }
      }),
      // 2. Items Sold
      prisma.orderItem.aggregate({
        where: { order: successfulOrderWhere },
        _sum: { quantity: true }
      }),
      // 3. Payment Methods Breakdown
      prisma.payment.groupBy({
        by: ['method'],
        where: {
          createdAt: { gte: start, lte: end },
          status: 'COMPLETED',
          order: { status: 'COMPLETED' }
        },
        _sum: { amount: true },
        _count: { id: true }
      }),
      // 4. Low Stock
      prisma.productVariant.findMany({
        where: { stock: { lte: prisma.productVariant.fields.lowStockThreshold } },
        include: { product: true },
        take: 10
      }),
      // 5. Top Selling Products
      prisma.orderItem.groupBy({
        by: ['variantId', 'productNameSnapshot', 'skuSnapshot', 'sizeSnapshot', 'colorSnapshot'],
        where: { order: successfulOrderWhere },
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
      }),
      // 6a. Customers Stats (Total)
      prisma.customer.count(),
      // 6b. Customers Stats (New in period)
      prisma.customer.count({
        where: { createdAt: { gte: start, lte: end } }
      }),
      // 6c. Returning customers base query
      prisma.order.groupBy({
        by: ['customerId'],
        where: {
          customerId: { not: null },
          createdAt: { gte: start, lte: end },
          status: 'COMPLETED'
        }
      }),
      // 7. Revenue Chart
      prisma.$queryRaw`
        SELECT 
          DATE(o."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') as date,
          SUM(o."total") as revenue,
          COUNT(o."id") as orders
        FROM "Order" o
        WHERE o."status" = 'COMPLETED'
          AND o."createdAt" >= ${start}
          AND o."createdAt" <= ${end}
          AND EXISTS (
            SELECT 1 FROM "Payment" p WHERE p."orderId" = o."id" AND p."status" = 'COMPLETED'
          )
        GROUP BY DATE(o."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')
        ORDER BY date ASC
      `,
      // 8a. Returns Summary
      prisma.returnRecord.aggregate({
        where: { createdAt: { gte: start, lte: end } },
        _sum: { quantity: true, refundAmount: true }
      }),
      // 8b. Recent Returns
      prisma.returnRecord.findMany({
         where: { createdAt: { gte: start, lte: end } },
         include: {
           order: { select: { orderNumber: true } },
           orderItem: { select: { productNameSnapshot: true } }
         },
         orderBy: { createdAt: 'desc' },
         take: 10
      })
    ]);

    // Format results
    const revenue = parseFloat(orderAgg._sum.total || 0);
    const ordersCount = orderAgg._count.id || 0;
    const discounts = parseFloat(orderAgg._sum.discount || 0);
    const tax = 0;
    const aov = ordersCount > 0 ? (revenue / ordersCount) : 0;
    const itemsSold = itemsAgg._sum.quantity || 0;

    const paymentSummary = { CASH: { amount: 0, orders: 0 }, QR: { amount: 0, orders: 0 } };
    payments.forEach(p => {
      if (p.method === 'CASH') {
        paymentSummary.CASH.amount = parseFloat(p._sum.amount || 0);
        paymentSummary.CASH.orders = p._count.id;
      } else if (p.method === 'QR') {
        paymentSummary.QR.amount = parseFloat(p._sum.amount || 0);
        paymentSummary.QR.orders = p._count.id;
      }
    });

    const formattedTopProducts = topItemsAgg.map(tp => ({
      ...tp,
      _sum: {
        quantity: tp._sum.quantity,
        total: parseFloat(tp._sum.total || 0)
      }
    }));

    let returningCount = 0;
    if (returningCustomersAgg.length > 0) {
      const customerIds = returningCustomersAgg.map(c => c.customerId);
      const globalOrderCounts = await prisma.order.groupBy({
        by: ['customerId'],
        where: { customerId: { in: customerIds }, status: 'COMPLETED' },
        _count: { id: true }
      });
      returningCount = globalOrderCounts.filter(c => c._count.id > 1).length;
    }

    const formattedChart = chartData.map(d => ({
      date: d.date.toISOString().split('T')[0],
      revenue: parseFloat(d.revenue || 0),
      orders: Number(d.orders || 0)
    }));

    const returnsSummary = {
      quantity: returnAgg._sum.quantity || 0,
      refundAmount: parseFloat(returnAgg._sum.refundAmount || 0)
    };

    res.status(200).json({
      success: true,
      data: {
        summary: { revenue, orders: ordersCount, itemsSold, aov, tax, discounts },
        returns: { summary: returnsSummary, recent: recentReturns },
        paymentSummary,
        lowStock: lowStockVariants,
        topProducts: formattedTopProducts,
        customerStats: { total: totalCustomers, new: newCustomers, returning: returningCount },
        chart: formattedChart
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getDashboardSummary
};

