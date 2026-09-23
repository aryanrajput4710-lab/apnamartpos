const express = require('express');
const { scanProduct, searchProducts } = require('../controllers/posController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/scan/:code', scanProduct);
router.get('/search', searchProducts);

module.exports = router;
