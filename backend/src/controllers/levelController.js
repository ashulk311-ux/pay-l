const { Level, Company } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

exports.getAllLevels = async (req, res) => {
  try {
    const levels = await Level.findAll({
      where: { companyId: req.user.companyId, isActive: true },
      include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }],
      order: [['levelNumber', 'ASC']]
    });
    res.json({ success: true, data: levels });
  } catch (error) {
    logger.error('Get levels error:', error);
    // If table doesn't exist, return empty array instead of error
    if (error.original && error.original.code === '42P01') {
      return res.json({ success: true, data: [] });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch levels' });
  }
};

exports.getLevel = async (req, res) => {
  try {
    const level = await Level.findOne({
      where: { id: req.params.id, companyId: req.user.companyId },
      include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }]
    });
    if (!level) {
      return res.status(404).json({ success: false, message: 'Level not found' });
    }
    res.json({ success: true, data: level });
  } catch (error) {
    logger.error('Get level error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(404).json({ success: false, message: 'Level not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch level' });
  }
};

exports.createLevel = async (req, res) => {
  try {
    const levelData = { ...req.body, companyId: req.user.companyId };
    
    const existing = await Level.findOne({
      where: { companyId: req.user.companyId, code: levelData.code }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Level code already exists' });
    }

    const level = await Level.create(levelData);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'create',
      entityType: 'Level',
      entityId: level.id
    });
    res.status(201).json({ success: true, data: level });
  } catch (error) {
    logger.error('Create level error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(503).json({ success: false, message: 'Levels feature is not available. Table does not exist.' });
    }
    res.status(500).json({ success: false, message: 'Failed to create level' });
  }
};

exports.updateLevel = async (req, res) => {
  try {
    const level = await Level.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!level) {
      return res.status(404).json({ success: false, message: 'Level not found' });
    }

    if (req.body.code && req.body.code !== level.code) {
      const existing = await Level.findOne({
        where: { companyId: req.user.companyId, code: req.body.code }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Level code already exists' });
      }
    }

    await level.update(req.body);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'update',
      entityType: 'Level',
      entityId: level.id
    });
    res.json({ success: true, data: level });
  } catch (error) {
    logger.error('Update level error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(404).json({ success: false, message: 'Level not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to update level' });
  }
};

exports.deleteLevel = async (req, res) => {
  try {
    const level = await Level.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!level) {
      return res.status(404).json({ success: false, message: 'Level not found' });
    }

    level.isActive = false;
    await level.save();
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'delete',
      entityType: 'Level',
      entityId: level.id
    });
    res.json({ success: true, message: 'Level deleted successfully' });
  } catch (error) {
    logger.error('Delete level error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(404).json({ success: false, message: 'Level not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to delete level' });
  }
};

