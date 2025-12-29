const logger = require('../utils/logger');

/**
 * Role-based access control middleware
 * Checks if user's role has access to specific modules/actions
 */

/**
 * Check if user can perform write operations (Auditor is read-only)
 */
const checkWriteAccess = (req, res, next) => {
  try {
    const user = req.user;
    const roleName = user?.role?.name?.toLowerCase();

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Super Admin has all access
    if (roleName === 'super admin') {
      return next();
    }

    // Auditor is read-only - block write operations
    if (roleName === 'auditor') {
      const method = req.method.toUpperCase();
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        return res.status(403).json({
          success: false,
          message: 'Auditor role has read-only access. Write operations are not allowed.'
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Write access check error:', error);
    return res.status(500).json({ success: false, message: 'Access check failed' });
  }
};

/**
 * Check if user has access to a specific module
 */
const checkModuleAccess = (moduleName) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const roleName = user?.role?.name?.toLowerCase();

      if (!user) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      // Super Admin has access to all modules
      if (roleName === 'super admin') {
        return next();
      }

      // Employee can only access portal
      if (roleName === 'employee') {
        if (moduleName === 'portal' || moduleName === 'gps-attendance') {
          return next();
        }
        return res.status(403).json({
          success: false,
          message: 'Employee role can only access portal routes'
        });
      }

      // Check role-specific module access
      const moduleAccessMap = {
        'hr/admin': ['employee', 'payroll', 'attendance', 'loan', 'reimbursement', 'supplementary', 'increment', 'hr_letters', 'biometric', 'office_location'],
        'finance': ['payroll', 'statutory', 'reports', 'analytics', 'government'],
        'auditor': ['employee', 'payroll', 'attendance', 'loan', 'reimbursement', 'supplementary', 'increment', 'statutory', 'reports', 'analytics', 'audit_logs', 'biometric', 'office_location', 'hr_letters', 'government']
      };

      const roleKey = roleName.replace('/', '_').toLowerCase();
      const allowedModules = moduleAccessMap[roleKey] || [];

      if (!allowedModules.includes(moduleName.toLowerCase())) {
        return res.status(403).json({
          success: false,
          message: `Access denied. ${user.role?.name || 'Your role'} does not have access to ${moduleName} module.`
        });
      }

      next();
    } catch (error) {
      logger.error('Module access check error:', error);
      return res.status(500).json({ success: false, message: 'Module access check failed' });
    }
  };
};

/**
 * Check if user can access global setup (only Super Admin)
 */
const checkGlobalSetupAccess = (req, res, next) => {
  try {
    const user = req.user;
    const roleName = user?.role?.name?.toLowerCase();

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (roleName !== 'super admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can access global setup'
      });
    }

    next();
  } catch (error) {
    logger.error('Global setup access check error:', error);
    return res.status(500).json({ success: false, message: 'Access check failed' });
  }
};

module.exports = {
  checkWriteAccess,
  checkModuleAccess,
  checkGlobalSetupAccess
};



