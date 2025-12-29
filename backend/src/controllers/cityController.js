const { City, Country, State } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

exports.getAllCities = async (req, res) => {
  try {
    const { countryId, stateId } = req.query;
    const where = { isActive: true };
    if (countryId) where.countryId = countryId;
    if (stateId) where.stateId = stateId;

    const cities = await City.findAll({
      where,
      include: [
        { model: Country, as: 'country', attributes: ['id', 'countryName', 'countryCode'] },
        { model: State, as: 'state', attributes: ['id', 'description', 'stateCode'] }
      ],
      order: [['description', 'ASC']]
    });
    res.json({ success: true, data: cities });
  } catch (error) {
    logger.error('Get cities error:', error);
    // If table doesn't exist, return empty array instead of error
    if (error.original && error.original.code === '42P01') {
      return res.json({ success: true, data: [] });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch cities' });
  }
};

exports.getCity = async (req, res) => {
  try {
    const city = await City.findOne({
      where: { id: req.params.id },
      include: [
        { model: Country, as: 'country', attributes: ['id', 'countryName', 'countryCode'] },
        { model: State, as: 'state', attributes: ['id', 'description', 'stateCode'] }
      ]
    });
    if (!city) {
      return res.status(404).json({ success: false, message: 'City not found' });
    }
    res.json({ success: true, data: city });
  } catch (error) {
    logger.error('Get city error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(404).json({ success: false, message: 'City not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch city' });
  }
};

exports.createCity = async (req, res) => {
  try {
    const existing = await City.findOne({
      where: { countryId: req.body.countryId, stateId: req.body.stateId, cityCode: req.body.cityCode }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'City code already exists for this state' });
    }

    const city = await City.create(req.body);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'region',
      action: 'create',
      entityType: 'City',
      entityId: city.id
    });
    res.status(201).json({ success: true, data: city });
  } catch (error) {
    logger.error('Create city error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(503).json({ success: false, message: 'Cities feature is not available. Table does not exist.' });
    }
    res.status(500).json({ success: false, message: 'Failed to create city' });
  }
};

exports.updateCity = async (req, res) => {
  try {
    const city = await City.findByPk(req.params.id);
    if (!city) {
      return res.status(404).json({ success: false, message: 'City not found' });
    }

    if (req.body.cityCode && req.body.cityCode !== city.cityCode) {
      const existing = await City.findOne({
        where: {
          countryId: req.body.countryId || city.countryId,
          stateId: req.body.stateId || city.stateId,
          cityCode: req.body.cityCode
        }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'City code already exists for this state' });
      }
    }

    await city.update(req.body);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'region',
      action: 'update',
      entityType: 'City',
      entityId: city.id
    });
    res.json({ success: true, data: city });
  } catch (error) {
    logger.error('Update city error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(404).json({ success: false, message: 'City not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to update city' });
  }
};

exports.deleteCity = async (req, res) => {
  try {
    const city = await City.findByPk(req.params.id);
    if (!city) {
      return res.status(404).json({ success: false, message: 'City not found' });
    }

    city.isActive = false;
    await city.save();
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'region',
      action: 'delete',
      entityType: 'City',
      entityId: city.id
    });
    res.json({ success: true, message: 'City deleted successfully' });
  } catch (error) {
    logger.error('Delete city error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(404).json({ success: false, message: 'City not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to delete city' });
  }
};

