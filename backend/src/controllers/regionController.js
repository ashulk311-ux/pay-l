const { Region, Company } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

exports.getAllRegions = async (req, res) => {
  try {
    const regions = await Region.findAll({
      where: { companyId: req.user.companyId, isActive: true },
      include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }],
      order: [['name', 'ASC']]
    });
    res.json({ success: true, data: regions });
  } catch (error) {
    logger.error('Get regions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch regions' });
  }
};

exports.getRegion = async (req, res) => {
  try {
    const region = await Region.findOne({
      where: { id: req.params.id, companyId: req.user.companyId },
      include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }]
    });
    if (!region) {
      return res.status(404).json({ success: false, message: 'Region not found' });
    }
    res.json({ success: true, data: region });
  } catch (error) {
    logger.error('Get region error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch region' });
  }
};

exports.createRegion = async (req, res) => {
  try {
    const regionData = { ...req.body, companyId: req.user.companyId };
    
    // Check if code already exists
    const existing = await Region.findOne({
      where: { companyId: req.user.companyId, code: regionData.code }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Region code already exists' });
    }

    const region = await Region.create(regionData);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'create',
      entityType: 'Region',
      entityId: region.id
    });
    res.status(201).json({ success: true, data: region });
  } catch (error) {
    logger.error('Create region error:', error);
    res.status(500).json({ success: false, message: 'Failed to create region' });
  }
};

exports.updateRegion = async (req, res) => {
  try {
    const region = await Region.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!region) {
      return res.status(404).json({ success: false, message: 'Region not found' });
    }

    // Check if code is being changed and already exists
    if (req.body.code && req.body.code !== region.code) {
      const existing = await Region.findOne({
        where: { companyId: req.user.companyId, code: req.body.code }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Region code already exists' });
      }
    }

    await region.update(req.body);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'update',
      entityType: 'Region',
      entityId: region.id
    });
    res.json({ success: true, data: region });
  } catch (error) {
    logger.error('Update region error:', error);
    res.status(500).json({ success: false, message: 'Failed to update region' });
  }
};

exports.deleteRegion = async (req, res) => {
  try {
    const region = await Region.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!region) {
      return res.status(404).json({ success: false, message: 'Region not found' });
    }

    region.isActive = false;
    await region.save();
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'delete',
      entityType: 'Region',
      entityId: region.id
    });
    res.json({ success: true, message: 'Region deleted successfully' });
  } catch (error) {
    logger.error('Delete region error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete region' });
  }
};



