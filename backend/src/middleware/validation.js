const { body, param, query, validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * Validation rules for authentication
 */
const authValidation = {
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('firstName')
      .trim()
      .notEmpty()
      .withMessage('First name is required')
      .isLength({ max: 100 })
      .withMessage('First name must be less than 100 characters'),
    body('lastName')
      .trim()
      .notEmpty()
      .withMessage('Last name is required')
      .isLength({ max: 100 })
      .withMessage('Last name must be less than 100 characters'),
    body('roleId')
      .isUUID()
      .withMessage('Valid role ID is required'),
    handleValidationErrors
  ],
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    handleValidationErrors
  ],
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    handleValidationErrors
  ]
};

/**
 * Validation rules for employee
 */
const employeeValidation = {
  create: [
    body('firstName')
      .trim()
      .notEmpty()
      .withMessage('First name is required')
      .isLength({ max: 100 })
      .withMessage('First name must be less than 100 characters'),
    body('lastName')
      .trim()
      .notEmpty()
      .withMessage('Last name is required')
      .isLength({ max: 100 })
      .withMessage('Last name must be less than 100 characters'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('phone')
      .optional()
      .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .withMessage('Valid phone number is required'),
    body('dateOfJoining')
      .isISO8601()
      .withMessage('Valid date of joining is required'),
    body('pan')
      .optional()
      .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
      .withMessage('Invalid PAN format (should be like ABCDE1234F)'),
    body('aadhaar')
      .optional()
      .matches(/^\d{12}$/)
      .withMessage('Invalid Aadhaar format (should be 12 digits)'),
    body('bankIfsc')
      .optional()
      .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
      .withMessage('Invalid IFSC code format'),
    body('bankAccountNumber')
      .optional()
      .matches(/^\d{9,18}$/)
      .withMessage('Invalid bank account number'),
    handleValidationErrors
  ],
  update: [
    param('id')
      .isUUID()
      .withMessage('Valid employee ID is required'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('pan')
      .optional()
      .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
      .withMessage('Invalid PAN format'),
    body('aadhaar')
      .optional()
      .matches(/^\d{12}$/)
      .withMessage('Invalid Aadhaar format'),
    handleValidationErrors
  ],
  getById: [
    param('id')
      .isUUID()
      .withMessage('Valid employee ID is required'),
    handleValidationErrors
  ]
};

/**
 * Validation rules for payroll
 */
const payrollValidation = {
  create: [
    body('month')
      .isInt({ min: 1, max: 12 })
      .withMessage('Month must be between 1 and 12'),
    body('year')
      .isInt({ min: 2000, max: 2100 })
      .withMessage('Valid year is required'),
    handleValidationErrors
  ],
  process: [
    param('id')
      .isUUID()
      .withMessage('Valid payroll ID is required'),
    handleValidationErrors
  ]
};

/**
 * Validation rules for loan
 */
const loanValidation = {
  create: [
    body('employeeId')
      .isUUID()
      .withMessage('Valid employee ID is required'),
    body('loanType')
      .isIn(['loan', 'advance'])
      .withMessage('Loan type must be either "loan" or "advance"'),
    body('amount')
      .isFloat({ min: 1 })
      .withMessage('Amount must be a positive number'),
    body('interestRate')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Interest rate must be between 0 and 100'),
    body('tenure')
      .isInt({ min: 1, max: 360 })
      .withMessage('Tenure must be between 1 and 360 months'),
    body('startDate')
      .isISO8601()
      .withMessage('Valid start date is required'),
    handleValidationErrors
  ],
  approve: [
    param('id')
      .isUUID()
      .withMessage('Valid loan ID is required'),
    handleValidationErrors
  ]
};

/**
 * Validation rules for reimbursement
 */
const reimbursementValidation = {
  create: [
    body('employeeId')
      .isUUID()
      .withMessage('Valid employee ID is required'),
    body('category')
      .trim()
      .notEmpty()
      .withMessage('Category is required'),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be a positive number'),
    body('date')
      .isISO8601()
      .withMessage('Valid date is required'),
    handleValidationErrors
  ]
};

/**
 * Validation rules for leave
 */
const leaveValidation = {
  create: [
    body('employeeId')
      .isUUID()
      .withMessage('Valid employee ID is required'),
    body('leaveType')
      .isIn(['CL', 'SL', 'PL', 'EL', 'ML', 'LWP'])
      .withMessage('Valid leave type is required'),
    body('startDate')
      .isISO8601()
      .withMessage('Valid start date is required'),
    body('endDate')
      .isISO8601()
      .withMessage('Valid end date is required'),
    body('days')
      .isFloat({ min: 0.5 })
      .withMessage('Days must be at least 0.5'),
    handleValidationErrors
  ]
};

/**
 * Validation rules for attendance
 */
const attendanceValidation = {
  create: [
    body('employeeId')
      .isUUID()
      .withMessage('Valid employee ID is required'),
    body('date')
      .isISO8601()
      .withMessage('Valid date is required'),
    body('status')
      .isIn(['present', 'absent', 'half-day', 'holiday', 'weekend'])
      .withMessage('Valid status is required'),
    handleValidationErrors
  ]
};

/**
 * Validation rules for salary increment
 */
const incrementValidation = {
  create: [
    body('employeeId')
      .isUUID()
      .withMessage('Valid employee ID is required'),
    body('effectiveDate')
      .isISO8601()
      .withMessage('Valid effective date is required'),
    body('newSalary')
      .isFloat({ min: 1 })
      .withMessage('New salary must be a positive number'),
    handleValidationErrors
  ]
};

/**
 * Validation rules for supplementary salary
 */
const supplementaryValidation = {
  create: [
    body('employeeId')
      .isUUID()
      .withMessage('Valid employee ID is required'),
    body('type')
      .isIn(['arrears', 'incentive', 'bonus', 'full-final', 'other'])
      .withMessage('Valid type is required'),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be a positive number'),
    body('month')
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage('Month must be between 1 and 12'),
    body('year')
      .optional()
      .isInt({ min: 2000, max: 2100 })
      .withMessage('Valid year is required'),
    handleValidationErrors
  ]
};

/**
 * Validation rules for reports
 */
const reportValidation = {
  getReport: [
    query('month')
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage('Month must be between 1 and 12'),
    query('year')
      .optional()
      .isInt({ min: 2000, max: 2100 })
      .withMessage('Valid year is required'),
    handleValidationErrors
  ]
};

/**
 * Validation rules for pagination
 */
const paginationValidation = {
  validate: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 200 })
      .withMessage('Limit must be between 1 and 200'),
    handleValidationErrors
  ]
};

/**
 * Validation rules for portal (employee self-service)
 */
const portalValidation = {
  applyLeave: [
    body('leaveType')
      .isIn(['CL', 'SL', 'PL', 'EL', 'ML', 'LWP'])
      .withMessage('Valid leave type is required'),
    body('startDate')
      .isISO8601()
      .withMessage('Valid start date is required'),
    body('endDate')
      .isISO8601()
      .withMessage('Valid end date is required'),
    handleValidationErrors
  ],
  updateProfile: [
    body('phone')
      .optional()
      .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .withMessage('Valid phone number is required'),
    handleValidationErrors
  ],
  raiseQuery: [
    body('subject')
      .trim()
      .notEmpty()
      .withMessage('Subject is required')
      .isLength({ max: 200 })
      .withMessage('Subject must be less than 200 characters'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ max: 2000 })
      .withMessage('Description must be less than 2000 characters'),
    body('category')
      .optional()
      .isIn(['Payroll', 'Attendance', 'Leave', 'Salary', 'Profile Update', 'Technical Issue', 'Other'])
      .withMessage('Valid category is required'),
    handleValidationErrors
  ]
};

module.exports = {
  handleValidationErrors,
  authValidation,
  employeeValidation,
  paginationValidation,
  payrollValidation,
  loanValidation,
  reimbursementValidation,
  leaveValidation,
  attendanceValidation,
  incrementValidation,
  supplementaryValidation,
  reportValidation,
  portalValidation
};

