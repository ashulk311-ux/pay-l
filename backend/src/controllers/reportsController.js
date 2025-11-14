const logger = require('../utils/logger');
const reportService = require('../services/reportService');
const { AuditLog, Employee, Payslip, Payroll } = require('../models');
const { Op } = require('sequelize');
const path = require('path');

/**
 * Get PF Report
 */
exports.getPFReport = async (req, res) => {
  try {
    const { month, year, format = 'json' } = req.query;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }

    const report = await reportService.generatePFReport(
      req.user.companyId,
      parseInt(month),
      parseInt(year)
    );

    if (format === 'excel') {
      const filename = `PF_Report_${month}_${year}_${Date.now()}.xlsx`;
      const filepath = reportService.exportReportToExcel(report.data, filename);
      const relativePath = filepath.replace(path.join(__dirname, '../../uploads/'), '');
      return res.json({
        success: true,
        message: 'PF report generated successfully',
        data: {
          ...report,
          excelPath: relativePath,
          downloadUrl: `/api/reports/download/${relativePath}`
        }
      });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    logger.error('Get PF report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate PF report', error: error.message });
  }
};

/**
 * Get ESI Report
 */
exports.getESIReport = async (req, res) => {
  try {
    const { month, year, format = 'json' } = req.query;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }

    const report = await reportService.generateESIReport(
      req.user.companyId,
      parseInt(month),
      parseInt(year)
    );

    if (format === 'excel') {
      const filename = `ESI_Report_${month}_${year}_${Date.now()}.xlsx`;
      const filepath = reportService.exportReportToExcel(report.data, filename);
      const relativePath = filepath.replace(path.join(__dirname, '../../uploads/'), '');
      return res.json({
        success: true,
        message: 'ESI report generated successfully',
        data: {
          ...report,
          excelPath: relativePath,
          downloadUrl: `/api/reports/download/${relativePath}`
        }
      });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    logger.error('Get ESI report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate ESI report', error: error.message });
  }
};

/**
 * Get TDS Report
 */
exports.getTDSReport = async (req, res) => {
  try {
    const { month, year, format = 'json' } = req.query;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }

    const report = await reportService.generateTDSReport(
      req.user.companyId,
      parseInt(month),
      parseInt(year)
    );

    if (format === 'excel') {
      const filename = `TDS_Report_${month}_${year}_${Date.now()}.xlsx`;
      const filepath = reportService.exportReportToExcel(report.data, filename);
      const relativePath = filepath.replace(path.join(__dirname, '../../uploads/'), '');
      return res.json({
        success: true,
        message: 'TDS report generated successfully',
        data: {
          ...report,
          excelPath: relativePath,
          downloadUrl: `/api/reports/download/${relativePath}`
        }
      });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    logger.error('Get TDS report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate TDS report', error: error.message });
  }
};

/**
 * Get PT Report
 */
exports.getPTReport = async (req, res) => {
  try {
    const { month, year, format = 'json' } = req.query;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }

    const report = await reportService.generatePTReport(
      req.user.companyId,
      parseInt(month),
      parseInt(year)
    );

    if (format === 'excel') {
      const filename = `PT_Report_${month}_${year}_${Date.now()}.xlsx`;
      const filepath = reportService.exportReportToExcel(report.data, filename);
      const relativePath = filepath.replace(path.join(__dirname, '../../uploads/'), '');
      return res.json({
        success: true,
        message: 'PT report generated successfully',
        data: {
          ...report,
          excelPath: relativePath,
          downloadUrl: `/api/reports/download/${relativePath}`
        }
      });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    logger.error('Get PT report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate PT report', error: error.message });
  }
};

/**
 * Get Salary Register
 */
exports.getSalaryRegister = async (req, res) => {
  try {
    const { month, year, format = 'json' } = req.query;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }

    const report = await reportService.generateSalaryRegister(
      req.user.companyId,
      parseInt(month),
      parseInt(year)
    );

    if (format === 'excel') {
      const filename = `Salary_Register_${month}_${year}_${Date.now()}.xlsx`;
      const filepath = reportService.exportReportToExcel(report.data, filename);
      const relativePath = filepath.replace(path.join(__dirname, '../../uploads/'), '');
      return res.json({
        success: true,
        message: 'Salary register generated successfully',
        data: {
          ...report,
          excelPath: relativePath,
          downloadUrl: `/api/reports/download/${relativePath}`
        }
      });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    logger.error('Get salary register error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate salary register', error: error.message });
  }
};

/**
 * Get Payroll Summary
 */
exports.getPayrollSummary = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }

    const payroll = await Payroll.findOne({
      where: {
        companyId: req.user.companyId,
        month: parseInt(month),
        year: parseInt(year)
      },
      include: [{
        model: Payslip,
        as: 'payslips',
        include: [{
          model: Employee,
          as: 'employee',
          attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'department', 'designation']
        }]
      }]
    });

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll not found' });
    }

    // Calculate department-wise summary
    const departmentSummary = {};
    payroll.payslips.forEach(payslip => {
      const dept = payslip.employee.department || 'Unassigned';
      if (!departmentSummary[dept]) {
        departmentSummary[dept] = {
          employees: 0,
          totalGross: 0,
          totalDeductions: 0,
          totalNet: 0
        };
      }
      departmentSummary[dept].employees++;
      departmentSummary[dept].totalGross += parseFloat(payslip.grossSalary) || 0;
      departmentSummary[dept].totalDeductions += parseFloat(payslip.totalDeductions) || 0;
      departmentSummary[dept].totalNet += parseFloat(payslip.netSalary) || 0;
    });

    res.json({
      success: true,
      data: {
        payroll: {
          id: payroll.id,
          month: payroll.month,
          year: payroll.year,
          status: payroll.status,
          totalEmployees: payroll.totalEmployees,
          totalGrossSalary: parseFloat(payroll.totalGrossSalary) || 0,
          totalDeductions: parseFloat(payroll.totalDeductions) || 0,
          totalNetSalary: parseFloat(payroll.totalNetSalary) || 0
        },
        departmentSummary
      }
    });
  } catch (error) {
    logger.error('Get payroll summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate payroll summary', error: error.message });
  }
};

/**
 * Get Payslip (redirect to payroll controller)
 */
exports.getPayslip = async (req, res) => {
  try {
    const { id } = req.params;
    const payslip = await Payslip.findByPk(id, {
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!payslip) {
      return res.status(404).json({ success: false, message: 'Payslip not found' });
    }

    res.json({ success: true, data: payslip });
  } catch (error) {
    logger.error('Get payslip error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payslip', error: error.message });
  }
};

/**
 * Get Reconciliation Report
 */
exports.getReconciliationReport = async (req, res) => {
  try {
    const { month, year, format = 'json' } = req.query;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }

    const report = await reportService.generateReconciliationReport(
      req.user.companyId,
      parseInt(month),
      parseInt(year)
    );

    if (format === 'excel') {
      // Create comparison data for Excel
      const excelData = [];
      if (report.comparison.current) {
        excelData.push({
          'Period': `${report.comparison.current.month}/${report.comparison.current.year}`,
          'Type': 'Current',
          'Employees': report.comparison.current.totalEmployees,
          'Gross Salary': report.comparison.current.totalGross,
          'Deductions': report.comparison.current.totalDeductions,
          'Net Salary': report.comparison.current.totalNet
        });
      }
      if (report.comparison.previous1) {
        excelData.push({
          'Period': `${report.comparison.previous1.month}/${report.comparison.previous1.year}`,
          'Type': 'Previous Month 1',
          'Employees': report.comparison.previous1.totalEmployees,
          'Gross Salary': report.comparison.previous1.totalGross,
          'Deductions': report.comparison.previous1.totalDeductions,
          'Net Salary': report.comparison.previous1.totalNet
        });
      }
      if (report.comparison.previous2) {
        excelData.push({
          'Period': `${report.comparison.previous2.month}/${report.comparison.previous2.year}`,
          'Type': 'Previous Month 2',
          'Employees': report.comparison.previous2.totalEmployees,
          'Gross Salary': report.comparison.previous2.totalGross,
          'Deductions': report.comparison.previous2.totalDeductions,
          'Net Salary': report.comparison.previous2.totalNet
        });
      }

      const filename = `Reconciliation_Report_${month}_${year}_${Date.now()}.xlsx`;
      const filepath = reportService.exportReportToExcel(excelData, filename);
      const relativePath = filepath.replace(path.join(__dirname, '../../uploads/'), '');
      return res.json({
        success: true,
        message: 'Reconciliation report generated successfully',
        data: {
          ...report,
          excelPath: relativePath,
          downloadUrl: `/api/reports/download/${relativePath}`
        }
      });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    logger.error('Get reconciliation report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate reconciliation report', error: error.message });
  }
};

/**
 * Get Bank Transfer Report (NEFT format)
 */
exports.getBankTransferReport = async (req, res) => {
  try {
    const { month, year, format = 'json' } = req.query;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }

    const report = await reportService.generateBankTransferReport(
      req.user.companyId,
      parseInt(month),
      parseInt(year)
    );

    if (format === 'excel' || format === 'csv') {
      const filename = `Bank_Transfer_${month}_${year}_${Date.now()}.xlsx`;
      const filepath = reportService.exportReportToExcel(report.data, filename);
      const relativePath = filepath.replace(path.join(__dirname, '../../uploads/'), '');
      return res.json({
        success: true,
        message: 'Bank transfer report generated successfully',
        data: {
          ...report,
          excelPath: relativePath,
          downloadUrl: `/api/reports/download/${relativePath}`
        }
      });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    logger.error('Get bank transfer report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate bank transfer report', error: error.message });
  }
};

/**
 * Get Employee History (track changes in designation, department, salary)
 */
exports.getEmployeeHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // 'all', 'designation', 'department', 'salary'

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Get audit logs for this employee
    const whereClause = {
      entityType: 'Employee',
      entityId: id
    };

    if (type && type !== 'all') {
      whereClause.module = type;
    }

    const auditLogs = await AuditLog.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    // Get salary structure changes
    const { SalaryStructure } = require('../models');
    const salaryStructures = await SalaryStructure.findAll({
      where: { employeeId: id },
      order: [['effectiveDate', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          employeeCode: employee.employeeCode,
          name: `${employee.firstName} ${employee.lastName}`
        },
        auditLogs: auditLogs,
        salaryHistory: salaryStructures
      }
    });
  } catch (error) {
    logger.error('Get employee history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employee history', error: error.message });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const { AuditLog } = require('../models');
    const logs = await AuditLog.findAll({ limit: 100, order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: logs });
  } catch (error) {
    logger.error('Get audit logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
};

