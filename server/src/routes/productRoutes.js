const express = require('express');
const { 
  createProduct, 
  getProducts, 
  getProductById, 
  updateProduct, 
  toggleProductStatus,
  createVariant,
  getVariantsByProduct,
  exportCatalog,
  importCatalog
} = require('../controllers/productController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// Product Routes
router.get('/', getProducts);
router.get('/catalog/export', requireRole('ADMIN'), exportCatalog);
router.post('/catalog/import', requireRole('ADMIN'), importCatalog);
router.get('/:id', getProductById);
router.post('/', requireRole('ADMIN'), createProduct);
router.put('/:id', requireRole('ADMIN'), updateProduct);
router.patch('/:id/status', requireRole('ADMIN'), toggleProductStatus);

// Nested Variant Routes
router.get('/:productId/variants', getVariantsByProduct);
router.post('/:productId/variants', requireRole('ADMIN'), createVariant);

module.exports = router;
