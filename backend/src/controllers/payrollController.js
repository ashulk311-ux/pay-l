const { Payroll, Payslip, Employee, Attendance } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');
const payrollCalculationService = require('../services/payrollCalculationService');
const path = require('path');
const fs = require('fs');
exports.getAllPayrolls = async (req, res) => {
  try {
    const payrolls = await Payroll.findAll({ where: { companyId: req.user.companyId } });
    res.json({ success: true, data: payrolls });
  } catch (error) {
    logger.error('Get payrolls error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payrolls' });
  }
};

exports.getPayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findByPk(req.params.id);
    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll not found' });
    }
    res.json({ success: true, data: payroll });
  } catch (error) {
    logger.error('Get payroll error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payroll' });
  }
};

exports.createPayroll = async (req, res) => {
  try {
    const payroll = await Payroll.create({ ...req.body, companyId: req.user.companyId });
    res.status(201).json({ success: true, data: payroll });
  } catch (error) {
    logger.error('Create payroll error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payroll' });
  }
};

/**
 * Lock attendance for payroll processing
 */
exports.lockAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const payroll = await Payroll.findByPk(id);

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll not found' });
    }

    if (payroll.attendanceLocked) {
      return res.status(400).json({ success: false, message: 'Attendance already locked' });
    }

    // Lock attendance records for the payroll month
    const startDate = new Date(payroll.year, payroll.month - 1, 1);
    const endDate = new Date(payroll.year, payroll.month, 0);
    const { Op } = require('sequelize');
    
    // Get all employees for the company
    const employees = await Employee.findAll({
      where: { companyId: payroll.companyId },
      attributes: ['id']
    });
    const employeeIds = employees.map(emp => emp.id);
    
    await Attendance.update(
      { isLocked: true },
      {
        where: {
          employeeId: { [Op.in]: employeeIds },
          date: { [Op.between]: [startDate, endDate] }
        }
      }
    );

    payroll.attendanceLocked = true;
    await payroll.save();

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'payroll',
      action: 'update',
      entityType: 'Payroll',
      entityId: payroll.id,
      description: `Attendance locked for ${payroll.month}/${payroll.year}`
    });

    res.json({
      success: true,
      message: 'Attendance locked successfully',
      data: payroll
    });
  } catch (error) {
    logger.error('Lock attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to lock attendance', error: error.message });
  }
};

/**
 * Process payroll - Calculate salaries for all employees
 */
exports.processPayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const payroll = await Payroll.findByPk(id, {
      include: [{ model: Employee, as: 'employees' }]
    });

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll not found' });
    }

    if (payroll.status === 'finalized' || payroll.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Payroll already finalized' });
    }

    if (!payroll.attendanceLocked) {
      return res.status(400).json({ success: false, message: 'Please lock attendance first' });
    }

    // Update payroll status
    payroll.status = 'processing';
    payroll.processedBy = req.user.id;
    payroll.processedAt = new Date();
    await payroll.save();

    // Calculate payroll for all employees
    const calculatedPayrolls = await payrollCalculationService.calculateBulkPayroll(payroll);

    // Create or update payslips
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let successCount = 0;
    let errorCount = 0;

    for (const calcData of calculatedPayrolls) {
      if (calcData.error) {
        errorCount++;
        logger.error(`Error processing employee ${calcData.employeeCode}: ${calcData.error}`);
        continue;
      }

      try {
        const [payslip, created] = await Payslip.findOrCreate({
          where: {
            payrollId: payroll.id,
            employeeId: calcData.employeeId,
            month: payroll.month,
            year: payroll.year
          },
          defaults: {
            payrollId: payroll.id,
            employeeId: calcData.employeeId,
            month: payroll.month,
            year: payroll.year,
            earnings: calcData.earnings,
            deductions: calcData.deductions,
            grossSalary: calcData.earnings.adjustedGrossSalary,
            totalDeductions: calcData.deductions.totalDeductions,
            netSalary: calcData.netSalary,
            daysWorked: calcData.workingDays,
            daysPresent: calcData.presentDays,
            daysAbsent: calcData.absentDays
          }
        });

        if (!created) {
          // Update existing payslip
          payslip.earnings = calcData.earnings;
          payslip.deductions = calcData.deductions;
          payslip.grossSalary = calcData.earnings.adjustedGrossSalary;
          payslip.totalDeductions = calcData.deductions.totalDeductions;
          payslip.netSalary = calcData.netSalary;
          payslip.daysWorked = calcData.workingDays;
          payslip.daysPresent = calcData.presentDays;
          payslip.daysAbsent = calcData.absentDays;
          await payslip.save();
        }

        totalGross += calcData.earnings.adjustedGrossSalary;
        totalDeductions += calcData.deductions.totalDeductions;
        totalNet += calcData.netSalary;
        successCount++;
      } catch (error) {
        errorCount++;
        logger.error(`Error creating payslip for employee ${calcData.employeeCode}:`, error);
      }
    }

    // Update payroll totals
    payroll.status = 'locked';
    payroll.totalEmployees = successCount;
    payroll.totalGrossSalary = totalGross;
    payroll.totalDeductions = totalDeductions;
    payroll.totalNetSalary = totalNet;
    await payroll.save();

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'payroll',
      action: 'update',
      entityType: 'Payroll',
      entityId: payroll.id,
      description: `Payroll processed for ${payroll.month}/${payroll.year} - ${successCount} employees processed`
    });

    res.json({
      success: true,
      message: `Payroll processed successfully. ${successCount} employees processed, ${errorCount} errors`,
      data: {
        payroll,
        summary: {
          totalEmployees: successCount,
          errorCount,
          totalGrossSalary: totalGross,
          totalDeductions: totalDeductions,
          totalNetSalary: totalNet
        }
      }
    });
  } catch (error) {
    logger.error('Process payroll error:', error);
    res.status(500).json({ success: false, message: 'Failed to process payroll', error: error.message });
  }
};

/**
 * Finalize payroll - Mark payroll as finalized
 */
exports.finalizePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const payroll = await Payroll.findByPk(id);

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll not found' });
    }

    if (payroll.status !== 'locked') {
      return res.status(400).json({ success: false, message: 'Payroll must be processed before finalizing' });
    }

    payroll.status = 'finalized';
    payroll.finalizedBy = req.user.id;
    payroll.finalizedAt = new Date();
    await payroll.save();

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'payroll',
      action: 'update',
      entityType: 'Payroll',
      entityId: payroll.id,
      description: `Payroll finalized for ${payroll.month}/${payroll.year}`
    });

    res.json({
      success: true,
      message: 'Payroll finalized successfully',
      data: payroll
    });
  } catch (error) {
    logger.error('Finalize payroll error:', error);
    res.status(500).json({ success: false, message: 'Failed to finalize payroll', error: error.message });
  }
};

/**
 * Generate payslip PDFs (placeholder - PDF service to be implemented)
 */
exports.generatePayslips = async (req, res) => {
  try {
    const { id } = req.params;
    const payroll = await Payroll.findByPk(id);

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll not found' });
    }

    if (payroll.status !== 'finalized') {
      return res.status(400).json({ success: false, message: 'Payroll must be finalized before generating payslips' });
    }

    const payslips = await Payslip.findAll({
      where: { payrollId: id },
      include: [{ model: Employee, as: 'employee' }]
    });

    // Generate PDFs for all payslips
    const pdfService = require('../services/pdfService');
    let successCount = 0;
    let errorCount = 0;

    for (const payslip of payslips) {
      try {
        const pdfPath = await pdfService.generatePayslipPDF(payslip);
        // Store relative path from uploads directory
        const relativePath = pdfPath.replace(path.join(__dirname, '../../uploads/'), '');
        payslip.pdfPath = relativePath;
        await payslip.save();
        successCount++;
      } catch (error) {
        logger.error(`Error generating PDF for payslip ${payslip.id}:`, error);
        errorCount++;
      }
    }

    res.json({
      success: true,
      message: `Payslip generation completed. ${successCount} PDFs generated, ${errorCount} errors`,
      data: { 
        total: payslips.length,
        success: successCount,
        errors: errorCount
      }
    });
  } catch (error) {
    logger.error('Generate payslips error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate payslips', error: error.message });
  }
};

/**
 * Distribute payslips (via email/WhatsApp)
 */
exports.distributePayslips = async (req, res) => {
  try {
    const { id } = req.params;
    const payroll = await Payroll.findByPk(id);

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll not found' });
    }

    const payslips = await Payslip.findAll({
      where: { payrollId: id, isDistributed: false },
      include: [{ model: Employee, as: 'employee' }]
    });

    // TODO: Implement email/WhatsApp distribution service
    // const notificationService = require('../services/notificationService');
    // for (const payslip of payslips) {
    //   await notificationService.sendPayslip(payslip);
    //   payslip.isDistributed = true;
    //   payslip.distributedAt = new Date();
    //   await payslip.save();
    // }

    res.json({
      success: true,
      message: `Payslip distribution initiated for ${payslips.length} employees`,
      data: { count: payslips.length }
    });
  } catch (error) {
    logger.error('Distribute payslips error:', error);
    res.status(500).json({ success: false, message: 'Failed to distribute payslips', error: error.message });
  }
};

exports.getPayslips = async (req, res) => {
  try {
    const payslips = await Payslip.findAll({ 
      where: { payrollId: req.params.id },
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'email'] }]
    });
    res.json({ success: true, data: payslips });
  } catch (error) {
    logger.error('Get payslips error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payslips' });
  }
};

/**
 * Get single payslip PDF
 */
exports.getPayslipPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const payslip = await Payslip.findByPk(id, {
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!payslip) {
      return res.status(404).json({ success: false, message: 'Payslip not found' });
    }

    // Check if PDF exists
    if (payslip.pdfPath) {
      const pdfPath = path.join(__dirname, '../../uploads', payslip.pdfPath);
      if (fs.existsSync(pdfPath)) {
        return res.sendFile(pdfPath);
      }
    }

    // Generate PDF if it doesn't exist
    const pdfService = require('../services/pdfService');
    const fullPath = await pdfService.generatePayslipPDF(payslip);
    const relativePath = fullPath.replace(path.join(__dirname, '../../uploads/'), '');
    payslip.pdfPath = relativePath;
    await payslip.save();

    res.sendFile(fullPath);
  } catch (error) {
    logger.error('Get payslip PDF error:', error);
    res.status(500).json({ success: false, message: 'Failed to get payslip PDF', error: error.message });
  }
};

