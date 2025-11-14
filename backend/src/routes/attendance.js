const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { attendanceValidation, leaveValidation } = require('../middleware/validation');

// Attendance routes
router.get('/', authenticate, authorize('view_attendance'), attendanceController.getAttendance);
router.post('/', attendanceValidation.create, authenticate, authorize('manage_attendance'), attendanceController.createAttendance);
router.post('/bulk-upload', authenticate, authorize('manage_attendance'), upload.single('file'), attendanceController.bulkUpload);
router.get('/employee/:id', authenticate, authorize('view_attendance'), attendanceController.getEmployeeAttendance);
router.put('/:id', authenticate, authorize('manage_attendance'), attendanceController.updateAttendance);

// Leave routes
router.get('/leave-balance/:id', authenticate, authorize('view_attendance'), attendanceController.getLeaveBalance);
router.post('/leave', leaveValidation.create, authenticate, authorize('manage_attendance'), attendanceController.applyLeave);
router.put('/leave/:id', authenticate, authorize('manage_attendance'), attendanceController.updateLeaveStatus);

module.exports = router;

