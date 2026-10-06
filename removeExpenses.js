const fs = require('fs');

// 1. Remove Expense model from schema
let schema = fs.readFileSync('server/prisma/schema.prisma', 'utf8');
schema = schema.replace(/model Expense \{[\s\S]*?\}/, '');
fs.writeFileSync('server/prisma/schema.prisma', schema);

// 2. Remove expense files
if(fs.existsSync('server/src/controllers/expenseController.js')) fs.unlinkSync('server/src/controllers/expenseController.js');
if(fs.existsSync('server/src/routes/expenseRoutes.js')) fs.unlinkSync('server/src/routes/expenseRoutes.js');
if(fs.existsSync('client/src/pages/Expenses.jsx')) fs.unlinkSync('client/src/pages/Expenses.jsx');

// 3. Update app.js
let app = fs.readFileSync('server/src/app.js', 'utf8');
app = app.replace(/const expenseRoutes = require\('\.\/routes\/expenseRoutes'\);\n?/, '');
app = app.replace(/app\.use\('\/api\/expenses', expenseRoutes\);\n?/, '');
fs.writeFileSync('server/src/app.js', app);

// 4. Update App.jsx
let appjsx = fs.readFileSync('client/src/App.jsx', 'utf8');
appjsx = appjsx.replace(/const Expenses = React\.lazy\(\(\) => import\('\.\/pages\/Expenses'\)\);\n?/, '');
appjsx = appjsx.replace(/<Route path="\/expenses" element=\{<Expenses \/>\} \/>\n?/, '');
fs.writeFileSync('client/src/App.jsx', appjsx);

// 5. Update AppLayout.jsx
let layout = fs.readFileSync('client/src/layouts/AppLayout.jsx', 'utf8');
layout = layout.replace(/\{\s*name:\s*'Expenses',\s*path:\s*'\/expenses',\s*icon:\s*FileText,\s*roles:\s*\['ADMIN'\]\s*\},\n?/, '');
fs.writeFileSync('client/src/layouts/AppLayout.jsx', layout);

// 6. Update reportController.js to revert gross profit calculation
let report = fs.readFileSync('server/src/controllers/reportController.js', 'utf8');

report = report.replace(
  /      prevProfitAgg,\n      expensesAgg\n    \] = await Promise\.all\(\[/,
  "      prevProfitAgg\n    ] = await Promise.all(["
);

report = report.replace(
  /      `,\n      prisma\.expense\.aggregate\(\{[\s\S]*?\}\)\n    \]\);/,
  "      `\n    ]);"
);

report = report.replace(
  /    const totalExpenses = expensesAgg[\s\S]*?;\n    const profit = \(profitAgg && profitAgg\[0\] \? parseFloat\(profitAgg\[0\]\.profit \|\| 0\) : 0\) - totalExpenses;/,
  "    const profit = profitAgg && profitAgg[0] ? parseFloat(profitAgg[0].profit || 0) : 0;"
);

report = report.replace(
  /summary: \{ revenue, profit, orders: ordersCount, itemsSold, aov, tax, discounts, prevRevenue, prevProfit, prevOrders: prevOrdersCount, prevItemsSold, prevAov, totalExpenses \}/,
  "summary: { revenue, profit, orders: ordersCount, itemsSold, aov, tax, discounts, prevRevenue, prevProfit, prevOrders: prevOrdersCount, prevItemsSold, prevAov }"
);

fs.writeFileSync('server/src/controllers/reportController.js', report);
