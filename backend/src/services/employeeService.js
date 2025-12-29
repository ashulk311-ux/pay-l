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
    // Get company's employee code generation settings
    const company = await Company.findByPk(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    const mode = company.employeeCodeGenerationMode || 'manual';
    const prefix = company.employeeCodePrefix || 'EMP';
    const format = company.employeeCodeFormat || '{PREFIX}{NUMBER}';

    // If manual, return null (code must be provided)
    if (mode === 'manual') {
      return null;
    }

    // If matrix integration, fetch from Matrix API
    if (mode === 'matrix' && company.matrixSoftwareIntegration) {
      // TODO: Integrate with Matrix Software API
      // For now, fall back to auto generation
      logger.warn('Matrix integration not implemented, falling back to auto generation');
    }

    // Get the last employee code for sequence generation
    const lastEmployee = await Employee.findOne({
      where: { companyId },
      order: [['createdAt', 'DESC']],
      attributes: ['employeeCode']
    });

    let newCode = '';

    // Parse format string (e.g., "{PREFIX}{NUMBER}", "{PREFIX}{YEAR}{NUMBER}")
    const currentYear = new Date().getFullYear();
    const year = String(currentYear);
    
    // Get next sequence number
    const yearEmployees = await Employee.count({
      where: {
        companyId,
        dateOfJoining: {
          [Op.gte]: new Date(currentYear, 0, 1)
        }
      }
    });
    const nextNumber = yearEmployees + 1;
    const paddedNumber = String(nextNumber).padStart(4, '0');

    // Replace format placeholders
    newCode = format
      .replace(/{PREFIX}/g, prefix)
      .replace(/{YEAR}/g, year)
      .replace(/{NUMBER}/g, paddedNumber)
      .replace(/{DEPARTMENT}/g, (employeeData.department || 'EMP').substring(0, 2).toUpperCase());

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

