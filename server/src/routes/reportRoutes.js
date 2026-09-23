const express = require('express');
const { getDashboardSummary } = require('../controllers/reportController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Only ADMIN can access reports
router.use(requireAuth);
router.use(requireRole('ADMIN'));

router.get('/dashboard', getDashboardSummary);

module.exports = router;
