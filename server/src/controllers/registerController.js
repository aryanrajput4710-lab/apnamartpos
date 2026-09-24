const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Open Register
exports.openRegister = async (req, res) => {
  try {
    const { openingFloat } = req.body;
    
    // Check if one is already open
    const current = await prisma.cashRegister.findFirst({
      where: { status: 'OPEN' }
    });
    if (current) {
      return res.status(400).json({ success: false, message: 'A register is already open.' });
    }

    const register = await prisma.cashRegister.create({
      data: {
        openedById: req.user.id,
        openingFloat: parseFloat(openingFloat || 0)
      }
    });

    res.json({ success: true, data: register });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Status & Shift Totals
exports.getRegisterStatus = async (req, res) => {
  try {
    const register = await prisma.cashRegister.findFirst({
      where: { status: 'OPEN' },
      include: { openedBy: { select: { name: true } } }
    });

    if (!register) {
      return res.json({ success: true, data: null });
    }

    // Calculate totals since openedAt
    const payments = await prisma.payment.groupBy({
      by: ['method'],
      where: {
        createdAt: { gte: register.openedAt },
        status: 'COMPLETED',
        order: { status: 'COMPLETED' }
      },
      _sum: { amount: true }
    });

    // Also factor in cash returns if any
    const cashReturns = await prisma.returnRecord.aggregate({
      where: {
        createdAt: { gte: register.openedAt },
      },
      _sum: { refundAmount: true } // Assuming all refunds paid from cash drawer
    });

    let totalCash = 0;
    let totalUPI = 0;

    payments.forEach(p => {
      if (p.method === 'CASH') totalCash += parseFloat(p._sum.amount || 0);
      if (p.method === 'QR') totalUPI += parseFloat(p._sum.amount || 0);
    });

    const refunds = parseFloat(cashReturns._sum.refundAmount || 0);
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
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Close Register
exports.closeRegister = async (req, res) => {
  try {
    const { id } = req.params;
    const { actualCash, totalUPI, expectedCash } = req.body;

    const diff = parseFloat(actualCash) - parseFloat(expectedCash);

    const register = await prisma.cashRegister.update({
      where: { id },
      data: {
        closedAt: new Date(),
        status: 'CLOSED',
        actualCash: parseFloat(actualCash),
        expectedCash: parseFloat(expectedCash),
        totalUPI: parseFloat(totalUPI),
        difference: diff
      }
    });

    res.json({ success: true, data: register });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
