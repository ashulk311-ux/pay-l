const { User, Role, Company } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

/**
 * Get all users (Super Admin only)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const isSuperAdmin = req.user.role?.name?.toLowerCase() === 'super admin';
    const { companyId: queryCompanyId, roleId, isActive } = req.query;

    const whereClause = {};
    
    // Company Admin can only see users from their company
    // Super Admin can see all users or filter by company
    if (!isSuperAdmin && req.user.companyId) {
      whereClause.companyId = req.user.companyId;
    } else if (queryCompanyId && isSuperAdmin) {
      // Super Admin can filter by company if provided
      whereClause.companyId = queryCompanyId;
    }
    
    if (roleId) {
      whereClause.roleId = roleId;
    }
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const users = await User.findAll({
      where: whereClause,
      include: [{
        model: Role,
        as: 'role',
        attributes: ['id', 'name', 'description']
      }, {
        model: Company,
        as: 'company',
        attributes: ['id', 'name', 'code']
      }],
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
};

/**
 * Get user by ID
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const user = await User.findByPk(id, {
      include: [{
        model: Role,
        as: 'role',
        attributes: ['id', 'name', 'description']
      }, {
        model: Company,
        as: 'company',
        attributes: ['id', 'name', 'code']
      }],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check company access (unless Super Admin)
    if (req.user.role?.name !== 'Super Admin' && user.companyId !== companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user', error: error.message });
  }
};

/**
 * Create new user (Super Admin only)
 */
exports.createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, roleId, companyId, isActive } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !roleId) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, first name, last name, and role are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Verify role exists
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Authorization check: Super Admin can create users for any company
    // Company Admin can only create users for their own company
    const isSuperAdmin = req.user.role?.name?.toLowerCase() === 'super admin';
    const isCompanyAdmin = req.user.role?.name?.toLowerCase() === 'company admin';
    
    let targetCompanyId;
    if (isSuperAdmin) {
      // Super Admin can specify any company or create without company
      targetCompanyId = companyId || req.user.companyId;
    } else if (isCompanyAdmin) {
      // Company Admin can only create users for their own company
      targetCompanyId = req.user.companyId;
      if (companyId && companyId !== req.user.companyId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Company Admin can only create users for their own company' 
        });
      }
    } else {
      return res.status(403).json({ 
        success: false, 
        message: 'Only Super Admin and Company Admin can create users' 
      });
    }

    // Verify company exists if provided
    if (targetCompanyId) {
      const company = await Company.findByPk(targetCompanyId);
      if (!company) {
        return res.status(400).json({ success: false, message: 'Invalid company' });
      }
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      roleId,
      companyId: targetCompanyId,
      isActive: isActive !== undefined ? isActive : true
    });

    // Reload with associations
    const createdUser = await User.findByPk(user.id, {
      include: [{
        model: Role,
        as: 'role',
        attributes: ['id', 'name', 'description']
      }],
      attributes: { exclude: ['password'] }
    });

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'user_management',
      action: 'create',
      entityType: 'User',
      entityId: user.id,
      description: `Created user: ${email} with role: ${role.name}`
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: createdUser
    });
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Failed to create user', error: error.message });
  }
};

/**
 * Update user
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, roleId, companyId, isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check company access (unless Super Admin)
    if (req.user.role?.name !== 'Super Admin' && user.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (roleId) {
      const role = await Role.findByPk(roleId);
      if (!role) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
      }
      user.roleId = roleId;
    }
    if (companyId && req.user.role?.name === 'Super Admin') {
      const company = await Company.findByPk(companyId);
      if (!company) {
        return res.status(400).json({ success: false, message: 'Invalid company' });
      }
      user.companyId = companyId;
    }
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    // Reload with associations
    const updatedUser = await User.findByPk(user.id, {
      include: [{
        model: Role,
        as: 'role',
        attributes: ['id', 'name', 'description']
      }],
      attributes: { exclude: ['password'] }
    });

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'user_management',
      action: 'update',
      entityType: 'User',
      entityId: user.id,
      description: `Updated user: ${user.email}`
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
  }
};

/**
 * Delete user
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent deleting yourself
    if (user.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    // Check company access (unless Super Admin)
    if (req.user.role?.name !== 'Super Admin' && user.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await user.destroy();

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'user_management',
      action: 'delete',
      entityType: 'User',
      entityId: id,
      description: `Deleted user: ${user.email}`
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
  }
};

/**
 * Reset user password (Super Admin only)
 */
exports.resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password is required and must be at least 6 characters'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check company access (unless Super Admin)
    if (req.user.role?.name !== 'Super Admin' && user.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    user.password = newPassword;
    await user.save();

    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'user_management',
      action: 'update',
      entityType: 'User',
      entityId: user.id,
      description: `Reset password for user: ${user.email}`
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    logger.error('Reset user password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password', error: error.message });
  }
};

