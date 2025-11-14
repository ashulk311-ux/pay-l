/**
 * Input sanitization utilities
 */

/**
 * Sanitize string input - remove HTML tags and trim whitespace
 */
function sanitizeString(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, ''); // Remove remaining angle brackets
}

/**
 * Sanitize object recursively
 */
function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Sanitize email - normalize and validate
 */
function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') return email;
  return email.toLowerCase().trim();
}

/**
 * Sanitize phone number - remove non-digit characters except + and spaces
 */
function sanitizePhone(phone) {
  if (!phone || typeof phone !== 'string') return phone;
  return phone.replace(/[^\d+\s-()]/g, '').trim();
}

/**
 * Sanitize numeric input
 */
function sanitizeNumber(value) {
  if (value === null || value === undefined) return value;
  const num = parseFloat(value);
  return isNaN(num) ? value : num;
}

/**
 * Sanitize integer input
 */
function sanitizeInteger(value) {
  if (value === null || value === undefined) return value;
  const num = parseInt(value, 10);
  return isNaN(num) ? value : num;
}

/**
 * Sanitize date input
 */
function sanitizeDate(date) {
  if (!date) return date;
  if (date instanceof Date) return date;
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? date : parsed;
}

/**
 * Middleware to sanitize request body
 */
function sanitizeBody(req, res, next) {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
}

/**
 * Middleware to sanitize query parameters
 */
function sanitizeQuery(req, res, next) {
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  next();
}

/**
 * Middleware to sanitize URL parameters
 */
function sanitizeParams(req, res, next) {
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
}

module.exports = {
  sanitizeString,
  sanitizeObject,
  sanitizeEmail,
  sanitizePhone,
  sanitizeNumber,
  sanitizeInteger,
  sanitizeDate,
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams
};

