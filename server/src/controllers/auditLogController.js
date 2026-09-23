const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, entityType, userId, startDate, endDate } = req.query;
    
    // pagination protection
    const parsedLimit = Math.min(parseInt(limit, 10) || 50, 100);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const where = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (userId) where.userId = userId;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parsedLimit,
        include: { user: { select: { name: true, email: true } } }
      }),
      prisma.auditLog.count({ where })
    ]);

    res.status(200).json({ success: true, data: logs, total, page: parsedPage, limit: parsedLimit });
  } catch (error) {
    console.error('AuditLog error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getAuditLogs
};
