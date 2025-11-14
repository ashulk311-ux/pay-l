const { GlobalPolicy } = require('../models');
const logger = require('../utils/logger');

exports.getPolicies = async (req, res) => {
  try {
    const policies = await GlobalPolicy.findAll({ where: { companyId: req.params.companyId } });
    res.json({ success: true, data: policies });
  } catch (error) {
    logger.error('Get policies error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch policies' });
  }
};

exports.createPolicy = async (req, res) => {
  try {
    const policy = await GlobalPolicy.create({
      companyId: req.params.companyId,
      ...req.body
    });
    res.status(201).json({ success: true, data: policy });
  } catch (error) {
    logger.error('Create policy error:', error);
    res.status(500).json({ success: false, message: 'Failed to create policy' });
  }
};

exports.updatePolicy = async (req, res) => {
  try {
    const policy = await GlobalPolicy.findOne({
      where: { companyId: req.params.companyId, moduleName: req.params.moduleName }
    });
    if (!policy) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }
    await policy.update(req.body);
    res.json({ success: true, data: policy });
  } catch (error) {
    logger.error('Update policy error:', error);
    res.status(500).json({ success: false, message: 'Failed to update policy' });
  }
};

exports.deletePolicy = async (req, res) => {
  try {
    const policy = await GlobalPolicy.findOne({
      where: { companyId: req.params.companyId, moduleName: req.params.moduleName }
    });
    if (!policy) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }
    await policy.destroy();
    res.json({ success: true, message: 'Policy deleted successfully' });
  } catch (error) {
    logger.error('Delete policy error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete policy' });
  }
};

