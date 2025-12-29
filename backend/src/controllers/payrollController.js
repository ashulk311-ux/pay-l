const {
  Payroll,
  Payslip,
  Employee,
  Attendance,
  Loan,
  LoanEMI,
  Reimbursement,
  LeaveRequest,
  PayrollPreCheck,
  SupplementarySalary
} = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');
const payrollCalculationService = require('../services/payrollCalculationService');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

exports.getAllPayrolls = async (req, res) => {
  try {
    const payrolls = await Payroll.findAll({
      where: { companyId: req.user.companyId },
      order: [['year', 'DESC'], ['month', 'DESC']]
    });
    res.json({ success: true, data: payrolls });
  } catch (error) {
    logger.error('Get payrolls error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payrolls' });
  }
};

exports.getPayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findByPk(req.params.id, {
      include: [
        {
          model: PayrollPreCheck,
          as: 'preChecks',
          include: [{ model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName'] }]
        }
      ]
    });
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
    const { month, year } = req.body;
    
    // Check if payroll already exists
    const existing = await Payroll.findOne({
      where: { companyId: req.user.companyId, month, year }
    });
    
    if (existing) {
      return res.status(400).json({ success: false, message: 'Payroll for this month already exists' });
    }
    
    const payroll = await Payroll.create({
      month: parseInt(month),
      year: parseInt(year),
      companyId: req.user.companyId,
      status: 'draft'
    });
    
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'payroll',
      action: 'create',
      entityType: 'Payroll',
      entityId: payroll.id,
      description: `Created payroll for ${month}/${year}`
    });
    
    res.status(201).json({ success: true, data: payroll });
  } catch (error) {
    logger.error('Create payroll error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payroll', error: error.message });
  }
};

/**
 * Get pre-processing checks
 */
exports.getPreChecks = async (req, res) => {
  try {
    const { id } = req.params;
    const payroll = await Payroll.findByPk(id);
    
    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll not found' });
    }
    
    const preChecks = await PayrollPreCheck.findAll({
      where: { payrollId: id },
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName'] }],
      order: [['checkStatus', 'ASC'], ['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: preChecks,
      summary: {
        total: preChecks.length,
        warnings: preChecks.filter(c => c.checkStatus === 'warning').length,
        errors: preChecks.filter(c => c.checkStatus === 'error').length,
        pending: preChecks.filter(c => c.checkStatus === 'pending').length,
        resolved: preChecks.filter(c => c.checkStatus === 'resolved').length,
        ignored: preChecks.filter(c => c.checkStatus === 'ignored').length
      }
    });
  } catch (error) {
    logger.error('Get pre-checks error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pre-checks', error: error.message });
  }
};

/**
 * Run pre-processing checks
 */
exports.runPreChecks = async (req, res) => {
  try {
    const { id } = req.params;
    const payroll = await Payroll.findByPk(id);
    
    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll not found' });
    }
    
    const startDate = new Date(payroll.year, payroll.month - 1, 1);
    const endDate = new Date(payroll.year, payroll.month, 0);
    
    const employees = await Employee.findAll({
      where: { companyId: payroll.companyId, isActive: true }
    });
    
    const preChecks = [];
    
    for (const employee of employees) {
      // Check absences
      const attendance = await Attendance.findAll({
        where: {
          employeeId: employee.id,
          date: { [Op.between]: [startDate, endDate] },
          status: 'absent'
        }
      });
      
      if (attendance.length > 0) {
        preChecks.push({
          payrollId: payroll.id,
          employeeId: employee.id,
          checkType: 'absence',
          checkStatus: 'warning',
          description: `${attendance.length} absent days found`,
          amount: 0
        });
      }
      
      // Check pending leave requests
      const pendingLeaves = await LeaveRequest.count({
        where: {
          employeeId: employee.id,
          status: 'pending',
          startDate: { [Op.lte]: endDate },
          endDate: { [Op.gte]: startDate }
        }
      });
      
      if (pendingLeaves > 0) {
        preChecks.push({
          payrollId: payroll.id,
          employeeId: employee.id,
          checkType: 'leave',
          checkStatus: 'warning',
          description: `${pendingLeaves} pending leave requests`,
          amount: 0
        });
      }
      
      // Check outstanding loans
      const loans = await Loan.findAll({
        where: {
          employeeId: employee.id,
          status: { [Op.in]: ['approved', 'active'] },
          outstandingAmount: { [Op.gt]: 0 }
        },
        include: [{ model: LoanEMI, as: 'emis' }]
      });
      
      for (const loan of loans) {
        const emiForMonth = loan.emis?.find(emi => {
          const emiDate = new Date(emi.dueDate);
          return emiDate.getMonth() === payroll.month - 1 && emiDate.getFullYear() === payroll.year;
        });
        
        if (emiForMonth && emiForMonth.status === 'pending') {
          preChecks.push({
            payrollId: payroll.id,
            employeeId: employee.id,
            checkType: loan.loanType === 'loan' ? 'loan' : 'advance',
            checkStatus: 'pending',
            description: `${loan.loanType === 'loan' ? 'Loan' : 'Advance'} EMI due: ₹${emiForMonth.emiAmount}`,
            amount: parseFloat(emiForMonth.emiAmount || 0)
          });
        }
      }
      
      // Check pending reimbursements
      const pendingReimbursements = await Reimbursement.sum('amount', {
        where: {
          employeeId: employee.id,
          status: { [Op.in]: ['pending', 'approved'] }
        }
      });
      
      if (pendingReimbursements > 0) {
        preChecks.push({
          payrollId: payroll.id,
          employeeId: employee.id,
          checkType: 'reimbursement',
          checkStatus: 'warning',
          description: `Pending reimbursements: ₹${pendingReimbursements}`,
          amount: parseFloat(pendingReimbursements || 0)
        });
      }
    }
    
    // Delete existing pre-checks and create new ones
    await PayrollPreCheck.destroy({ where: { payrollId: payroll.id } });
    await PayrollPreCheck.bulkCreate(preChecks);
    
    payroll.preCheckCompleted = true;
    payroll.preCheckCompletedAt = new Date();
    payroll.preCheckCompletedBy = req.user.id;
    await payroll.save();
    
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'payroll',
      action: 'update',
      entityType: 'Payroll',
      entityId: payroll.id,
      description: `Pre-processing checks completed: ${preChecks.length} checks found`
    });
    
    res.json({
      success: true,
      message: `Pre-processing checks completed. ${preChecks.length} checks found`,
      data: {
        payroll,
        preChecks,
        summary: {
          total: preChecks.length,
          warnings: preChecks.filter(c => c.checkStatus === 'warning').length,
          errors: preChecks.filter(c => c.checkStatus === 'error').length,
          pending: preChecks.filter(c => c.checkStatus === 'pending').length
        }
      }
    });
  } catch (error) {
    logger.error('Run pre-checks error:', error);
    res.status(500).json({ success: false, message: 'Failed to run pre-checks', error: error.message });
  }
};

/**
 * Resolve pre-check
 */
exports.resolvePreCheck = async (req, res) => {
  try {
    const { id, checkId } = req.params;
    const { resolutionNotes, action } = req.body; // action: 'resolve', 'ignore'
    
    const preCheck = await PayrollPreCheck.findOne({
      where: { id: checkId, payrollId: id }
    });
    
    if (!preCheck) {
      return res.status(404).json({ success: false, message: 'Pre-check not found' });
    }
    
    preCheck.checkStatus = action === 'ignore' ? 'ignored' : 'resolved';
    preCheck.resolvedBy = req.user.id;
    preCheck.resolvedAt = new Date();
    preCheck.resolutionNotes = resolutionNotes || '';
    await preCheck.save();
    
    res.json({
      success: true,
      message: 'Pre-check resolved successfully',
      data: preCheck
    });
  } catch (error) {
    logger.error('Resolve pre-check error:', error);
    res.status(500).json({ success: false, message: 'Failed to resolve pre-check', error: error.message });
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
    
    const startDate = new Date(payroll.year, payroll.month - 1, 1);
    const endDate = new Date(payroll.year, payroll.month, 0);
    
    const employees = await Employee.findAll({
      where: { companyId: payroll.companyId, isActive: true },
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
 * Apply earnings/deductions (supplementary salary, etc.)
 */
exports.applyEarningsDeductions = async (req, res) => {
  try {
    const { id } = req.params;
    const payroll = await Payroll.findByPk(id);
    
    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll not found' });
    }
    
    if (!payroll.attendanceLocked) {
      return res.status(400).json({ success: false, message: 'Please lock attendance first' });
    }
    
    const startDate = new Date(payroll.year, payroll.month - 1, 1);
    const endDate = new Date(payroll.year, payroll.month, 0);
    
    // Get all supplementary salaries for the month
    const employees = await Employee.findAll({
      where: { companyId: payroll.companyId, isActive: true },
      attributes: ['id']
    });
    const employeeIds = employees.map(emp => emp.id);
    
    const supplementarySalaries = await SupplementarySalary.findAll({
      where: {
        employeeId: { [Op.in]: employeeIds },
        isProcessed: false,
        [Op.or]: [
          { month: payroll.month, year: payroll.year },
          {
            effectiveDate: { [Op.between]: [startDate, endDate] }
          }
        ]
      }
    });
    
    // Mark as processed
    for (const supp of supplementarySalaries) {
      supp.isProcessed = true;
      supp.processedInPayrollId = payroll.id;
      await supp.save();
    }
    
    payroll.earningsApplied = true;
    payroll.deductionsApplied = true;
    await payroll.save();
    
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'payroll',
      action: 'update',
      entityType: 'Payroll',
      entityId: payroll.id,
      description: `Applied earnings/deductions: ${supplementarySalaries.length} supplementary salaries`
    });
    
    res.json({
      success: true,
      message: `Applied ${supplementarySalaries.length} earnings/deductions`,
      data: { payroll, count: supplementarySalaries.length }
    });
  } catch (error) {
    logger.error('Apply earnings/deductions error:', error);
    res.status(500).json({ success: false, message: 'Failed to apply earnings/deductions', error: error.message });
  }
};

/**
 * Bulk import salary (manual override)
 */
exports.bulkImportSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const payroll = await Payroll.findByPk(id);
    
    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll not found' });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    const employees = await Employee.findAll({
      where: { companyId: payroll.companyId, isActive: true }
    });
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    for (const row of data) {
      try {
        const employeeCode = row['Employee Code'] || row['EmployeeCode'] || row['employee_code'];
        const grossSalary = row['Gross Salary'] || row['GrossSalary'] || row['gross_salary'];
        const netSalary = row['Net Salary'] || row['NetSalary'] || row['net_salary'];
        const totalDeductions = row['Total Deductions'] || row['TotalDeductions'] || row['total_deductions'] || 0;
        
        if (!employeeCode || !grossSalary || !netSalary) {
          results.failed++;
          results.errors.push(`Row ${data.indexOf(row) + 2}: Missing required fields`);
          continue;
        }
        
        const employee = employees.find(e => e.employeeCode === employeeCode);
        if (!employee) {
          results.failed++;
          results.errors.push(`Row ${data.indexOf(row) + 2}: Employee not found: ${employeeCode}`);
          continue;
        }
        
        // Create or update payslip
        const [payslip, created] = await Payslip.findOrCreate({
          where: {
            payrollId: payroll.id,
            employeeId: employee.id,
            month: payroll.month,
            year: payroll.year
          },
          defaults: {
            payrollId: payroll.id,
            employeeId: employee.id,
            month: payroll.month,
            year: payroll.year,
            grossSalary: parseFloat(grossSalary),
            totalDeductions: parseFloat(totalDeductions),
            netSalary: parseFloat(netSalary),
            isManualOverride: true
          }
        });
        
        if (!created) {
          payslip.grossSalary = parseFloat(grossSalary);
          payslip.totalDeductions = parseFloat(totalDeductions);
          payslip.netSalary = parseFloat(netSalary);
          payslip.isManualOverride = true;
          await payslip.save();
        }
        
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${data.indexOf(row) + 2}: ${error.message}`);
      }
    }
    
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'payroll',
      action: 'update',
      entityType: 'Payroll',
      entityId: payroll.id,
      description: `Bulk imported salary: ${results.success} records processed, ${results.failed} failed`
    });
    
    res.json({
      success: true,
      message: `Import completed: ${results.success} records processed, ${results.failed} failed`,
      data: results
    });
  } catch (error) {
    logger.error('Bulk import salary error:', error);
    res.status(500).json({ success: false, message: 'Failed to import salary', error: error.message });
  }
};

/**
 * Process payroll - Calculate salaries for all employees
 */
exports.processPayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const payroll = await Payroll.findByPk(id);
    
    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll not found' });
    }
    
    if (payroll.status === 'finalized' || payroll.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Payroll already finalized' });
    }
    
    if (!payroll.attendanceLocked) {
      return res.status(400).json({ success: false, message: 'Please lock attendance first' });
    }
    
    payroll.status = 'processing';
    payroll.processedBy = req.user.id;
    payroll.processedAt = new Date();
    await payroll.save();
    
    const calculatedPayrolls = await payrollCalculationService.calculateBulkPayroll(payroll);
    
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
        // Skip if manual override exists
        const existingPayslip = await Payslip.findOne({
          where: {
            payrollId: payroll.id,
            employeeId: calcData.employeeId,
            isManualOverride: true
          }
        });
        
        if (existingPayslip) {
          continue; // Skip manual override payslips
        }
        
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
 * Generate payslip PDFs
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
    
    const pdfService = require('../services/pdfService');
    let successCount = 0;
    let errorCount = 0;
    
    for (const payslip of payslips) {
      try {
        const pdfPath = await pdfService.generatePayslipPDF(payslip);
        const relativePath = pdfPath.replace(path.join(__dirname, '../../uploads/'), '');
        payslip.pdfPath = relativePath;
        await payslip.save();
        successCount++;
      } catch (error) {
        logger.error(`Error generating PDF for payslip ${payslip.id}:`, error);
        errorCount++;
      }
    }
    
    payroll.payslipsGenerated = true;
    await payroll.save();
    
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
    
    if (!payroll.payslipsGenerated) {
      return res.status(400).json({ success: false, message: 'Please generate payslips first' });
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
    
    payroll.payslipsDistributed = true;
    await payroll.save();
    
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'payroll',
      action: 'update',
      entityType: 'Payroll',
      entityId: payroll.id,
      description: `Payslips distributed to ${payslips.length} employees`
    });
    
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
    
    if (payslip.pdfPath) {
      const pdfPath = path.join(__dirname, '../../uploads', payslip.pdfPath);
      if (fs.existsSync(pdfPath)) {
        return res.sendFile(pdfPath);
      }
    }
    
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
