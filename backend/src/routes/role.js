const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { authenticate } = require('../middleware/auth');

// Get all roles (authenticated users can view roles)
router.get('/', authenticate, roleController.getAllRoles);
router.get('/:id', authenticate, roleController.getRoleById);

module.exports = router;



