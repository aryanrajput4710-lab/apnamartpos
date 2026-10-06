const fs = require('fs');
let c = fs.readFileSync('server/src/controllers/reportController.js', 'utf8');

c = c.replace(
  "      prevProfitAgg\n    ] = await Promise.all([",
  "      prevProfitAgg,\n      expensesAgg\n    ] = await Promise.all(["
);

c = c.replace(
  "      `\n    ]);",
  "      `,\n      prisma.expense.aggregate({\n        where: { date: { gte: start, lte: end } },\n        _sum: { amount: true }\n      })\n    ]);"
);

c = c.replace(
  "    const profit = profitAgg && profitAgg[0] ? parseFloat(profitAgg[0].profit || 0) : 0;",
  "    const totalExpenses = expensesAgg && expensesAgg._sum && expensesAgg._sum.amount ? parseFloat(expensesAgg._sum.amount) : 0;\n    const profit = (profitAgg && profitAgg[0] ? parseFloat(profitAgg[0].profit || 0) : 0) - totalExpenses;"
);

c = c.replace(
  "summary: { revenue, profit, orders: ordersCount, itemsSold, aov, tax, discounts, prevRevenue, prevProfit, prevOrders: prevOrdersCount, prevItemsSold, prevAov }",
  "summary: { revenue, profit, orders: ordersCount, itemsSold, aov, tax, discounts, prevRevenue, prevProfit, prevOrders: prevOrdersCount, prevItemsSold, prevAov, totalExpenses }"
);

fs.writeFileSync('server/src/controllers/reportController.js', c);
