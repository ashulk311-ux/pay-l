const {
  FullAndFinalSettlement,
  Employee,
  Loan,
  LoanEMI,
  Reimbursement,
  LeaveBalance,
  LeaveType,
  Payslip,
  Payroll
} = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

/**
 * Calculate Full & Final Settlement
 */
async function calculateSettlement(employeeId, lastWorkingDate, settlementDate) {
  const employee = await Employee.findByPk(employeeId);
  if (!employee) {
    throw new Error('Employee not found');
  }

  const settlement = {
    noticePeriodDays: 0,
    noticePeriodAmount: 0,
    earnedLeaves: 0,
    earnedLeaveAmount: 0,
    unpaidLeaves: 0,
    unpaidLeaveDeduction: 0,
    outstandingLoans: 0,
    outstandingAdvances: 0,
    pendingReimbursements: 0,
    gratuity: 0,
    bonus: 0,
    otherDeductions: 0,
    otherPayments: 0
  };

  // Calculate outstanding loans
  const loans = await Loan.findAll({
    where: {
      employeeId,
      status: { [Op.in]: ['approved', 'active'] },
      outstandingAmount: { [Op.gt]: 0 }
    }
  });

  for (const loan of loans) {
    if (loan.loanType === 'loan') {
      settlement.outstandingLoans += parseFloat(loan.outstandingAmount || 0);
    } else {
      settlement.outstandingAdvances += parseFloat(loan.outstandingAmount || 0);
    }
  }

  // Calculate pending reimbursements
  const reimbursements = await Reimbursement.sum('amount', {
    where: {
      employeeId,
      status: { [Op.in]: ['pending', 'approved'] }
    }
  });
  settlement.pendingReimbursements = reimbursements || 0;

  // Calculate leave balance
  const currentYear = new Date().getFullYear();
  const leaveBalances = await LeaveBalance.findAll({
    where: {
      employeeId,
      year: currentYear
    },
    include: [{ model: LeaveType, as: 'leaveType' }]
  });

  for (const balance of leaveBalances) {
    if (balance.leaveType?.code === 'PL' || balance.leaveType?.code === 'EL') {
      settlement.earnedLeaves += parseFloat(balance.balance || 0);
    }
  }

  // Calculate earned leave encashment (assuming basic salary per day)
  // This should be calculated based on actual salary structure
  const lastPayslip = await Payslip.findOne({
    where: { employeeId },
    order: [['createdAt', 'DESC']],
    include: [{ model: Payroll, as: 'payroll' }]
  });

  if (lastPayslip) {
    const dailyRate = parseFloat(lastPayslip.basicSalary || 0) / 30;
    settlement.earnedLeaveAmount = settlement.earnedLeaves * dailyRate;
  }

  // Calculate gratuity using gratuity service
  const gratuityService = require('../services/gratuityService');
  try {
    const gratuityResult = await gratuityService.calculateGratuity(employeeId, lastWorkingDate);
    settlement.gratuity = gratuityResult.gratuityAmount || 0;
    settlement.gratuityDetails = gratuityResult;
  } catch (error) {
    logger.error('Gratuity calculation error:', error);
    settlement.gratuity = 0;
  }

  // Calculate gross and net
  settlement.grossAmount = settlement.noticePeriodAmount + settlement.earnedLeaveAmount + settlement.gratuity + settlement.bonus + settlement.otherPayments;
  settlement.totalDeductions = settlement.unpaidLeaveDeduction + settlement.outstandingLoans + settlement.outstandingAdvances + settlement.otherDeductions;
  settlement.netAmount = settlement.grossAmount - settlement.totalDeductions;

  return settlement;
}

/**
 * Get all Full & Final Settlements
 */
exports.getAllSettlements = async (req, res) => {
  try {
    const { status, employeeId, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const employees = await Employee.findAll({
      where: { companyId: req.user.companyId, isActive: true },
      attributes: ['id']
    });

    const whereClause = {
      employeeId: { [Op.in]: employees.map(e => e.id) }
    };
    if (status) whereClause.status = status;
    if (employeeId) whereClause.employeeId = employeeId;

    const { count, rows } = await FullAndFinalSettlement.findAndCountAll({
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
    logger.error('Get settlements error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch settlements', error: error.message });
  }
};

/**
 * Get single settlement
 */
exports.getSettlement = async (req, res) => {
  try {
    const settlement = await FullAndFinalSettlement.findByPk(req.params.id, {
      include: [
        { model: Employee, as: 'employee' },
        { model: require('../models').User, as: 'approver', attributes: ['id', 'email', 'firstName', 'lastName'] }
      ]
    });

    if (!settlement) {
      return res.status(404).json({ success: false, message: 'Settlement not found' });
    }

    const employee = await Employee.findByPk(settlement.employeeId);
    if (employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: settlement });
  } catch (error) {
    logger.error('Get settlement error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch settlement', error: error.message });
  }
};

/**
 * Create Full & Final Settlement
 */
exports.createSettlement = async (req, res) => {
  try {
    const { employeeId, settlementDate, lastWorkingDate, remarks } = req.body;

    if (!employeeId || !settlementDate || !lastWorkingDate) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const employee = await Employee.findByPk(employeeId);
    if (!employee || employee.companyId !== req.user.companyId) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Calculate settlement
    const calculatedSettlement = await calculateSettlement(employeeId, lastWorkingDate, settlementDate);

    const settlement = await FullAndFinalSettlement.create({
      employeeId,
      settlementDate: new Date(settlementDate),
      lastWorkingDate: new Date(lastWorkingDate),
      ...calculatedSettlement,
      remarks: remarks || '',
      status: 'draft'
    });

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      action: 'create',
      entityType: 'FullAndFinalSettlement',
      entityId: settlement.id,
      module: 'full_and_final',
      description: `Created Full & Final Settlement for employee`
    });

    res.status(201).json({
      success: true,
      message: 'Full & Final Settlement created successfully',
      data: settlement
    });
  } catch (error) {
    logger.error('Create settlement error:', error);
    res.status(500).json({ success: false, message: 'Failed to create settlement', error: error.message });
  }
};

/**
 * Update settlement
 */
exports.updateSettlement = async (req, res) => {
  try {
    const settlement = await FullAndFinalSettlement.findByPk(req.params.id, {
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!settlement) {
      return res.status(404).json({ success: false, message: 'Settlement not found' });
    }

    if (settlement.employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (settlement.status === 'paid' || settlement.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot update paid/cancelled settlement' });
    }

    await settlement.update(req.body);

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      action: 'update',
      entityType: 'FullAndFinalSettlement',
      entityId: settlement.id,
      module: 'full_and_final',
      description: 'Updated Full & Final Settlement'
    });

    res.json({
      success: true,
      message: 'Settlement updated successfully',
      data: settlement
    });
  } catch (error) {
    logger.error('Update settlement error:', error);
    res.status(500).json({ success: false, message: 'Failed to update settlement', error: error.message });
  }
};

/**
 * Approve settlement
 */
exports.approveSettlement = async (req, res) => {
  try {
    const settlement = await FullAndFinalSettlement.findByPk(req.params.id, {
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!settlement) {
      return res.status(404).json({ success: false, message: 'Settlement not found' });
    }

    if (settlement.employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (settlement.status !== 'draft' && settlement.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Settlement is not in draft/pending status' });
    }

    await settlement.update({
      status: 'approved',
      approvedBy: req.user.id,
      approvedAt: new Date()
    });

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      action: 'approve',
      entityType: 'FullAndFinalSettlement',
      entityId: settlement.id,
      module: 'full_and_final',
      description: 'Approved Full & Final Settlement'
    });

    res.json({
      success: true,
      message: 'Settlement approved successfully',
      data: settlement
    });
  } catch (error) {
    logger.error('Approve settlement error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve settlement', error: error.message });
  }
};

/**
 * Mark settlement as paid
 */
exports.markAsPaid = async (req, res) => {
  try {
    const settlement = await FullAndFinalSettlement.findByPk(req.params.id, {
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!settlement) {
      return res.status(404).json({ success: false, message: 'Settlement not found' });
    }

    if (settlement.employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (settlement.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Settlement must be approved before marking as paid' });
    }

    await settlement.update({
      status: 'paid',
      paidAt: new Date()
    });

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      action: 'update',
      entityType: 'FullAndFinalSettlement',
      entityId: settlement.id,
      module: 'full_and_final',
      description: 'Marked Full & Final Settlement as paid'
    });

    res.json({
      success: true,
      message: 'Settlement marked as paid successfully',
      data: settlement
    });
  } catch (error) {
    logger.error('Mark settlement as paid error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark settlement as paid', error: error.message });
  }
};

