const { Reimbursement, Employee } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

/**
 * Get all reimbursements with filters
 */
exports.getAllReimbursements = async (req, res) => {
  try {
    const { status, category, employeeId, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) whereClause.status = status;
    if (category) whereClause.category = category;
    if (employeeId) whereClause.employeeId = employeeId;

    const { count, rows } = await Reimbursement.findAndCountAll({
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
    logger.error('Get reimbursements error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reimbursements', error: error.message });
  }
};

/**
 * Get single reimbursement
 */
exports.getReimbursement = async (req, res) => {
  try {
    const reimbursement = await Reimbursement.findByPk(req.params.id, {
      include: [{
        model: Employee,
        as: 'employee'
      }]
    });

    if (!reimbursement) {
      return res.status(404).json({ success: false, message: 'Reimbursement not found' });
    }

    res.json({ success: true, data: reimbursement });
  } catch (error) {
    logger.error('Get reimbursement error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reimbursement', error: error.message });
  }
};

/**
 * Create reimbursement
 */
exports.createReimbursement = async (req, res) => {
  try {
    const { employeeId, category, amount, date, description, documents, isTaxable } = req.body;

    if (!employeeId || !category || !amount || !date) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const reimbursement = await Reimbursement.create({
      employeeId,
      category,
      amount: parseFloat(amount),
      date: new Date(date),
      description,
      documents: documents || [],
      isTaxable: isTaxable || false,
      status: 'pending'
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'create',
      entityType: 'Reimbursement',
      entityId: reimbursement.id,
      module: 'reimbursement',
      description: `Created reimbursement of ₹${amount} for ${category}`
    });

    res.status(201).json({
      success: true,
      message: 'Reimbursement created successfully',
      data: reimbursement
    });
  } catch (error) {
    logger.error('Create reimbursement error:', error);
    res.status(500).json({ success: false, message: 'Failed to create reimbursement', error: error.message });
  }
};

/**
 * Update reimbursement
 */
exports.updateReimbursement = async (req, res) => {
  try {
    const reimbursement = await Reimbursement.findByPk(req.params.id);
    if (!reimbursement) {
      return res.status(404).json({ success: false, message: 'Reimbursement not found' });
    }

    if (reimbursement.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Cannot update paid reimbursement' });
    }

    await reimbursement.update(req.body);

    await createAuditLog({
      userId: req.user.id,
      action: 'update',
      entityType: 'Reimbursement',
      entityId: reimbursement.id,
      module: 'reimbursement',
      description: 'Updated reimbursement details'
    });

    res.json({
      success: true,
      message: 'Reimbursement updated successfully',
      data: reimbursement
    });
  } catch (error) {
    logger.error('Update reimbursement error:', error);
    res.status(500).json({ success: false, message: 'Failed to update reimbursement', error: error.message });
  }
};

/**
 * Approve reimbursement
 */
exports.approveReimbursement = async (req, res) => {
  try {
    const reimbursement = await Reimbursement.findByPk(req.params.id);
    if (!reimbursement) {
      return res.status(404).json({ success: false, message: 'Reimbursement not found' });
    }

    if (reimbursement.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Reimbursement is not in pending status' });
    }

    await reimbursement.update({
      status: 'approved',
      approvedBy: req.user.id,
      approvedAt: new Date()
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'approve',
      entityType: 'Reimbursement',
      entityId: reimbursement.id,
      module: 'reimbursement',
      description: `Approved reimbursement of ₹${reimbursement.amount}`
    });

    res.json({
      success: true,
      message: 'Reimbursement approved successfully',
      data: reimbursement
    });
  } catch (error) {
    logger.error('Approve reimbursement error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve reimbursement', error: error.message });
  }
};

/**
 * Get employee reimbursements
 */
exports.getEmployeeReimbursements = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { status } = req.query;

    const whereClause = { employeeId };
    if (status) whereClause.status = status;

    const reimbursements = await Reimbursement.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: reimbursements
    });
  } catch (error) {
    logger.error('Get employee reimbursements error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employee reimbursements', error: error.message });
  }
};
