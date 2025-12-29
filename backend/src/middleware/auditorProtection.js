const logger = require('../utils/logger');

/**
 * Middleware to protect write operations from Auditor role
 * Auditor has read-only access
 */
const protectAuditorWrite = (req, res, next) => {
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
          message: 'Auditor role has read-only access. Write operations (create, update, delete) are not allowed.'
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Auditor protection error:', error);
    return res.status(500).json({ success: false, message: 'Access check failed' });
  }
};

module.exports = {
  protectAuditorWrite
};



