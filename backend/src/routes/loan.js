const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');
const { authenticate, authorize } = require('../middleware/auth');
const { loanValidation } = require('../middleware/validation');

router.get('/', authenticate, authorize('view_loan'), loanController.getAllLoans);
router.get('/:id', authenticate, authorize('view_loan'), loanController.getLoan);
router.post('/', loanValidation.create, authenticate, authorize('manage_loan'), loanController.createLoan);
router.put('/:id', authenticate, authorize('manage_loan'), loanController.updateLoan);
router.put('/:id/approve', loanValidation.approve, authenticate, authorize('manage_loan'), loanController.approveLoan);
router.get('/employee/:employeeId', authenticate, authorize('view_loan'), loanController.getEmployeeLoans);

module.exports = router;

