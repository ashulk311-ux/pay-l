const { TDSDeductor, Company } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

/**
 * Get all TDS deductors for a company
 */
exports.getAllTDSDeductors = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'User must be associated with a company'
      });
    }

    const deductors = await TDSDeductor.findAll({
      where: { companyId },
      include: [{ model: Company, as: 'company', attributes: ['id', 'name', 'code'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: deductors });
  } catch (error) {
    logger.error('Get TDS deductors error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch TDS deductors', error: error.message });
  }
};

/**
 * Get single TDS deductor
 */
exports.getTDSDeductor = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const deductor = await TDSDeductor.findOne({
      where: { id: req.params.id, companyId },
      include: [{ model: Company, as: 'company', attributes: ['id', 'name', 'code'] }]
    });

    if (!deductor) {
      return res.status(404).json({ success: false, message: 'TDS deductor not found' });
    }

    res.json({ success: true, data: deductor });
  } catch (error) {
    logger.error('Get TDS deductor error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch TDS deductor' });
  }
};

/**
 * Create TDS deductor
 */
exports.createTDSDeductor = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'User must be associated with a company'
      });
    }

    const deductor = await TDSDeductor.create({
      ...req.body,
      companyId
    });

    await createAuditLog({
      userId: req.user.id,
      companyId,
      module: 'statutory',
      action: 'create',
      entityType: 'TDSDeductor',
      entityId: deductor.id,
      description: `TDS deductor created: ${deductor.name}`
    });

    res.status(201).json({ success: true, data: deductor });
  } catch (error) {
    logger.error('Create TDS deductor error:', error);
    res.status(500).json({ success: false, message: 'Failed to create TDS deductor', error: error.message });
  }
};

/**
 * Update TDS deductor
 */
exports.updateTDSDeductor = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const deductor = await TDSDeductor.findOne({
      where: { id: req.params.id, companyId }
    });

    if (!deductor) {
      return res.status(404).json({ success: false, message: 'TDS deductor not found' });
    }

    await deductor.update(req.body);

    await createAuditLog({
      userId: req.user.id,
      companyId,
      module: 'statutory',
      action: 'update',
      entityType: 'TDSDeductor',
      entityId: deductor.id,
      description: `TDS deductor updated: ${deductor.name}`
    });

    res.json({ success: true, data: deductor });
  } catch (error) {
    logger.error('Update TDS deductor error:', error);
    res.status(500).json({ success: false, message: 'Failed to update TDS deductor', error: error.message });
  }
};

/**
 * Delete TDS deductor
 */
exports.deleteTDSDeductor = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const deductor = await TDSDeductor.findOne({
      where: { id: req.params.id, companyId }
    });

    if (!deductor) {
      return res.status(404).json({ success: false, message: 'TDS deductor not found' });
    }

    await deductor.destroy();

    await createAuditLog({
      userId: req.user.id,
      companyId,
      module: 'statutory',
      action: 'delete',
      entityType: 'TDSDeductor',
      entityId: req.params.id,
      description: `TDS deductor deleted: ${deductor.name}`
    });

    res.json({ success: true, message: 'TDS deductor deleted successfully' });
  } catch (error) {
    logger.error('Delete TDS deductor error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete TDS deductor' });
  }
};


