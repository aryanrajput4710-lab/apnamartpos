const express = require('express');
const { runIntegrityChecks } = require('../controllers/integrityController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('ADMIN'));

router.get('/', runIntegrityChecks);

module.exports = router;
