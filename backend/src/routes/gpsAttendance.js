const express = require('express');
const router = express.Router();
const gpsAttendanceController = require('../controllers/gpsAttendanceController');
const { authenticate } = require('../middleware/auth');

// GPS Attendance routes for Mobile App
// These routes use JWT authentication from mobile app
router.post('/check-in', authenticate, gpsAttendanceController.checkIn);
router.post('/check-out', authenticate, gpsAttendanceController.checkOut);
router.get('/today', authenticate, gpsAttendanceController.getTodayAttendance);
router.post('/verify-location', authenticate, gpsAttendanceController.verifyLocation);
router.get('/office-locations', authenticate, gpsAttendanceController.getOfficeLocations);

module.exports = router;



