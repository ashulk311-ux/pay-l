const gdprService = require('../services/gdprService');
const logger = require('../utils/logger');

/**
 * Export personal data (Right to Access & Data Portability)
 */
exports.exportPersonalData = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const format = req.query.format || 'json'; // json or file

    if (format === 'file') {
      const { filepath, filename } = await gdprService.exportPersonalDataAsFile(employeeId, req.user.id);
      
      res.download(filepath, filename, (err) => {
        if (err) {
          logger.error('Download error:', err);
          res.status(500).json({ success: false, message: 'Failed to download file' });
        }
      });
    } else {
      const data = await gdprService.exportPersonalData(employeeId, req.user.id);
      res.json({
        success: true,
        data,
        message: 'Personal data exported successfully'
      });
    }
  } catch (error) {
    logger.error('Export personal data error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to export personal data' });
  }
};

/**
 * Check if data can be deleted
 */
exports.canDeleteData = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const result = await gdprService.canDeleteData(employeeId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Can delete data check error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to check deletion eligibility' });
  }
};

/**
 * Anonymize/Delete personal data (Right to be Forgotten)
 */
exports.anonymizePersonalData = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { reason } = req.body;

    // First check if data can be deleted
    const canDelete = await gdprService.canDeleteData(employeeId);
    if (!canDelete.canDelete) {
      return res.status(400).json({
        success: false,
        message: canDelete.reason
      });
    }

    const result = await gdprService.anonymizePersonalData(employeeId, req.user.id, reason);
    
    res.json({
      success: true,
      message: 'Personal data anonymized successfully',
      data: result
    });
  } catch (error) {
    logger.error('Anonymize personal data error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to anonymize personal data' });
  }
};



