const { PFGroup, Company } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

/**
 * Get all PF groups for a company
 */
exports.getAllPFGroups = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'User must be associated with a company'
      });
    }

    const groups = await PFGroup.findAll({
      where: { companyId },
      include: [{ model: Company, as: 'company', attributes: ['id', 'name', 'code'] }],
      order: [['groupName', 'ASC']]
    });

    res.json({ success: true, data: groups });
  } catch (error) {
    logger.error('Get PF groups error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch PF groups', error: error.message });
  }
};

/**
 * Get single PF group
 */
exports.getPFGroup = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const group = await PFGroup.findOne({
      where: { id: req.params.id, companyId },
      include: [{ model: Company, as: 'company', attributes: ['id', 'name', 'code'] }]
    });

    if (!group) {
      return res.status(404).json({ success: false, message: 'PF group not found' });
    }

    res.json({ success: true, data: group });
  } catch (error) {
    logger.error('Get PF group error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch PF group' });
  }
};

/**
 * Create PF group
 */
exports.createPFGroup = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'User must be associated with a company'
      });
    }

    const group = await PFGroup.create({
      ...req.body,
      companyId
    });

    await createAuditLog({
      userId: req.user.id,
      companyId,
      module: 'statutory',
      action: 'create',
      entityType: 'PFGroup',
      entityId: group.id,
      description: `PF group created: ${group.groupName}`
    });

    res.status(201).json({ success: true, data: group });
  } catch (error) {
    logger.error('Create PF group error:', error);
    res.status(500).json({ success: false, message: 'Failed to create PF group', error: error.message });
  }
};

/**
 * Update PF group
 */
exports.updatePFGroup = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const group = await PFGroup.findOne({
      where: { id: req.params.id, companyId }
    });

    if (!group) {
      return res.status(404).json({ success: false, message: 'PF group not found' });
    }

    await group.update(req.body);

    await createAuditLog({
      userId: req.user.id,
      companyId,
      module: 'statutory',
      action: 'update',
      entityType: 'PFGroup',
      entityId: group.id,
      description: `PF group updated: ${group.groupName}`
    });

    res.json({ success: true, data: group });
  } catch (error) {
    logger.error('Update PF group error:', error);
    res.status(500).json({ success: false, message: 'Failed to update PF group', error: error.message });
  }
};

/**
 * Delete PF group
 */
exports.deletePFGroup = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const group = await PFGroup.findOne({
      where: { id: req.params.id, companyId }
    });

    if (!group) {
      return res.status(404).json({ success: false, message: 'PF group not found' });
    }

    await group.destroy();

    await createAuditLog({
      userId: req.user.id,
      companyId,
      module: 'statutory',
      action: 'delete',
      entityType: 'PFGroup',
      entityId: req.params.id,
      description: `PF group deleted: ${group.groupName}`
    });

    res.json({ success: true, message: 'PF group deleted successfully' });
  } catch (error) {
    logger.error('Delete PF group error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete PF group' });
  }
};


