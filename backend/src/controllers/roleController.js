const { Role } = require('../models');
const logger = require('../utils/logger');

/**
 * Get all roles
 */
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'description', 'isSystemRole']
    });

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    logger.error('Get all roles error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch roles', error: error.message });
  }
};

/**
 * Get role by ID
 */
exports.getRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id, {
      attributes: ['id', 'name', 'description', 'isSystemRole']
    });

    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    res.json({
      success: true,
      data: role
    });
  } catch (error) {
    logger.error('Get role by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch role', error: error.message });
  }
};



