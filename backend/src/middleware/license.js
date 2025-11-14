const { License, Company } = require('../models');
const logger = require('../utils/logger');

// Check license validity for a module
const checkLicense = (moduleName) => {
  return async (req, res, next) => {
    try {
      const companyId = req.params.companyId || req.body.companyId || req.query.companyId;
      
      if (!companyId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Company ID is required' 
        });
      }

      const company = await Company.findByPk(companyId);
      if (!company) {
        return res.status(404).json({ 
          success: false, 
          message: 'Company not found' 
        });
      }

      // Check if license exists and is valid for this module
      const license = await License.findOne({
        where: {
          companyId,
          moduleName,
          isActive: true,
          expiryDate: { [require('sequelize').Op.gte]: new Date() }
        }
      });

      if (!license) {
        return res.status(403).json({ 
          success: false, 
          message: `Valid license required for ${moduleName} module` 
        });
      }

      // Check user count against license limit
      const { Employee } = require('../models');
      const activeUserCount = await Employee.count({
        where: { companyId, isActive: true }
      });

      const maxUsers = license.userBlocks * 50; // 50 users per block
      
      if (activeUserCount >= maxUsers) {
        return res.status(403).json({ 
          success: false, 
          message: `User limit reached. Current: ${activeUserCount}, Maximum: ${maxUsers}` 
        });
      }

      req.license = license;
      next();
    } catch (error) {
      logger.error('License check error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'License validation failed' 
      });
    }
  };
};

module.exports = { checkLicense };

