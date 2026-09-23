const express = require('express');
const { 
  getVariantById, 
  updateVariant, 
  toggleVariantStatus 
} = require('../controllers/variantController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/:id', getVariantById);
router.put('/:id', requireRole('ADMIN'), updateVariant);
router.patch('/:id/status', requireRole('ADMIN'), toggleVariantStatus);

module.exports = router;
