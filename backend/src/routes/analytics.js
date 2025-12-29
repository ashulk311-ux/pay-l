const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

// Payroll Analytics
router.get('/payroll', authenticate, authorize('view_reports'), analyticsController.getPayrollAnalytics);
router.get('/attendance', authenticate, authorize('view_attendance'), analyticsController.getAttendanceAnalytics);

module.exports = router;



