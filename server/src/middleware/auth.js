const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../utils/jwt');

const prisma = new PrismaClient();

const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.id) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    // Attach safe user object to request
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};

module.exports = {
  requireAuth,
  requireRole
};
