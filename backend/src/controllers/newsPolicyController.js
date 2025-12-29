const { NewsPolicy, Company } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

exports.getAllNewsPolicies = async (req, res) => {
  try {
    const { type, isActive } = req.query;
    const where = { companyId: req.user.companyId };
    if (type) {
      where.type = type;
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const newsPolicies = await NewsPolicy.findAll({
      where,
      include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }],
      order: [['publishedAt', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json({ success: true, data: newsPolicies });
  } catch (error) {
    logger.error('Get news/policies error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch news/policies' });
  }
};

exports.getNewsPolicy = async (req, res) => {
  try {
    const newsPolicy = await NewsPolicy.findOne({
      where: { id: req.params.id, companyId: req.user.companyId },
      include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }]
    });
    if (!newsPolicy) {
      return res.status(404).json({ success: false, message: 'News/Policy not found' });
    }
    res.json({ success: true, data: newsPolicy });
  } catch (error) {
    logger.error('Get news/policy error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch news/policy' });
  }
};

exports.createNewsPolicy = async (req, res) => {
  try {
    const newsPolicyData = { ...req.body, companyId: req.user.companyId };
    
    // If publishedAt is not provided and isActive is true, set it to now
    if (!newsPolicyData.publishedAt && newsPolicyData.isActive) {
      newsPolicyData.publishedAt = new Date();
    }

    const newsPolicy = await NewsPolicy.create(newsPolicyData);
    
    // TODO: Send push notifications if sendNotification is true
    // This would integrate with a notification service
    
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'create',
      entityType: 'NewsPolicy',
      entityId: newsPolicy.id
    });
    res.status(201).json({ success: true, data: newsPolicy });
  } catch (error) {
    logger.error('Create news/policy error:', error);
    res.status(500).json({ success: false, message: 'Failed to create news/policy' });
  }
};

exports.updateNewsPolicy = async (req, res) => {
  try {
    const newsPolicy = await NewsPolicy.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!newsPolicy) {
      return res.status(404).json({ success: false, message: 'News/Policy not found' });
    }

    // If publishing for the first time
    if (!newsPolicy.publishedAt && req.body.isActive) {
      req.body.publishedAt = new Date();
    }

    await newsPolicy.update(req.body);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'update',
      entityType: 'NewsPolicy',
      entityId: newsPolicy.id
    });
    res.json({ success: true, data: newsPolicy });
  } catch (error) {
    logger.error('Update news/policy error:', error);
    res.status(500).json({ success: false, message: 'Failed to update news/policy' });
  }
};

exports.deleteNewsPolicy = async (req, res) => {
  try {
    const newsPolicy = await NewsPolicy.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!newsPolicy) {
      return res.status(404).json({ success: false, message: 'News/Policy not found' });
    }

    newsPolicy.isActive = false;
    await newsPolicy.save();
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'company',
      action: 'delete',
      entityType: 'NewsPolicy',
      entityId: newsPolicy.id
    });
    res.json({ success: true, message: 'News/Policy deleted successfully' });
  } catch (error) {
    logger.error('Delete news/policy error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete news/policy' });
  }
};



