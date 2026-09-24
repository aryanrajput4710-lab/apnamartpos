const express = require('express');
const { login, logout, getMe } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../utils/password');
const validate = require('../middleware/validate');
const { loginSchema } = require('../schemas/authSchema');
const { loginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);

module.exports = router;
