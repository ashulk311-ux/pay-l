const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');
const { authenticate, authorize } = require('../middleware/auth');
const { loanValidation } = require('../middleware/validation');

router.get('/', authenticate, authorize('view_loan'), loanController.getAllLoans);
router.get('/outstanding', authenticate, authorize('view_loan'), loanController.getOutstandingLoans);
router.get('/:id', authenticate, authorize('view_loan'), loanController.getLoan);
router.post('/request', authenticate, authorize('manage_loan'), loanController.requestLoan);
router.post('/', loanValidation.create, authenticate, authorize('manage_loan'), loanController.requestLoan);
router.put('/:id', authenticate, authorize('manage_loan'), loanController.updateLoan);
router.put('/:id/approve', loanValidation.approve, authenticate, authorize('manage_loan'), loanController.approveLoan);
router.put('/:id/reject', authenticate, authorize('manage_loan'), loanController.rejectLoan);
router.put('/:id/configure-emi', authenticate, authorize('manage_loan'), loanController.configureEMI);
router.post('/emi/:emiId/payment', authenticate, authorize('manage_loan'), loanController.recordEMIPayment);
router.get('/employee/:employeeId', authenticate, authorize('view_loan'), loanController.getEmployeeLoans);

module.exports = router;

