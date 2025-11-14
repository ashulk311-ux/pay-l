const { Employee, SalaryStructure, Attendance, Leave, Loan, Reimbursement, SupplementarySalary, StatutoryConfig } = require('../models');
const { Op } = require('sequelize');
const statutoryCalculationService = require('./statutoryCalculationService');
const logger = require('../utils/logger');

/**
 * Calculate payroll for a single employee
 * @param {Object} employee - Employee object
 * @param {Object} payroll - Payroll object
 * @param {Object} attendanceData - Attendance data for the month
 * @param {Object} options - Additional options
 * @returns {Object} Calculated payroll data
 */
async function calculateEmployeePayroll(employee, payroll, attendanceData, options = {}) {
  try {
    // Get active salary structure
    const salaryStructure = await SalaryStructure.findOne({
      where: {
        employeeId: employee.id,
        isActive: true
      },
      order: [['effectiveDate', 'DESC']]
    });

    if (!salaryStructure) {
      throw new Error(`No active salary structure found for employee ${employee.employeeCode}`);
    }

    // Get attendance data
    const workingDays = attendanceData.workingDays || 0;
    const presentDays = attendanceData.presentDays || 0;
    const absentDays = attendanceData.absentDays || 0;
    const leaveDays = attendanceData.leaveDays || 0;
    const lopDays = attendanceData.lopDays || 0; // Loss of Pay days

    // Calculate basic earnings
    const basicSalary = parseFloat(salaryStructure.basicSalary) || 0;
    const hra = parseFloat(salaryStructure.hra) || 0;
    const specialAllowance = parseFloat(salaryStructure.specialAllowance) || 0;
    const otherAllowances = salaryStructure.otherAllowances || {};

    // Calculate prorated salary based on attendance
    const daysInMonth = workingDays + absentDays + leaveDays;
    const attendanceRatio = daysInMonth > 0 ? presentDays / daysInMonth : 0;

    // Earnings
    const earnings = {
      basic: Math.round(basicSalary * attendanceRatio),
      hra: Math.round(hra * attendanceRatio),
      specialAllowance: Math.round(specialAllowance * attendanceRatio),
      otherAllowances: {}
    };

    // Add other allowances
    let totalOtherAllowances = 0;
    if (typeof otherAllowances === 'object') {
      Object.keys(otherAllowances).forEach(key => {
        const amount = parseFloat(otherAllowances[key]) || 0;
        earnings.otherAllowances[key] = Math.round(amount * attendanceRatio);
        totalOtherAllowances += earnings.otherAllowances[key];
      });
    }

    // Calculate gross salary
    const grossSalary = earnings.basic + earnings.hra + earnings.specialAllowance + totalOtherAllowances;

    // Get supplementary salary (arrears, incentives, etc.)
    const supplementarySalaries = await SupplementarySalary.findAll({
      where: {
        employeeId: employee.id,
        payrollMonth: payroll.month,
        payrollYear: payroll.year,
        status: 'approved'
      }
    });

    let totalSupplementary = 0;
    supplementarySalaries.forEach(sup => {
      totalSupplementary += parseFloat(sup.amount) || 0;
      if (!earnings.otherAllowances['Supplementary']) {
        earnings.otherAllowances['Supplementary'] = 0;
      }
      earnings.otherAllowances['Supplementary'] += parseFloat(sup.amount) || 0;
    });

    const adjustedGrossSalary = grossSalary + totalSupplementary;

    // Deductions
    const deductions = {
      pf: 0,
      esi: 0,
      tds: 0,
      pt: 0,
      lwf: 0,
      loan: 0,
      otherDeductions: {}
    };

    // Get statutory config for employee's company
    const statutoryConfig = await StatutoryConfig.findOne({
      where: { companyId: employee.companyId, isActive: true }
    });

    // Calculate statutory deductions
    if (statutoryConfig) {
      const statutoryDeductions = await statutoryCalculationService.calculateStatutoryDeductions(
        employee,
        adjustedGrossSalary,
        statutoryConfig,
        payroll
      );
      
      deductions.pf = statutoryDeductions.pf || 0;
      deductions.esi = statutoryDeductions.esi || 0;
      deductions.tds = statutoryDeductions.tds || 0;
      deductions.pt = statutoryDeductions.pt || 0;
      deductions.lwf = statutoryDeductions.lwf || 0;
    }

    // Calculate loan deductions
    const activeLoans = await Loan.findAll({
      where: {
        employeeId: employee.id,
        status: 'active'
      }
    });

    let totalLoanDeduction = 0;
    activeLoans.forEach(loan => {
      const emi = parseFloat(loan.monthlyEmi) || 0;
      totalLoanDeduction += emi;
    });
    deductions.loan = totalLoanDeduction;

    // Add other deductions from salary structure
    const structureDeductions = salaryStructure.deductions || {};
    if (typeof structureDeductions === 'object') {
      Object.keys(structureDeductions).forEach(key => {
        const amount = parseFloat(structureDeductions[key]) || 0;
        deductions.otherDeductions[key] = amount;
      });
    }

    // Calculate total deductions
    const totalDeductions = 
      deductions.pf + 
      deductions.esi + 
      deductions.tds + 
      deductions.pt + 
      deductions.lwf + 
      deductions.loan +
      Object.values(deductions.otherDeductions).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

    // Calculate net salary
    const netSalary = Math.max(0, adjustedGrossSalary - totalDeductions);

    return {
      employeeId: employee.id,
      employeeCode: employee.employeeCode,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      workingDays,
      presentDays,
      absentDays,
      leaveDays,
      lopDays,
      earnings: {
        ...earnings,
        totalOtherAllowances,
        grossSalary,
        supplementary: totalSupplementary,
        adjustedGrossSalary
      },
      deductions: {
        ...deductions,
        totalDeductions
      },
      netSalary,
      salaryStructureId: salaryStructure.id
    };
  } catch (error) {
    logger.error(`Error calculating payroll for employee ${employee.id}:`, error);
    throw error;
  }
}

/**
 * Calculate payroll for all employees in a company
 * @param {Object} payroll - Payroll object
 * @param {Object} options - Additional options
 * @returns {Array} Array of calculated payroll data for all employees
 */
async function calculateBulkPayroll(payroll, options = {}) {
  try {
    const employees = await Employee.findAll({
      where: {
        companyId: payroll.companyId,
        isActive: true
      }
    });

    const results = [];
    
    for (const employee of employees) {
      try {
        // Get attendance data for the month
        // Calculate date range for the month
        const startDate = new Date(payroll.year, payroll.month - 1, 1);
        const endDate = new Date(payroll.year, payroll.month, 0);
        
        const attendanceRecords = await Attendance.findAll({
          where: {
            employeeId: employee.id,
            date: {
              [Op.between]: [startDate, endDate]
            }
          }
        });

        // Calculate attendance summary
        const attendanceData = {
          workingDays: 0,
          presentDays: 0,
          absentDays: 0,
          leaveDays: 0,
          lopDays: 0
        };

        attendanceRecords.forEach(record => {
          if (record.status === 'present' || record.status === 'half-day') {
            attendanceData.presentDays += record.status === 'half-day' ? 0.5 : 1;
            attendanceData.workingDays++;
          } else if (record.status === 'absent') {
            attendanceData.absentDays++;
            attendanceData.lopDays++;
          } else if (record.status === 'holiday' || record.status === 'weekend') {
            // Holidays and weekends don't count as working days for salary calculation
          }
        });
        
        // Also check leave records
        const leaveRecords = await Leave.findAll({
          where: {
            employeeId: employee.id,
            startDate: {
              [Op.lte]: endDate
            },
            endDate: {
              [Op.gte]: startDate
            },
            status: 'approved'
          }
        });
        
        leaveRecords.forEach(leave => {
          // Calculate overlapping days
          const leaveStart = new Date(Math.max(new Date(leave.startDate).getTime(), startDate.getTime()));
          const leaveEnd = new Date(Math.min(new Date(leave.endDate).getTime(), endDate.getTime()));
          const leaveDays = Math.ceil((leaveEnd - leaveStart) / (1000 * 60 * 60 * 24)) + 1;
          attendanceData.leaveDays += leaveDays;
          attendanceData.workingDays += leaveDays;
        });

        const calculatedPayroll = await calculateEmployeePayroll(
          employee,
          payroll,
          attendanceData,
          options
        );

        results.push(calculatedPayroll);
      } catch (error) {
        logger.error(`Error processing employee ${employee.id}:`, error);
        results.push({
          employeeId: employee.id,
          employeeCode: employee.employeeCode,
          error: error.message
        });
      }
    }

    return results;
  } catch (error) {
    logger.error('Error calculating bulk payroll:', error);
    throw error;
  }
}

module.exports = {
  calculateEmployeePayroll,
  calculateBulkPayroll
};

