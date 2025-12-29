/**
 * Pagination utility functions
 */

/**
 * Get pagination parameters from request query
 * @param {Object} req - Express request object
 * @param {Object} options - Options object
 * @param {number} options.defaultLimit - Default limit (default: 50)
 * @param {number} options.maxLimit - Maximum allowed limit (default: 100)
 * @param {number} options.minLimit - Minimum allowed limit (default: 1)
 * @returns {Object} Pagination parameters { page, limit, offset }
 */
exports.getPaginationParams = (req, options = {}) => {
  const {
    defaultLimit = 50,
    maxLimit = 100,
    minLimit = 1
  } = options;

  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || defaultLimit;

  // Validate and constrain page
  if (page < 1) page = 1;
  if (isNaN(page)) page = 1;

  // Validate and constrain limit
  if (limit < minLimit) limit = minLimit;
  if (limit > maxLimit) limit = maxLimit;
  if (isNaN(limit)) limit = defaultLimit;

  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * Format pagination response
 * @param {number} total - Total number of records
 * @param {number} page - Current page
 * @param {number} limit - Records per page
 * @returns {Object} Pagination metadata
 */
exports.formatPaginationResponse = (total, page, limit) => {
  return {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPreviousPage: page > 1
  };
};

/**
 * Create paginated response
 * @param {Array} data - Array of records
 * @param {number} total - Total number of records
 * @param {number} page - Current page
 * @param {number} limit - Records per page
 * @returns {Object} Paginated response object
 */
exports.createPaginatedResponse = (data, total, page, limit) => {
  return {
    success: true,
    data,
    pagination: exports.formatPaginationResponse(total, page, limit)
  };
};


