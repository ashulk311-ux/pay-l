const hrLetterService = require('../services/hrLetterService');
const { Employee } = require('../models');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

/**
 * Generate Offer Letter
 */
exports.generateOfferLetter = async (req, res) => {
  try {
    const { employeeId, offerDetails } = req.body;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee ID is required' });
    }

    const result = await hrLetterService.generateOfferLetter(employeeId, offerDetails || {});

    res.json({
      success: true,
      message: 'Offer letter generated successfully',
      data: result
    });
  } catch (error) {
    logger.error('Generate offer letter error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate offer letter', error: error.message });
  }
};

/**
 * Generate Relieving Letter
 */
exports.generateRelievingLetter = async (req, res) => {
  try {
    const { employeeId, relievingDetails } = req.body;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee ID is required' });
    }

    const result = await hrLetterService.generateRelievingLetter(employeeId, relievingDetails || {});

    res.json({
      success: true,
      message: 'Relieving letter generated successfully',
      data: result
    });
  } catch (error) {
    logger.error('Generate relieving letter error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate relieving letter', error: error.message });
  }
};

/**
 * Generate Experience Certificate
 */
exports.generateExperienceCertificate = async (req, res) => {
  try {
    const { employeeId, experienceDetails } = req.body;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee ID is required' });
    }

    const result = await hrLetterService.generateExperienceCertificate(employeeId, experienceDetails || {});

    res.json({
      success: true,
      message: 'Experience certificate generated successfully',
      data: result
    });
  } catch (error) {
    logger.error('Generate experience certificate error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate experience certificate', error: error.message });
  }
};

/**
 * Generate Salary Certificate
 */
exports.generateSalaryCertificate = async (req, res) => {
  try {
    const { employeeId, salaryDetails } = req.body;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee ID is required' });
    }

    const result = await hrLetterService.generateSalaryCertificate(employeeId, salaryDetails || {});

    res.json({
      success: true,
      message: 'Salary certificate generated successfully',
      data: result
    });
  } catch (error) {
    logger.error('Generate salary certificate error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate salary certificate', error: error.message });
  }
};

/**
 * Download HR Letter
 */
exports.downloadLetter = async (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(__dirname, '../../uploads/hr-letters', filename);

    // Security check
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    res.download(filepath, filename, (err) => {
      if (err) {
        logger.error('Download letter error:', err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Error downloading file' });
        }
      }
    });
  } catch (error) {
    logger.error('Download letter error:', error);
    res.status(500).json({ success: false, message: 'Failed to download letter', error: error.message });
  }
};



