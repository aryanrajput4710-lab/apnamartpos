const express = require('express');
const { scanProduct, searchProducts, checkout, getReceipt } = require('../controllers/posController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/scan/:code', scanProduct);
router.get('/search', searchProducts);
router.post('/checkout', checkout);
router.get('/orders/:id/receipt', getReceipt);

module.exports = router;
