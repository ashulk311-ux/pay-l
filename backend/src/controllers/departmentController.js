const { Department, Company, Employee } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');
const { getPaginationParams, createPaginatedResponse } = require('../utils/pagination');
const { getErrorMessage } = require('../utils/errorMessages');

exports.getAllDepartments = async (req, res) => {
  try {
    const { search } = req.query;
    const { page, limit, offset } = getPaginationParams(req, { defaultLimit: 50, maxLimit: 200 });
    
    const whereClause = { companyId: req.user.companyId, isActive: true };
    
    // Add search filter if provided
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: departments } = await Department.findAndCountAll({
      where: whereClause,
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        { model: Employee, as: 'head', attributes: ['id', 'firstName', 'lastName', 'employeeCode'], required: false }
      ],
      order: [['name', 'ASC']],
      limit,
      offset
    });
    
    res.json(createPaginatedResponse(departments, count, page, limit));
  } catch (error) {
    logger.error('Get departments error:', error);
    res.status(500).json({ success: false, message: getErrorMessage('OPERATION_FAILED', 'fetch departments') });
  }
};

exports.getDepartment = async (req, res) => {
  try {
    const department = await Department.findOne({
      where: { id: req.params.id, companyId: req.user.companyId },
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        { model: Employee, as: 'head', attributes: ['id', 'firstName', 'lastName', 'employeeCode'] }
      ]
    });
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    res.json({ success: true, data: department });
  } catch (error) {
    logger.error('Get department error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch department' });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const departmentData = { ...req.body, companyId: req.user.companyId };
    
    // Check if code already exists
    const existing = await Department.findOne({
      where: { companyId: req.user.companyId, code: departmentData.code }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: getErrorMessage('CODE_EXISTS', 'Department') });
    }

    const department = await Department.create(departmentData);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'create',
      entityType: 'Department',
      entityId: department.id
    });
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    logger.error('Create department error:', error);
    res.status(500).json({ success: false, message: 'Failed to create department' });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const department = await Department.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Check if code is being changed and already exists
    if (req.body.code && req.body.code !== department.code) {
      const existing = await Department.findOne({
        where: { companyId: req.user.companyId, code: req.body.code }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: getErrorMessage('CODE_EXISTS', 'Department') });
      }
    }

    await department.update(req.body);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'update',
      entityType: 'Department',
      entityId: department.id
    });
    res.json({ success: true, data: department });
  } catch (error) {
    logger.error('Update department error:', error);
    res.status(500).json({ success: false, message: 'Failed to update department' });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!department) {
      return res.status(404).json({ success: false, message: getErrorMessage('NOT_FOUND', 'Department') });
    }

    department.isActive = false;
    await department.save();
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'delete',
      entityType: 'Department',
      entityId: department.id
    });
    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    logger.error('Delete department error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete department' });
  }
};


