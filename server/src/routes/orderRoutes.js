const express = require('express');
const { getOrders, getOrderById, returnOrderItems } = require('../controllers/orderController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.post('/:id/return', returnOrderItems);

module.exports = router;

