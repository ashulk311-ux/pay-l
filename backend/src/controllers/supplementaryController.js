const { SupplementarySalary, Employee } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

/**
 * Get all supplementary salaries
 */
exports.getAllSupplementary = async (req, res) => {
  try {
    const { type, employeeId, month, year, isProcessed, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (type) whereClause.type = type;
    if (employeeId) whereClause.employeeId = employeeId;
    if (month) whereClause.month = parseInt(month);
    if (year) whereClause.year = parseInt(year);
    if (isProcessed !== undefined) whereClause.isProcessed = isProcessed === 'true';

    const { count, rows } = await SupplementarySalary.findAndCountAll({
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
    logger.error('Get supplementary salaries error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch supplementary salaries', error: error.message });
  }
};

/**
 * Get single supplementary salary
 */
exports.getSupplementary = async (req, res) => {
  try {
    const supplementary = await SupplementarySalary.findByPk(req.params.id, {
      include: [{
        model: Employee,
        as: 'employee'
      }]
    });

    if (!supplementary) {
      return res.status(404).json({ success: false, message: 'Supplementary salary not found' });
    }

    res.json({ success: true, data: supplementary });
  } catch (error) {
    logger.error('Get supplementary salary error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch supplementary salary', error: error.message });
  }
};

/**
 * Create supplementary salary
 */
exports.createSupplementary = async (req, res) => {
  try {
    const { employeeId, type, amount, month, year, description } = req.body;

    if (!employeeId || !type || !amount) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const supplementary = await SupplementarySalary.create({
      employeeId,
      type,
      amount: parseFloat(amount),
      month: month ? parseInt(month) : null,
      year: year ? parseInt(year) : null,
      description,
      isProcessed: false
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'create',
      entityType: 'SupplementarySalary',
      entityId: supplementary.id,
      module: 'supplementary',
      description: `Created ${type} of ₹${amount} for employee`
    });

    res.status(201).json({
      success: true,
      message: 'Supplementary salary created successfully',
      data: supplementary
    });
  } catch (error) {
    logger.error('Create supplementary salary error:', error);
    res.status(500).json({ success: false, message: 'Failed to create supplementary salary', error: error.message });
  }
};

/**
 * Bulk create supplementary salaries
 */
exports.bulkCreate = async (req, res) => {
  try {
    const { entries } = req.body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ success: false, message: 'Entries array is required' });
    }

    const created = [];
    for (const entry of entries) {
      const { employeeId, type, amount, month, year, description } = entry;
      if (employeeId && type && amount) {
        const supplementary = await SupplementarySalary.create({
          employeeId,
          type,
          amount: parseFloat(amount),
          month: month ? parseInt(month) : null,
          year: year ? parseInt(year) : null,
          description,
          isProcessed: false
        });
        created.push(supplementary);
      }
    }

    await createAuditLog({
      userId: req.user.id,
      action: 'create',
      entityType: 'SupplementarySalary',
      module: 'supplementary',
      description: `Bulk created ${created.length} supplementary salaries`
    });

    res.status(201).json({
      success: true,
      message: `Successfully created ${created.length} supplementary salaries`,
      data: created
    });
  } catch (error) {
    logger.error('Bulk create supplementary salaries error:', error);
    res.status(500).json({ success: false, message: 'Failed to bulk create supplementary salaries', error: error.message });
  }
};

/**
 * Update supplementary salary
 */
exports.updateSupplementary = async (req, res) => {
  try {
    const supplementary = await SupplementarySalary.findByPk(req.params.id);
    if (!supplementary) {
      return res.status(404).json({ success: false, message: 'Supplementary salary not found' });
    }

    if (supplementary.isProcessed) {
      return res.status(400).json({ success: false, message: 'Cannot update processed supplementary salary' });
    }

    await supplementary.update(req.body);

    await createAuditLog({
      userId: req.user.id,
      action: 'update',
      entityType: 'SupplementarySalary',
      entityId: supplementary.id,
      module: 'supplementary',
      description: 'Updated supplementary salary'
    });

    res.json({
      success: true,
      message: 'Supplementary salary updated successfully',
      data: supplementary
    });
  } catch (error) {
    logger.error('Update supplementary salary error:', error);
    res.status(500).json({ success: false, message: 'Failed to update supplementary salary', error: error.message });
  }
};

/**
 * Delete supplementary salary
 */
exports.deleteSupplementary = async (req, res) => {
  try {
    const supplementary = await SupplementarySalary.findByPk(req.params.id);
    if (!supplementary) {
      return res.status(404).json({ success: false, message: 'Supplementary salary not found' });
    }

    if (supplementary.isProcessed) {
      return res.status(400).json({ success: false, message: 'Cannot delete processed supplementary salary' });
    }

    await supplementary.destroy();

    await createAuditLog({
      userId: req.user.id,
      action: 'delete',
      entityType: 'SupplementarySalary',
      entityId: req.params.id,
      module: 'supplementary',
      description: 'Deleted supplementary salary'
    });

    res.json({
      success: true,
      message: 'Supplementary salary deleted successfully'
    });
  } catch (error) {
    logger.error('Delete supplementary salary error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete supplementary salary', error: error.message });
  }
};
