const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'fallback_secret_for_dev_only', {
    expiresIn: '7d'
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev_only');
};

module.exports = {
  generateToken,
  verifyToken
};
