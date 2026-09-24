const express = require('express');
const { resetTestData, getOrders, getOrderById, returnOrderItems, deleteOrder } = require('../controllers/orderController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.delete('/', requireRole('ADMIN'), resetTestData);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.post('/:id/return', returnOrderItems);
router.delete('/:id', requireRole('ADMIN'), deleteOrder);

module.exports = router;
