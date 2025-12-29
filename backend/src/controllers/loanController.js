const { Loan, LoanEMI, Employee, Payslip, Payroll } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

/**
 * Get all loans with filters
 */
exports.getAllLoans = async (req, res) => {
  try {
    const { status, loanType, employeeId, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) whereClause.status = status;
    if (loanType) whereClause.loanType = loanType;
    if (employeeId) whereClause.employeeId = employeeId;

    // Filter by company employees
    const employees = await Employee.findAll({
      where: { companyId: req.user.companyId, isActive: true },
      attributes: ['id']
    });
    whereClause.employeeId = whereClause.employeeId 
      ? { [Op.and]: [whereClause.employeeId, { [Op.in]: employees.map(e => e.id) }] }
      : { [Op.in]: employees.map(e => e.id) };

    const { count, rows } = await Loan.findAndCountAll({
      where: whereClause,
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'employeeCode', 'firstName', 'lastName']
      }],
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
    logger.error('Get loans error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch loans', error: error.message });
  }
};

/**
 * Get single loan with EMIs
 */
exports.getLoan = async (req, res) => {
  try {
    const loan = await Loan.findByPk(req.params.id, {
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'email']
        },
        {
          model: LoanEMI,
          as: 'emis',
          order: [['emiNumber', 'ASC']]
        }
      ]
    });

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    // Check access
    const employee = await Employee.findByPk(loan.employeeId);
    if (employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: loan });
  } catch (error) {
    logger.error('Get loan error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch loan', error: error.message });
  }
};

/**
 * Request loan (Employee)
 */
exports.requestLoan = async (req, res) => {
  try {
    const { employeeId, loanType, amount, interestRate, tenure, startDate, requestReason, autoDeduct } = req.body;

    if (!employeeId || !loanType || !amount || !tenure || !startDate) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const employee = await Employee.findByPk(employeeId);
    if (!employee || employee.companyId !== req.user.companyId) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Calculate EMI
    const principal = parseFloat(amount);
    const rate = parseFloat(interestRate || 0) / 100 / 12; // Monthly interest rate
    const months = parseInt(tenure);

    let emiAmount = 0;
    if (rate > 0) {
      emiAmount = (principal * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    } else {
      emiAmount = principal / months;
    }

    // Calculate end date
    const start = new Date(startDate);
    const endDate = new Date(start);
    endDate.setMonth(endDate.getMonth() + months);

    // Calculate next deduction date (first salary date after start date)
    const nextDeductionDate = new Date(start);
    nextDeductionDate.setMonth(nextDeductionDate.getMonth() + 1);
    nextDeductionDate.setDate(1); // First day of next month

    const loan = await Loan.create({
      employeeId,
      loanType,
      amount: principal,
      interestRate: interestRate || 0,
      tenure: months,
      emiAmount: Math.round(emiAmount * 100) / 100,
      startDate: start,
      endDate: endDate,
      autoDeduct: autoDeduct !== false,
      outstandingAmount: principal,
      status: 'pending',
      requestDate: new Date(),
      requestReason: requestReason || '',
      requestedBy: req.user.id,
      nextDeductionDate: nextDeductionDate
    });

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      action: 'create',
      entityType: 'Loan',
      entityId: loan.id,
      module: 'loan',
      description: `Loan request created: ${loanType} of ₹${amount}`
    });

    res.status(201).json({
      success: true,
      message: 'Loan request submitted successfully',
      data: loan
    });
  } catch (error) {
    logger.error('Request loan error:', error);
    res.status(500).json({ success: false, message: 'Failed to create loan request', error: error.message });
  }
};

/**
 * Approve loan
 */
exports.approveLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const loan = await Loan.findByPk(id, {
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    if (loan.employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (loan.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Loan is not in pending status' });
    }

    await loan.update({
      status: 'approved',
      approvedBy: req.user.id,
      approvedAt: new Date(),
      outstandingAmount: parseFloat(loan.amount)
    });

    // Generate EMIs
    await generateEMIs(loan);

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      action: 'approve',
      entityType: 'Loan',
      entityId: loan.id,
      module: 'loan',
      description: `Approved ${loan.loanType} of ₹${loan.amount}`
    });

    res.json({
      success: true,
      message: 'Loan approved successfully',
      data: loan
    });
  } catch (error) {
    logger.error('Approve loan error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve loan', error: error.message });
  }
};

/**
 * Reject loan
 */
exports.rejectLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const loan = await Loan.findByPk(id, {
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    if (loan.employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (loan.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Loan is not in pending status' });
    }

    await loan.update({
      status: 'rejected',
      rejectedBy: req.user.id,
      rejectedAt: new Date(),
      rejectionReason: rejectionReason || ''
    });

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      action: 'reject',
      entityType: 'Loan',
      entityId: loan.id,
      module: 'loan',
      description: `Rejected ${loan.loanType} of ₹${loan.amount}`
    });

    res.json({
      success: true,
      message: 'Loan rejected successfully',
      data: loan
    });
  } catch (error) {
    logger.error('Reject loan error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject loan', error: error.message });
  }
};

/**
 * Generate EMIs for a loan
 */
async function generateEMIs(loan) {
  try {
    const principal = parseFloat(loan.amount);
    const rate = parseFloat(loan.interestRate || 0) / 100 / 12;
    const months = parseInt(loan.tenure);
    const emiAmount = parseFloat(loan.emiAmount);

    let remainingPrincipal = principal;
    const startDate = new Date(loan.startDate);

    // Delete existing EMIs if any
    await LoanEMI.destroy({ where: { loanId: loan.id } });

    for (let i = 1; i <= months; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      let interestAmount = 0;
      let principalAmount = emiAmount;

      if (rate > 0) {
        interestAmount = remainingPrincipal * rate;
        principalAmount = emiAmount - interestAmount;
      } else {
        principalAmount = principal / months;
      }

      // Adjust last EMI to account for rounding
      if (i === months) {
        principalAmount = remainingPrincipal;
      }

      remainingPrincipal -= principalAmount;

      await LoanEMI.create({
        loanId: loan.id,
        emiNumber: i,
        dueDate: dueDate.toISOString().split('T')[0],
        principalAmount: Math.round(principalAmount * 100) / 100,
        interestAmount: Math.round(interestAmount * 100) / 100,
        totalAmount: Math.round(emiAmount * 100) / 100,
        status: 'pending'
      });
    }

    // Update loan status to active
    await loan.update({ status: 'active' });
  } catch (error) {
    logger.error('Generate EMIs error:', error);
    throw error;
  }
}

/**
 * Configure EMI settings
 */
exports.configureEMI = async (req, res) => {
  try {
    const { id } = req.params;
    const { emiConfiguration, autoDeduct } = req.body;

    const loan = await Loan.findByPk(id, {
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    if (loan.employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await loan.update({
      emiConfiguration: emiConfiguration || loan.emiConfiguration,
      autoDeduct: autoDeduct !== undefined ? autoDeduct : loan.autoDeduct
    });

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      action: 'update',
      entityType: 'Loan',
      entityId: loan.id,
      module: 'loan',
      description: 'EMI configuration updated'
    });

    res.json({ success: true, data: loan });
  } catch (error) {
    logger.error('Configure EMI error:', error);
    res.status(500).json({ success: false, message: 'Failed to configure EMI' });
  }
};

/**
 * Get outstanding loans
 */
exports.getOutstandingLoans = async (req, res) => {
  try {
    const { employeeId } = req.query;

    const employees = await Employee.findAll({
      where: { companyId: req.user.companyId, isActive: true },
      attributes: ['id']
    });

    const whereClause = {
      employeeId: { [Op.in]: employees.map(e => e.id) },
      status: { [Op.in]: ['approved', 'active'] },
      outstandingAmount: { [Op.gt]: 0 }
    };

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    const loans = await Loan.findAll({
      where: whereClause,
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'employeeCode', 'firstName', 'lastName']
        },
        {
          model: LoanEMI,
          as: 'emis',
          where: { status: { [Op.in]: ['pending', 'overdue', 'partial'] } },
          required: false
        }
      ],
      order: [['outstandingAmount', 'DESC']]
    });

    // Calculate summary
    const summary = {
      totalOutstanding: 0,
      totalLoans: loans.length,
      overdueEMIs: 0,
      pendingEMIs: 0
    };

    loans.forEach(loan => {
      summary.totalOutstanding += parseFloat(loan.outstandingAmount || 0);
      const pendingEMIs = loan.emis?.filter(emi => emi.status === 'pending' || emi.status === 'overdue') || [];
      summary.pendingEMIs += pendingEMIs.length;
      summary.overdueEMIs += pendingEMIs.filter(emi => {
        const dueDate = new Date(emi.dueDate);
        return dueDate < new Date() && emi.status !== 'paid';
      }).length;
    });

    res.json({
      success: true,
      data: loans,
      summary
    });
  } catch (error) {
    logger.error('Get outstanding loans error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch outstanding loans', error: error.message });
  }
};

/**
 * Record EMI payment
 */
exports.recordEMIPayment = async (req, res) => {
  try {
    const { emiId } = req.params;
    const { paidAmount, paidDate, payrollId, payslipId, isAutoDeducted } = req.body;

    const emi = await LoanEMI.findByPk(emiId, {
      include: [{ model: Loan, as: 'loan', include: [{ model: Employee, as: 'employee' }] }]
    });

    if (!emi) {
      return res.status(404).json({ success: false, message: 'EMI not found' });
    }

    if (emi.loan.employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const paid = parseFloat(paidAmount || emi.totalAmount);
    const remaining = parseFloat(emi.totalAmount) - parseFloat(emi.paidAmount || 0);

    if (paid > remaining) {
      return res.status(400).json({ success: false, message: 'Paid amount exceeds remaining amount' });
    }

    const newPaidAmount = parseFloat(emi.paidAmount || 0) + paid;
    let status = 'paid';
    if (newPaidAmount < parseFloat(emi.totalAmount)) {
      status = 'partial';
    }

    // Check if overdue
    const dueDate = new Date(emi.dueDate);
    if (dueDate < new Date() && status !== 'paid') {
      status = 'overdue';
    }

    await emi.update({
      paidAmount: newPaidAmount,
      paidDate: paidDate || new Date().toISOString().split('T')[0],
      status,
      payrollId: payrollId || null,
      payslipId: payslipId || null,
      isAutoDeducted: isAutoDeducted || false
    });

    // Update loan outstanding amount
    const loan = emi.loan;
    const newOutstanding = parseFloat(loan.outstandingAmount || 0) - paid;
    const newPaidLoanAmount = parseFloat(loan.paidAmount || 0) + paid;

    await loan.update({
      outstandingAmount: Math.max(0, newOutstanding),
      paidAmount: newPaidLoanAmount,
      lastDeductionDate: paidDate || new Date().toISOString().split('T')[0],
      status: newOutstanding <= 0 ? 'closed' : loan.status
    });

    // Update next deduction date
    if (loan.autoDeduct && loan.status === 'active') {
      const nextEMI = await LoanEMI.findOne({
        where: {
          loanId: loan.id,
          status: { [Op.in]: ['pending', 'overdue'] }
        },
        order: [['dueDate', 'ASC']]
      });

      if (nextEMI) {
        await loan.update({ nextDeductionDate: nextEMI.dueDate });
      }
    }

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      action: 'update',
      entityType: 'LoanEMI',
      entityId: emi.id,
      module: 'loan',
      description: `EMI payment recorded: ₹${paid} for EMI #${emi.emiNumber}`
    });

    res.json({ success: true, data: emi, message: 'EMI payment recorded successfully' });
  } catch (error) {
    logger.error('Record EMI payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to record EMI payment', error: error.message });
  }
};

/**
 * Get employee loans
 */
exports.getEmployeeLoans = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { status } = req.query;

    const employee = await Employee.findByPk(employeeId);
    if (!employee || employee.companyId !== req.user.companyId) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const whereClause = { employeeId };
    if (status) whereClause.status = status;

    const loans = await Loan.findAll({
      where: whereClause,
      include: [{
        model: LoanEMI,
        as: 'emis',
        order: [['emiNumber', 'ASC']]
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: loans
    });
  } catch (error) {
    logger.error('Get employee loans error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employee loans', error: error.message });
  }
};

/**
 * Update loan
 */
exports.updateLoan = async (req, res) => {
  try {
    const loan = await Loan.findByPk(req.params.id, {
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    if (loan.employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (loan.status === 'closed') {
      return res.status(400).json({ success: false, message: 'Cannot update closed loan' });
    }

    await loan.update(req.body);

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      action: 'update',
      entityType: 'Loan',
      entityId: loan.id,
      module: 'loan',
      description: 'Updated loan details'
    });

    res.json({
      success: true,
      message: 'Loan updated successfully',
      data: loan
    });
  } catch (error) {
    logger.error('Update loan error:', error);
    res.status(500).json({ success: false, message: 'Failed to update loan', error: error.message });
  }
};
