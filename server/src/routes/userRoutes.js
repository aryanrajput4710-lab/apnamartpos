const express = require('express');
const { getUsers, createUser, toggleUserActive } = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// All user routes require ADMIN role
router.use(requireAuth, requireRole('ADMIN'));

router.get('/', getUsers);
router.post('/', createUser);
router.patch('/:id/active', toggleUserActive);

module.exports = router;
