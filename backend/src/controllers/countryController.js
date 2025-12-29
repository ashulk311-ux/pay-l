const { Country } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

exports.getAllCountries = async (req, res) => {
  try {
    const countries = await Country.findAll({
      where: { isActive: true },
      order: [['countryName', 'ASC']]
    });
    res.json({ success: true, data: countries });
  } catch (error) {
    logger.error('Get countries error:', error);
    // If table doesn't exist, return empty array instead of error
    if (error.original && error.original.code === '42P01') {
      return res.json({ success: true, data: [] });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch countries' });
  }
};

exports.getCountry = async (req, res) => {
  try {
    const country = await Country.findByPk(req.params.id);
    if (!country) {
      return res.status(404).json({ success: false, message: 'Country not found' });
    }
    res.json({ success: true, data: country });
  } catch (error) {
    logger.error('Get country error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(404).json({ success: false, message: 'Country not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch country' });
  }
};

exports.createCountry = async (req, res) => {
  try {
    const existing = await Country.findOne({
      where: { countryCode: req.body.countryCode }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Country code already exists' });
    }

    const country = await Country.create(req.body);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'region',
      action: 'create',
      entityType: 'Country',
      entityId: country.id
    });
    res.status(201).json({ success: true, data: country });
  } catch (error) {
    logger.error('Create country error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(503).json({ success: false, message: 'Countries feature is not available. Table does not exist.' });
    }
    res.status(500).json({ success: false, message: 'Failed to create country' });
  }
};

exports.updateCountry = async (req, res) => {
  try {
    const country = await Country.findByPk(req.params.id);
    if (!country) {
      return res.status(404).json({ success: false, message: 'Country not found' });
    }

    if (req.body.countryCode && req.body.countryCode !== country.countryCode) {
      const existing = await Country.findOne({
        where: { countryCode: req.body.countryCode }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Country code already exists' });
      }
    }

    await country.update(req.body);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'region',
      action: 'update',
      entityType: 'Country',
      entityId: country.id
    });
    res.json({ success: true, data: country });
  } catch (error) {
    logger.error('Update country error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(404).json({ success: false, message: 'Country not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to update country' });
  }
};

exports.deleteCountry = async (req, res) => {
  try {
    const country = await Country.findByPk(req.params.id);
    if (!country) {
      return res.status(404).json({ success: false, message: 'Country not found' });
    }

    country.isActive = false;
    await country.save();
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'region',
      action: 'delete',
      entityType: 'Country',
      entityId: country.id
    });
    res.json({ success: true, message: 'Country deleted successfully' });
  } catch (error) {
    logger.error('Delete country error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(404).json({ success: false, message: 'Country not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to delete country' });
  }
};

