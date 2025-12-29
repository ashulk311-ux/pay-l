const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// Validation rules
const createUserValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('roleId').isUUID().withMessage('Valid role ID is required'),
  body('companyId').optional().isUUID().withMessage('Valid company ID is required'),
  body('phone').optional().isString(),
  body('isActive').optional().isBoolean(),
  handleValidationErrors
];

const updateUserValidation = [
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional().isString(),
  body('roleId').optional().isUUID().withMessage('Valid role ID is required'),
  body('companyId').optional().isUUID().withMessage('Valid company ID is required'),
  body('isActive').optional().isBoolean(),
  handleValidationErrors
];

const resetPasswordValidation = [
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

// All routes require Super Admin access (authorize will check, but Super Admin bypasses)
// Since permissions might not be set up, we rely on Super Admin bypass in authorize middleware
// Super Admin can access all users, Company Admin can access their company users
router.get('/', authenticate, authorize('manage_company_users'), userController.getAllUsers);
router.get('/:id', authenticate, authorize('manage_company_users'), userController.getUserById);
router.post('/', createUserValidation, authenticate, authorize('manage_company_users'), userController.createUser);
router.put('/:id', updateUserValidation, authenticate, authorize('manage_company_users'), userController.updateUser);
router.delete('/:id', authenticate, authorize('manage_company_users'), userController.deleteUser);
router.post('/:id/reset-password', resetPasswordValidation, authenticate, authorize('manage_company_users'), userController.resetUserPassword);

module.exports = router;

