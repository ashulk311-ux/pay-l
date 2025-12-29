/**
 * User-friendly error messages
 */

const errorMessages = {
  // General errors
  NOT_FOUND: (resource) => `${resource} not found`,
  ACCESS_DENIED: 'You do not have permission to access this resource',
  INVALID_INPUT: 'Invalid input provided. Please check your data and try again',
  OPERATION_FAILED: (operation) => `Failed to ${operation}. Please try again later`,
  REQUIRED_FIELD: (field) => `${field} is required`,
  
  // Employee errors
  EMPLOYEE_NOT_FOUND: 'Employee record not found',
  EMPLOYEE_CODE_EXISTS: 'Employee code already exists. Please use a different code',
  EMPLOYEE_EMAIL_EXISTS: 'An employee with this email already exists',
  
  // Company errors
  COMPANY_NOT_FOUND: 'Company not found',
  COMPANY_CODE_EXISTS: 'Company code already exists',
  COMPANY_NOT_ASSOCIATED: 'User must be associated with a company to perform this action',
  
  // Authentication errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_EXPIRED: 'Your session has expired. Please login again',
  TOKEN_INVALID: 'Invalid authentication token',
  UNAUTHORIZED: 'You must be logged in to access this resource',
  
  // Validation errors
  INVALID_EMAIL: 'Please provide a valid email address',
  INVALID_PHONE: 'Please provide a valid phone number',
  INVALID_DATE: 'Please provide a valid date',
  INVALID_AMOUNT: 'Please provide a valid amount',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long',
  PASSWORD_WEAK: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  
  // Duplicate errors
  DUPLICATE_ENTRY: (resource) => `This ${resource} already exists`,
  CODE_EXISTS: (resource) => `${resource} code already exists. Please use a different code`,
  
  // File errors
  FILE_TOO_LARGE: (maxSize) => `File size exceeds the maximum allowed size of ${maxSize}`,
  INVALID_FILE_TYPE: 'Invalid file type. Please upload a supported file format',
  FILE_UPLOAD_FAILED: 'Failed to upload file. Please try again',
  
  // Business logic errors
  INSUFFICIENT_BALANCE: 'Insufficient balance to complete this operation',
  INVALID_STATUS: (currentStatus, requiredStatus) => 
    `Cannot perform this action. Current status is '${currentStatus}', but '${requiredStatus}' is required`,
  ALREADY_PROCESSED: 'This record has already been processed',
  CANNOT_DELETE: (resource, reason) => 
    `Cannot delete ${resource}. ${reason}`,
  
  // Leave errors
  INSUFFICIENT_LEAVE_BALANCE: (leaveType) => 
    `Insufficient ${leaveType} leave balance`,
  LEAVE_OVERLAP: 'Leave dates overlap with an existing leave request',
  INVALID_LEAVE_DATES: 'Start date must be before or equal to end date',
  
  // Loan errors
  LOAN_LIMIT_EXCEEDED: 'Loan amount exceeds the maximum allowed limit',
  LOAN_ALREADY_APPROVED: 'This loan has already been approved',
  LOAN_ALREADY_REJECTED: 'This loan has already been rejected',
  
  // Reimbursement errors
  REIMBURSEMENT_LIMIT_EXCEEDED: (limitType, amount) => 
    `Reimbursement amount exceeds the ${limitType} limit of ₹${amount}`,
  MAX_REQUESTS_REACHED: (limitType, count) => 
    `Maximum ${limitType} request limit of ${count} has been reached`,
  
  // Payroll errors
  PAYROLL_ALREADY_PROCESSED: 'Payroll for this period has already been processed',
  ATTENDANCE_NOT_LOCKED: 'Attendance must be locked before processing payroll',
  PRE_CHECKS_FAILED: 'Pre-processing checks failed. Please resolve the issues before proceeding',
  
  // Database errors
  DATABASE_ERROR: 'A database error occurred. Please try again later',
  CONNECTION_ERROR: 'Unable to connect to the database. Please try again later',
  
  // Server errors
  INTERNAL_ERROR: 'An unexpected error occurred. Our team has been notified',
  SERVICE_UNAVAILABLE: 'Service is temporarily unavailable. Please try again later'
};

/**
 * Get user-friendly error message
 * @param {string} key - Error message key
 * @param {...any} args - Arguments for message formatting
 * @returns {string} Formatted error message
 */
exports.getErrorMessage = (key, ...args) => {
  const message = errorMessages[key];
  if (!message) {
    return errorMessages.INTERNAL_ERROR;
  }
  
  if (typeof message === 'function') {
    return message(...args);
  }
  
  return message;
};

/**
 * Format validation error message
 * @param {string} field - Field name
 * @param {string} error - Error type
 * @returns {string} Formatted validation error
 */
exports.formatValidationError = (field, error) => {
  const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
  
  switch (error) {
    case 'required':
      return `${fieldName} is required`;
    case 'invalid':
      return `Invalid ${fieldName}`;
    case 'exists':
      return `${fieldName} already exists`;
    case 'notFound':
      return `${fieldName} not found`;
    default:
      return `${fieldName}: ${error}`;
  }
};

module.exports = errorMessages;
module.exports.getErrorMessage = exports.getErrorMessage;
module.exports.formatValidationError = exports.formatValidationError;


