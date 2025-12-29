const { EmailTemplate, Company } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

exports.getAllTemplates = async (req, res) => {
  try {
    const { type } = req.query;
    const where = { companyId: req.user.companyId, isActive: true };
    if (type) {
      where.type = type;
    }

    const templates = await EmailTemplate.findAll({
      where,
      include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }],
      order: [['type', 'ASC'], ['name', 'ASC']]
    });
    res.json({ success: true, data: templates });
  } catch (error) {
    logger.error('Get templates error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch templates' });
  }
};

exports.getTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findOne({
      where: { id: req.params.id, companyId: req.user.companyId },
      include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }]
    });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.json({ success: true, data: template });
  } catch (error) {
    logger.error('Get template error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch template' });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const templateData = { ...req.body, companyId: req.user.companyId };
    const template = await EmailTemplate.create(templateData);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'create',
      entityType: 'EmailTemplate',
      entityId: template.id
    });
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    logger.error('Create template error:', error);
    res.status(500).json({ success: false, message: 'Failed to create template' });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    await template.update(req.body);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'update',
      entityType: 'EmailTemplate',
      entityId: template.id
    });
    res.json({ success: true, data: template });
  } catch (error) {
    logger.error('Update template error:', error);
    res.status(500).json({ success: false, message: 'Failed to update template' });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    template.isActive = false;
    await template.save();
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'delete',
      entityType: 'EmailTemplate',
      entityId: template.id
    });
    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    logger.error('Delete template error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete template' });
  }
};



