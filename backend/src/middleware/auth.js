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
    const user = await User.findByPk(decoded.userId, {
      include: [{
        model: Role,
        include: [Permission]
      }]
    });

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

      // Super Admin has all permissions
      if (user.role?.name === 'Super Admin') {
        return next();
      }

      // Check if user's role has the required permission
      const hasPermission = user.role?.permissions?.some(
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

