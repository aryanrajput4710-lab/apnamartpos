const express = require('express');
const { searchCustomers, createCustomer } = require('../controllers/customerController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/search', searchCustomers);
router.post('/', createCustomer);

module.exports = router;
