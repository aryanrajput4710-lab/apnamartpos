const express = require('express');
const { getUsers, createUser, toggleUserActive } = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createUserSchema, toggleUserSchema } = require('../schemas/userSchema');

const router = express.Router();

// All user routes require ADMIN role
router.use(requireAuth, requireRole('ADMIN'));

router.get('/', getUsers);
router.post('/', validate(createUserSchema), createUser);
router.patch('/:id/active', validate(toggleUserSchema), toggleUserActive);

module.exports = router;
