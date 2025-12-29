const { State, Country } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

exports.getAllStates = async (req, res) => {
  try {
    const { countryId } = req.query;
    const where = { isActive: true };
    if (countryId) where.countryId = countryId;

    const states = await State.findAll({
      where,
      include: [{ model: Country, as: 'country', attributes: ['id', 'countryName', 'countryCode'] }],
      order: [['description', 'ASC']]
    });
    res.json({ success: true, data: states });
  } catch (error) {
    logger.error('Get states error:', error);
    // If table doesn't exist, return empty array instead of error
    if (error.original && error.original.code === '42P01') {
      return res.json({ success: true, data: [] });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch states' });
  }
};

exports.getState = async (req, res) => {
  try {
    const state = await State.findOne({
      where: { id: req.params.id },
      include: [{ model: Country, as: 'country', attributes: ['id', 'countryName', 'countryCode'] }]
    });
    if (!state) {
      return res.status(404).json({ success: false, message: 'State not found' });
    }
    res.json({ success: true, data: state });
  } catch (error) {
    logger.error('Get state error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(404).json({ success: false, message: 'State not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch state' });
  }
};

exports.createState = async (req, res) => {
  try {
    const existing = await State.findOne({
      where: { countryId: req.body.countryId, stateCode: req.body.stateCode }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'State code already exists for this country' });
    }

    const state = await State.create(req.body);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'region',
      action: 'create',
      entityType: 'State',
      entityId: state.id
    });
    res.status(201).json({ success: true, data: state });
  } catch (error) {
    logger.error('Create state error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(503).json({ success: false, message: 'States feature is not available. Table does not exist.' });
    }
    res.status(500).json({ success: false, message: 'Failed to create state' });
  }
};

exports.updateState = async (req, res) => {
  try {
    const state = await State.findByPk(req.params.id);
    if (!state) {
      return res.status(404).json({ success: false, message: 'State not found' });
    }

    if (req.body.stateCode && req.body.stateCode !== state.stateCode) {
      const existing = await State.findOne({
        where: { countryId: req.body.countryId || state.countryId, stateCode: req.body.stateCode }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'State code already exists for this country' });
      }
    }

    await state.update(req.body);
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'region',
      action: 'update',
      entityType: 'State',
      entityId: state.id
    });
    res.json({ success: true, data: state });
  } catch (error) {
    logger.error('Update state error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(404).json({ success: false, message: 'State not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to update state' });
  }
};

exports.deleteState = async (req, res) => {
  try {
    const state = await State.findByPk(req.params.id);
    if (!state) {
      return res.status(404).json({ success: false, message: 'State not found' });
    }

    state.isActive = false;
    await state.save();
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'region',
      action: 'delete',
      entityType: 'State',
      entityId: state.id
    });
    res.json({ success: true, message: 'State deleted successfully' });
  } catch (error) {
    logger.error('Delete state error:', error);
    if (error.original && error.original.code === '42P01') {
      return res.status(404).json({ success: false, message: 'State not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to delete state' });
  }
};

