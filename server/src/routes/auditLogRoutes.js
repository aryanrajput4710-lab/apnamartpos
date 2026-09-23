const express = require('express');
const { getAuditLogs } = require('../controllers/auditLogController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('ADMIN'));

router.get('/', getAuditLogs);

module.exports = router;
