const { IncomeTaxSlab, Company } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

/**
 * Get all income tax slabs for a company
 */
exports.getAllIncomeTaxSlabs = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { taxRegime, slabType, financialYear } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'User must be associated with a company'
      });
    }

    const where = { companyId };
    if (taxRegime) where.taxRegime = taxRegime;
    if (slabType) where.slabType = slabType;
    if (financialYear) {
      const year = parseInt(financialYear);
      where.startFinancialYear = { [require('sequelize').Op.lte]: new Date(`${year}-04-01`) };
      where.endFinancialYear = { [require('sequelize').Op.gte]: new Date(`${year + 1}-03-31`) };
    }

    const slabs = await IncomeTaxSlab.findAll({
      where,
      include: [{ model: Company, as: 'company', attributes: ['id', 'name', 'code'] }],
      order: [['taxRegime', 'ASC'], ['slabType', 'ASC'], ['serialNumber', 'ASC']]
    });

    res.json({ success: true, data: slabs });
  } catch (error) {
    logger.error('Get income tax slabs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch income tax slabs', error: error.message });
  }
};

/**
 * Get single income tax slab
 */
exports.getIncomeTaxSlab = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const slab = await IncomeTaxSlab.findOne({
      where: { id: req.params.id, companyId },
      include: [{ model: Company, as: 'company', attributes: ['id', 'name', 'code'] }]
    });

    if (!slab) {
      return res.status(404).json({ success: false, message: 'Income tax slab not found' });
    }

    res.json({ success: true, data: slab });
  } catch (error) {
    logger.error('Get income tax slab error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch income tax slab' });
  }
};

/**
 * Create income tax slab
 */
exports.createIncomeTaxSlab = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'User must be associated with a company'
      });
    }

    const slab = await IncomeTaxSlab.create({
      ...req.body,
      companyId
    });

    await createAuditLog({
      userId: req.user.id,
      companyId,
      module: 'statutory',
      action: 'create',
      entityType: 'IncomeTaxSlab',
      entityId: slab.id,
      description: `Income tax slab created: ${slab.taxRegime} - ${slab.slabType}`
    });

    res.status(201).json({ success: true, data: slab });
  } catch (error) {
    logger.error('Create income tax slab error:', error);
    res.status(500).json({ success: false, message: 'Failed to create income tax slab', error: error.message });
  }
};

/**
 * Update income tax slab
 */
exports.updateIncomeTaxSlab = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const slab = await IncomeTaxSlab.findOne({
      where: { id: req.params.id, companyId }
    });

    if (!slab) {
      return res.status(404).json({ success: false, message: 'Income tax slab not found' });
    }

    await slab.update(req.body);

    await createAuditLog({
      userId: req.user.id,
      companyId,
      module: 'statutory',
      action: 'update',
      entityType: 'IncomeTaxSlab',
      entityId: slab.id,
      description: `Income tax slab updated: ${slab.taxRegime} - ${slab.slabType}`
    });

    res.json({ success: true, data: slab });
  } catch (error) {
    logger.error('Update income tax slab error:', error);
    res.status(500).json({ success: false, message: 'Failed to update income tax slab', error: error.message });
  }
};

/**
 * Delete income tax slab
 */
exports.deleteIncomeTaxSlab = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const slab = await IncomeTaxSlab.findOne({
      where: { id: req.params.id, companyId }
    });

    if (!slab) {
      return res.status(404).json({ success: false, message: 'Income tax slab not found' });
    }

    await slab.destroy();

    await createAuditLog({
      userId: req.user.id,
      companyId,
      module: 'statutory',
      action: 'delete',
      entityType: 'IncomeTaxSlab',
      entityId: req.params.id,
      description: `Income tax slab deleted: ${slab.taxRegime} - ${slab.slabType}`
    });

    res.json({ success: true, message: 'Income tax slab deleted successfully' });
  } catch (error) {
    logger.error('Delete income tax slab error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete income tax slab' });
  }
};


