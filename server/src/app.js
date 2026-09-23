const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const variantRoutes = require('./routes/variantRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');

// Important: set credentials to true for cookies over CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/variants', variantRoutes);
app.use('/api/inventory', inventoryRoutes);

// Temporary test routes for role validation
const { requireAuth, requireRole } = require('./middleware/auth');
app.get('/api/admin/test', requireAuth, requireRole('ADMIN'), (req, res) => res.json({ success: true, message: 'Admin access granted' }));
app.get('/api/cashier/test', requireAuth, requireRole('ADMIN', 'CASHIER'), (req, res) => res.json({ success: true, message: 'Cashier/Admin access granted' }));

// Health-check API
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ status: 'error', database: 'disconnected', error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/api/health/db', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: error.message });
  }
});

module.exports = app;
