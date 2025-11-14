const logger = require('../utils/logger');

/**
 * Calculate PF (Provident Fund) deduction
 * @param {Number} grossSalary - Gross salary
 * @param {Object} config - PF configuration
 * @returns {Number} PF deduction amount
 */
function calculatePF(grossSalary, config) {
  if (!config || !config.pfEnabled) {
    return 0;
  }

  const pfWageLimit = parseFloat(config.pfWageLimit) || 15000;
  const pfEmployeeRate = parseFloat(config.pfEmployeeRate) || 12; // 12%
  const pfEmployerRate = parseFloat(config.pfEmployerRate) || 12; // 12%

  // PF is calculated on minimum of (gross salary, wage limit)
  const pfBase = Math.min(grossSalary, pfWageLimit);
  const pfDeduction = Math.round((pfBase * pfEmployeeRate) / 100);

  return {
    employee: pfDeduction,
    employer: Math.round((pfBase * pfEmployerRate) / 100),
    base: pfBase
  };
}

/**
 * Calculate ESI (Employee State Insurance) deduction
 * @param {Number} grossSalary - Gross salary
 * @param {Object} config - ESI configuration
 * @returns {Number} ESI deduction amount
 */
function calculateESI(grossSalary, config) {
  if (!config || !config.esiEnabled) {
    return 0;
  }

  const esiWageLimit = parseFloat(config.esiWageLimit) || 21000;
  const esiEmployeeRate = parseFloat(config.esiEmployeeRate) || 0.75; // 0.75%
  const esiEmployerRate = parseFloat(config.esiEmployerRate) || 3.25; // 3.25%

  if (grossSalary > esiWageLimit) {
    return { employee: 0, employer: 0, base: 0 };
  }

  const esiDeduction = Math.round((grossSalary * esiEmployeeRate) / 100);

  return {
    employee: esiDeduction,
    employer: Math.round((grossSalary * esiEmployerRate) / 100),
    base: grossSalary
  };
}

/**
 * Calculate TDS (Tax Deducted at Source) / Income Tax
 * @param {Number} grossSalary - Gross salary
 * @param {Object} employee - Employee object
 * @param {Object} config - TDS configuration
 * @param {Number} financialYear - Financial year
 * @returns {Number} TDS deduction amount
 */
function calculateTDS(grossSalary, employee, config, financialYear) {
  if (!config || !config.tdsEnabled) {
    return 0;
  }

  // Get employee's tax regime (old or new)
  const regime = config.tdsRegime || 'new'; // 'old' or 'new'
  
  // Annual salary
  const annualSalary = grossSalary * 12;
  
  // Standard deduction (applicable in both regimes)
  const standardDeduction = 50000;
  
  // Get exemptions (HRA, LTA, etc.) - simplified for now
  const exemptions = parseFloat(employee.taxExemptions) || 0;
  
  // Taxable income
  const taxableIncome = Math.max(0, annualSalary - standardDeduction - exemptions);

  let tax = 0;

  if (regime === 'new') {
    // New tax regime (2023-24)
    if (taxableIncome <= 300000) {
      tax = 0;
    } else if (taxableIncome <= 700000) {
      tax = (taxableIncome - 300000) * 0.05;
    } else if (taxableIncome <= 1000000) {
      tax = 20000 + (taxableIncome - 700000) * 0.10;
    } else if (taxableIncome <= 1200000) {
      tax = 50000 + (taxableIncome - 1000000) * 0.15;
    } else if (taxableIncome <= 1500000) {
      tax = 80000 + (taxableIncome - 1200000) * 0.20;
    } else {
      tax = 140000 + (taxableIncome - 1500000) * 0.30;
    }
  } else {
    // Old tax regime
    if (taxableIncome <= 250000) {
      tax = 0;
    } else if (taxableIncome <= 500000) {
      tax = (taxableIncome - 250000) * 0.05;
    } else if (taxableIncome <= 1000000) {
      tax = 12500 + (taxableIncome - 500000) * 0.20;
    } else {
      tax = 112500 + (taxableIncome - 1000000) * 0.30;
    }
  }

  // Add cess (4% of tax)
  const cess = tax * 0.04;
  const totalTax = tax + cess;

  // Monthly TDS
  const monthlyTDS = Math.round(totalTax / 12);

  return {
    annualTaxableIncome: taxableIncome,
    annualTax: totalTax,
    monthlyTDS: monthlyTDS,
    regime: regime
  };
}

/**
 * Calculate PT (Professional Tax)
 * @param {Number} grossSalary - Gross salary
 * @param {String} state - Employee's state
 * @param {Object} config - PT configuration
 * @returns {Number} PT deduction amount
 */
function calculatePT(grossSalary, state, config) {
  if (!config || !config.ptEnabled) {
    return 0;
  }

  // Professional Tax slabs vary by state
  // Simplified calculation - can be enhanced with state-wise slabs
  const ptSlabs = config.ptSlabs || {
    default: [
      { min: 0, max: 5000, amount: 0 },
      { min: 5001, max: 10000, amount: 150 },
      { min: 10001, max: 15000, amount: 175 },
      { min: 15001, max: Infinity, amount: 200 }
    ]
  };

  const slabs = ptSlabs[state] || ptSlabs.default;
  
  for (const slab of slabs) {
    if (grossSalary >= slab.min && grossSalary <= slab.max) {
      return slab.amount;
    }
  }

  return 0;
}

/**
 * Calculate LWF (Labour Welfare Fund)
 * @param {Number} grossSalary - Gross salary
 * @param {Object} config - LWF configuration
 * @returns {Number} LWF deduction amount
 */
function calculateLWF(grossSalary, config) {
  if (!config || !config.lwfEnabled) {
    return 0;
  }

  const lwfEmployeeRate = parseFloat(config.lwfEmployeeRate) || 10;
  const lwfEmployerRate = parseFloat(config.lwfEmployerRate) || 20;

  return {
    employee: lwfEmployeeRate,
    employer: lwfEmployerRate
  };
}

/**
 * Calculate all statutory deductions
 * @param {Object} employee - Employee object
 * @param {Number} grossSalary - Gross salary
 * @param {Object} statutoryConfigs - Array of statutory configurations or single config
 * @param {Object} payroll - Payroll object
 * @returns {Object} All statutory deductions
 */
async function calculateStatutoryDeductions(employee, grossSalary, statutoryConfigs, payroll) {
  try {
    const { StatutoryConfig } = require('../models');
    
    // If single config object passed, fetch all configs for the company
    let configs = statutoryConfigs;
    if (!Array.isArray(configs)) {
      configs = await StatutoryConfig.findAll({
        where: {
          companyId: employee.companyId,
          isEnabled: true
        }
      });
    }

    const deductions = {
      pf: 0,
      esi: 0,
      tds: 0,
      pt: 0,
      lwf: 0,
      details: {}
    };

    // Process each statutory type
    for (const config of configs) {
      const configData = config.configuration || {};
      const state = employee.state || config.state || 'Maharashtra';

      switch (config.statutoryType) {
        case 'PF':
          const pfResult = calculatePF(grossSalary, {
            pfEnabled: config.isEnabled,
            pfWageLimit: configData.wageLimit || 15000,
            pfEmployeeRate: configData.employeeRate || 12,
            pfEmployerRate: configData.employerRate || 12
          });
          deductions.pf = pfResult.employee;
          deductions.details.pf = pfResult;
          break;

        case 'ESI':
          const esiResult = calculateESI(grossSalary, {
            esiEnabled: config.isEnabled,
            esiWageLimit: configData.wageLimit || 21000,
            esiEmployeeRate: configData.employeeRate || 0.75,
            esiEmployerRate: configData.employerRate || 3.25
          });
          deductions.esi = esiResult.employee;
          deductions.details.esi = esiResult;
          break;

        case 'TDS':
          const financialYear = payroll.month >= 4 ? payroll.year : payroll.year - 1;
          const tdsResult = calculateTDS(grossSalary, employee, {
            tdsEnabled: config.isEnabled,
            tdsRegime: config.tdsRegime || 'new',
            tdsSlabs: config.tdsSlabs || []
          }, financialYear);
          deductions.tds = tdsResult.monthlyTDS;
          deductions.details.tds = tdsResult;
          break;

        case 'PT':
          deductions.pt = calculatePT(grossSalary, state, {
            ptEnabled: config.isEnabled,
            ptSlabs: configData.slabs || {}
          });
          deductions.details.pt = { state, amount: deductions.pt };
          break;

        case 'LWF':
          const lwfResult = calculateLWF(grossSalary, {
            lwfEnabled: config.isEnabled,
            lwfEmployeeRate: configData.employeeRate || 10,
            lwfEmployerRate: configData.employerRate || 20
          });
          deductions.lwf = lwfResult.employee;
          deductions.details.lwf = lwfResult;
          break;
      }
    }

    return deductions;
  } catch (error) {
    logger.error('Error calculating statutory deductions:', error);
    throw error;
  }
}

module.exports = {
  calculatePF,
  calculateESI,
  calculateTDS,
  calculatePT,
  calculateLWF,
  calculateStatutoryDeductions
};

