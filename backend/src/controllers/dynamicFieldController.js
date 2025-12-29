const { DynamicField, Company } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

exports.getAllFields = async (req, res) => {
  try {
    const fields = await DynamicField.findAll({
      where: { companyId: req.user.companyId, isActive: true },
      include: [{ model: Company, as: 'company', attributes: ['id', 'name', 'code'] }],
      order: [['section', 'ASC'], ['displayOrder', 'ASC']]
    });
    res.json({ success: true, data: fields });
  } catch (error) {
    logger.error('Get dynamic fields error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dynamic fields' });
  }
};

exports.getField = async (req, res) => {
  try {
    const field = await DynamicField.findOne({
      where: { id: req.params.id, companyId: req.user.companyId },
      include: [{ model: Company, as: 'company', attributes: ['id', 'name', 'code'] }]
    });
    if (!field) {
      return res.status(404).json({ success: false, message: 'Dynamic field not found' });
    }
    res.json({ success: true, data: field });
  } catch (error) {
    logger.error('Get dynamic field error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dynamic field' });
  }
};

exports.createField = async (req, res) => {
  try {
    const fieldData = { ...req.body, companyId: req.user.companyId };
    
    // Check if code already exists
    const existing = await DynamicField.findOne({
      where: { companyId: req.user.companyId, fieldCode: fieldData.fieldCode }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Field code already exists' });
    }

    const field = await DynamicField.create(fieldData);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'employee',
      action: 'create',
      entityType: 'DynamicField',
      entityId: field.id
    });
    res.status(201).json({ success: true, data: field });
  } catch (error) {
    logger.error('Create dynamic field error:', error);
    res.status(500).json({ success: false, message: 'Failed to create dynamic field' });
  }
};

exports.updateField = async (req, res) => {
  try {
    const field = await DynamicField.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!field) {
      return res.status(404).json({ success: false, message: 'Dynamic field not found' });
    }

    // Check if code is being changed and already exists
    if (req.body.fieldCode && req.body.fieldCode !== field.fieldCode) {
      const existing = await DynamicField.findOne({
        where: { companyId: req.user.companyId, fieldCode: req.body.fieldCode }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Field code already exists' });
      }
    }

    await field.update(req.body);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'employee',
      action: 'update',
      entityType: 'DynamicField',
      entityId: field.id
    });
    res.json({ success: true, data: field });
  } catch (error) {
    logger.error('Update dynamic field error:', error);
    res.status(500).json({ success: false, message: 'Failed to update dynamic field' });
  }
};

exports.deleteField = async (req, res) => {
  try {
    const field = await DynamicField.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!field) {
      return res.status(404).json({ success: false, message: 'Dynamic field not found' });
    }

    field.isActive = false;
    await field.save();
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'employee',
      action: 'delete',
      entityType: 'DynamicField',
      entityId: field.id
    });
    res.json({ success: true, message: 'Dynamic field deleted successfully' });
  } catch (error) {
    logger.error('Delete dynamic field error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete dynamic field' });
  }
};



