const jwt = require('jsonwebtoken');
const { User, Role, Permission } = require('../models');
const logger = require('../utils/logger');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Try to load user with role and permissions, but make permissions optional
    // since the join table might not exist yet
    let user;
    try {
      user = await User.findByPk(decoded.userId, {
        include: [{
          model: Role,
          as: 'role',
          required: false,
          include: [{
            model: Permission,
            as: 'permissions',
            required: false,
            through: { attributes: [] }
          }]
        }]
      });
    } catch (error) {
      // If permissions join table doesn't exist, load user with role only
      // Super Admin will still work since it bypasses permission checks
      if (error.name === 'SequelizeDatabaseError' && error.message.includes('RolePermissions')) {
        user = await User.findByPk(decoded.userId, {
          include: [{
            model: Role,
            as: 'role',
            required: false
          }]
        });
      } else {
        throw error;
      }
    }

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Check if user has required permission
const authorize = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      // Super Admin has all permissions - check role name (case-insensitive)
      const roleName = user.role?.name?.toLowerCase();
      if (roleName === 'super admin') {
        return next();
      }

      // Employee role - only portal routes allowed
      if (roleName === 'employee') {
        // Check if route is a portal route
        const isPortalRoute = req.path.startsWith('/api/portal') || req.path.startsWith('/api/gps-attendance');
        if (!isPortalRoute) {
          return res.status(403).json({ 
            success: false, 
            message: 'Employee role can only access portal routes' 
          });
        }
        return next();
      }

      // Company Admin should have access to dashboard analytics, reports, employees, payroll, and user management
      // even if permissions aren't loaded (for backward compatibility)
      const companyAdminAllowedPermissions = [
        'view_reports', 
        'view_analytics', 
        'view_employee', 
        'view_payroll',
        'manage_employee',
        'manage_payroll',
        'manage_company_users',
        'view_company',
        'manage_company',
        'manage_branches',
        'manage_departments',
        'manage_designations',
        'manage_regions',
        'manage_templates',
        'manage_news_policies',
        'view_attendance',
        'manage_attendance',
        'view_loan',
        'manage_loan',
        'view_reimbursement',
        'manage_reimbursement',
        'view_supplementary',
        'manage_supplementary',
        'view_increment',
        'manage_increment',
        'view_statutory',
        'view_hr_letters',
        'manage_hr_letters',
        'view_office_location',
        'manage_office_location',
        'view_biometric',
        'manage_biometric'
      ];
      
      if (roleName === 'company admin' && companyAdminAllowedPermissions.includes(requiredPermission)) {
        // If permissions are loaded and user has the permission, allow
        // If permissions aren't loaded, still allow (backward compatibility)
        if (user.role?.permissions && user.role.permissions.length > 0) {
          const hasPermission = user.role.permissions.some(p => p.name === requiredPermission);
          if (hasPermission) {
            return next();
          }
        } else {
          // No permissions loaded, but allow Company Admin for these routes
          return next();
        }
      }

      // If permissions aren't loaded (RolePermissions table doesn't exist), 
      // only Super Admin and Company Admin (for specific routes) can access
      if (!user.role?.permissions || user.role.permissions.length === 0) {
        // If no permissions are loaded, only Super Admin should have access
        // (Company Admin is handled above for specific routes)
        return res.status(403).json({ 
          success: false, 
          message: 'Insufficient permissions. Please ensure you are logged in as Super Admin or permissions are configured for your role.' 
        });
      }

      // Check if user's role has the required permission
      const hasPermission = user.role.permissions.some(
        perm => perm.name === requiredPermission || perm.name === '*'
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          success: false, 
          message: 'Insufficient permissions' 
        });
      }

      next();
    } catch (error) {
      logger.error('Authorization error:', error);
      return res.status(500).json({ success: false, message: 'Authorization check failed' });
    }
  };
};

// Check if user has access to specific module
const checkModuleAccess = (moduleName) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const companyId = req.params.companyId || req.body.companyId || req.query.companyId;

      // Check if module is enabled for the company
      const { GlobalPolicy } = require('../models');
      const policy = await GlobalPolicy.findOne({
        where: { companyId, moduleName, isEnabled: true }
      });

      if (!policy && user.role?.name !== 'Super Admin') {
        return res.status(403).json({ 
          success: false, 
          message: `Module ${moduleName} is not enabled for this organization` 
        });
      }

      next();
    } catch (error) {
      logger.error('Module access check error:', error);
      return res.status(500).json({ success: false, message: 'Module access check failed' });
    }
  };
};

module.exports = {
  authenticate,
  authorize,
  checkModuleAccess
};

