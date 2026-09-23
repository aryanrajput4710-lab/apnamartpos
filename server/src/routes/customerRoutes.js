const express = require('express');
const { searchCustomers, createCustomer, getCustomers, getCustomerById, getCustomerOrders } = require('../controllers/customerController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/search', searchCustomers);
router.post('/', createCustomer);
router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.get('/:id/orders', getCustomerOrders);

module.exports = router;
