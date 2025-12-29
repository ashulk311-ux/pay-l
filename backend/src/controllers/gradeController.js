const { Grade, Company } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

exports.getAllGrades = async (req, res) => {
  try {
    const grades = await Grade.findAll({
      where: { companyId: req.user.companyId, isActive: true },
      include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }],
      order: [['level', 'ASC'], ['name', 'ASC']]
    });
    res.json({ success: true, data: grades });
  } catch (error) {
    logger.error('Get grades error:', error);
    // If table doesn't exist, return empty array instead of error
    if (error.original && error.original.code === '42P01') {
      return res.json({ success: true, data: [] });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch grades' });
  }
};

exports.getGrade = async (req, res) => {
  try {
    const grade = await Grade.findOne({
      where: { id: req.params.id, companyId: req.user.companyId },
      include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }]
    });
    if (!grade) {
      return res.status(404).json({ success: false, message: 'Grade not found' });
    }
    res.json({ success: true, data: grade });
  } catch (error) {
    logger.error('Get grade error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(404).json({ success: false, message: 'Grade not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch grade' });
  }
};

exports.createGrade = async (req, res) => {
  try {
    const gradeData = { ...req.body, companyId: req.user.companyId };
    
    const existing = await Grade.findOne({
      where: { companyId: req.user.companyId, code: gradeData.code }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Grade code already exists' });
    }

    const grade = await Grade.create(gradeData);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'create',
      entityType: 'Grade',
      entityId: grade.id
    });
    res.status(201).json({ success: true, data: grade });
  } catch (error) {
    logger.error('Create grade error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(503).json({ success: false, message: 'Grades feature is not available. Table does not exist.' });
    }
    res.status(500).json({ success: false, message: 'Failed to create grade' });
  }
};

exports.updateGrade = async (req, res) => {
  try {
    const grade = await Grade.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!grade) {
      return res.status(404).json({ success: false, message: 'Grade not found' });
    }

    if (req.body.code && req.body.code !== grade.code) {
      const existing = await Grade.findOne({
        where: { companyId: req.user.companyId, code: req.body.code }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Grade code already exists' });
      }
    }

    await grade.update(req.body);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'update',
      entityType: 'Grade',
      entityId: grade.id
    });
    res.json({ success: true, data: grade });
  } catch (error) {
    logger.error('Update grade error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(404).json({ success: false, message: 'Grade not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to update grade' });
  }
};

exports.deleteGrade = async (req, res) => {
  try {
    const grade = await Grade.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!grade) {
      return res.status(404).json({ success: false, message: 'Grade not found' });
    }

    grade.isActive = false;
    await grade.save();
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'delete',
      entityType: 'Grade',
      entityId: grade.id
    });
    res.json({ success: true, message: 'Grade deleted successfully' });
  } catch (error) {
    logger.error('Delete grade error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(404).json({ success: false, message: 'Grade not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to delete grade' });
  }
};

