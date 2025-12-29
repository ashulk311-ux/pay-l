const { Employee, Payslip, Payroll } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Calculate Gratuity as per Payment of Gratuity Act, 1972
 * Gratuity = (Last drawn salary * 15/26) * Years of service
 * 
 * Rules:
 * - Minimum 5 years of continuous service required
 * - Based on last drawn salary (Basic + DA)
 * - Maximum gratuity limit: ₹20 lakhs (as per 2023 amendment)
 */
async function calculateGratuity(employeeId, lastWorkingDate) {
  try {
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const joiningDate = new Date(employee.dateOfJoining || employee.joiningDate);
    const exitDate = new Date(lastWorkingDate);
    
    // Calculate years of service
    const yearsOfService = (exitDate - joiningDate) / (1000 * 60 * 60 * 24 * 365.25);
    
    // Gratuity is payable only if service is 5 years or more
    if (yearsOfService < 5) {
      return {
        eligible: false,
        yearsOfService: yearsOfService.toFixed(2),
        gratuityAmount: 0,
        reason: 'Minimum 5 years of service required for gratuity'
      };
    }

    // Get last drawn salary (Basic + DA)
    const lastPayroll = await Payroll.findOne({
      where: {
        companyId: employee.companyId,
        status: { [Op.in]: ['finalized', 'paid'] }
      },
      include: [{
        model: Payslip,
        as: 'payslips',
        where: { employeeId },
        required: false
      }],
      order: [['year', 'DESC'], ['month', 'DESC']]
    });

    let lastDrawnSalary = 0;
    if (lastPayroll && lastPayroll.payslips && lastPayroll.payslips.length > 0) {
      const lastPayslip = lastPayroll.payslips[0];
      const earnings = lastPayslip.earnings || {};
      // Basic + DA (if DA is separate, otherwise use basic)
      lastDrawnSalary = parseFloat(earnings.basic || 0) + parseFloat(earnings.dearnessAllowance || 0);
    } else {
      // Fallback to current salary structure
      const { SalaryStructure } = require('../models');
      const salaryStructure = await SalaryStructure.findOne({
        where: { employeeId, isActive: true },
        order: [['effectiveDate', 'DESC']]
      });
      
      if (salaryStructure) {
        const earnings = salaryStructure.earnings || {};
        lastDrawnSalary = parseFloat(earnings.basic || 0) + parseFloat(earnings.dearnessAllowance || 0);
      }
    }

    if (lastDrawnSalary === 0) {
      return {
        eligible: true,
        yearsOfService: yearsOfService.toFixed(2),
        gratuityAmount: 0,
        warning: 'Last drawn salary not found. Please provide manually.'
      };
    }

    // Calculate gratuity: (Last drawn salary * 15/26) * Years of service
    const gratuityPerYear = (lastDrawnSalary * 15) / 26;
    let gratuityAmount = gratuityPerYear * Math.floor(yearsOfService);

    // Apply maximum limit (₹20 lakhs as per 2023 amendment)
    const maxGratuity = 2000000; // ₹20 lakhs
    if (gratuityAmount > maxGratuity) {
      gratuityAmount = maxGratuity;
    }

    return {
      eligible: true,
      yearsOfService: yearsOfService.toFixed(2),
      completedYears: Math.floor(yearsOfService),
      lastDrawnSalary,
      gratuityPerYear: gratuityPerYear.toFixed(2),
      gratuityAmount: Math.round(gratuityAmount),
      maxLimitApplied: gratuityAmount >= maxGratuity,
      calculation: {
        formula: '(Last drawn salary × 15/26) × Years of service',
        lastDrawnSalary,
        multiplier: 15/26,
        yearsOfService: Math.floor(yearsOfService),
        calculatedAmount: (gratuityPerYear * Math.floor(yearsOfService)).toFixed(2),
        finalAmount: Math.round(gratuityAmount)
      }
    };
  } catch (error) {
    logger.error('Calculate gratuity error:', error);
    throw error;
  }
}

/**
 * Calculate gratuity for multiple employees (bulk calculation)
 */
async function calculateBulkGratuity(employeeIds, lastWorkingDate) {
  const results = [];
  
  for (const employeeId of employeeIds) {
    try {
      const result = await calculateGratuity(employeeId, lastWorkingDate);
      results.push({
        employeeId,
        ...result
      });
    } catch (error) {
      results.push({
        employeeId,
        eligible: false,
        error: error.message
      });
    }
  }
  
  return results;
}

module.exports = {
  calculateGratuity,
  calculateBulkGratuity
};



