const { Loan, Employee, Payslip } = require('../models');
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
 * Get single loan
 */
exports.getLoan = async (req, res) => {
  try {
    const loan = await Loan.findByPk(req.params.id, {
      include: [{
        model: Employee,
        as: 'employee'
      }]
    });

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    res.json({ success: true, data: loan });
  } catch (error) {
    logger.error('Get loan error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch loan', error: error.message });
  }
};

/**
 * Create loan
 */
exports.createLoan = async (req, res) => {
  try {
    const { employeeId, loanType, amount, interestRate, tenure, startDate, autoDeduct } = req.body;

    if (!employeeId || !loanType || !amount || !tenure || !startDate) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
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
      status: 'pending'
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'create',
      entityType: 'Loan',
      entityId: loan.id,
      module: 'loan',
      description: `Created ${loanType} of ₹${amount} for employee`
    });

    res.status(201).json({
      success: true,
      message: 'Loan created successfully',
      data: loan
    });
  } catch (error) {
    logger.error('Create loan error:', error);
    res.status(500).json({ success: false, message: 'Failed to create loan', error: error.message });
  }
};

/**
 * Update loan
 */
exports.updateLoan = async (req, res) => {
  try {
    const loan = await Loan.findByPk(req.params.id);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    if (loan.status === 'closed') {
      return res.status(400).json({ success: false, message: 'Cannot update closed loan' });
    }

    await loan.update(req.body);

    await createAuditLog({
      userId: req.user.id,
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

/**
 * Approve loan
 */
exports.approveLoan = async (req, res) => {
  try {
    const loan = await Loan.findByPk(req.params.id);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    if (loan.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Loan is not in pending status' });
    }

    await loan.update({
      status: 'active',
      approvedBy: req.user.id,
      approvedAt: new Date(),
      outstandingAmount: parseFloat(loan.amount)
    });

    await createAuditLog({
      userId: req.user.id,
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
 * Get employee loans
 */
exports.getEmployeeLoans = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { status } = req.query;

    const whereClause = { employeeId };
    if (status) whereClause.status = status;

    const loans = await Loan.findAll({
      where: whereClause,
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
