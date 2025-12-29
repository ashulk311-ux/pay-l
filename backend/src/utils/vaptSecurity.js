/**
 * VAPT (Vulnerability Assessment and Penetration Testing) Security Utilities
 * Implements security best practices for VAPT certification
 */

const logger = require('./logger');

/**
 * Security Headers Configuration for VAPT Compliance
 */
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none';"
};

/**
 * Validate input against common injection patterns
 */
function validateInput(input) {
  if (typeof input !== 'string') return true;
  
  // SQL Injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
    /(--|#|\/\*|\*\/|;)/g,
    /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/gi
  ];
  
  // XSS patterns
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi
  ];
  
  // Command Injection patterns
  const cmdPatterns = [
    /[;&|`$(){}[\]]/g,
    /\b(cat|ls|pwd|whoami|id|uname|ps|kill|rm|mv|cp)\b/gi
  ];
  
  const allPatterns = [...sqlPatterns, ...xssPatterns, ...cmdPatterns];
  
  for (const pattern of allPatterns) {
    if (pattern.test(input)) {
      logger.warn(`Potential security threat detected: ${pattern} in input`);
      return false;
    }
  }
  
  return true;
}

/**
 * Sanitize file path to prevent directory traversal
 */
function sanitizeFilePath(filePath) {
  if (!filePath) return null;
  
  // Remove directory traversal attempts
  let sanitized = filePath.replace(/\.\./g, '').replace(/\/\//g, '/');
  
  // Remove leading slashes
  sanitized = sanitized.replace(/^\/+/, '');
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  return sanitized;
}

/**
 * Rate limiting configuration for VAPT
 */
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
};

/**
 * Security audit log
 */
function logSecurityEvent(event, details) {
  logger.warn('Security Event:', {
    event,
    details,
    timestamp: new Date().toISOString(),
    type: 'SECURITY_AUDIT'
  });
}

/**
 * Validate JWT token format
 */
function validateTokenFormat(token) {
  if (!token || typeof token !== 'string') return false;
  
  // JWT format: header.payload.signature (3 parts separated by dots)
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  // Each part should be base64url encoded
  const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
  return parts.every(part => base64UrlRegex.test(part));
}

/**
 * Check for common security vulnerabilities
 */
function performSecurityCheck(req) {
  const checks = {
    sqlInjection: true,
    xss: true,
    pathTraversal: true,
    commandInjection: true
  };
  
  // Check query parameters
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string' && !validateInput(value)) {
        checks.sqlInjection = false;
        checks.xss = false;
        logSecurityEvent('SUSPICIOUS_QUERY_PARAM', { key, value });
      }
    }
  }
  
  // Check body parameters
  if (req.body) {
    const bodyStr = JSON.stringify(req.body);
    if (!validateInput(bodyStr)) {
      checks.sqlInjection = false;
      checks.xss = false;
      logSecurityEvent('SUSPICIOUS_BODY_PARAM', { body: bodyStr.substring(0, 100) });
    }
  }
  
  // Check file paths
  if (req.params) {
    for (const [key, value] of Object.entries(req.params)) {
      if (key.includes('path') || key.includes('file') || key.includes('id')) {
        const sanitized = sanitizeFilePath(value);
        if (sanitized !== value) {
          checks.pathTraversal = false;
          logSecurityEvent('PATH_TRAVERSAL_ATTEMPT', { key, value });
        }
      }
    }
  }
  
  return checks;
}

module.exports = {
  securityHeaders,
  validateInput,
  sanitizeFilePath,
  rateLimitConfig,
  logSecurityEvent,
  validateTokenFormat,
  performSecurityCheck
};



