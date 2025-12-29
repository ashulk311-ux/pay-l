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
async function generateBankTransferReport(companyId, month, year, bankName = null) {
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

    let filteredPayslips = payslips.filter(p => p.employee.bankAccountNumber && p.employee.bankIfsc);
    
    // Filter by bank name if provided
    if (bankName) {
      filteredPayslips = filteredPayslips.filter(p => 
        p.employee.bankName && p.employee.bankName.toLowerCase().includes(bankName.toLowerCase())
      );
    }

    const reportData = filteredPayslips.map(payslip => {
      return {
        'Employee Code': payslip.employee.employeeCode,
        'Employee Name': `${payslip.employee.firstName} ${payslip.employee.lastName}`,
        'Bank Name': payslip.employee.bankName || '',
        'Account Number': payslip.employee.bankAccountNumber,
        'IFSC': payslip.employee.bankIfsc,
        'IFSC Code': payslip.employee.bankIfsc,
        'Amount': parseFloat(payslip.netSalary) || 0,
        'Beneficiary Name': `${payslip.employee.firstName} ${payslip.employee.lastName}`,
        'Remarks': `Salary for ${month}/${year}`
      };
    });

    // Group by bank for summary
    const bankWiseSummary = {};
    reportData.forEach(row => {
      const bank = row['Bank Name'] || 'Unknown';
      if (!bankWiseSummary[bank]) {
        bankWiseSummary[bank] = { count: 0, total: 0 };
      }
      bankWiseSummary[bank].count++;
      bankWiseSummary[bank].total += row['Amount'];
    });

    return {
      month,
      year,
      companyId,
      totalEmployees: reportData.length,
      totalAmount: reportData.reduce((sum, r) => sum + r['Amount'], 0),
      bankWiseSummary,
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
      where: { companyId, month: prevMonth1, year: prevYear1, status: { [Op.in]: ['locked', 'finalized', 'paid'] } }
    });

    const prevPayroll2 = await Payroll.findOne({
      where: { companyId, month: prevMonth2, year: prevYear2, status: { [Op.in]: ['locked', 'finalized', 'paid'] } }
    });

    // Get current month payslips
    const currentPayslips = await Payslip.findAll({
      where: { payrollId: currentPayroll.id },
      include: [{ model: Employee, as: 'employee' }]
    });

    // Get previous month payslips for comparison
    const prevPayslips1 = prevPayroll1 ? await Payslip.findAll({
      where: { payrollId: prevPayroll1.id },
      include: [{ model: Employee, as: 'employee' }]
    }) : [];

    const prevPayslips2 = prevPayroll2 ? await Payslip.findAll({
      where: { payrollId: prevPayroll2.id },
      include: [{ model: Employee, as: 'employee' }]
    }) : [];

    // Create comparison data
    const comparison = {
      current: {
        month,
        year,
        totalEmployees: currentPayslips.length,
        totalGross: currentPayroll.totalGrossSalary,
        totalDeductions: currentPayroll.totalDeductions,
        totalNet: currentPayroll.totalNetSalary
      },
      previous1: prevPayroll1 ? {
        month: prevMonth1,
        year: prevYear1,
        totalEmployees: prevPayslips1.length,
        totalGross: prevPayroll1.totalGrossSalary,
        totalDeductions: prevPayroll1.totalDeductions,
        totalNet: prevPayroll1.totalNetSalary
      } : null,
      previous2: prevPayroll2 ? {
        month: prevMonth2,
        year: prevYear2,
        totalEmployees: prevPayslips2.length,
        totalGross: prevPayroll2.totalGrossSalary,
        totalDeductions: prevPayroll2.totalDeductions,
        totalNet: prevPayroll2.totalNetSalary
      } : null
    };

    // Calculate variations
    const variations = {
      vsPrevious1: prevPayroll1 ? {
        grossChange: currentPayroll.totalGrossSalary - prevPayroll1.totalGrossSalary,
        grossChangePercent: ((currentPayroll.totalGrossSalary - prevPayroll1.totalGrossSalary) / prevPayroll1.totalGrossSalary * 100).toFixed(2),
        netChange: currentPayroll.totalNetSalary - prevPayroll1.totalNetSalary,
        netChangePercent: ((currentPayroll.totalNetSalary - prevPayroll1.totalNetSalary) / prevPayroll1.totalNetSalary * 100).toFixed(2),
        employeeChange: currentPayslips.length - prevPayslips1.length
      } : null,
      vsPrevious2: prevPayroll2 ? {
        grossChange: currentPayroll.totalGrossSalary - prevPayroll2.totalGrossSalary,
        grossChangePercent: ((currentPayroll.totalGrossSalary - prevPayroll2.totalGrossSalary) / prevPayroll2.totalGrossSalary * 100).toFixed(2),
        netChange: currentPayroll.totalNetSalary - prevPayroll2.totalNetSalary,
        netChangePercent: ((currentPayroll.totalNetSalary - prevPayroll2.totalNetSalary) / prevPayroll2.totalNetSalary * 100).toFixed(2),
        employeeChange: currentPayslips.length - prevPayslips2.length
      } : null
    };

    // Salary variation tracker - employee-wise
    const salaryVariations = [];
    currentPayslips.forEach(currentPayslip => {
      const employeeCode = currentPayslip.employee.employeeCode;
      const prevPayslip1 = prevPayslips1.find(p => p.employee.employeeCode === employeeCode);
      const prevPayslip2 = prevPayslips2.find(p => p.employee.employeeCode === employeeCode);

      const variation = {
        'Employee Code': employeeCode,
        'Employee Name': `${currentPayslip.employee.firstName} ${currentPayslip.employee.lastName}`,
        'Current Gross': parseFloat(currentPayslip.grossSalary || 0),
        'Current Net': parseFloat(currentPayslip.netSalary || 0),
        'Previous Month 1 Gross': prevPayslip1 ? parseFloat(prevPayslip1.grossSalary || 0) : 0,
        'Previous Month 1 Net': prevPayslip1 ? parseFloat(prevPayslip1.netSalary || 0) : 0,
        'Previous Month 2 Gross': prevPayslip2 ? parseFloat(prevPayslip2.grossSalary || 0) : 0,
        'Previous Month 2 Net': prevPayslip2 ? parseFloat(prevPayslip2.netSalary || 0) : 0,
        'Gross Change vs M-1': prevPayslip1 ? (parseFloat(currentPayslip.grossSalary || 0) - parseFloat(prevPayslip1.grossSalary || 0)).toFixed(2) : 0,
        'Net Change vs M-1': prevPayslip1 ? (parseFloat(currentPayslip.netSalary || 0) - parseFloat(prevPayslip1.netSalary || 0)).toFixed(2) : 0,
        'Gross Change vs M-2': prevPayslip2 ? (parseFloat(currentPayslip.grossSalary || 0) - parseFloat(prevPayslip2.grossSalary || 0)).toFixed(2) : 0,
        'Net Change vs M-2': prevPayslip2 ? (parseFloat(currentPayslip.netSalary || 0) - parseFloat(prevPayslip2.netSalary || 0)).toFixed(2) : 0
      };
      salaryVariations.push(variation);
    });

    return {
      month,
      year,
      companyId,
      comparison,
      variations,
      salaryVariations,
      data: [
        {
          'Period': `${month}/${year}`,
          'Type': 'Current',
          'Employees': comparison.current.totalEmployees,
          'Gross Salary': comparison.current.totalGross,
          'Deductions': comparison.current.totalDeductions,
          'Net Salary': comparison.current.totalNet
        },
        ...(comparison.previous1 ? [{
          'Period': `${prevMonth1}/${prevYear1}`,
          'Type': 'Previous Month 1',
          'Employees': comparison.previous1.totalEmployees,
          'Gross Salary': comparison.previous1.totalGross,
          'Deductions': comparison.previous1.totalDeductions,
          'Net Salary': comparison.previous1.totalNet
        }] : []),
        ...(comparison.previous2 ? [{
          'Period': `${prevMonth2}/${prevYear2}`,
          'Type': 'Previous Month 2',
          'Employees': comparison.previous2.totalEmployees,
          'Gross Salary': comparison.previous2.totalGross,
          'Deductions': comparison.previous2.totalDeductions,
          'Net Salary': comparison.previous2.totalNet
        }] : [])
      ]
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
function exportReportToExcel(data, filename, format = 'excel') {
  try {
    const reportsDir = path.join(__dirname, '../../uploads/reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filepath = path.join(reportsDir, filename);
    
    if (format === 'csv') {
      // CSV export
      const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(data));
      fs.writeFileSync(filepath, csv);
      return filepath;
    }
    
    // Excel export
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

/**
 * Export Bank Transfer Report in NEFT format
 */
function exportBankTransferReport(data, filename, format = 'excel') {
  try {
    const reportsDir = path.join(__dirname, '../../uploads/reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filepath = path.join(reportsDir, filename);
    
    if (format === 'neft') {
      // NEFT format: Fixed width format
      let neftContent = '';
      data.forEach((row, index) => {
        // NEFT format: Account Number (15), IFSC (11), Amount (13), Beneficiary Name (40), Remarks (30)
        const accountNumber = (row['Account Number'] || '').padStart(15, '0');
        const ifsc = (row['IFSC'] || '').padEnd(11, ' ');
        const amount = (parseFloat(row['Amount'] || 0) * 100).toFixed(0).padStart(13, '0'); // Amount in paise
        const beneficiaryName = (row['Beneficiary Name'] || '').substring(0, 40).padEnd(40, ' ');
        const remarks = (row['Remarks'] || '').substring(0, 30).padEnd(30, ' ');
        neftContent += `${accountNumber}${ifsc}${amount}${beneficiaryName}${remarks}\n`;
      });
      fs.writeFileSync(filepath, neftContent);
      return filepath;
    }
    
    return exportReportToExcel(data, filename, format);
  } catch (error) {
    logger.error('Error exporting bank transfer report:', error);
    throw error;
  }
}

/**
 * Generate Payroll Summary (Head-wise)
 */
async function generatePayrollSummary(companyId, month, year) {
  try {
    const payroll = await Payroll.findOne({
      where: { companyId, month, year, status: { [Op.in]: ['locked', 'finalized', 'paid'] } }
    });

    if (!payroll) {
      return { success: false, message: 'Payroll not found for the specified month/year' };
    }

    const payslips = await Payslip.findAll({
      where: { payrollId: payroll.id },
      include: [{ model: Employee, as: 'employee' }]
    });

    const headWiseSummary = {};
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    payslips.forEach(payslip => {
      const earnings = payslip.earnings || {};
      const deductions = payslip.deductions || {};

      // Process earnings
      Object.keys(earnings).forEach(head => {
        if (head !== 'adjustedGrossSalary' && head !== 'totalEarnings') {
          if (!headWiseSummary[head]) {
            headWiseSummary[head] = { type: 'earning', total: 0, count: 0 };
          }
          headWiseSummary[head].total += parseFloat(earnings[head] || 0);
          headWiseSummary[head].count++;
        }
      });

      // Process deductions
      Object.keys(deductions).forEach(head => {
        if (head !== 'totalDeductions') {
          if (!headWiseSummary[head]) {
            headWiseSummary[head] = { type: 'deduction', total: 0, count: 0 };
          }
          headWiseSummary[head].total += parseFloat(deductions[head] || 0);
          headWiseSummary[head].count++;
        }
      });

      totalGross += parseFloat(payslip.grossSalary || 0);
      totalDeductions += parseFloat(payslip.totalDeductions || 0);
      totalNet += parseFloat(payslip.netSalary || 0);
    });

    const summaryData = Object.keys(headWiseSummary).map(head => ({
      'Salary Head': head,
      'Type': headWiseSummary[head].type === 'earning' ? 'Earning' : 'Deduction',
      'Total Amount': headWiseSummary[head].total.toFixed(2),
      'Employee Count': headWiseSummary[head].count
    }));

    return {
      success: true,
      data: summaryData,
      summary: {
        totalGross,
        totalDeductions,
        totalNet,
        totalEmployees: payslips.length
      }
    };
  } catch (error) {
    logger.error('Error generating payroll summary:', error);
    throw error;
  }
}

/**
 * Execute Custom Report
 */
async function executeCustomReport(report, params = {}) {
  try {
    const { dataSource, filters, columns, grouping, sorting, aggregations } = report;
    
    let query;
    let model;
    
    // Determine model based on data source
    switch (dataSource) {
      case 'payroll':
        model = Payslip;
        break;
      case 'employee':
        model = Employee;
        break;
      case 'attendance':
        model = require('../models').Attendance;
        break;
      case 'leave':
        model = require('../models').LeaveRequest;
        break;
      case 'loan':
        model = require('../models').Loan;
        break;
      case 'reimbursement':
        model = require('../models').Reimbursement;
        break;
      default:
        throw new Error('Invalid data source');
    }
    
    // Build query
    const whereClause = { companyId: report.companyId, ...filters, ...params };
    
    query = {
      where: whereClause,
      limit: params.limit || 1000
    };
    
    // Apply sorting
    if (sorting && sorting.length > 0) {
      query.order = sorting.map(s => [s.field, s.direction || 'ASC']);
    }
    
    // Execute query
    const results = await model.findAll(query);
    
    // Transform results based on selected columns
    let transformedData = results.map(row => {
      const rowData = row.toJSON();
      if (columns && columns.length > 0) {
        const filtered = {};
        columns.forEach(col => {
          filtered[col] = rowData[col];
        });
        return filtered;
      }
      return rowData;
    });
    
    // Apply grouping and aggregations
    if (grouping && grouping.length > 0 && aggregations && aggregations.length > 0) {
      const grouped = {};
      transformedData.forEach(row => {
        const groupKey = grouping.map(g => row[g]).join('|');
        if (!grouped[groupKey]) {
          grouped[groupKey] = { ...row };
          aggregations.forEach(agg => {
            grouped[groupKey][agg.field] = 0;
          });
        }
        aggregations.forEach(agg => {
          if (agg.function === 'sum') {
            grouped[groupKey][agg.field] += parseFloat(row[agg.field] || 0);
          } else if (agg.function === 'count') {
            grouped[groupKey][agg.field]++;
          } else if (agg.function === 'avg') {
            grouped[groupKey][agg.field] = (grouped[groupKey][agg.field] + parseFloat(row[agg.field] || 0)) / 2;
          }
        });
      });
      transformedData = Object.values(grouped);
    }
    
    return {
      success: true,
      data: transformedData,
      count: transformedData.length
    };
  } catch (error) {
    logger.error('Error executing custom report:', error);
    throw error;
  }
}

module.exports = {
  generatePFReport,
  generateESIReport,
  generateTDSReport,
  generatePTReport,
  generateSalaryRegister,
  generatePayrollSummary,
  generateBankTransferReport,
  generateReconciliationReport,
  exportReportToExcel,
  exportBankTransferReport,
  executeCustomReport
};

