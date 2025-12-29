const { SalaryHeadMapping, Company } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

exports.getAllMappings = async (req, res) => {
  try {
    const mappings = await SalaryHeadMapping.findAll({
      where: { companyId: req.user.companyId, isActive: true },
      include: [{ model: Company, as: 'company', attributes: ['id', 'name', 'code'] }],
      order: [['category', 'ASC'], ['displayOrder', 'ASC']]
    });
    res.json({ success: true, data: mappings });
  } catch (error) {
    logger.error('Get salary head mappings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch salary head mappings' });
  }
};

exports.getMapping = async (req, res) => {
  try {
    const mapping = await SalaryHeadMapping.findOne({
      where: { id: req.params.id, companyId: req.user.companyId },
      include: [{ model: Company, as: 'company', attributes: ['id', 'name', 'code'] }]
    });
    if (!mapping) {
      return res.status(404).json({ success: false, message: 'Salary head mapping not found' });
    }
    res.json({ success: true, data: mapping });
  } catch (error) {
    logger.error('Get salary head mapping error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch salary head mapping' });
  }
};

exports.createMapping = async (req, res) => {
  try {
    const mappingData = { ...req.body, companyId: req.user.companyId };
    
    // Check if code already exists
    const existing = await SalaryHeadMapping.findOne({
      where: { companyId: req.user.companyId, salaryHeadCode: mappingData.salaryHeadCode }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Salary head code already exists' });
    }

    const mapping = await SalaryHeadMapping.create(mappingData);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'statutory',
      action: 'create',
      entityType: 'SalaryHeadMapping',
      entityId: mapping.id
    });
    res.status(201).json({ success: true, data: mapping });
  } catch (error) {
    logger.error('Create salary head mapping error:', error);
    res.status(500).json({ success: false, message: 'Failed to create salary head mapping' });
  }
};

exports.updateMapping = async (req, res) => {
  try {
    const mapping = await SalaryHeadMapping.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!mapping) {
      return res.status(404).json({ success: false, message: 'Salary head mapping not found' });
    }

    // Check if code is being changed and already exists
    if (req.body.salaryHeadCode && req.body.salaryHeadCode !== mapping.salaryHeadCode) {
      const existing = await SalaryHeadMapping.findOne({
        where: { companyId: req.user.companyId, salaryHeadCode: req.body.salaryHeadCode }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Salary head code already exists' });
      }
    }

    await mapping.update(req.body);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'statutory',
      action: 'update',
      entityType: 'SalaryHeadMapping',
      entityId: mapping.id
    });
    res.json({ success: true, data: mapping });
  } catch (error) {
    logger.error('Update salary head mapping error:', error);
    res.status(500).json({ success: false, message: 'Failed to update salary head mapping' });
  }
};

exports.deleteMapping = async (req, res) => {
  try {
    const mapping = await SalaryHeadMapping.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!mapping) {
      return res.status(404).json({ success: false, message: 'Salary head mapping not found' });
    }

    mapping.isActive = false;
    await mapping.save();
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'statutory',
      action: 'delete',
      entityType: 'SalaryHeadMapping',
      entityId: mapping.id
    });
    res.json({ success: true, message: 'Salary head mapping deleted successfully' });
  } catch (error) {
    logger.error('Delete salary head mapping error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete salary head mapping' });
  }
};



