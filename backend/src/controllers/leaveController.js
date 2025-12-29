const { Leave, Employee } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

/**
 * Get all leaves
 */
exports.getAllLeaves = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { status, employeeId, year, month } = req.query;

    // Get all employees for the company
    const employees = await Employee.findAll({
      where: { companyId },
      attributes: ['id']
    });
    const employeeIds = employees.map(e => e.id);

    const whereClause = {
      employeeId: { [Op.in]: employeeIds }
    };

    if (status) {
      whereClause.status = status;
    }

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (year) {
      const yearStart = new Date(`${year}-01-01`);
      const yearEnd = new Date(`${year}-12-31`);
      whereClause[Op.or] = [
        { startDate: { [Op.between]: [yearStart, yearEnd] } },
        { endDate: { [Op.between]: [yearStart, yearEnd] } }
      ];
    }

    if (month && year) {
      const monthStart = new Date(`${year}-${month}-01`);
      const monthEnd = new Date(year, month, 0);
      whereClause[Op.or] = [
        { startDate: { [Op.between]: [monthStart, monthEnd] } },
        { endDate: { [Op.between]: [monthStart, monthEnd] } }
      ];
    }

    const leaves = await Leave.findAll({
      where: whereClause,
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'department']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: leaves
    });
  } catch (error) {
    logger.error('Get all leaves error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leaves', error: error.message });
  }
};

/**
 * Get leave by ID
 */
exports.getLeaveById = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const leave = await Leave.findByPk(id, {
      include: [{
        model: Employee,
        as: 'employee',
        where: { companyId },
        attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'department']
      }]
    });

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave not found' });
    }

    res.json({
      success: true,
      data: leave
    });
  } catch (error) {
    logger.error('Get leave by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leave', error: error.message });
  }
};

/**
 * Create leave
 */
exports.createLeave = async (req, res) => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;

    if (!employeeId || !leaveType || !startDate) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, leave type, and start date are required'
      });
    }

    const employee = await Employee.findOne({
      where: { id: employeeId, companyId: req.user.companyId }
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const end = endDate || startDate;
    const start = new Date(startDate);
    const endD = new Date(end);
    const days = Math.ceil((endD - start) / (1000 * 60 * 60 * 24)) + 1;

    // Check for overlapping leaves
    const overlapping = await Leave.findOne({
      where: {
        employeeId,
        status: { [Op.in]: ['pending', 'approved'] },
        [Op.or]: [
          {
            startDate: { [Op.between]: [startDate, end] },
            endDate: { [Op.between]: [startDate, end] }
          },
          {
            startDate: { [Op.lte]: startDate },
            endDate: { [Op.gte]: end }
          }
        ]
      }
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: 'Leave application overlaps with existing approved/pending leave'
      });
    }

    const leave = await Leave.create({
      employeeId,
      leaveType,
      startDate,
      endDate: end,
      days,
      reason,
      status: 'pending'
    });

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'leave',
      action: 'create',
      entityType: 'Leave',
      entityId: leave.id,
      description: `Leave application submitted: ${leaveType} for ${days} days`
    });

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: leave
    });
  } catch (error) {
    logger.error('Create leave error:', error);
    res.status(500).json({ success: false, message: 'Failed to create leave', error: error.message });
  }
};

/**
 * Update leave
 */
exports.updateLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { leaveType, startDate, endDate, reason } = req.body;

    const leave = await Leave.findByPk(id, {
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave not found' });
    }

    // Check company access
    if (leave.employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Only allow updates to pending leaves
    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending leaves can be updated'
      });
    }

    if (leaveType) leave.leaveType = leaveType;
    if (startDate) leave.startDate = startDate;
    if (endDate) leave.endDate = endDate;
    if (reason !== undefined) leave.reason = reason;

    // Recalculate days if dates changed
    if (startDate || endDate) {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      leave.days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    }

    await leave.save();

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'leave',
      action: 'update',
      entityType: 'Leave',
      entityId: leave.id,
      description: `Leave application updated`
    });

    res.json({
      success: true,
      message: 'Leave updated successfully',
      data: leave
    });
  } catch (error) {
    logger.error('Update leave error:', error);
    res.status(500).json({ success: false, message: 'Failed to update leave', error: error.message });
  }
};

/**
 * Delete leave
 */
exports.deleteLeave = async (req, res) => {
  try {
    const { id } = req.params;

    const leave = await Leave.findByPk(id, {
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave not found' });
    }

    // Check company access
    if (leave.employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Only allow deletion of pending leaves
    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending leaves can be deleted'
      });
    }

    await leave.destroy();

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'leave',
      action: 'delete',
      entityType: 'Leave',
      entityId: id,
      description: `Leave application deleted`
    });

    res.json({
      success: true,
      message: 'Leave deleted successfully'
    });
  } catch (error) {
    logger.error('Delete leave error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete leave', error: error.message });
  }
};

/**
 * Approve leave
 */
exports.approveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const leave = await Leave.findByPk(id, {
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave not found' });
    }

    // Check company access
    if (leave.employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    leave.status = 'approved';
    leave.approvedBy = req.user.id;
    leave.approvedAt = new Date();
    if (remarks) {
      leave.remarks = remarks;
    }
    await leave.save();

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'leave',
      action: 'update',
      entityType: 'Leave',
      entityId: leave.id,
      description: `Leave approved: ${leave.leaveType} for ${leave.days} days`
    });

    res.json({
      success: true,
      message: 'Leave approved successfully',
      data: leave
    });
  } catch (error) {
    logger.error('Approve leave error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve leave', error: error.message });
  }
};

/**
 * Reject leave
 */
exports.rejectLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const leave = await Leave.findByPk(id, {
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave not found' });
    }

    // Check company access
    if (leave.employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    leave.status = 'rejected';
    leave.approvedBy = req.user.id;
    leave.approvedAt = new Date();
    if (remarks) {
      leave.remarks = remarks;
    }
    await leave.save();

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'leave',
      action: 'update',
      entityType: 'Leave',
      entityId: leave.id,
      description: `Leave rejected: ${leave.leaveType} for ${leave.days} days`
    });

    res.json({
      success: true,
      message: 'Leave rejected successfully',
      data: leave
    });
  } catch (error) {
    logger.error('Reject leave error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject leave', error: error.message });
  }
};

/**
 * Get leave balance for employee
 */
exports.getLeaveBalance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Check company access
    if (employee.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get all approved leaves for the year
    const leaves = await Leave.findAll({
      where: {
        employeeId,
        status: 'approved',
        startDate: { [Op.gte]: new Date(currentYear, 0, 1) },
        endDate: { [Op.lte]: new Date(currentYear, 11, 31) }
      }
    });

    // Calculate leave balance (assuming standard leave allocation)
    // This can be configured per company/employee
    const leaveAllocation = {
      CL: 12, // Casual Leave
      SL: 12, // Sick Leave
      PL: 15, // Privilege Leave
      EL: 5,  // Earned Leave
      ML: 0,  // Maternity Leave
      LWP: 0  // Leave Without Pay
    };

    const leaveBalance = {};
    const leaveUsed = {};

    Object.keys(leaveAllocation).forEach(type => {
      leaveUsed[type] = leaves
        .filter(l => l.leaveType === type)
        .reduce((sum, l) => sum + parseFloat(l.days || 0), 0);
      leaveBalance[type] = leaveAllocation[type] - leaveUsed[type];
    });

    res.json({
      success: true,
      data: {
        employeeId,
        year: currentYear,
        allocation: leaveAllocation,
        used: leaveUsed,
        balance: leaveBalance,
        leaves: leaves
      }
    });
  } catch (error) {
    logger.error('Get leave balance error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leave balance', error: error.message });
  }
};



