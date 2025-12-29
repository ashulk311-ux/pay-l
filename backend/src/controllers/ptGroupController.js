const { PTGroup, Company } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

/**
 * Get all PT groups for a company
 */
exports.getAllPTGroups = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'User must be associated with a company'
      });
    }

    const groups = await PTGroup.findAll({
      where: { companyId },
      include: [{ model: Company, as: 'company', attributes: ['id', 'name', 'code'] }],
      order: [['groupName', 'ASC']]
    });

    res.json({ success: true, data: groups });
  } catch (error) {
    logger.error('Get PT groups error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch PT groups', error: error.message });
  }
};

/**
 * Get single PT group
 */
exports.getPTGroup = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const group = await PTGroup.findOne({
      where: { id: req.params.id, companyId },
      include: [{ model: Company, as: 'company', attributes: ['id', 'name', 'code'] }]
    });

    if (!group) {
      return res.status(404).json({ success: false, message: 'PT group not found' });
    }

    res.json({ success: true, data: group });
  } catch (error) {
    logger.error('Get PT group error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch PT group' });
  }
};

/**
 * Create PT group
 */
exports.createPTGroup = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'User must be associated with a company'
      });
    }

    const group = await PTGroup.create({
      ...req.body,
      companyId
    });

    await createAuditLog({
      userId: req.user.id,
      companyId,
      module: 'statutory',
      action: 'create',
      entityType: 'PTGroup',
      entityId: group.id,
      description: `PT group created: ${group.groupName}`
    });

    res.status(201).json({ success: true, data: group });
  } catch (error) {
    logger.error('Create PT group error:', error);
    res.status(500).json({ success: false, message: 'Failed to create PT group', error: error.message });
  }
};

/**
 * Update PT group
 */
exports.updatePTGroup = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const group = await PTGroup.findOne({
      where: { id: req.params.id, companyId }
    });

    if (!group) {
      return res.status(404).json({ success: false, message: 'PT group not found' });
    }

    await group.update(req.body);

    await createAuditLog({
      userId: req.user.id,
      companyId,
      module: 'statutory',
      action: 'update',
      entityType: 'PTGroup',
      entityId: group.id,
      description: `PT group updated: ${group.groupName}`
    });

    res.json({ success: true, data: group });
  } catch (error) {
    logger.error('Update PT group error:', error);
    res.status(500).json({ success: false, message: 'Failed to update PT group', error: error.message });
  }
};

/**
 * Delete PT group
 */
exports.deletePTGroup = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const group = await PTGroup.findOne({
      where: { id: req.params.id, companyId }
    });

    if (!group) {
      return res.status(404).json({ success: false, message: 'PT group not found' });
    }

    await group.destroy();

    await createAuditLog({
      userId: req.user.id,
      companyId,
      module: 'statutory',
      action: 'delete',
      entityType: 'PTGroup',
      entityId: req.params.id,
      description: `PT group deleted: ${group.groupName}`
    });

    res.json({ success: true, message: 'PT group deleted successfully' });
  } catch (error) {
    logger.error('Delete PT group error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete PT group' });
  }
};


