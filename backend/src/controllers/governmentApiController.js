const governmentApiService = require('../services/governmentApiService');
const reportService = require('../services/reportService');
const { Payslip, Payroll, Employee } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Submit PF challan to government portal
 */
exports.submitPFChallan = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }

    // Get PF report data
    const pfReport = await reportService.generatePFReport(req.user.companyId, parseInt(month), parseInt(year));

    if (!pfReport.data || pfReport.data.length === 0) {
      return res.status(400).json({ success: false, message: 'No PF data found for the specified period' });
    }

    // Submit to government portal
    const result = await governmentApiService.submitPFChallan(
      req.user.companyId,
      parseInt(month),
      parseInt(year),
      pfReport.data
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'PF challan submitted successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to submit PF challan',
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Submit PF challan error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit PF challan', error: error.message });
  }
};

/**
 * Submit ESI challan to government portal
 */
exports.submitESIChallan = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }

    // Get ESI report data
    const esiReport = await reportService.generateESIReport(req.user.companyId, parseInt(month), parseInt(year));

    if (!esiReport.data || esiReport.data.length === 0) {
      return res.status(400).json({ success: false, message: 'No ESI data found for the specified period' });
    }

    // Submit to government portal
    const result = await governmentApiService.submitESIChallan(
      req.user.companyId,
      parseInt(month),
      parseInt(year),
      esiReport.data
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'ESI challan submitted successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to submit ESI challan',
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Submit ESI challan error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit ESI challan', error: error.message });
  }
};

/**
 * Verify UAN
 */
exports.verifyUAN = async (req, res) => {
  try {
    const { uan } = req.body;

    if (!uan) {
      return res.status(400).json({ success: false, message: 'UAN is required' });
    }

    const result = await governmentApiService.verifyUAN(uan);

    res.json({
      success: result.success,
      message: result.success ? 'UAN verified successfully' : 'UAN verification failed',
      data: result
    });
  } catch (error) {
    logger.error('Verify UAN error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify UAN', error: error.message });
  }
};

/**
 * Verify ESI number
 */
exports.verifyESINumber = async (req, res) => {
  try {
    const { esiNumber } = req.body;

    if (!esiNumber) {
      return res.status(400).json({ success: false, message: 'ESI number is required' });
    }

    const result = await governmentApiService.verifyESINumber(esiNumber);

    res.json({
      success: result.success,
      message: result.success ? 'ESI number verified successfully' : 'ESI number verification failed',
      data: result
    });
  } catch (error) {
    logger.error('Verify ESI number error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify ESI number', error: error.message });
  }
};

/**
 * Get PF contribution history
 */
exports.getPFContributionHistory = async (req, res) => {
  try {
    const { uan, fromDate, toDate } = req.query;

    if (!uan) {
      return res.status(400).json({ success: false, message: 'UAN is required' });
    }

    const result = await governmentApiService.getPFContributionHistory(uan, fromDate, toDate);

    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    logger.error('Get PF contribution history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch PF contribution history', error: error.message });
  }
};

/**
 * Get ESI contribution history
 */
exports.getESIContributionHistory = async (req, res) => {
  try {
    const { esiNumber, fromDate, toDate } = req.query;

    if (!esiNumber) {
      return res.status(400).json({ success: false, message: 'ESI number is required' });
    }

    const result = await governmentApiService.getESIContributionHistory(esiNumber, fromDate, toDate);

    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    logger.error('Get ESI contribution history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch ESI contribution history', error: error.message });
  }
};

/**
 * Download PF challan
 */
exports.downloadPFChallan = async (req, res) => {
  try {
    const { challanNumber } = req.params;

    if (!challanNumber) {
      return res.status(400).json({ success: false, message: 'Challan number is required' });
    }

    const result = await governmentApiService.downloadPFChallan(challanNumber);

    if (result.success) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.pdf);
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to download PF challan',
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Download PF challan error:', error);
    res.status(500).json({ success: false, message: 'Failed to download PF challan', error: error.message });
  }
};

/**
 * Download ESI challan
 */
exports.downloadESIChallan = async (req, res) => {
  try {
    const { challanNumber } = req.params;

    if (!challanNumber) {
      return res.status(400).json({ success: false, message: 'Challan number is required' });
    }

    const result = await governmentApiService.downloadESIChallan(challanNumber);

    if (result.success) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.pdf);
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to download ESI challan',
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Download ESI challan error:', error);
    res.status(500).json({ success: false, message: 'Failed to download ESI challan', error: error.message });
  }
};



