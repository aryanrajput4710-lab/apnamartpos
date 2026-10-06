const fs = require('fs');
let c = fs.readFileSync('server/src/controllers/reportController.js', 'utf8');

const promiseAllStart = `    const [
      orderAgg,
      itemsAgg,
      payments,
      lowStockVariants,
      topItemsAgg,
      totalCustomers,
      newCustomers,
      returningCustomersAgg,
      chartData,
      profitAgg,
      returnAgg,
      recentReturns,
      topCategoriesAgg,
      prevOrderAgg,
      prevItemsAgg,
      prevProfitAgg`;

const promiseAllStartNew = `    const [
      orderAgg,
      itemsAgg,
      payments,
      lowStockVariants,
      topItemsAgg,
      totalCustomers,
      newCustomers,
      returningCustomersAgg,
      chartData,
      profitAgg,
      returnAgg,
      recentReturns,
      topCategoriesAgg,
      prevOrderAgg,
      prevItemsAgg,
      prevProfitAgg,
      expensesAgg`;

c = c.replace(promiseAllStart, promiseAllStartNew);

const promiseAllEnd = `      prisma.$queryRaw\`
        SELECT SUM("total" - ("unitCostPrice" * "quantity")) as profit
        FROM "OrderItem"
        WHERE "orderId" IN (
          SELECT id FROM "Order" 
          WHERE "status" = 'COMPLETED' AND "createdAt" >= \${pStart} AND "createdAt" <= \${pEnd}
        )
      \`
    ]);`;

const promiseAllEndNew = `      prisma.$queryRaw\`
        SELECT SUM("total" - ("unitCostPrice" * "quantity")) as profit
        FROM "OrderItem"
        WHERE "orderId" IN (
          SELECT id FROM "Order" 
          WHERE "status" = 'COMPLETED' AND "createdAt" >= \${pStart} AND "createdAt" <= \${pEnd}
        )
      \`,
      // 17. Expenses
      prisma.expense.aggregate({
        where: { date: { gte: start, lte: end } },
        _sum: { amount: true }
      })
    ]);`;

c = c.replace(promiseAllEnd, promiseAllEndNew);

const jsonResponseStart = `    // Process data
    const grossProfit = profitAgg && profitAgg.length > 0 ? parseFloat(profitAgg[0].profit || 0) : 0;
    const prevGrossProfit = prevProfitAgg && prevProfitAgg.length > 0 ? parseFloat(prevProfitAgg[0].profit || 0) : 0;`;

const jsonResponseStartNew = `    // Process data
    const expenses = expensesAgg && expensesAgg._sum && expensesAgg._sum.amount ? parseFloat(expensesAgg._sum.amount) : 0;
    const grossProfit = (profitAgg && profitAgg.length > 0 ? parseFloat(profitAgg[0].profit || 0) : 0) - expenses;
    const prevGrossProfit = prevProfitAgg && prevProfitAgg.length > 0 ? parseFloat(prevProfitAgg[0].profit || 0) : 0;`;

c = c.replace(jsonResponseStart, jsonResponseStartNew);

const summaryRes = `      summary: {
        revenue: parseFloat(orderAgg._sum.total || 0),
        orders: orderAgg._count.id || 0,
        itemsSold: itemsAgg._sum.quantity || 0,
        grossProfit,`;

const summaryResNew = `      summary: {
        revenue: parseFloat(orderAgg._sum.total || 0),
        orders: orderAgg._count.id || 0,
        itemsSold: itemsAgg._sum.quantity || 0,
        grossProfit,
        expenses,`;

c = c.replace(summaryRes, summaryResNew);

fs.writeFileSync('server/src/controllers/reportController.js', c);
