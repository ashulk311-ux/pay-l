const express = require('express');
const router = express.Router();
const matrixService = require('../services/matrixService');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/sync-to/:employeeId', authenticate, authorize('manage_employee'), async (req, res) => {
  try {
    const result = await matrixService.syncEmployeeToMatrix(req.params.employeeId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/sync-from/:matrixEmployeeId', authenticate, authorize('manage_employee'), async (req, res) => {
  try {
    const result = await matrixService.syncEmployeeFromMatrix(req.params.matrixEmployeeId, req.user.companyId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/remove/:employeeId', authenticate, authorize('manage_employee'), async (req, res) => {
  try {
    const result = await matrixService.removeEmployeeFromMatrix(req.params.employeeId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;



