const express = require('express');
const { getOrders, getOrderById } = require('../controllers/orderController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', getOrders);
router.get('/:id', getOrderById);

module.exports = router;
