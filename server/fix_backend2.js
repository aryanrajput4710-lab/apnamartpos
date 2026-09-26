const fs = require('fs');
let code = fs.readFileSync('src/controllers/reportController.js', 'utf8');

const target = `    const paymentSummary = { CASH: { amount: 0, orders: 0 }, QR: { amount: 0, orders: 0 } };`;

const injection = `    const prevRevenue = parseFloat((prevOrderAgg && prevOrderAgg._sum && prevOrderAgg._sum.total) || 0);
    const prevOrdersCount = (prevOrderAgg && prevOrderAgg._count && prevOrderAgg._count.id) || 0;
    const prevAov = prevOrdersCount > 0 ? (prevRevenue / prevOrdersCount) : 0;
    const prevItemsSold = (prevItemsAgg && prevItemsAgg._sum && prevItemsAgg._sum.quantity) || 0;
    const prevProfit = (prevProfitAgg && prevProfitAgg[0]) ? parseFloat(prevProfitAgg[0].profit || 0) : 0;

    const paymentSummary = { CASH: { amount: 0, orders: 0 }, QR: { amount: 0, orders: 0 } };`;

code = code.replace(target, injection);
fs.writeFileSync('src/controllers/reportController.js', code);
