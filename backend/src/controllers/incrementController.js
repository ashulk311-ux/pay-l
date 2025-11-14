const { SalaryIncrement, Employee, SalaryStructure } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

/**
 * Get all salary increments
 */
exports.getAllIncrements = async (req, res) => {
  try {
    const { status, employeeId, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) whereClause.status = status;
    if (employeeId) whereClause.employeeId = employeeId;

    const { count, rows } = await SalaryIncrement.findAndCountAll({
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
    logger.error('Get increments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch increments', error: error.message });
  }
};

/**
 * Get single increment
 */
exports.getIncrement = async (req, res) => {
  try {
    const increment = await SalaryIncrement.findByPk(req.params.id, {
      include: [{
        model: Employee,
        as: 'employee'
      }]
    });

    if (!increment) {
      return res.status(404).json({ success: false, message: 'Increment not found' });
    }

    res.json({ success: true, data: increment });
  } catch (error) {
    logger.error('Get increment error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch increment', error: error.message });
  }
};

/**
 * Create salary increment
 */
exports.createIncrement = async (req, res) => {
  try {
    const { employeeId, effectiveDate, newSalary, reason } = req.body;

    if (!employeeId || !effectiveDate || !newSalary) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Get current salary structure
    const salaryStructure = await SalaryStructure.findOne({
      where: { employeeId, isActive: true }
    });

    if (!salaryStructure) {
      return res.status(404).json({ success: false, message: 'Salary structure not found for employee' });
    }

    const previousSalary = parseFloat(salaryStructure.grossSalary);
    const incrementAmount = parseFloat(newSalary) - previousSalary;
    const incrementPercentage = (incrementAmount / previousSalary) * 100;

    const increment = await SalaryIncrement.create({
      employeeId,
      effectiveDate: new Date(effectiveDate),
      previousSalary,
      newSalary: parseFloat(newSalary),
      incrementAmount,
      incrementPercentage: Math.round(incrementPercentage * 100) / 100,
      reason,
      status: 'pending',
      isApplied: false
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'create',
      entityType: 'SalaryIncrement',
      entityId: increment.id,
      module: 'increment',
      description: `Created salary increment of ₹${incrementAmount} (${incrementPercentage.toFixed(2)}%)`
    });

    res.status(201).json({
      success: true,
      message: 'Salary increment created successfully',
      data: increment
    });
  } catch (error) {
    logger.error('Create increment error:', error);
    res.status(500).json({ success: false, message: 'Failed to create increment', error: error.message });
  }
};

/**
 * Bulk create increments
 */
exports.bulkCreate = async (req, res) => {
  try {
    const { entries } = req.body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ success: false, message: 'Entries array is required' });
    }

    const created = [];
    for (const entry of entries) {
      const { employeeId, effectiveDate, newSalary, reason } = entry;
      if (employeeId && effectiveDate && newSalary) {
        const salaryStructure = await SalaryStructure.findOne({
          where: { employeeId, isActive: true }
        });

        if (salaryStructure) {
          const previousSalary = parseFloat(salaryStructure.grossSalary);
          const incrementAmount = parseFloat(newSalary) - previousSalary;
          const incrementPercentage = (incrementAmount / previousSalary) * 100;

          const increment = await SalaryIncrement.create({
            employeeId,
            effectiveDate: new Date(effectiveDate),
            previousSalary,
            newSalary: parseFloat(newSalary),
            incrementAmount,
            incrementPercentage: Math.round(incrementPercentage * 100) / 100,
            reason,
            status: 'pending',
            isApplied: false
          });
          created.push(increment);
        }
      }
    }

    await createAuditLog({
      userId: req.user.id,
      action: 'create',
      entityType: 'SalaryIncrement',
      module: 'increment',
      description: `Bulk created ${created.length} increments`
    });

    res.status(201).json({
      success: true,
      message: `Successfully created ${created.length} increments`,
      data: created
    });
  } catch (error) {
    logger.error('Bulk create increments error:', error);
    res.status(500).json({ success: false, message: 'Failed to bulk create increments', error: error.message });
  }
};

/**
 * Update increment
 */
exports.updateIncrement = async (req, res) => {
  try {
    const increment = await SalaryIncrement.findByPk(req.params.id);
    if (!increment) {
      return res.status(404).json({ success: false, message: 'Increment not found' });
    }

    if (increment.isApplied) {
      return res.status(400).json({ success: false, message: 'Cannot update applied increment' });
    }

    // Recalculate if newSalary is updated
    if (req.body.newSalary) {
      const newSalary = parseFloat(req.body.newSalary);
      const incrementAmount = newSalary - parseFloat(increment.previousSalary);
      const incrementPercentage = (incrementAmount / parseFloat(increment.previousSalary)) * 100;
      req.body.incrementAmount = incrementAmount;
      req.body.incrementPercentage = Math.round(incrementPercentage * 100) / 100;
    }

    await increment.update(req.body);

    await createAuditLog({
      userId: req.user.id,
      action: 'update',
      entityType: 'SalaryIncrement',
      entityId: increment.id,
      module: 'increment',
      description: 'Updated increment details'
    });

    res.json({
      success: true,
      message: 'Increment updated successfully',
      data: increment
    });
  } catch (error) {
    logger.error('Update increment error:', error);
    res.status(500).json({ success: false, message: 'Failed to update increment', error: error.message });
  }
};

/**
 * Approve increment
 */
exports.approveIncrement = async (req, res) => {
  try {
    const increment = await SalaryIncrement.findByPk(req.params.id);
    if (!increment) {
      return res.status(404).json({ success: false, message: 'Increment not found' });
    }

    if (increment.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Increment is not in pending status' });
    }

    await increment.update({
      status: 'approved',
      approvedBy: req.user.id,
      approvedAt: new Date()
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'approve',
      entityType: 'SalaryIncrement',
      entityId: increment.id,
      module: 'increment',
      description: `Approved salary increment of ₹${increment.incrementAmount}`
    });

    res.json({
      success: true,
      message: 'Increment approved successfully',
      data: increment
    });
  } catch (error) {
    logger.error('Approve increment error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve increment', error: error.message });
  }
};
