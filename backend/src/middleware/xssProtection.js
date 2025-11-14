/**
 * XSS Protection Middleware
 * Additional layer of protection against XSS attacks
 */

/**
 * Sanitize string to prevent XSS
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Deep sanitize object to prevent XSS
 */
function sanitizeForXSS(obj) {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return escapeHtml(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForXSS(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Skip sanitization for known safe fields (like IDs, dates, numbers)
        if (key.includes('Id') || key.includes('id') || key.includes('Date') || key.includes('date') || 
            key === 'amount' || key === 'salary' || key === 'percentage' || key === 'rate') {
          sanitized[key] = obj[key];
        } else {
          sanitized[key] = sanitizeForXSS(obj[key]);
        }
      }
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Middleware to sanitize response data for XSS protection
 * Note: This is a basic implementation. For production, consider using DOMPurify or similar
 */
const xssProtection = (req, res, next) => {
  // Store original json method
  const originalJson = res.json.bind(res);
  
  // Override json method to sanitize output
  res.json = function(data) {
    // Only sanitize in development or if explicitly enabled
    // In production, rely on proper input sanitization and Content-Security-Policy
    if (process.env.ENABLE_XSS_SANITIZATION === 'true') {
      data = sanitizeForXSS(data);
    }
    return originalJson(data);
  };
  
  next();
};

module.exports = {
  xssProtection,
  escapeHtml,
  sanitizeForXSS
};

