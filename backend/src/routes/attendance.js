const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const attendanceImportController = require('../controllers/attendanceImportController');
const { authenticate, authorize } = require('../middleware/auth');
const { protectAuditorWrite } = require('../middleware/auditorProtection');
const upload = require('../middleware/upload');
const { attendanceValidation, leaveValidation } = require('../middleware/validation');

// Attendance routes
router.get('/', authenticate, authorize('view_attendance'), attendanceController.getAttendance);
router.post('/', attendanceValidation.create, authenticate, authorize('manage_attendance'), protectAuditorWrite, attendanceController.createAttendance);
router.post('/bulk-upload', authenticate, authorize('manage_attendance'), protectAuditorWrite, upload.single('file'), attendanceController.bulkUpload);
router.post('/upload-daily', authenticate, authorize('manage_attendance'), protectAuditorWrite, upload.single('file'), attendanceImportController.uploadDailyAttendance);
router.post('/upload-monthly', authenticate, authorize('manage_attendance'), protectAuditorWrite, upload.single('file'), attendanceImportController.uploadMonthlyAttendance);
router.get('/employee/:id', authenticate, authorize('view_attendance'), attendanceController.getEmployeeAttendance);
router.put('/:id', authenticate, authorize('manage_attendance'), protectAuditorWrite, attendanceImportController.updateAttendance);

// Leave routes
router.get('/leave-balance/:id', authenticate, authorize('view_attendance'), attendanceController.getLeaveBalance);
router.post('/leave', leaveValidation.create, authenticate, authorize('manage_attendance'), protectAuditorWrite, attendanceController.applyLeave);
router.put('/leave/:id', authenticate, authorize('manage_attendance'), protectAuditorWrite, attendanceController.updateLeaveStatus);

module.exports = router;

