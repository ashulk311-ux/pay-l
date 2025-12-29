const express = require('express');
const router = express.Router();
const leaveMasterController = require('../controllers/leaveMasterController');
const { authenticate, authorize } = require('../middleware/auth');

// Leave Types
router.get('/types', authenticate, authorize('view_attendance'), leaveMasterController.getAllLeaveTypes);
router.post('/types', authenticate, authorize('manage_attendance'), leaveMasterController.createLeaveType);
router.put('/types/:id', authenticate, authorize('manage_attendance'), leaveMasterController.updateLeaveType);

// Leave Balance
router.get('/balance', authenticate, authorize('view_attendance'), leaveMasterController.getLeaveBalance);
router.post('/balance', authenticate, authorize('manage_attendance'), leaveMasterController.updateLeaveBalance);

// Holiday Calendar
router.get('/holidays', authenticate, authorize('view_attendance'), leaveMasterController.getAllHolidays);
router.post('/holidays', authenticate, authorize('manage_attendance'), leaveMasterController.createHoliday);
router.put('/holidays/:id', authenticate, authorize('manage_attendance'), leaveMasterController.updateHoliday);
router.delete('/holidays/:id', authenticate, authorize('manage_attendance'), leaveMasterController.deleteHoliday);

// Leave Encashment
router.get('/encashment', authenticate, authorize('view_attendance'), leaveMasterController.getEncashmentRules);
router.post('/encashment', authenticate, authorize('manage_attendance'), leaveMasterController.createEncashmentRule);
router.put('/encashment/:id', authenticate, authorize('manage_attendance'), leaveMasterController.updateEncashmentRule);

module.exports = router;



