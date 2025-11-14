const { Company } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.findAll({ where: { isActive: true } });
    res.json({ success: true, data: companies });
  } catch (error) {
    logger.error('Get companies error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch companies' });
  }
};

exports.getCompany = async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    res.json({ success: true, data: company });
  } catch (error) {
    logger.error('Get company error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch company' });
  }
};

exports.createCompany = async (req, res) => {
  try {
    const company = await Company.create(req.body);
    await createAuditLog({
      userId: req.user.id,
      companyId: company.id,
      module: 'company',
      action: 'create',
      entityType: 'Company',
      entityId: company.id
    });
    res.status(201).json({ success: true, data: company });
  } catch (error) {
    logger.error('Create company error:', error);
    res.status(500).json({ success: false, message: 'Failed to create company' });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    await company.update(req.body);
    await createAuditLog({
      userId: req.user.id,
      companyId: company.id,
      module: 'company',
      action: 'update',
      entityType: 'Company',
      entityId: company.id
    });
    res.json({ success: true, data: company });
  } catch (error) {
    logger.error('Update company error:', error);
    res.status(500).json({ success: false, message: 'Failed to update company' });
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    company.isActive = false;
    await company.save();
    await createAuditLog({
      userId: req.user.id,
      companyId: company.id,
      module: 'company',
      action: 'delete',
      entityType: 'Company',
      entityId: company.id
    });
    res.json({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    logger.error('Delete company error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete company' });
  }
};

exports.addBranch = async (req, res) => {
  // Implementation for adding branch
  res.json({ success: true, message: 'Branch added successfully' });
};

exports.addDepartment = async (req, res) => {
  // Implementation for adding department
  res.json({ success: true, message: 'Department added successfully' });
};

exports.addDesignation = async (req, res) => {
  // Implementation for adding designation
  res.json({ success: true, message: 'Designation added successfully' });
};

