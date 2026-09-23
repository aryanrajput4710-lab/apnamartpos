const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
// Let cashers view settings if they need to see receipt footer or QR, but only admin can update.
router.get('/', getSettings);
router.put('/', requireRole('ADMIN'), updateSettings);

module.exports = router;
