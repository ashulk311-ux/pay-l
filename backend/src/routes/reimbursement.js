const express = require('express');
const router = express.Router();
const reimbursementController = require('../controllers/reimbursementController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { reimbursementValidation } = require('../middleware/validation');

router.get('/', authenticate, authorize('view_reimbursement'), reimbursementController.getAllReimbursements);
router.get('/:id', authenticate, authorize('view_reimbursement'), reimbursementController.getReimbursement);
router.post('/', reimbursementValidation.create, authenticate, authorize('manage_reimbursement'), upload.array('documents'), reimbursementController.createReimbursement);
router.put('/:id', authenticate, authorize('manage_reimbursement'), reimbursementController.updateReimbursement);
router.put('/:id/approve', authenticate, authorize('manage_reimbursement'), reimbursementController.approveReimbursement);
router.put('/:id/reject', authenticate, authorize('manage_reimbursement'), reimbursementController.rejectReimbursement);
router.get('/employee/:employeeId', authenticate, authorize('view_reimbursement'), reimbursementController.getEmployeeReimbursements);

module.exports = router;

