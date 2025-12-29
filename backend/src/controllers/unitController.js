const { Unit, Company, OfficeLocation } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

exports.getAllUnits = async (req, res) => {
  try {
    const units = await Unit.findAll({
      where: { companyId: req.user.companyId, isActive: true },
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        { model: OfficeLocation, as: 'location', attributes: ['id', 'name'] }
      ],
      order: [['name', 'ASC']]
    });
    res.json({ success: true, data: units });
  } catch (error) {
    logger.error('Get units error:', error);
    // If table doesn't exist, return empty array instead of error
    if (error.original && error.original.code === '42P01') {
      return res.json({ success: true, data: [] });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch units' });
  }
};

exports.getUnit = async (req, res) => {
  try {
    const unit = await Unit.findOne({
      where: { id: req.params.id, companyId: req.user.companyId },
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        { model: OfficeLocation, as: 'location', attributes: ['id', 'name'] }
      ]
    });
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }
    res.json({ success: true, data: unit });
  } catch (error) {
    logger.error('Get unit error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch unit' });
  }
};

exports.createUnit = async (req, res) => {
  try {
    const unitData = { ...req.body, companyId: req.user.companyId };
    
    const existing = await Unit.findOne({
      where: { companyId: req.user.companyId, code: unitData.code }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Unit code already exists' });
    }

    const unit = await Unit.create(unitData);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'create',
      entityType: 'Unit',
      entityId: unit.id
    });
    res.status(201).json({ success: true, data: unit });
  } catch (error) {
    logger.error('Create unit error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(503).json({ success: false, message: 'Units feature is not available. Table does not exist.' });
    }
    res.status(500).json({ success: false, message: 'Failed to create unit' });
  }
};

exports.updateUnit = async (req, res) => {
  try {
    const unit = await Unit.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }

    if (req.body.code && req.body.code !== unit.code) {
      const existing = await Unit.findOne({
        where: { companyId: req.user.companyId, code: req.body.code }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Unit code already exists' });
      }
    }

    await unit.update(req.body);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'update',
      entityType: 'Unit',
      entityId: unit.id
    });
    res.json({ success: true, data: unit });
  } catch (error) {
    logger.error('Update unit error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to update unit' });
  }
};

exports.deleteUnit = async (req, res) => {
  try {
    const unit = await Unit.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }

    unit.isActive = false;
    await unit.save();
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'delete',
      entityType: 'Unit',
      entityId: unit.id
    });
    res.json({ success: true, message: 'Unit deleted successfully' });
  } catch (error) {
    logger.error('Delete unit error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to delete unit' });
  }
};

