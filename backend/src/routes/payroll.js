const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { authenticate, authorize } = require('../middleware/auth');
const { payrollValidation } = require('../middleware/validation');

router.get('/', authenticate, authorize('view_payroll'), payrollController.getAllPayrolls);
router.get('/:id', authenticate, authorize('view_payroll'), payrollController.getPayroll);
router.post('/', payrollValidation.create, authenticate, authorize('manage_payroll'), payrollController.createPayroll);
router.post('/:id/process', payrollValidation.process, authenticate, authorize('manage_payroll'), payrollController.processPayroll);
router.post('/:id/lock-attendance', authenticate, authorize('manage_payroll'), payrollController.lockAttendance);
router.post('/:id/finalize', authenticate, authorize('manage_payroll'), payrollController.finalizePayroll);
router.post('/:id/generate-payslips', authenticate, authorize('manage_payroll'), payrollController.generatePayslips);
router.post('/:id/distribute', authenticate, authorize('manage_payroll'), payrollController.distributePayslips);
router.get('/:id/payslips', authenticate, authorize('view_payroll'), payrollController.getPayslips);
router.get('/payslip/:id/pdf', authenticate, authorize('view_payroll'), payrollController.getPayslipPDF);

module.exports = router;

