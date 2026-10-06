const prisma = require('../utils/prisma');

exports.createExpense = async (req, res) => {
  try {
    const { category, amount, description, date } = req.body;
    
    if (!category || !amount) {
      return res.status(400).json({ success: false, message: 'Category and amount are required' });
    }
    
    const expense = await prisma.expense.create({
      data: {
        category,
        amount: parseFloat(amount),
        description: description || null,
        date: date ? new Date(date) : new Date()
      }
    });
    
    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' },
      take: 100
    });
    res.json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
