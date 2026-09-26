const express = require('express');
const { getDashboardSummary } = require('../controllers/reportController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/dashboard', getDashboardSummary);

module.exports = router;
