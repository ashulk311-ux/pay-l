const { IncrementPolicy, Company } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

/**
 * Get all increment policies
 */
exports.getAllPolicies = async (req, res) => {
  try {
    const policies = await IncrementPolicy.findAll({
      where: { companyId: req.user.companyId },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: policies });
  } catch (error) {
    logger.error('Get increment policies error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch policies' });
  }
};

/**
 * Create increment policy
 */
exports.createPolicy = async (req, res) => {
  try {
    const policy = await IncrementPolicy.create({
      ...req.body,
      companyId: req.user.companyId
    });
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'increment',
      action: 'create',
      entityType: 'IncrementPolicy',
      entityId: policy.id
    });
    res.status(201).json({ success: true, data: policy });
  } catch (error) {
    logger.error('Create increment policy error:', error);
    res.status(500).json({ success: false, message: 'Failed to create policy' });
  }
};

/**
 * Update increment policy
 */
exports.updatePolicy = async (req, res) => {
  try {
    const policy = await IncrementPolicy.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!policy) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }
    await policy.update(req.body);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'increment',
      action: 'update',
      entityType: 'IncrementPolicy',
      entityId: policy.id
    });
    res.json({ success: true, data: policy });
  } catch (error) {
    logger.error('Update increment policy error:', error);
    res.status(500).json({ success: false, message: 'Failed to update policy' });
  }
};



