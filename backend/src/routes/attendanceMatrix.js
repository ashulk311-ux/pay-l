const express = require('express');
const router = express.Router();
const attendanceMatrixService = require('../services/attendanceMatrixService');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/sync-attendance', authenticate, authorize('manage_attendance'), async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const result = await attendanceMatrixService.syncAttendanceFromMatrix(req.user.companyId, startDate, endDate);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/sync-leave-types', authenticate, authorize('manage_attendance'), async (req, res) => {
  try {
    const result = await attendanceMatrixService.syncLeaveTypesFromMatrix(req.user.companyId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/sync-leave-balances', authenticate, authorize('manage_attendance'), async (req, res) => {
  try {
    const { employeeId } = req.body;
    const result = await attendanceMatrixService.syncLeaveBalancesFromMatrix(req.user.companyId, employeeId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/sync-holidays', authenticate, authorize('manage_attendance'), async (req, res) => {
  try {
    const { year } = req.body;
    const result = await attendanceMatrixService.syncHolidayCalendarFromMatrix(req.user.companyId, year);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;



