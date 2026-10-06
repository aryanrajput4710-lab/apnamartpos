const fs = require('fs');
let c = fs.readFileSync('server/src/controllers/registerController.js', 'utf8');

const newRoute = `
// Cash Transaction
exports.addCashTransaction = async (req, res) => {
  try {
    const { registerId, type, amount, remarks } = req.body;
    const tx = await prisma.cashTransaction.create({
      data: {
        registerId,
        type,
        amount: parseFloat(amount),
        remarks
      }
    });
    res.json({ success: true, data: tx });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
`;

c += newRoute;

// Replace getRegisterStatus expectedCash logic
const oldGetRegisterStatus = `    const refunds = parseFloat(cashReturns._sum.refundAmount || 0);
    const expectedCash = parseFloat(register.openingFloat) + totalCash - refunds;

    res.json({
      success: true,
      data: {
        ...register,
        totalSalesCash: totalCash,
        totalSalesUPI: totalUPI,
        totalRefundsCash: refunds,
        expectedCash
      }
    });`;

const newGetRegisterStatus = `    const refunds = parseFloat(cashReturns._sum.refundAmount || 0);
    
    const cashTxs = await prisma.cashTransaction.findMany({
      where: { registerId: register.id }
    });
    let cashAdded = 0;
    let cashRemoved = 0;
    cashTxs.forEach(tx => {
      if (tx.type === 'ADD') cashAdded += parseFloat(tx.amount);
      if (tx.type === 'REMOVE') cashRemoved += parseFloat(tx.amount);
    });

    const expectedCash = parseFloat(register.openingFloat) + totalCash - refunds + cashAdded - cashRemoved;

    res.json({
      success: true,
      data: {
        ...register,
        totalSalesCash: totalCash,
        totalSalesUPI: totalUPI,
        totalRefundsCash: refunds,
        cashAdded,
        cashRemoved,
        cashTxs,
        expectedCash
      }
    });`;

c = c.replace(oldGetRegisterStatus, newGetRegisterStatus);

fs.writeFileSync('server/src/controllers/registerController.js', c);
