const { Employee, Company, GlobalPolicy } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Generate employee code based on company policy
 * @param {String} companyId - Company ID
 * @param {Object} employeeData - Employee data for code generation
 * @returns {String} Generated employee code
 */
async function generateEmployeeCode(companyId, employeeData = {}) {
  try {
    // Get company's employee code generation policy
    const globalPolicy = await GlobalPolicy.findOne({
      where: { companyId, key: 'employee_code_generation' }
    });

    let codeFormat = 'AUTO'; // AUTO, MANUAL, PREFIX_SEQUENCE, etc.
    let prefix = '';
    let sequenceLength = 4;

    if (globalPolicy && globalPolicy.value) {
      const policy = typeof globalPolicy.value === 'string' 
        ? JSON.parse(globalPolicy.value) 
        : globalPolicy.value;
      codeFormat = policy.format || 'AUTO';
      prefix = policy.prefix || '';
      sequenceLength = policy.sequenceLength || 4;
    }

    // If manual, return null (code must be provided)
    if (codeFormat === 'MANUAL') {
      return null;
    }

    // Get the last employee code for sequence generation
    const lastEmployee = await Employee.findOne({
      where: { companyId },
      order: [['createdAt', 'DESC']],
      attributes: ['employeeCode']
    });

    let newCode = '';

    switch (codeFormat) {
      case 'PREFIX_SEQUENCE':
        // Format: PREFIX + SEQUENCE (e.g., EMP0001, EMP0002)
        const lastSequence = lastEmployee 
          ? parseInt(lastEmployee.employeeCode.replace(prefix, '')) || 0 
          : 0;
        const nextSequence = lastSequence + 1;
        newCode = prefix + String(nextSequence).padStart(sequenceLength, '0');
        break;

      case 'DEPARTMENT_CODE':
        // Format: DEPT + SEQUENCE (e.g., HR001, IT001)
        const deptPrefix = (employeeData.department || 'EMP').substring(0, 2).toUpperCase();
        const deptEmployees = await Employee.count({
          where: {
            companyId,
            department: employeeData.department
          }
        });
        newCode = deptPrefix + String(deptEmployees + 1).padStart(sequenceLength, '0');
        break;

      case 'YEAR_SEQUENCE':
        // Format: YEAR + SEQUENCE (e.g., 2024001, 2024002)
        const currentYear = new Date().getFullYear();
        const yearEmployees = await Employee.count({
          where: {
            companyId,
            dateOfJoining: {
              [Op.gte]: new Date(currentYear, 0, 1)
            }
          }
        });
        newCode = currentYear.toString() + String(yearEmployees + 1).padStart(sequenceLength, '0');
        break;

      case 'AUTO':
      default:
        // Format: EMP + YEAR + SEQUENCE (e.g., EMP2024001)
        const year = new Date().getFullYear();
        const autoEmployees = await Employee.count({
          where: {
            companyId,
            dateOfJoining: {
              [Op.gte]: new Date(year, 0, 1)
            }
          }
        });
        newCode = `EMP${year}${String(autoEmployees + 1).padStart(4, '0')}`;
        break;
    }

    // Ensure uniqueness
    let finalCode = newCode;
    let counter = 1;
    while (await Employee.findOne({ where: { companyId, employeeCode: finalCode } })) {
      finalCode = `${newCode}_${counter}`;
      counter++;
    }

    return finalCode;
  } catch (error) {
    logger.error('Error generating employee code:', error);
    throw error;
  }
}

/**
 * Validate employee data for onboarding
 * @param {Object} employeeData - Employee data to validate
 * @returns {Object} Validation result with isValid and errors
 */
function validateEmployeeData(employeeData) {
  const errors = [];

  // Required fields
  if (!employeeData.firstName) {
    errors.push('First name is required');
  }
  if (!employeeData.lastName) {
    errors.push('Last name is required');
  }
  if (!employeeData.dateOfJoining) {
    errors.push('Date of joining is required');
  }
  if (!employeeData.email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employeeData.email)) {
    errors.push('Invalid email format');
  }

  // PAN validation (if provided)
  if (employeeData.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(employeeData.pan)) {
    errors.push('Invalid PAN format (should be like ABCDE1234F)');
  }

  // Aadhaar validation (if provided)
  if (employeeData.aadhaar && !/^\d{12}$/.test(employeeData.aadhaar)) {
    errors.push('Invalid Aadhaar format (should be 12 digits)');
  }

  // Bank account validation (if provided)
  if (employeeData.bankAccountNumber && !/^\d{9,18}$/.test(employeeData.bankAccountNumber)) {
    errors.push('Invalid bank account number');
  }

  // IFSC validation (if provided)
  if (employeeData.bankIfsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(employeeData.bankIfsc)) {
    errors.push('Invalid IFSC code format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check KYC completion status
 * @param {Object} employee - Employee object
 * @returns {Object} KYC status with missing documents
 */
function checkKYCStatus(employee) {
  const requiredDocuments = ['aadhaar', 'pan', 'photo', 'bankAccountNumber'];
  const missingDocuments = [];
  const documents = employee.documents || {};

  requiredDocuments.forEach(doc => {
    if (doc === 'aadhaar' && !employee.aadhaar) {
      missingDocuments.push('Aadhaar');
    } else if (doc === 'pan' && !employee.pan) {
      missingDocuments.push('PAN');
    } else if (doc === 'photo' && !employee.photo && !documents.photo) {
      missingDocuments.push('Photo');
    } else if (doc === 'bankAccountNumber' && !employee.bankAccountNumber) {
      missingDocuments.push('Bank Account Details');
    }
  });

  const isComplete = missingDocuments.length === 0;
  const status = isComplete ? 'verified' : employee.kycStatus || 'pending';

  return {
    status,
    isComplete,
    missingDocuments,
    completedDocuments: requiredDocuments.filter(doc => !missingDocuments.includes(doc))
  };
}

module.exports = {
  generateEmployeeCode,
  validateEmployeeData,
  checkKYCStatus
};

