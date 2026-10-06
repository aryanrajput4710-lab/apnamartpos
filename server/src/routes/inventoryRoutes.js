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
const validate = require('../middleware/validate');
const { stockActionSchema, adjustStockSchema } = require('../validators/inventoryValidator');

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
router.post('/stock-in', validate(stockActionSchema), stockIn);
router.post('/stock-out', validate(stockActionSchema), stockOut);
router.post('/adjust', validate(adjustStockSchema), adjustStock);

router.post('/batch-stock-in', require('../controllers/inventoryController').batchStockIn);
module.exports = router;
