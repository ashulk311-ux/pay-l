const { ESIGroup, Company } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

/**
 * Get all ESI groups for a company
 */
exports.getAllESIGroups = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'User must be associated with a company'
      });
    }

    const groups = await ESIGroup.findAll({
      where: { companyId },
      include: [{ model: Company, as: 'company', attributes: ['id', 'name', 'code'] }],
      order: [['groupName', 'ASC']]
    });

    res.json({ success: true, data: groups });
  } catch (error) {
    logger.error('Get ESI groups error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch ESI groups', error: error.message });
  }
};

/**
 * Get single ESI group
 */
exports.getESIGroup = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const group = await ESIGroup.findOne({
      where: { id: req.params.id, companyId },
      include: [{ model: Company, as: 'company', attributes: ['id', 'name', 'code'] }]
    });

    if (!group) {
      return res.status(404).json({ success: false, message: 'ESI group not found' });
    }

    res.json({ success: true, data: group });
  } catch (error) {
    logger.error('Get ESI group error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch ESI group' });
  }
};

/**
 * Create ESI group
 */
exports.createESIGroup = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'User must be associated with a company'
      });
    }

    const group = await ESIGroup.create({
      ...req.body,
      companyId
    });

    await createAuditLog({
      userId: req.user.id,
      companyId,
      module: 'statutory',
      action: 'create',
      entityType: 'ESIGroup',
      entityId: group.id,
      description: `ESI group created: ${group.groupName}`
    });

    res.status(201).json({ success: true, data: group });
  } catch (error) {
    logger.error('Create ESI group error:', error);
    res.status(500).json({ success: false, message: 'Failed to create ESI group', error: error.message });
  }
};

/**
 * Update ESI group
 */
exports.updateESIGroup = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const group = await ESIGroup.findOne({
      where: { id: req.params.id, companyId }
    });

    if (!group) {
      return res.status(404).json({ success: false, message: 'ESI group not found' });
    }

    await group.update(req.body);

    await createAuditLog({
      userId: req.user.id,
      companyId,
      module: 'statutory',
      action: 'update',
      entityType: 'ESIGroup',
      entityId: group.id,
      description: `ESI group updated: ${group.groupName}`
    });

    res.json({ success: true, data: group });
  } catch (error) {
    logger.error('Update ESI group error:', error);
    res.status(500).json({ success: false, message: 'Failed to update ESI group', error: error.message });
  }
};

/**
 * Delete ESI group
 */
exports.deleteESIGroup = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const group = await ESIGroup.findOne({
      where: { id: req.params.id, companyId }
    });

    if (!group) {
      return res.status(404).json({ success: false, message: 'ESI group not found' });
    }

    await group.destroy();

    await createAuditLog({
      userId: req.user.id,
      companyId,
      module: 'statutory',
      action: 'delete',
      entityType: 'ESIGroup',
      entityId: req.params.id,
      description: `ESI group deleted: ${group.groupName}`
    });

    res.json({ success: true, message: 'ESI group deleted successfully' });
  } catch (error) {
    logger.error('Delete ESI group error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete ESI group' });
  }
};


