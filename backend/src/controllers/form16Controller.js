const { Form16, Employee, Company, Payslip, Payroll } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Get all Form 16s for a company
 */
exports.getAllForm16s = async (req, res) => {
  try {
    const { financialYear, employeeId } = req.query;
    const where = { companyId: req.user.companyId };
    
    if (financialYear) where.financialYear = financialYear;
    if (employeeId) where.employeeId = employeeId;

    const form16s = await Form16.findAll({
      where,
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'pan'] },
        { model: Company, as: 'company', attributes: ['id', 'name', 'code'] }
      ],
      order: [['financialYear', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json({ success: true, data: form16s });
  } catch (error) {
    logger.error('Get Form 16s error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch Form 16s' });
  }
};

/**
 * Get Form 16 by ID
 */
exports.getForm16 = async (req, res) => {
  try {
    const form16 = await Form16.findByPk(req.params.id, {
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'pan', 'dateOfJoining'] },
        { model: Company, as: 'company', attributes: ['id', 'name', 'code', 'pan', 'address'] }
      ]
    });

    if (!form16) {
      return res.status(404).json({ success: false, message: 'Form 16 not found' });
    }

    // Check access
    if (form16.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: form16 });
  } catch (error) {
    logger.error('Get Form 16 error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch Form 16' });
  }
};

/**
 * Generate Form 16 for an employee
 */
exports.generateForm16 = async (req, res) => {
  try {
    const { employeeId, financialYear } = req.body;

    if (!employeeId || !financialYear) {
      return res.status(400).json({ success: false, message: 'Employee ID and Financial Year are required' });
    }

    const employee = await Employee.findByPk(employeeId);
    if (!employee || employee.companyId !== req.user.companyId) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Check if Form 16 already exists
    const existing = await Form16.findOne({
      where: { companyId: req.user.companyId, employeeId, financialYear }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Form 16 for this financial year already exists' });
    }

    // Get all payslips for the financial year
    const startDate = new Date(`${financialYear}-04-01`);
    const endDate = new Date(`${parseInt(financialYear) + 1}-03-31`);

    const payslips = await Payslip.findAll({
      where: {
        employeeId,
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [{ model: Payroll, as: 'payroll' }],
      order: [['createdAt', 'ASC']]
    });

    // Calculate totals from payslips
    let grossSalary = 0;
    let totalDeductions = 0;
    let tdsDeducted = 0;
    const allowances = {};
    const deductions = {};

    payslips.forEach(payslip => {
      grossSalary += parseFloat(payslip.grossSalary || 0);
      totalDeductions += parseFloat(payslip.totalDeductions || 0);
      
      const earnings = payslip.earnings || {};
      const payslipDeductions = payslip.deductions || {};
      
      Object.keys(earnings).forEach(key => {
        allowances[key] = (allowances[key] || 0) + parseFloat(earnings[key] || 0);
      });

      Object.keys(payslipDeductions).forEach(key => {
        deductions[key] = (deductions[key] || 0) + parseFloat(payslipDeductions[key] || 0);
        if (key === 'tds') {
          tdsDeducted += parseFloat(payslipDeductions[key] || 0);
        }
      });
    });

    // Get company details
    const company = await Company.findByPk(req.user.companyId);

    // Calculate tax (simplified - would need proper tax calculation)
    const taxableIncome = grossSalary - totalDeductions;
    const assessmentYear = `${parseInt(financialYear) + 1}-${(parseInt(financialYear) + 2).toString().slice(-2)}`;

    // Create Form 16
    const form16 = await Form16.create({
      companyId: req.user.companyId,
      employeeId,
      financialYear,
      assessmentYear,
      pan: employee.pan,
      employerName: company.name,
      employerAddress: company.address,
      employerPAN: company.pan,
      grossSalary,
      allowances,
      totalSalary: grossSalary,
      totalDeductions,
      taxableIncome,
      tdsDeducted,
      status: 'generated',
      generatedAt: new Date(),
      generatedBy: req.user.id
    });

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'statutory',
      action: 'create',
      entityType: 'Form16',
      entityId: form16.id,
      description: `Generated Form 16 for ${employee.employeeCode} - FY ${financialYear}`
    });

    res.status(201).json({ success: true, data: form16, message: 'Form 16 generated successfully' });
  } catch (error) {
    logger.error('Generate Form 16 error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate Form 16' });
  }
};

/**
 * Download Form 16 PDF
 */
exports.downloadForm16PDF = async (req, res) => {
  try {
    const form16 = await Form16.findByPk(req.params.id, {
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'pan', 'dateOfJoining'] },
        { model: Company, as: 'company', attributes: ['id', 'name', 'code', 'pan', 'address'] }
      ]
    });

    if (!form16) {
      return res.status(404).json({ success: false, message: 'Form 16 not found' });
    }

    // Check access
    if (form16.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Generate PDF (simplified version)
    const doc = new PDFDocument({ margin: 50 });
    const fileName = `Form16_${form16.employee.employeeCode}_${form16.financialYear}.pdf`;
    const filePath = path.join(__dirname, '../../uploads/form16', fileName);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write PDF to file
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Form 16 Content
    doc.fontSize(16).text('FORM 16', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Certificate under Section 203 of the Income-tax Act, 1961 for tax deducted at source`);
    doc.moveDown();
    doc.text(`Financial Year: ${form16.financialYear} | Assessment Year: ${form16.assessmentYear}`);
    doc.moveDown(2);

    // Part A - Employer Details
    doc.fontSize(14).text('PART A', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Employer Name: ${form16.employerName || form16.company.name}`);
    doc.text(`Address: ${form16.employerAddress || form16.company.address}`);
    doc.text(`TAN: ${form16.employerTAN || 'N/A'}`);
    doc.text(`PAN: ${form16.employerPAN || form16.company.pan}`);
    doc.moveDown(2);

    // Part B - Employee Details
    doc.fontSize(14).text('PART B', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Employee Name: ${form16.employee.firstName} ${form16.employee.lastName}`);
    doc.text(`PAN: ${form16.pan || 'N/A'}`);
    doc.moveDown(2);

    // Salary Details
    doc.fontSize(14).text('Salary Details', { underline: true });
    doc.moveDown();
    doc.text(`Gross Salary: ₹${form16.grossSalary.toFixed(2)}`);
    doc.text(`Total Deductions: ₹${form16.totalDeductions.toFixed(2)}`);
    doc.text(`Taxable Income: ₹${form16.taxableIncome.toFixed(2)}`);
    doc.text(`TDS Deducted: ₹${form16.tdsDeducted.toFixed(2)}`);
    doc.moveDown();

    doc.end();

    stream.on('finish', () => {
      // Update Form16 with PDF path
      form16.pdfPath = filePath;
      form16.save();

      res.download(filePath, fileName, (err) => {
        if (err) {
          logger.error('Download Form 16 PDF error:', err);
          res.status(500).json({ success: false, message: 'Failed to download Form 16' });
        }
      });
    });
  } catch (error) {
    logger.error('Download Form 16 PDF error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate Form 16 PDF' });
  }
};

