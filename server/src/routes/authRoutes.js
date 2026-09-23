const express = require('express');
const { login, logout, getMe } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../utils/password');

const router = express.Router();
const prisma = new PrismaClient();

// TEMPORARY ROUTE TO FIX SEEDING ISSUE
router.get('/seed-admin', async (req, res) => {
  try {
    const exists = await prisma.user.findUnique({ where: { email: 'admin@store.com' } });
    if (exists) return res.send('Admin already exists!');
    
    const passwordHash = await hashPassword('mypassword123');
    await prisma.user.create({
      data: { name: 'Super Admin', email: 'admin@store.com', passwordHash, role: 'ADMIN' }
    });
    res.send('Success! Admin created with email: admin@store.com and password: mypassword123');
  } catch (err) {
    res.send('Error: ' + err.message);
  }
});

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);

module.exports = router;
