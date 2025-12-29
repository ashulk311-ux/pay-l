const { ProfessionalTaxSlab, Company } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

/**
 * Get all professional tax slabs for a company
 */
exports.getAllProfessionalTaxSlabs = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { state, personType, financialYear } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'User must be associated with a company'
      });
    }

    const where = { companyId };
    if (state) where.state = state;
    if (personType) where.personType = personType;
    if (financialYear) {
      const year = parseInt(financialYear);
      where.startFinancialYear = { [require('sequelize').Op.lte]: new Date(`${year}-04-01`) };
      where.endFinancialYear = { [require('sequelize').Op.gte]: new Date(`${year + 1}-03-31`) };
    }

    const slabs = await ProfessionalTaxSlab.findAll({
      where,
      include: [{ model: Company, as: 'company', attributes: ['id', 'name', 'code'] }],
      order: [['state', 'ASC'], ['personType', 'ASC']]
    });

    res.json({ success: true, data: slabs });
  } catch (error) {
    logger.error('Get professional tax slabs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch professional tax slabs', error: error.message });
  }
};

/**
 * Get single professional tax slab
 */
exports.getProfessionalTaxSlab = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const slab = await ProfessionalTaxSlab.findOne({
      where: { id: req.params.id, companyId },
      include: [{ model: Company, as: 'company', attributes: ['id', 'name', 'code'] }]
    });

    if (!slab) {
      return res.status(404).json({ success: false, message: 'Professional tax slab not found' });
    }

    res.json({ success: true, data: slab });
  } catch (error) {
    logger.error('Get professional tax slab error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch professional tax slab' });
  }
};

/**
 * Create professional tax slab
 */
exports.createProfessionalTaxSlab = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'User must be associated with a company'
      });
    }

    const slab = await ProfessionalTaxSlab.create({
      ...req.body,
      companyId
    });

    await createAuditLog({
      userId: req.user.id,
      companyId,
      module: 'statutory',
      action: 'create',
      entityType: 'ProfessionalTaxSlab',
      entityId: slab.id,
      description: `Professional tax slab created: ${slab.state} - ${slab.personType}`
    });

    res.status(201).json({ success: true, data: slab });
  } catch (error) {
    logger.error('Create professional tax slab error:', error);
    res.status(500).json({ success: false, message: 'Failed to create professional tax slab', error: error.message });
  }
};

/**
 * Update professional tax slab
 */
exports.updateProfessionalTaxSlab = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const slab = await ProfessionalTaxSlab.findOne({
      where: { id: req.params.id, companyId }
    });

    if (!slab) {
      return res.status(404).json({ success: false, message: 'Professional tax slab not found' });
    }

    await slab.update(req.body);

    await createAuditLog({
      userId: req.user.id,
      companyId,
      module: 'statutory',
      action: 'update',
      entityType: 'ProfessionalTaxSlab',
      entityId: slab.id,
      description: `Professional tax slab updated: ${slab.state} - ${slab.personType}`
    });

    res.json({ success: true, data: slab });
  } catch (error) {
    logger.error('Update professional tax slab error:', error);
    res.status(500).json({ success: false, message: 'Failed to update professional tax slab', error: error.message });
  }
};

/**
 * Delete professional tax slab
 */
exports.deleteProfessionalTaxSlab = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const slab = await ProfessionalTaxSlab.findOne({
      where: { id: req.params.id, companyId }
    });

    if (!slab) {
      return res.status(404).json({ success: false, message: 'Professional tax slab not found' });
    }

    await slab.destroy();

    await createAuditLog({
      userId: req.user.id,
      companyId,
      module: 'statutory',
      action: 'delete',
      entityType: 'ProfessionalTaxSlab',
      entityId: req.params.id,
      description: `Professional tax slab deleted: ${slab.state} - ${slab.personType}`
    });

    res.json({ success: true, message: 'Professional tax slab deleted successfully' });
  } catch (error) {
    logger.error('Delete professional tax slab error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete professional tax slab' });
  }
};


