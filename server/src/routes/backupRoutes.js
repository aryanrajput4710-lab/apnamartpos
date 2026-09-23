const express = require('express');
const { createBackup, restoreBackup, getBackupStatus } = require('../controllers/backupController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('ADMIN'));

router.get('/status', getBackupStatus);
router.post('/create', createBackup);
router.post('/restore', restoreBackup);

module.exports = router;
