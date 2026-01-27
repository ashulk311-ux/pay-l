const logger = require('../utils/logger');
const reportService = require('../services/reportService');
const {
  AuditLog,
  Employee,
  Payslip,
  Payroll,
  EmployeeHistory,
  CustomReport,
  SalaryStructure
} = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const XLSX = require('xlsx');

/**
 * Get PF Report
 */
exports.getPFReport = async (req, res) => {
  try {
    const { month, year, format = 'json' } = req.query;
    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }
    const report = await reportService.generatePFReport(req.user.companyId, parseInt(month), parseInt(year));
    if (format === 'excel' || format === 'csv') {
      const filename = `PF_Report_${month}_${year}_${Date.now()}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      const filepath = reportService.exportReportToExcel(report.data, filename, format);
      const relativePath = filepath.replace(path.join(__dirname, '../../uploads/'), '');
      return res.json({
        success: true,
        message: 'PF report generated successfully',
        data: { ...report, excelPath: relativePath, downloadUrl: `/api/reports/download/${relativePath}` }
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
    const report = await reportService.generateESIReport(req.user.companyId, parseInt(month), parseInt(year));
    if (format === 'excel' || format === 'csv') {
      const filename = `ESI_Report_${month}_${year}_${Date.now()}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      const filepath = reportService.exportReportToExcel(report.data, filename, format);
      const relativePath = filepath.replace(path.join(__dirname, '../../uploads/'), '');
      return res.json({
        success: true,
        message: 'ESI report generated successfully',
        data: { ...report, excelPath: relativePath, downloadUrl: `/api/reports/download/${relativePath}` }
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
    const report = await reportService.generateTDSReport(req.user.companyId, parseInt(month), parseInt(year));
    if (format === 'excel' || format === 'csv') {
      const filename = `TDS_Report_${month}_${year}_${Date.now()}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      const filepath = reportService.exportReportToExcel(report.data, filename, format);
      const relativePath = filepath.replace(path.join(__dirname, '../../uploads/'), '');
      return res.json({
        success: true,
        message: 'TDS report generated successfully',
        data: { ...report, excelPath: relativePath, downloadUrl: `/api/reports/download/${relativePath}` }
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
    const report = await reportService.generatePTReport(req.user.companyId, parseInt(month), parseInt(year));
    if (format === 'excel' || format === 'csv') {
      const filename = `PT_Report_${month}_${year}_${Date.now()}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      const filepath = reportService.exportReportToExcel(report.data, filename, format);
      const relativePath = filepath.replace(path.join(__dirname, '../../uploads/'), '');
      return res.json({
        success: true,
        message: 'PT report generated successfully',
        data: { ...report, excelPath: relativePath, downloadUrl: `/api/reports/download/${relativePath}` }
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
    const report = await reportService.generateSalaryRegister(req.user.companyId, parseInt(month), parseInt(year));
    if (format === 'excel' || format === 'csv') {
      const filename = `Salary_Register_${month}_${year}_${Date.now()}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      const filepath = reportService.exportReportToExcel(report.data, filename, format);
      const relativePath = filepath.replace(path.join(__dirname, '../../uploads/'), '');
      return res.json({
        success: true,
        message: 'Salary register generated successfully',
        data: { ...report, excelPath: relativePath, downloadUrl: `/api/reports/download/${relativePath}` }
      });
    }
    res.json({ success: true, data: report });
  } catch (error) {
    logger.error('Get salary register error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate salary register', error: error.message });
  }
};

/**
 * Get Payroll Summary (Head-wise)
 */
exports.getPayrollSummary = async (req, res) => {
  try {
    const { month, year, format = 'json' } = req.query;
    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }
    const report = await reportService.generatePayrollSummary(req.user.companyId, parseInt(month), parseInt(year));
    if (format === 'excel' || format === 'csv') {
      const filename = `Payroll_Summary_${month}_${year}_${Date.now()}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      const filepath = reportService.exportReportToExcel(report.data, filename, format);
      const relativePath = filepath.replace(path.join(__dirname, '../../uploads/'), '');
      return res.json({
        success: true,
        message: 'Payroll summary generated successfully',
        data: { ...report, excelPath: relativePath, downloadUrl: `/api/reports/download/${relativePath}` }
      });
    }
    res.json({ success: true, data: report });
  } catch (error) {
    logger.error('Get payroll summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate payroll summary', error: error.message });
  }
};

/**
 * Get Payslip (PDF with branding)
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
    const pdfService = require('../services/pdfService');
    const pdfPath = await pdfService.generatePayslipPDF(payslip);
    res.sendFile(pdfPath);
  } catch (error) {
    logger.error('Get payslip error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate payslip', error: error.message });
  }
};

/**
 * Get Reconciliation Report (with salary variation tracker)
 */
exports.getReconciliationReport = async (req, res) => {
  try {
    const { month, year, format = 'json' } = req.query;
    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }
    const report = await reportService.generateReconciliationReport(req.user.companyId, parseInt(month), parseInt(year));
    if (format === 'excel' || format === 'csv') {
      const filename = `Reconciliation_Report_${month}_${year}_${Date.now()}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      const filepath = reportService.exportReportToExcel(report.data, filename, format);
      const relativePath = filepath.replace(path.join(__dirname, '../../uploads/'), '');
      return res.json({
        success: true,
        message: 'Reconciliation report generated successfully',
        data: { ...report, excelPath: relativePath, downloadUrl: `/api/reports/download/${relativePath}` }
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
    const { month, year, format = 'json', bankName } = req.query;
    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }
    const report = await reportService.generateBankTransferReport(req.user.companyId, parseInt(month), parseInt(year), bankName);
    if (format === 'excel' || format === 'csv' || format === 'neft') {
      const filename = `Bank_Transfer_${month}_${year}_${Date.now()}.${format === 'csv' ? 'csv' : format === 'neft' ? 'txt' : 'xlsx'}`;
      const filepath = reportService.exportBankTransferReport(report.data, filename, format);
      const relativePath = filepath.replace(path.join(__dirname, '../../uploads/'), '');
      return res.json({
        success: true,
        message: 'Bank transfer report generated successfully',
        data: { ...report, excelPath: relativePath, downloadUrl: `/api/reports/download/${relativePath}` }
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
    const { changeType, fromDate, toDate, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = { employeeId: id };
    if (changeType) whereClause.changeType = changeType;
    if (fromDate || toDate) {
      whereClause.createdAt = {};
      if (fromDate) whereClause.createdAt[Op.gte] = new Date(fromDate);
      if (toDate) whereClause.createdAt[Op.lte] = new Date(toDate);
    }
    
    const { count, rows } = await EmployeeHistory.findAndCountAll({
      where: whereClause,
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName'] },
        { model: require('../models').User, as: 'changer', attributes: ['id', 'email', 'firstName', 'lastName'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Get employee history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employee history', error: error.message });
  }
};

/**
 * Get Audit Logs
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const { module, action, entityType, fromDate, toDate, userId, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = { companyId: req.user.companyId };
    if (module) whereClause.module = module;
    if (action) whereClause.action = action;
    if (entityType) whereClause.entityType = entityType;
    if (userId) whereClause.userId = userId;
    if (fromDate || toDate) {
      whereClause.createdAt = {};
      if (fromDate) whereClause.createdAt[Op.gte] = new Date(fromDate);
      if (toDate) whereClause.createdAt[Op.lte] = new Date(toDate);
    }
    
    const { count, rows } = await AuditLog.findAndCountAll({
      where: whereClause,
      include: [
        { model: require('../models').User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Get audit logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs', error: error.message });
  }
};

/**
 * Export Audit Logs
 */
exports.exportAuditLogs = async (req, res) => {
  try {
    const { module, action, entityType, fromDate, toDate, userId, format = 'excel' } = req.query;
    
    const whereClause = { companyId: req.user.companyId };
    if (module) whereClause.module = module;
    if (action) whereClause.action = action;
    if (entityType) whereClause.entityType = entityType;
    if (userId) whereClause.userId = userId;
    if (fromDate || toDate) {
      whereClause.createdAt = {};
      if (fromDate) whereClause.createdAt[Op.gte] = new Date(fromDate);
      if (toDate) whereClause.createdAt[Op.lte] = new Date(toDate);
    }
    
    const logs = await AuditLog.findAll({
      where: whereClause,
      include: [
        { model: require('../models').User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    const excelData = logs.map(log => ({
      'Timestamp': log.createdAt,
      'User': `${log.user?.firstName || ''} ${log.user?.lastName || ''} (${log.user?.email || ''})`,
      'Module': log.module,
      'Action': log.action,
      'Entity Type': log.entityType,
      'Entity ID': log.entityId,
      'IP Address': log.ipAddress,
      'Description': log.description || ''
    }));
    
    const filename = `Audit_Logs_${Date.now()}.${format === 'csv' ? 'csv' : 'xlsx'}`;
    const filepath = reportService.exportReportToExcel(excelData, filename, format);
    const relativePath = filepath.replace(path.join(__dirname, '../../uploads/'), '');
    
    res.json({
      success: true,
      message: 'Audit logs exported successfully',
      data: { excelPath: relativePath, downloadUrl: `/api/reports/download/${relativePath}` }
    });
  } catch (error) {
    logger.error('Export audit logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to export audit logs', error: error.message });
  }
};

/**
 * Get all custom reports
 */
exports.getCustomReports = async (req, res) => {
  try {
    const reports = await CustomReport.findAll({
      where: { companyId: req.user.companyId, isActive: true },
      include: [
        { model: require('../models').User, as: 'creator', attributes: ['id', 'email', 'firstName', 'lastName'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: reports });
  } catch (error) {
    logger.error('Get custom reports error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch custom reports', error: error.message });
  }
};

/**
 * Create custom report
 */
exports.createCustomReport = async (req, res) => {
  try {
    const report = await CustomReport.create({
      ...req.body,
      companyId: req.user.companyId,
      createdBy: req.user.id
    });
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    logger.error('Create custom report error:', error);
    res.status(500).json({ success: false, message: 'Failed to create custom report', error: error.message });
  }
};

/**
 * Update custom report
 */
exports.updateCustomReport = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await CustomReport.findOne({
      where: { id, companyId: req.user.companyId }
    });
    if (!report) {
      return res.status(404).json({ success: false, message: 'Custom report not found' });
    }
    await report.update(req.body);
    res.json({ success: true, data: report });
  } catch (error) {
    logger.error('Update custom report error:', error);
    res.status(500).json({ success: false, message: 'Failed to update custom report', error: error.message });
  }
};

/**
 * Delete custom report
 */
exports.deleteCustomReport = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await CustomReport.findOne({
      where: { id, companyId: req.user.companyId }
    });
    if (!report) {
      return res.status(404).json({ success: false, message: 'Custom report not found' });
    }
    await report.destroy();
    res.json({ success: true, message: 'Custom report deleted successfully' });
  } catch (error) {
    logger.error('Delete custom report error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete custom report', error: error.message });
  }
};

/**
 * Execute custom report
 */
exports.executeCustomReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { params } = req.body; // Additional parameters for report execution
    
    const report = await CustomReport.findOne({
      where: { id, companyId: req.user.companyId, isActive: true }
    });
    
    if (!report) {
      return res.status(404).json({ success: false, message: 'Custom report not found' });
    }
    
    const result = await reportService.executeCustomReport(report, params || {});
    
    if (report.format === 'excel' || report.format === 'csv') {
      const filename = `${report.reportName}_${Date.now()}.${report.format === 'csv' ? 'csv' : 'xlsx'}`;
      const filepath = reportService.exportReportToExcel(result.data, filename, report.format);
      const relativePath = filepath.replace(path.join(__dirname, '../../uploads/'), '');
      return res.json({
        success: true,
        message: 'Custom report executed successfully',
        data: { ...result, excelPath: relativePath, downloadUrl: `/api/reports/download/${relativePath}` }
      });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Execute custom report error:', error);
    res.status(500).json({ success: false, message: 'Failed to execute custom report', error: error.message });
  }
};