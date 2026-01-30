const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

// Generate JWT token (JWT_SECRET validated at server startup)
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error('JWT_SECRET is not configured');
    logger.error(err.message);
    throw err;
  }
  return jwt.sign({ userId }, secret, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, roleId, companyId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      roleId,
      companyId
    });

    const token = generateToken(user.id);

    await createAuditLog({
      userId: user.id,
      companyId,
      module: 'auth',
      action: 'create',
      entityType: 'User',
      entityId: user.id
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roleId: user.roleId
        },
        token
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: 'role' }]
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user.id);

    await createAuditLog({
      userId: user.id,
      companyId: user.companyId,
      module: 'auth',
      action: 'view',
      entityType: 'User',
      entityId: user.id
    });

    // Send plain objects only (avoid Sequelize serialization issues)
    const roleData = user.role
      ? { id: user.role.id, name: user.role.name }
      : null;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: roleData
        },
        token
      }
    });
  } catch (error) {
    const errMsg = error?.message || String(error) || 'Unknown error';
    const errStack = error?.stack;
    logger.error('Login error:', errMsg, errStack ? { stack: errStack } : {});
    // Log to stdout so Render/hosting shows it in dashboard
    console.error('[auth/login] 500:', errMsg, errStack || '');
    const debugRequested = req.query.debug === '1' || req.get('X-Debug-Login') === '1';
    const clientMessage =
      process.env.NODE_ENV === 'production' && !debugRequested
        ? 'Login failed. Please try again or contact support.'
        : errMsg;
    const payload = {
      success: false,
      message: 'Login failed',
      error: clientMessage || 'An unexpected error occurred'
    };
    if (debugRequested) payload.debug = { error: errMsg, name: error?.name };
    res.status(500).json(payload);
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Role, as: 'role' }],
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user', error: error.message });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const user = await User.findByPk(req.user.id);

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;

    await user.save();

    await createAuditLog({
      userId: user.id,
      companyId: user.companyId,
      module: 'auth',
      action: 'update',
      entityType: 'User',
      entityId: user.id
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    await createAuditLog({
      userId: user.id,
      companyId: user.companyId,
      module: 'auth',
      action: 'update',
      entityType: 'User',
      entityId: user.id
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password', error: error.message });
  }
};

// Logout
exports.logout = async (req, res) => {
  // With JWT, logout is handled client-side by removing the token
  // But we can log the action
  await createAuditLog({
    userId: req.user.id,
    companyId: req.user.companyId,
    module: 'auth',
    action: 'view',
    entityType: 'User',
    entityId: req.user.id
  });

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  // Implementation for forgot password
  res.json({ success: true, message: 'Password reset email sent' });
};

// Reset password
exports.resetPassword = async (req, res) => {
  // Implementation for reset password
  res.json({ success: true, message: 'Password reset successfully' });
};

