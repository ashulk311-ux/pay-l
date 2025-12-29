const { Branch, Company } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');
const { getPaginationParams, createPaginatedResponse } = require('../utils/pagination');
const { getErrorMessage } = require('../utils/errorMessages');

exports.getAllBranches = async (req, res) => {
  try {
    const { search } = req.query;
    const { page, limit, offset } = getPaginationParams(req, { defaultLimit: 50, maxLimit: 200 });
    
    const whereClause = { companyId: req.user.companyId, isActive: true };
    
    // Add search filter if provided
    if (search) {
      const { Op } = require('sequelize');
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: branches } = await Branch.findAndCountAll({
      where: whereClause,
      include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }],
      order: [['name', 'ASC']],
      limit,
      offset
    });
    
    res.json(createPaginatedResponse(branches, count, page, limit));
  } catch (error) {
    logger.error('Get branches error:', error);
    res.status(500).json({ success: false, message: getErrorMessage('OPERATION_FAILED', 'fetch branches') });
  }
};

exports.getBranch = async (req, res) => {
  try {
    const branch = await Branch.findOne({
      where: { id: req.params.id, companyId: req.user.companyId },
      include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }]
    });
    if (!branch) {
      return res.status(404).json({ success: false, message: getErrorMessage('NOT_FOUND', 'Branch') });
    }
    res.json({ success: true, data: branch });
  } catch (error) {
    logger.error('Get branch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch branch' });
  }
};

exports.createBranch = async (req, res) => {
  try {
    const branchData = { ...req.body, companyId: req.user.companyId };
    
    // Check if code already exists
    const existing = await Branch.findOne({
      where: { companyId: req.user.companyId, code: branchData.code }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: getErrorMessage('CODE_EXISTS', 'Branch') });
    }

    const branch = await Branch.create(branchData);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'create',
      entityType: 'Branch',
      entityId: branch.id
    });
    res.status(201).json({ success: true, data: branch });
  } catch (error) {
    logger.error('Create branch error:', error);
    res.status(500).json({ success: false, message: getErrorMessage('OPERATION_FAILED', 'create branch') });
  }
};

exports.updateBranch = async (req, res) => {
  try {
    const branch = await Branch.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    // Check if code is being changed and already exists
    if (req.body.code && req.body.code !== branch.code) {
      const existing = await Branch.findOne({
        where: { companyId: req.user.companyId, code: req.body.code }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: getErrorMessage('CODE_EXISTS', 'Branch') });
      }
    }

    await branch.update(req.body);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'update',
      entityType: 'Branch',
      entityId: branch.id
    });
    res.json({ success: true, data: branch });
  } catch (error) {
    logger.error('Update branch error:', error);
    res.status(500).json({ success: false, message: getErrorMessage('OPERATION_FAILED', 'update branch') });
  }
};

exports.deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!branch) {
      return res.status(404).json({ success: false, message: getErrorMessage('NOT_FOUND', 'Branch') });
    }

    branch.isActive = false;
    await branch.save();
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'delete',
      entityType: 'Branch',
      entityId: branch.id
    });
    res.json({ success: true, message: 'Branch deleted successfully' });
  } catch (error) {
    logger.error('Delete branch error:', error);
    res.status(500).json({ success: false, message: getErrorMessage('OPERATION_FAILED', 'delete branch') });
  }
};


