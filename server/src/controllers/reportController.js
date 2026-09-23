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

    // 1. Summary Cards (Revenue, Orders, Tax, Discount)
    const orderAgg = await prisma.order.aggregate({
      where: successfulOrderWhere,
      _sum: {
        total: true,
        subtotal: true,
        discount: true
      },
      _count: {
        id: true
      }
    });

    const revenue = orderAgg._sum.total || 0;
    const ordersCount = orderAgg._count.id || 0;
    const discounts = orderAgg._sum.discount || 0;
    // Assuming no tax column on Order in Phase 5 schema; we'll treat it as 0.
    const tax = 0;
    const aov = ordersCount > 0 ? (revenue / ordersCount) : 0;

    // 2. Items Sold
    const itemsAgg = await prisma.orderItem.aggregate({
      where: {
        order: successfulOrderWhere
      },
      _sum: {
        quantity: true
      }
    });
    const itemsSold = itemsAgg._sum.quantity || 0;

    // 3. Payment Methods Breakdown
    // We aggregate payments directly
    const payments = await prisma.payment.groupBy({
      by: ['method'],
      where: {
        createdAt: { gte: start, lte: end },
        status: 'COMPLETED',
        order: { status: 'COMPLETED' }
      },
      _sum: { amount: true },
      _count: { id: true }
    });

    const paymentSummary = {
      CASH: { amount: 0, orders: 0 },
      QR: { amount: 0, orders: 0 }
    };

    payments.forEach(p => {
      if (p.method === 'CASH') {
        paymentSummary.CASH.amount = p._sum.amount || 0;
        paymentSummary.CASH.orders = p._count.id;
      } else if (p.method === 'QR') {
        paymentSummary.QR.amount = p._sum.amount || 0;
        paymentSummary.QR.orders = p._count.id;
      }
    });

    // 4. Low Stock
    const lowStockVariants = await prisma.productVariant.findMany({
      where: {
        stock: { lte: prisma.productVariant.fields.lowStockThreshold }
      },
      include: { product: true },
      take: 10
    });

    // 5. Top Selling Products
    // Because prisma groupBy doesn't easily let us fetch relations (like snapshot names),
    // we'll fetch the aggregated items and map them.
    const topItemsAgg = await prisma.orderItem.groupBy({
      by: ['variantId', 'productNameSnapshot', 'skuSnapshot', 'sizeSnapshot', 'colorSnapshot'],
      where: {
        order: successfulOrderWhere
      },
      _sum: {
        quantity: true,
        total: true
      },
      orderBy: {
        _sum: { quantity: 'desc' }
      },
      take: 5
    });

    // 6. Customers Stats
    const totalCustomers = await prisma.customer.count();
    const newCustomers = await prisma.customer.count({
      where: { createdAt: { gte: start, lte: end } }
    });
    
    // Returning customers (customers with >1 order all time, who ordered in this period)
    const returningCustomersAgg = await prisma.order.groupBy({
      by: ['customerId'],
      where: {
        customerId: { not: null },
        createdAt: { gte: start, lte: end },
        status: 'COMPLETED'
      }
    });
    
    // Check which of these have > 1 completed order globally
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

    // 7. Revenue Chart (Daily aggregation for the period)
    // We'll use raw SQL for time grouping, safely parameterized.
    const chartData = await prisma.$queryRaw`
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
    `;

    // Map chart dates to strings
    const formattedChart = chartData.map(d => ({
      date: d.date.toISOString().split('T')[0],
      revenue: parseFloat(d.revenue || 0),
      orders: Number(d.orders || 0)
    }));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          revenue,
          orders: ordersCount,
          itemsSold,
          aov,
          tax,
          discounts
        },
        paymentSummary,
        lowStock: lowStockVariants,
        topProducts: topItemsAgg,
        customerStats: {
          total: totalCustomers,
          new: newCustomers,
          returning: returningCount
        },
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
