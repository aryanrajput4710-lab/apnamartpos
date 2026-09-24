const express = require('express');
const router = express.Router();
const registerController = require('../controllers/registerController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/status', registerController.getRegisterStatus);
router.post('/open', registerController.openRegister);
router.post('/close/:id', registerController.closeRegister);

module.exports = router;
