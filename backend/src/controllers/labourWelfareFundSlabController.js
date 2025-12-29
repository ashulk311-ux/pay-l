const { LabourWelfareFundSlab, Company } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

/**
 * Get all labour welfare fund slabs for a company
 */
exports.getAllLabourWelfareFundSlabs = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { state } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'User must be associated with a company'
      });
    }

    const where = { companyId };
    if (state) where.state = state;

    const slabs = await LabourWelfareFundSlab.findAll({
      where,
      include: [{ model: Company, as: 'company', attributes: ['id', 'name', 'code'] }],
      order: [['state', 'ASC']]
    });

    res.json({ success: true, data: slabs });
  } catch (error) {
    logger.error('Get labour welfare fund slabs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch labour welfare fund slabs', error: error.message });
  }
};

/**
 * Get single labour welfare fund slab
 */
exports.getLabourWelfareFundSlab = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const slab = await LabourWelfareFundSlab.findOne({
      where: { id: req.params.id, companyId },
      include: [{ model: Company, as: 'company', attributes: ['id', 'name', 'code'] }]
    });

    if (!slab) {
      return res.status(404).json({ success: false, message: 'Labour welfare fund slab not found' });
    }

    res.json({ success: true, data: slab });
  } catch (error) {
    logger.error('Get labour welfare fund slab error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch labour welfare fund slab' });
  }
};

/**
 * Create labour welfare fund slab
 */
exports.createLabourWelfareFundSlab = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'User must be associated with a company'
      });
    }

    const slab = await LabourWelfareFundSlab.create({
      ...req.body,
      companyId
    });

    await createAuditLog({
      userId: req.user.id,
      companyId,
      module: 'statutory',
      action: 'create',
      entityType: 'LabourWelfareFundSlab',
      entityId: slab.id,
      description: `Labour welfare fund slab created: ${slab.state}`
    });

    res.status(201).json({ success: true, data: slab });
  } catch (error) {
    logger.error('Create labour welfare fund slab error:', error);
    res.status(500).json({ success: false, message: 'Failed to create labour welfare fund slab', error: error.message });
  }
};

/**
 * Update labour welfare fund slab
 */
exports.updateLabourWelfareFundSlab = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const slab = await LabourWelfareFundSlab.findOne({
      where: { id: req.params.id, companyId }
    });

    if (!slab) {
      return res.status(404).json({ success: false, message: 'Labour welfare fund slab not found' });
    }

    await slab.update(req.body);

    await createAuditLog({
      userId: req.user.id,
      companyId,
      module: 'statutory',
      action: 'update',
      entityType: 'LabourWelfareFundSlab',
      entityId: slab.id,
      description: `Labour welfare fund slab updated: ${slab.state}`
    });

    res.json({ success: true, data: slab });
  } catch (error) {
    logger.error('Update labour welfare fund slab error:', error);
    res.status(500).json({ success: false, message: 'Failed to update labour welfare fund slab', error: error.message });
  }
};

/**
 * Delete labour welfare fund slab
 */
exports.deleteLabourWelfareFundSlab = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const slab = await LabourWelfareFundSlab.findOne({
      where: { id: req.params.id, companyId }
    });

    if (!slab) {
      return res.status(404).json({ success: false, message: 'Labour welfare fund slab not found' });
    }

    await slab.destroy();

    await createAuditLog({
      userId: req.user.id,
      companyId,
      module: 'statutory',
      action: 'delete',
      entityType: 'LabourWelfareFundSlab',
      entityId: req.params.id,
      description: `Labour welfare fund slab deleted: ${slab.state}`
    });

    res.json({ success: true, message: 'Labour welfare fund slab deleted successfully' });
  } catch (error) {
    logger.error('Delete labour welfare fund slab error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete labour welfare fund slab' });
  }
};


