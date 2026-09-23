const express = require('express');
const { login, logout, getMe } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../utils/password');

const router = express.Router();
const prisma = new PrismaClient();

const { loginLimiter } = require('../middleware/rateLimiter');

router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);

module.exports = router;
