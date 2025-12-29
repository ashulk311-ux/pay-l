const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticate, authorize } = require('../middleware/auth');
const { protectAuditorWrite } = require('../middleware/auditorProtection');
const upload = require('../middleware/upload');
const { employeeValidation } = require('../middleware/validation');

router.get('/', authenticate, authorize('view_employee'), employeeController.getAllEmployees);
router.get('/:id', employeeValidation.getById, authenticate, authorize('view_employee'), employeeController.getEmployee);
router.post('/', employeeValidation.create, authenticate, authorize('manage_employee'), protectAuditorWrite, upload.array('documents'), employeeController.createEmployee);
router.put('/:id', employeeValidation.update, authenticate, authorize('manage_employee'), protectAuditorWrite, upload.array('documents'), employeeController.updateEmployee);
router.delete('/:id', employeeValidation.getById, authenticate, authorize('manage_employee'), protectAuditorWrite, employeeController.deleteEmployee);
router.post('/bulk-import', authenticate, authorize('manage_employee'), protectAuditorWrite, upload.single('file'), employeeController.bulkImport);
router.get('/:id/documents', authenticate, authorize('view_employee'), employeeController.getDocuments);
router.post('/:id/upload-document', authenticate, authorize('manage_employee'), protectAuditorWrite, upload.single('file'), employeeController.uploadDocument);
router.post('/:id/kyc-verify', authenticate, authorize('manage_employee'), protectAuditorWrite, employeeController.verifyKYC);
router.get('/:id/onboarding-status', authenticate, authorize('view_employee'), employeeController.getOnboardingStatus);

module.exports = router;

