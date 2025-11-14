const { Payslip, Employee, Payroll, StatutoryConfig, AuditLog } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

/**
 * Generate PF (Provident Fund) Report
 * @param {String} companyId - Company ID
 * @param {Number} month - Month
 * @param {Number} year - Year
 * @returns {Array} PF report data
 */
async function generatePFReport(companyId, month, year) {
  try {
    const payroll = await Payroll.findOne({
      where: { companyId, month, year, status: { [Op.in]: ['locked', 'finalized', 'paid'] } }
    });

    if (!payroll) {
      throw new Error(`No finalized payroll found for ${month}/${year}`);
    }

    const payslips = await Payslip.findAll({
      where: { payrollId: payroll.id },
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'uan', 'pan']
      }]
    });

    const reportData = payslips
      .filter(p => p.deductions && p.deductions.pf > 0)
      .map(payslip => {
        const deductions = payslip.deductions || {};
        const pfDetails = deductions.details?.pf || {};
        
        return {
          'Employee Code': payslip.employee.employeeCode,
          'Employee Name': `${payslip.employee.firstName} ${payslip.employee.lastName}`,
          'UAN': payslip.employee.uan || '',
          'PAN': payslip.employee.pan || '',
          'PF Base': pfDetails.base || 0,
          'Employee PF': deductions.pf || 0,
          'Employer PF': pfDetails.employer || 0,
          'Total PF': (deductions.pf || 0) + (pfDetails.employer || 0),
          'Gross Salary': parseFloat(payslip.grossSalary) || 0
        };
      });

    return {
      month,
      year,
      companyId,
      totalEmployees: reportData.length,
      totalEmployeePF: reportData.reduce((sum, r) => sum + r['Employee PF'], 0),
      totalEmployerPF: reportData.reduce((sum, r) => sum + r['Employer PF'], 0),
      totalPF: reportData.reduce((sum, r) => sum + r['Total PF'], 0),
      data: reportData
    };
  } catch (error) {
    logger.error('Error generating PF report:', error);
    throw error;
  }
}

/**
 * Generate ESI (Employee State Insurance) Report
 * @param {String} companyId - Company ID
 * @param {Number} month - Month
 * @param {Number} year - Year
 * @returns {Array} ESI report data
 */
async function generateESIReport(companyId, month, year) {
  try {
    const payroll = await Payroll.findOne({
      where: { companyId, month, year, status: { [Op.in]: ['locked', 'finalized', 'paid'] } }
    });

    if (!payroll) {
      throw new Error(`No finalized payroll found for ${month}/${year}`);
    }

    const payslips = await Payslip.findAll({
      where: { payrollId: payroll.id },
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'employeeCode', 'firstName', 'lastName']
      }]
    });

    const reportData = payslips
      .filter(p => p.deductions && p.deductions.esi > 0)
      .map(payslip => {
        const deductions = payslip.deductions || {};
        const esiDetails = deductions.details?.esi || {};
        
        return {
          'Employee Code': payslip.employee.employeeCode,
          'Employee Name': `${payslip.employee.firstName} ${payslip.employee.lastName}`,
          'ESI Base': esiDetails.base || 0,
          'Employee ESI': deductions.esi || 0,
          'Employer ESI': esiDetails.employer || 0,
          'Total ESI': (deductions.esi || 0) + (esiDetails.employer || 0),
          'Gross Salary': parseFloat(payslip.grossSalary) || 0
        };
      });

    return {
      month,
      year,
      companyId,
      totalEmployees: reportData.length,
      totalEmployeeESI: reportData.reduce((sum, r) => sum + r['Employee ESI'], 0),
      totalEmployerESI: reportData.reduce((sum, r) => sum + r['Employer ESI'], 0),
      totalESI: reportData.reduce((sum, r) => sum + r['Total ESI'], 0),
      data: reportData
    };
  } catch (error) {
    logger.error('Error generating ESI report:', error);
    throw error;
  }
}

/**
 * Generate TDS (Tax Deducted at Source) Report
 * @param {String} companyId - Company ID
 * @param {Number} month - Month
 * @param {Number} year - Year
 * @returns {Array} TDS report data
 */
async function generateTDSReport(companyId, month, year) {
  try {
    const payroll = await Payroll.findOne({
      where: { companyId, month, year, status: { [Op.in]: ['locked', 'finalized', 'paid'] } }
    });

    if (!payroll) {
      throw new Error(`No finalized payroll found for ${month}/${year}`);
    }

    const payslips = await Payslip.findAll({
      where: { payrollId: payroll.id },
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'pan']
      }]
    });

    const reportData = payslips
      .filter(p => p.deductions && p.deductions.tds > 0)
      .map(payslip => {
        const deductions = payslip.deductions || {};
        const tdsDetails = deductions.details?.tds || {};
        
        return {
          'Employee Code': payslip.employee.employeeCode,
          'Employee Name': `${payslip.employee.firstName} ${payslip.employee.lastName}`,
          'PAN': payslip.employee.pan || '',
          'Annual Taxable Income': tdsDetails.annualTaxableIncome || 0,
          'Annual Tax': tdsDetails.annualTax || 0,
          'Monthly TDS': deductions.tds || 0,
          'Regime': tdsDetails.regime || 'new',
          'Gross Salary': parseFloat(payslip.grossSalary) || 0
        };
      });

    return {
      month,
      year,
      companyId,
      totalEmployees: reportData.length,
      totalTDS: reportData.reduce((sum, r) => sum + r['Monthly TDS'], 0),
      data: reportData
    };
  } catch (error) {
    logger.error('Error generating TDS report:', error);
    throw error;
  }
}

/**
 * Generate PT (Professional Tax) Report
 * @param {String} companyId - Company ID
 * @param {Number} month - Month
 * @param {Number} year - Year
 * @returns {Array} PT report data
 */
async function generatePTReport(companyId, month, year) {
  try {
    const payroll = await Payroll.findOne({
      where: { companyId, month, year, status: { [Op.in]: ['locked', 'finalized', 'paid'] } }
    });

    if (!payroll) {
      throw new Error(`No finalized payroll found for ${month}/${year}`);
    }

    const payslips = await Payslip.findAll({
      where: { payrollId: payroll.id },
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'state']
      }]
    });

    const reportData = payslips
      .filter(p => p.deductions && p.deductions.pt > 0)
      .map(payslip => {
        const deductions = payslip.deductions || {};
        
        return {
          'Employee Code': payslip.employee.employeeCode,
          'Employee Name': `${payslip.employee.firstName} ${payslip.employee.lastName}`,
          'State': payslip.employee.state || '',
          'Professional Tax': deductions.pt || 0,
          'Gross Salary': parseFloat(payslip.grossSalary) || 0
        };
      });

    return {
      month,
      year,
      companyId,
      totalEmployees: reportData.length,
      totalPT: reportData.reduce((sum, r) => sum + r['Professional Tax'], 0),
      data: reportData
    };
  } catch (error) {
    logger.error('Error generating PT report:', error);
    throw error;
  }
}

/**
 * Generate Salary Register Report
 * @param {String} companyId - Company ID
 * @param {Number} month - Month
 * @param {Number} year - Year
 * @returns {Array} Salary register data
 */
async function generateSalaryRegister(companyId, month, year) {
  try {
    const payroll = await Payroll.findOne({
      where: { companyId, month, year, status: { [Op.in]: ['locked', 'finalized', 'paid'] } }
    });

    if (!payroll) {
      throw new Error(`No finalized payroll found for ${month}/${year}`);
    }

    const payslips = await Payslip.findAll({
      where: { payrollId: payroll.id },
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'designation', 'department']
      }],
      order: [['employee', 'employeeCode', 'ASC']]
    });

    const reportData = payslips.map(payslip => {
      const earnings = payslip.earnings || {};
      const deductions = payslip.deductions || {};
      
      return {
        'Employee Code': payslip.employee.employeeCode,
        'Employee Name': `${payslip.employee.firstName} ${payslip.employee.lastName}`,
        'Designation': payslip.employee.designation || '',
        'Department': payslip.employee.department || '',
        'Basic': earnings.basic || 0,
        'HRA': earnings.hra || 0,
        'Special Allowance': earnings.specialAllowance || 0,
        'Other Allowances': earnings.totalOtherAllowances || 0,
        'Gross Salary': parseFloat(payslip.grossSalary) || 0,
        'PF': deductions.pf || 0,
        'ESI': deductions.esi || 0,
        'TDS': deductions.tds || 0,
        'PT': deductions.pt || 0,
        'LWF': deductions.lwf || 0,
        'Loan': deductions.loan || 0,
        'Other Deductions': Object.values(deductions.otherDeductions || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0),
        'Total Deductions': parseFloat(payslip.totalDeductions) || 0,
        'Net Salary': parseFloat(payslip.netSalary) || 0,
        'Days Worked': payslip.daysWorked || 0,
        'Days Present': payslip.daysPresent || 0
      };
    });

    return {
      month,
      year,
      companyId,
      totalEmployees: reportData.length,
      totalGross: reportData.reduce((sum, r) => sum + r['Gross Salary'], 0),
      totalDeductions: reportData.reduce((sum, r) => sum + r['Total Deductions'], 0),
      totalNet: reportData.reduce((sum, r) => sum + r['Net Salary'], 0),
      data: reportData
    };
  } catch (error) {
    logger.error('Error generating salary register:', error);
    throw error;
  }
}

/**
 * Generate Bank Transfer Report (NEFT format)
 * @param {String} companyId - Company ID
 * @param {Number} month - Month
 * @param {Number} year - Year
 * @returns {Array} Bank transfer data in NEFT format
 */
async function generateBankTransferReport(companyId, month, year) {
  try {
    const payroll = await Payroll.findOne({
      where: { companyId, month, year, status: { [Op.in]: ['locked', 'finalized', 'paid'] } }
    });

    if (!payroll) {
      throw new Error(`No finalized payroll found for ${month}/${year}`);
    }

    const payslips = await Payslip.findAll({
      where: { payrollId: payroll.id },
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'bankAccountNumber', 'bankIfsc', 'bankName']
      }]
    });

    const reportData = payslips
      .filter(p => p.employee.bankAccountNumber && p.employee.bankIfsc)
      .map(payslip => {
        return {
          'Employee Code': payslip.employee.employeeCode,
          'Employee Name': `${payslip.employee.firstName} ${payslip.employee.lastName}`,
          'Bank Name': payslip.employee.bankName || '',
          'Account Number': payslip.employee.bankAccountNumber,
          'IFSC Code': payslip.employee.bankIfsc,
          'Amount': parseFloat(payslip.netSalary) || 0,
          'Remarks': `Salary for ${month}/${year}`
        };
      });

    return {
      month,
      year,
      companyId,
      totalEmployees: reportData.length,
      totalAmount: reportData.reduce((sum, r) => sum + r['Amount'], 0),
      data: reportData
    };
  } catch (error) {
    logger.error('Error generating bank transfer report:', error);
    throw error;
  }
}

/**
 * Generate Reconciliation Report (compare current month with previous 2 months)
 * @param {String} companyId - Company ID
 * @param {Number} month - Month
 * @param {Number} year - Year
 * @returns {Object} Reconciliation data
 */
async function generateReconciliationReport(companyId, month, year) {
  try {
    // Get current month payroll
    const currentPayroll = await Payroll.findOne({
      where: { companyId, month, year, status: { [Op.in]: ['locked', 'finalized', 'paid'] } }
    });

    if (!currentPayroll) {
      throw new Error(`No finalized payroll found for ${month}/${year}`);
    }

    // Calculate previous months
    let prevMonth1 = month - 1;
    let prevYear1 = year;
    if (prevMonth1 < 1) {
      prevMonth1 = 12;
      prevYear1 = year - 1;
    }

    let prevMonth2 = prevMonth1 - 1;
    let prevYear2 = prevYear1;
    if (prevMonth2 < 1) {
      prevMonth2 = 12;
      prevYear2 = prevYear1 - 1;
    }

    // Get previous month payrolls
    const prevPayroll1 = await Payroll.findOne({
      where: { companyId, month: prevMonth1, year: prevYear1 }
    });

    const prevPayroll2 = await Payroll.findOne({
      where: { companyId, month: prevMonth2, year: prevYear2 }
    });

    const comparison = {
      current: {
        month,
        year,
        totalEmployees: currentPayroll.totalEmployees || 0,
        totalGross: parseFloat(currentPayroll.totalGrossSalary) || 0,
        totalDeductions: parseFloat(currentPayroll.totalDeductions) || 0,
        totalNet: parseFloat(currentPayroll.totalNetSalary) || 0
      },
      previous1: prevPayroll1 ? {
        month: prevMonth1,
        year: prevYear1,
        totalEmployees: prevPayroll1.totalEmployees || 0,
        totalGross: parseFloat(prevPayroll1.totalGrossSalary) || 0,
        totalDeductions: parseFloat(prevPayroll1.totalDeductions) || 0,
        totalNet: parseFloat(prevPayroll1.totalNetSalary) || 0
      } : null,
      previous2: prevPayroll2 ? {
        month: prevMonth2,
        year: prevYear2,
        totalEmployees: prevPayroll2.totalEmployees || 0,
        totalGross: parseFloat(prevPayroll2.totalGrossSalary) || 0,
        totalDeductions: parseFloat(prevPayroll2.totalDeductions) || 0,
        totalNet: parseFloat(prevPayroll2.totalNetSalary) || 0
      } : null
    };

    // Calculate variations
    const variations = {
      vsPrevious1: prevPayroll1 ? {
        employees: comparison.current.totalEmployees - comparison.previous1.totalEmployees,
        gross: comparison.current.totalGross - comparison.previous1.totalGross,
        deductions: comparison.current.totalDeductions - comparison.previous1.totalDeductions,
        net: comparison.current.totalNet - comparison.previous1.totalNet
      } : null,
      vsPrevious2: prevPayroll2 ? {
        employees: comparison.current.totalEmployees - comparison.previous2.totalEmployees,
        gross: comparison.current.totalGross - comparison.previous2.totalGross,
        deductions: comparison.current.totalDeductions - comparison.previous2.totalDeductions,
        net: comparison.current.totalNet - comparison.previous2.totalNet
      } : null
    };

    return {
      companyId,
      comparison,
      variations
    };
  } catch (error) {
    logger.error('Error generating reconciliation report:', error);
    throw error;
  }
}

/**
 * Export report to Excel
 * @param {Array} data - Report data array
 * @param {String} filename - Output filename
 * @returns {String} Path to generated Excel file
 */
function exportReportToExcel(data, filename) {
  try {
    const reportsDir = path.join(__dirname, '../../uploads/reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filepath = path.join(reportsDir, filename);
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

    // Auto-size columns
    const maxWidth = 20;
    const colWidths = data.length > 0 ? Object.keys(data[0]).map(key => ({
      wch: Math.min(Math.max(key.length, 12), maxWidth)
    })) : [];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, filepath);
    return filepath;
  } catch (error) {
    logger.error('Error exporting report to Excel:', error);
    throw error;
  }
}

module.exports = {
  generatePFReport,
  generateESIReport,
  generateTDSReport,
  generatePTReport,
  generateSalaryRegister,
  generateBankTransferReport,
  generateReconciliationReport,
  exportReportToExcel
};

