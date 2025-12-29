const { CostCenter, Company } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

exports.getAllCostCenters = async (req, res) => {
  try {
    const costCenters = await CostCenter.findAll({
      where: { companyId: req.user.companyId, isActive: true },
      include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }],
      order: [['name', 'ASC']]
    });
    res.json({ success: true, data: costCenters });
  } catch (error) {
    logger.error('Get cost centers error:', error);
    // If table doesn't exist, return empty array instead of error
    if (error.original && error.original.code === '42P01') {
      return res.json({ success: true, data: [] });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch cost centers' });
  }
};

exports.getCostCenter = async (req, res) => {
  try {
    const costCenter = await CostCenter.findOne({
      where: { id: req.params.id, companyId: req.user.companyId },
      include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }]
    });
    if (!costCenter) {
      return res.status(404).json({ success: false, message: 'Cost center not found' });
    }
    res.json({ success: true, data: costCenter });
  } catch (error) {
    logger.error('Get cost center error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(404).json({ success: false, message: 'Cost center not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch cost center' });
  }
};

exports.createCostCenter = async (req, res) => {
  try {
    const costCenterData = { ...req.body, companyId: req.user.companyId };
    
    const existing = await CostCenter.findOne({
      where: { companyId: req.user.companyId, code: costCenterData.code }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Cost center code already exists' });
    }

    const costCenter = await CostCenter.create(costCenterData);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'create',
      entityType: 'CostCenter',
      entityId: costCenter.id
    });
    res.status(201).json({ success: true, data: costCenter });
  } catch (error) {
    logger.error('Create cost center error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(503).json({ success: false, message: 'Cost centers feature is not available. Table does not exist.' });
    }
    res.status(500).json({ success: false, message: 'Failed to create cost center' });
  }
};

exports.updateCostCenter = async (req, res) => {
  try {
    const costCenter = await CostCenter.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!costCenter) {
      return res.status(404).json({ success: false, message: 'Cost center not found' });
    }

    if (req.body.code && req.body.code !== costCenter.code) {
      const existing = await CostCenter.findOne({
        where: { companyId: req.user.companyId, code: req.body.code }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Cost center code already exists' });
      }
    }

    await costCenter.update(req.body);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'update',
      entityType: 'CostCenter',
      entityId: costCenter.id
    });
    res.json({ success: true, data: costCenter });
  } catch (error) {
    logger.error('Update cost center error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(404).json({ success: false, message: 'Cost center not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to update cost center' });
  }
};

exports.deleteCostCenter = async (req, res) => {
  try {
    const costCenter = await CostCenter.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!costCenter) {
      return res.status(404).json({ success: false, message: 'Cost center not found' });
    }

    costCenter.isActive = false;
    await costCenter.save();
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'delete',
      entityType: 'CostCenter',
      entityId: costCenter.id
    });
    res.json({ success: true, message: 'Cost center deleted successfully' });
  } catch (error) {
    logger.error('Delete cost center error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(404).json({ success: false, message: 'Cost center not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to delete cost center' });
  }
};

