const axios = require('axios');
const logger = require('../utils/logger');
const { Employee, Company } = require('../models');

/**
 * Sync employee to Matrix Software
 */
async function syncEmployeeToMatrix(employeeId) {
  try {
    const employee = await Employee.findByPk(employeeId, {
      include: [{ model: Company, as: 'company' }]
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    const company = employee.company;
    if (!company.matrixSoftwareIntegration || !company.matrixApiKey || !company.matrixApiUrl) {
      throw new Error('Matrix Software integration not configured for this company');
    }

    // Prepare employee data for Matrix
    const matrixData = {
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      dateOfJoining: employee.dateOfJoining,
      designation: employee.designation,
      department: employee.department,
      branch: employee.branch,
      pan: employee.pan,
      aadhaar: employee.aadhaar,
      uan: employee.uan,
      bankAccountNumber: employee.bankAccountNumber,
      bankIfsc: employee.bankIfsc,
      bankName: employee.bankName,
      isTemporary: employee.isTemporary
    };

    // Call Matrix API
    const response = await axios.post(
      `${company.matrixApiUrl}/api/employees`,
      matrixData,
      {
        headers: {
          'Authorization': `Bearer ${company.matrixApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Update employee with Matrix ID
    if (response.data && response.data.id) {
      await employee.update({ matrixEmployeeId: response.data.id });
      logger.info(`Employee ${employee.employeeCode} synced to Matrix with ID: ${response.data.id}`);
      return { success: true, matrixEmployeeId: response.data.id };
    }

    throw new Error('Invalid response from Matrix API');
  } catch (error) {
    logger.error('Sync employee to Matrix error:', error);
    throw error;
  }
}

/**
 * Sync employee from Matrix Software
 */
async function syncEmployeeFromMatrix(matrixEmployeeId, companyId) {
  try {
    const company = await Company.findByPk(companyId);
    if (!company.matrixSoftwareIntegration || !company.matrixApiKey || !company.matrixApiUrl) {
      throw new Error('Matrix Software integration not configured for this company');
    }

    // Fetch employee from Matrix
    const response = await axios.get(
      `${company.matrixApiUrl}/api/employees/${matrixEmployeeId}`,
      {
        headers: {
          'Authorization': `Bearer ${company.matrixApiKey}`
        }
      }
    );

    const matrixData = response.data;

    // Find or create employee
    const [employee, created] = await Employee.findOrCreate({
      where: {
        companyId,
        matrixEmployeeId: matrixEmployeeId
      },
      defaults: {
        companyId,
        employeeCode: matrixData.employeeCode || `TEMP-${Date.now()}`,
        firstName: matrixData.firstName,
        lastName: matrixData.lastName,
        email: matrixData.email,
        phone: matrixData.phone,
        dateOfJoining: matrixData.dateOfJoining ? new Date(matrixData.dateOfJoining) : new Date(),
        designation: matrixData.designation,
        department: matrixData.department,
        branch: matrixData.branch,
        pan: matrixData.pan,
        aadhaar: matrixData.aadhaar,
        uan: matrixData.uan,
        bankAccountNumber: matrixData.bankAccountNumber,
        bankIfsc: matrixData.bankIfsc,
        bankName: matrixData.bankName,
        isTemporary: true,
        matrixEmployeeId: matrixEmployeeId,
        kycStatus: 'pending'
      }
    });

    if (!created) {
      // Update existing employee
      await employee.update({
        firstName: matrixData.firstName,
        lastName: matrixData.lastName,
        email: matrixData.email,
        phone: matrixData.phone,
        designation: matrixData.designation,
        department: matrixData.department,
        branch: matrixData.branch
      });
    }

    logger.info(`Employee synced from Matrix: ${employee.employeeCode}`);
    return { success: true, employee, created };
  } catch (error) {
    logger.error('Sync employee from Matrix error:', error);
    throw error;
  }
}

/**
 * Remove employee from Matrix (when temporary employee is converted to permanent)
 */
async function removeEmployeeFromMatrix(employeeId) {
  try {
    const employee = await Employee.findByPk(employeeId, {
      include: [{ model: Company, as: 'company' }]
    });

    if (!employee || !employee.matrixEmployeeId) {
      return { success: true, message: 'No Matrix ID found' };
    }

    const company = employee.company;
    if (!company.matrixSoftwareIntegration || !company.matrixApiKey || !company.matrixApiUrl) {
      return { success: true, message: 'Matrix integration not configured' };
    }

    // Call Matrix API to remove employee
    await axios.delete(
      `${company.matrixApiUrl}/api/employees/${employee.matrixEmployeeId}`,
      {
        headers: {
          'Authorization': `Bearer ${company.matrixApiKey}`
        }
      }
    );

    // Clear Matrix ID from employee
    await employee.update({ matrixEmployeeId: null, isTemporary: false });
    logger.info(`Employee ${employee.employeeCode} removed from Matrix`);
    return { success: true };
  } catch (error) {
    logger.error('Remove employee from Matrix error:', error);
    throw error;
  }
}

module.exports = {
  syncEmployeeToMatrix,
  syncEmployeeFromMatrix,
  removeEmployeeFromMatrix
};



