const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { authenticate, authorize } = require('../middleware/auth');
const { leaveValidation } = require('../middleware/validation');

// Get all leaves
router.get('/', authenticate, authorize('view_attendance'), leaveController.getAllLeaves);

// Get leave by ID
router.get('/:id', authenticate, authorize('view_attendance'), leaveController.getLeaveById);

// Create leave
router.post('/', leaveValidation.create, authenticate, authorize('manage_attendance'), leaveController.createLeave);

// Update leave
router.put('/:id', authenticate, authorize('manage_attendance'), leaveController.updateLeave);

// Delete leave
router.delete('/:id', authenticate, authorize('manage_attendance'), leaveController.deleteLeave);

// Approve leave
router.post('/:id/approve', authenticate, authorize('manage_attendance'), leaveController.approveLeave);

// Reject leave
router.post('/:id/reject', authenticate, authorize('manage_attendance'), leaveController.rejectLeave);

// Get leave balance for employee
router.get('/employee/:employeeId/balance', authenticate, authorize('view_attendance'), leaveController.getLeaveBalance);

module.exports = router;



