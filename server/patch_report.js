const fs = require('fs');

let code = fs.readFileSync('src/controllers/reportController.js', 'utf8');

const getPrevBounds_code = `
const getPrevBounds = (start, end, range) => {
  const diff = end.getTime() - start.getTime();
  if (range === 'Today' || range === 'Yesterday') {
    return { pStart: new Date(start.getTime() - 86400000), pEnd: new Date(end.getTime() - 86400000) };
  } else if (range === 'Last 7 Days') {
    return { pStart: new Date(start.getTime() - 7 * 86400000), pEnd: new Date(end.getTime() - 7 * 86400000) };
  } else if (range === 'Last 30 Days') {
    return { pStart: new Date(start.getTime() - 30 * 86400000), pEnd: new Date(end.getTime() - 30 * 86400000) };
  } else if (range === 'This Month') {
    const pStart = new Date(start);
    pStart.setMonth(pStart.getMonth() - 1);
    const pEnd = new Date(start);
    pEnd.setMilliseconds(-1);
    return { pStart, pEnd };
  } else {
    return { pStart: new Date(start.getTime() - diff - 1), pEnd: new Date(end.getTime() - diff - 1) };
  }
};
`;

code = code.replace("const getDashboardSummary = async (req, res) => {", getPrevBounds_code + "\nconst getDashboardSummary = async (req, res) => {");

const query_insert = `
    const { pStart, pEnd } = getPrevBounds(start, end, range);
    const prevOrderWhere = {
      createdAt: { gte: pStart, lte: pEnd },
      status: 'COMPLETED',
      payments: { some: { status: 'COMPLETED' } }
    };

    // Execute all independent queries concurrently
`;
code = code.replace("// Execute all independent queries concurrently", query_insert);

const promise_all_find = `      // 10. Top Selling Categories
      prisma.$queryRaw\`
        SELECT 
          p.category, 
          SUM(oi.quantity) as quantity, 
          SUM(oi.total) as total
        FROM "OrderItem" oi
        JOIN "ProductVariant" v ON oi."variantId" = v.id
        JOIN "Product" p ON v."productId" = p.id
        JOIN "Order" o ON oi."orderId" = o.id
        WHERE o.status = 'COMPLETED'
          AND o."createdAt" >= \${start}
          AND o."createdAt" <= \${end}
        GROUP BY p.category
        ORDER BY quantity DESC
      \`
    ]);`;

const promise_all_replace = `      // 10. Top Selling Categories
      prisma.$queryRaw\`
        SELECT 
          p.category, 
          SUM(oi.quantity) as quantity, 
          SUM(oi.total) as total
        FROM "OrderItem" oi
        JOIN "ProductVariant" v ON oi."variantId" = v.id
        JOIN "Product" p ON v."productId" = p.id
        JOIN "Order" o ON oi."orderId" = o.id
        WHERE o.status = 'COMPLETED'
          AND o."createdAt" >= \${start}
          AND o."createdAt" <= \${end}
        GROUP BY p.category
        ORDER BY quantity DESC
      \`,
      // PREV SUMMARY
      prisma.order.aggregate({
        where: prevOrderWhere,
        _sum: { total: true },
        _count: { id: true }
      }),
      prisma.orderItem.aggregate({
        where: { order: prevOrderWhere },
        _sum: { quantity: true }
      }),
      prisma.$queryRaw\`
        SELECT SUM("total" - ("unitCostPrice" * "quantity")) as profit
        FROM "OrderItem"
        WHERE "orderId" IN (
          SELECT id FROM "Order" 
          WHERE "status" = 'COMPLETED' AND "createdAt" >= \${pStart} AND "createdAt" <= \${pEnd}
        )
      \`
    ]);`;

code = code.replace(promise_all_find, promise_all_replace);

const result_mapping_find = `      topCategoriesAgg
    ] = await Promise.all([`;

const result_mapping_replace = `      topCategoriesAgg,
      prevOrderAgg,
      prevItemsAgg,
      prevProfitAgg
    ] = await Promise.all([`;

code = code.replace(result_mapping_find, result_mapping_replace);

const summary_formatting_find = `    const revenue = parseFloat(orderAgg._sum.total || 0);
    const ordersCount = orderAgg._count.id || 0;
    const discounts = parseFloat(orderAgg._sum.discount || 0);
    const tax = 0;
    const aov = ordersCount > 0 ? (revenue / ordersCount) : 0;
    const itemsSold = itemsAgg._sum.quantity || 0;
    const profit = profitAgg && profitAgg[0] ? parseFloat(profitAgg[0].profit || 0) : 0;`;

const summary_formatting_replace = `    const revenue = parseFloat(orderAgg._sum.total || 0);
    const ordersCount = orderAgg._count.id || 0;
    const discounts = parseFloat(orderAgg._sum.discount || 0);
    const tax = 0;
    const aov = ordersCount > 0 ? (revenue / ordersCount) : 0;
    const itemsSold = itemsAgg._sum.quantity || 0;
    const profit = profitAgg && profitAgg[0] ? parseFloat(profitAgg[0].profit || 0) : 0;

    const prevRevenue = parseFloat(prevOrderAgg._sum.total || 0);
    const prevOrdersCount = prevOrderAgg._count.id || 0;
    const prevAov = prevOrdersCount > 0 ? (prevRevenue / prevOrdersCount) : 0;
    const prevItemsSold = prevItemsAgg._sum.quantity || 0;
    const prevProfit = prevProfitAgg && prevProfitAgg[0] ? parseFloat(prevProfitAgg[0].profit || 0) : 0;`;

code = code.replace(summary_formatting_find, summary_formatting_replace);

const final_payload_find = `summary: { revenue, profit, orders: ordersCount, itemsSold, aov, tax, discounts }`;
const final_payload_replace = `summary: { revenue, profit, orders: ordersCount, itemsSold, aov, tax, discounts, prevRevenue, prevProfit, prevOrders: prevOrdersCount, prevItemsSold, prevAov }`;
code = code.replace(final_payload_find, final_payload_replace);

fs.writeFileSync('src/controllers/reportController.js', code);
