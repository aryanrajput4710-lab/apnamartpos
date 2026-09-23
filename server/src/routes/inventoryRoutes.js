const express = require('express');
const { 
  getInventory, 
  getLowStock, 
  getOutOfStock, 
  getVariantHistory,
  getGlobalHistory,
  stockIn, 
  stockOut, 
  adjustStock,
  getDashboardSummary
} = require('../controllers/inventoryController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// Accessible by both ADMIN and CASHIER
router.get('/', getInventory);
router.get('/low-stock', getLowStock);
router.get('/out-of-stock', getOutOfStock);
router.get('/summary', getDashboardSummary);

// Admin only routes
router.use(requireRole('ADMIN'));
router.get('/history', getGlobalHistory);
router.get('/:variantId/history', getVariantHistory);
router.post('/stock-in', stockIn);
router.post('/stock-out', stockOut);
router.post('/adjust', adjustStock);

module.exports = router;
