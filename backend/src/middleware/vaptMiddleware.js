const vaptSecurity = require('../utils/vaptSecurity');
const logger = require('../utils/logger');

/**
 * VAPT Security Middleware
 * Performs security checks on incoming requests
 */
function vaptSecurityCheck(req, res, next) {
  try {
    // Perform security checks
    const checks = vaptSecurity.performSecurityCheck(req);
    
    // If any check fails, log and block request
    if (!Object.values(checks).every(check => check === true)) {
      vaptSecurity.logSecurityEvent('SECURITY_CHECK_FAILED', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        checks
      });
      
      return res.status(400).json({
        success: false,
        message: 'Request contains potentially malicious content',
        code: 'SECURITY_CHECK_FAILED'
      });
    }
    
    // Validate JWT token format if present
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (!vaptSecurity.validateTokenFormat(token)) {
        vaptSecurity.logSecurityEvent('INVALID_TOKEN_FORMAT', {
          ip: req.ip,
          path: req.path
        });
        
        return res.status(401).json({
          success: false,
          message: 'Invalid token format',
          code: 'INVALID_TOKEN'
        });
      }
    }
    
    next();
  } catch (error) {
    logger.error('VAPT security check error:', error);
    // Don't block on middleware error, but log it
    next();
  }
}

module.exports = {
  vaptSecurityCheck
};



