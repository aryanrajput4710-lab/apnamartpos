
const { verifyToken, verifyRefreshToken, generateToken } = require('../utils/jwt');

const prisma = require('../utils/prisma');

const requireAuth = async (req, res, next) => {
  try {
    let token = req.cookies.token;
    let decoded;
    
    // Check access token
    if (token) {
      try {
        decoded = verifyToken(token);
      } catch (err) {
        // Token might be expired, we'll try refresh token below
        decoded = null;
      }
    }

    // If no valid access token, try refresh token
    if (!decoded) {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }

      try {
        const refreshDecoded = verifyRefreshToken(refreshToken);
        if (!refreshDecoded || !refreshDecoded.id) throw new Error('Invalid refresh token');

        // Generate new access token
        const newToken = generateToken(refreshDecoded.id);
        const isProd = process.env.NODE_ENV === 'production';
        res.cookie('token', newToken, {
          httpOnly: true,
          secure: isProd,
          sameSite: isProd ? 'none' : 'lax',
          maxAge: 15 * 60 * 1000 
        });
        
        decoded = refreshDecoded;
      } catch (refreshErr) {
        return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
      }
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
