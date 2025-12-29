const {
  ReimbursementCategory,
  ReimbursementPolicy,
  ReimbursementWorkflowConfig,
  Company
} = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

/**
 * Reimbursement Category Management
 */
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await ReimbursementCategory.findAll({
      where: { companyId: req.user.companyId, isActive: true },
      order: [['code', 'ASC']]
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const category = await ReimbursementCategory.create({
      ...req.body,
      companyId: req.user.companyId
    });
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'reimbursement',
      action: 'create',
      entityType: 'ReimbursementCategory',
      entityId: category.id
    });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    logger.error('Create category error:', error);
    res.status(500).json({ success: false, message: 'Failed to create category' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await ReimbursementCategory.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    await category.update(req.body);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'reimbursement',
      action: 'update',
      entityType: 'ReimbursementCategory',
      entityId: category.id
    });
    res.json({ success: true, data: category });
  } catch (error) {
    logger.error('Update category error:', error);
    res.status(500).json({ success: false, message: 'Failed to update category' });
  }
};

/**
 * Reimbursement Policy Management
 */
exports.getAllPolicies = async (req, res) => {
  try {
    const policies = await ReimbursementPolicy.findAll({
      where: { companyId: req.user.companyId },
      include: [
        {
          model: ReimbursementCategory,
          as: 'category',
          attributes: ['id', 'code', 'name']
        }
      ]
    });
    res.json({ success: true, data: policies });
  } catch (error) {
    logger.error('Get policies error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch policies' });
  }
};

exports.createPolicy = async (req, res) => {
  try {
    const policy = await ReimbursementPolicy.create({
      ...req.body,
      companyId: req.user.companyId
    });
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'reimbursement',
      action: 'create',
      entityType: 'ReimbursementPolicy',
      entityId: policy.id
    });
    res.status(201).json({ success: true, data: policy });
  } catch (error) {
    logger.error('Create policy error:', error);
    res.status(500).json({ success: false, message: 'Failed to create policy' });
  }
};

exports.updatePolicy = async (req, res) => {
  try {
    const policy = await ReimbursementPolicy.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!policy) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }
    await policy.update(req.body);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'reimbursement',
      action: 'update',
      entityType: 'ReimbursementPolicy',
      entityId: policy.id
    });
    res.json({ success: true, data: policy });
  } catch (error) {
    logger.error('Update policy error:', error);
    res.status(500).json({ success: false, message: 'Failed to update policy' });
  }
};

/**
 * Reimbursement Workflow Config Management
 */
exports.getAllWorkflowConfigs = async (req, res) => {
  try {
    const configs = await ReimbursementWorkflowConfig.findAll({
      where: { companyId: req.user.companyId, isActive: true },
      include: [
        {
          model: ReimbursementCategory,
          as: 'category',
          attributes: ['id', 'code', 'name'],
          required: false
        }
      ],
      order: [['level', 'ASC']]
    });
    res.json({ success: true, data: configs });
  } catch (error) {
    logger.error('Get workflow configs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch workflow configs' });
  }
};

exports.createWorkflowConfig = async (req, res) => {
  try {
    const config = await ReimbursementWorkflowConfig.create({
      ...req.body,
      companyId: req.user.companyId
    });
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'reimbursement',
      action: 'create',
      entityType: 'ReimbursementWorkflowConfig',
      entityId: config.id
    });
    res.status(201).json({ success: true, data: config });
  } catch (error) {
    logger.error('Create workflow config error:', error);
    res.status(500).json({ success: false, message: 'Failed to create workflow config' });
  }
};

exports.updateWorkflowConfig = async (req, res) => {
  try {
    const config = await ReimbursementWorkflowConfig.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!config) {
      return res.status(404).json({ success: false, message: 'Workflow config not found' });
    }
    await config.update(req.body);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'reimbursement',
      action: 'update',
      entityType: 'ReimbursementWorkflowConfig',
      entityId: config.id
    });
    res.json({ success: true, data: config });
  } catch (error) {
    logger.error('Update workflow config error:', error);
    res.status(500).json({ success: false, message: 'Failed to update workflow config' });
  }
};



