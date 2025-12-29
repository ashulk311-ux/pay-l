const { OfficeLocation, Company } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

/**
 * Get all office locations
 */
exports.getAllLocations = async (req, res) => {
  try {
    const { branchId } = req.query;
    
    const whereClause = { companyId: req.user.companyId };
    if (branchId) {
      whereClause.branchId = branchId;
    }

    const locations = await OfficeLocation.findAll({
      where: whereClause,
      include: [
        { model: require('../models').Branch, as: 'branch', attributes: ['id', 'name'] }
      ],
      order: [['isDefault', 'DESC'], ['locationName', 'ASC']]
    });

    res.json({ success: true, data: locations });
  } catch (error) {
    logger.error('Get office locations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch office locations', error: error.message });
  }
};

/**
 * Get single office location
 */
exports.getLocation = async (req, res) => {
  try {
    const location = await OfficeLocation.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });

    if (!location) {
      return res.status(404).json({ success: false, message: 'Office location not found' });
    }

    res.json({ success: true, data: location });
  } catch (error) {
    logger.error('Get office location error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch office location', error: error.message });
  }
};

/**
 * Create office location
 */
exports.createLocation = async (req, res) => {
  try {
    const {
      branchId,
      locationName,
      address,
      latitude,
      longitude,
      allowedRadius,
      isDefault,
      workingHours,
      timezone
    } = req.body;

    if (!locationName || !address || !latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await OfficeLocation.update(
        { isDefault: false },
        { where: { companyId: req.user.companyId, branchId: branchId || null } }
      );
    }

    const location = await OfficeLocation.create({
      companyId: req.user.companyId,
      branchId: branchId || null,
      locationName,
      address,
      latitude,
      longitude,
      allowedRadius: allowedRadius || 100,
      isDefault: isDefault || false,
      workingHours: workingHours || {},
      timezone: timezone || 'Asia/Kolkata',
      isActive: true
    });

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'attendance',
      action: 'create',
      entityType: 'OfficeLocation',
      entityId: location.id,
      description: `Office location created: ${locationName}`
    });

    res.status(201).json({
      success: true,
      message: 'Office location created successfully',
      data: location
    });
  } catch (error) {
    logger.error('Create office location error:', error);
    res.status(500).json({ success: false, message: 'Failed to create office location', error: error.message });
  }
};

/**
 * Update office location
 */
exports.updateLocation = async (req, res) => {
  try {
    const location = await OfficeLocation.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });

    if (!location) {
      return res.status(404).json({ success: false, message: 'Office location not found' });
    }

    // If setting as default, unset other defaults
    if (req.body.isDefault) {
      await OfficeLocation.update(
        { isDefault: false },
        { where: { companyId: req.user.companyId, branchId: location.branchId || null, id: { [require('sequelize').Op.ne]: location.id } } }
      );
    }

    await location.update(req.body);

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'attendance',
      action: 'update',
      entityType: 'OfficeLocation',
      entityId: location.id,
      description: 'Office location updated'
    });

    res.json({
      success: true,
      message: 'Office location updated successfully',
      data: location
    });
  } catch (error) {
    logger.error('Update office location error:', error);
    res.status(500).json({ success: false, message: 'Failed to update office location', error: error.message });
  }
};

/**
 * Delete office location
 */
exports.deleteLocation = async (req, res) => {
  try {
    const location = await OfficeLocation.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });

    if (!location) {
      return res.status(404).json({ success: false, message: 'Office location not found' });
    }

    await location.destroy();

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'attendance',
      action: 'delete',
      entityType: 'OfficeLocation',
      entityId: req.params.id,
      description: 'Office location deleted'
    });

    res.json({
      success: true,
      message: 'Office location deleted successfully'
    });
  } catch (error) {
    logger.error('Delete office location error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete office location', error: error.message });
  }
};



