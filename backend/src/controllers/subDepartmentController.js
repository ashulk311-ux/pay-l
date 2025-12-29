const { SubDepartment, Company, Department } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

exports.getAllSubDepartments = async (req, res) => {
  try {
    const { departmentId } = req.query;
    const where = { companyId: req.user.companyId, isActive: true };
    if (departmentId) where.departmentId = departmentId;

    const subDepartments = await SubDepartment.findAll({
      where,
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] }
      ],
      order: [['name', 'ASC']]
    });
    res.json({ success: true, data: subDepartments });
  } catch (error) {
    logger.error('Get sub departments error:', error);
    // If table doesn't exist, return empty array instead of error
    if (error.original && error.original.code === '42P01') {
      return res.json({ success: true, data: [] });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch sub departments', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

exports.getSubDepartment = async (req, res) => {
  try {
    const subDepartment = await SubDepartment.findOne({
      where: { id: req.params.id, companyId: req.user.companyId },
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] }
      ]
    });
    if (!subDepartment) {
      return res.status(404).json({ success: false, message: 'Sub department not found' });
    }
    res.json({ success: true, data: subDepartment });
  } catch (error) {
    logger.error('Get sub department error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(404).json({ success: false, message: 'Sub department not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch sub department' });
  }
};

exports.createSubDepartment = async (req, res) => {
  try {
    const subDepartmentData = { ...req.body, companyId: req.user.companyId };
    
    const existing = await SubDepartment.findOne({
      where: { companyId: req.user.companyId, code: subDepartmentData.code }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Sub department code already exists' });
    }

    const subDepartment = await SubDepartment.create(subDepartmentData);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'create',
      entityType: 'SubDepartment',
      entityId: subDepartment.id
    });
    res.status(201).json({ success: true, data: subDepartment });
  } catch (error) {
    logger.error('Create sub department error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(503).json({ success: false, message: 'Sub departments feature is not available. Table does not exist.' });
    }
    res.status(500).json({ success: false, message: 'Failed to create sub department' });
  }
};

exports.updateSubDepartment = async (req, res) => {
  try {
    const subDepartment = await SubDepartment.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!subDepartment) {
      return res.status(404).json({ success: false, message: 'Sub department not found' });
    }

    if (req.body.code && req.body.code !== subDepartment.code) {
      const existing = await SubDepartment.findOne({
        where: { companyId: req.user.companyId, code: req.body.code }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Sub department code already exists' });
      }
    }

    await subDepartment.update(req.body);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'update',
      entityType: 'SubDepartment',
      entityId: subDepartment.id
    });
    res.json({ success: true, data: subDepartment });
  } catch (error) {
    logger.error('Update sub department error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(404).json({ success: false, message: 'Sub department not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to update sub department' });
  }
};

exports.deleteSubDepartment = async (req, res) => {
  try {
    const subDepartment = await SubDepartment.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!subDepartment) {
      return res.status(404).json({ success: false, message: 'Sub department not found' });
    }

    subDepartment.isActive = false;
    await subDepartment.save();
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'delete',
      entityType: 'SubDepartment',
      entityId: subDepartment.id
    });
    res.json({ success: true, message: 'Sub department deleted successfully' });
  } catch (error) {
    logger.error('Delete sub department error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(404).json({ success: false, message: 'Sub department not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to delete sub department' });
  }
};

