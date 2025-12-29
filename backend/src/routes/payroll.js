const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { authenticate, authorize } = require('../middleware/auth');
const { checkWriteAccess } = require('../middleware/roleBasedAccess');
const { payrollValidation } = require('../middleware/validation');

router.get('/', authenticate, authorize('view_payroll'), payrollController.getAllPayrolls);
router.get('/:id', authenticate, authorize('view_payroll'), payrollController.getPayroll);
router.post('/', payrollValidation.create, authenticate, authorize('manage_payroll'), checkWriteAccess, payrollController.createPayroll);
router.get('/:id/pre-checks', authenticate, authorize('view_payroll'), payrollController.getPreChecks);
router.post('/:id/pre-checks', authenticate, authorize('manage_payroll'), checkWriteAccess, payrollController.runPreChecks);
router.put('/:id/pre-checks/:checkId/resolve', authenticate, authorize('manage_payroll'), checkWriteAccess, payrollController.resolvePreCheck);
router.post('/:id/lock-attendance', authenticate, authorize('manage_payroll'), checkWriteAccess, payrollController.lockAttendance);
router.post('/:id/apply-earnings-deductions', authenticate, authorize('manage_payroll'), checkWriteAccess, payrollController.applyEarningsDeductions);
router.post('/:id/bulk-import', authenticate, authorize('manage_payroll'), checkWriteAccess, require('../middleware/upload').single('file'), payrollController.bulkImportSalary);
router.post('/:id/process', payrollValidation.process, authenticate, authorize('process_salary'), checkWriteAccess, payrollController.processPayroll);
router.post('/:id/finalize', authenticate, authorize('process_salary'), checkWriteAccess, payrollController.finalizePayroll);
router.post('/:id/generate-payslips', authenticate, authorize('process_salary'), checkWriteAccess, payrollController.generatePayslips);
router.post('/:id/distribute', authenticate, authorize('process_salary'), checkWriteAccess, payrollController.distributePayslips);
router.get('/:id/payslips', authenticate, authorize('view_payroll'), payrollController.getPayslips);
router.get('/payslip/:id/pdf', authenticate, authorize('view_payroll'), payrollController.getPayslipPDF);

module.exports = router;

