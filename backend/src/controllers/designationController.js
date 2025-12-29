const { Designation, Company } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');
const { getPaginationParams, createPaginatedResponse } = require('../utils/pagination');
const { getErrorMessage } = require('../utils/errorMessages');

exports.getAllDesignations = async (req, res) => {
  try {
    const { search } = req.query;
    const { page, limit, offset } = getPaginationParams(req, { defaultLimit: 50, maxLimit: 200 });
    
    const whereClause = { companyId: req.user.companyId, isActive: true };
    
    // Add search filter if provided
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: designations } = await Designation.findAndCountAll({
      where: whereClause,
      include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }],
      order: [['level', 'DESC'], ['name', 'ASC']],
      limit,
      offset
    });
    
    res.json(createPaginatedResponse(designations, count, page, limit));
  } catch (error) {
    logger.error('Get designations error:', error);
    res.status(500).json({ success: false, message: getErrorMessage('OPERATION_FAILED', 'fetch designations') });
  }
};

exports.getDesignation = async (req, res) => {
  try {
    const designation = await Designation.findOne({
      where: { id: req.params.id, companyId: req.user.companyId },
      include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }]
    });
    if (!designation) {
      return res.status(404).json({ success: false, message: 'Designation not found' });
    }
    res.json({ success: true, data: designation });
  } catch (error) {
    logger.error('Get designation error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch designation' });
  }
};

exports.createDesignation = async (req, res) => {
  try {
    const designationData = { ...req.body, companyId: req.user.companyId };
    
    // Check if code already exists
    const existing = await Designation.findOne({
      where: { companyId: req.user.companyId, code: designationData.code }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Designation code already exists' });
    }

    const designation = await Designation.create(designationData);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'create',
      entityType: 'Designation',
      entityId: designation.id
    });
    res.status(201).json({ success: true, data: designation });
  } catch (error) {
    logger.error('Create designation error:', error);
    res.status(500).json({ success: false, message: 'Failed to create designation' });
  }
};

exports.updateDesignation = async (req, res) => {
  try {
    const designation = await Designation.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!designation) {
      return res.status(404).json({ success: false, message: 'Designation not found' });
    }

    // Check if code is being changed and already exists
    if (req.body.code && req.body.code !== designation.code) {
      const existing = await Designation.findOne({
        where: { companyId: req.user.companyId, code: req.body.code }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: getErrorMessage('CODE_EXISTS', 'Designation') });
      }
    }

    await designation.update(req.body);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'update',
      entityType: 'Designation',
      entityId: designation.id
    });
    res.json({ success: true, data: designation });
  } catch (error) {
    logger.error('Update designation error:', error);
    res.status(500).json({ success: false, message: 'Failed to update designation' });
  }
};

exports.deleteDesignation = async (req, res) => {
  try {
    const designation = await Designation.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!designation) {
      return res.status(404).json({ success: false, message: getErrorMessage('NOT_FOUND', 'Designation') });
    }

    designation.isActive = false;
    await designation.save();
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'delete',
      entityType: 'Designation',
      entityId: designation.id
    });
    res.json({ success: true, message: 'Designation deleted successfully' });
  } catch (error) {
    logger.error('Delete designation error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete designation' });
  }
};


