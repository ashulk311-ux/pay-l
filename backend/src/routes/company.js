const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { authenticate, authorize } = require('../middleware/auth');

// Super Admin routes
router.get('/', authenticate, authorize('*'), companyController.getAllCompanies);
router.post('/', authenticate, authorize('*'), companyController.createCompany);

// Company Admin routes (for their own company)
router.get('/my-company', authenticate, authorize('view_company'), companyController.getMyCompany);
router.get('/:id', authenticate, authorize('view_company'), companyController.getCompany);
router.put('/:id', authenticate, authorize('manage_company'), companyController.updateCompany);
router.delete('/:id', authenticate, authorize('*'), companyController.deleteCompany);

// Configuration routes
router.put('/:id/smtp-config', authenticate, authorize('manage_company'), companyController.updateSMTPConfig);
router.put('/:id/whatsapp-config', authenticate, authorize('manage_company'), companyController.updateWhatsAppConfig);
router.put('/:id/employee-code-settings', authenticate, authorize('manage_company'), companyController.updateEmployeeCodeSettings);
router.put('/:id/bank-details', authenticate, authorize('manage_company'), companyController.updateBankDetails);

// Company Settings routes
router.get('/:id/settings', authenticate, authorize('view_company'), companyController.getCompanySettings);
router.put('/:id/settings', authenticate, authorize('manage_company'), companyController.updateCompanySettings);
router.put('/:id/settings/custom-messages', authenticate, authorize('manage_company'), companyController.updateCustomMessages);
router.put('/:id/settings/employee-parameters', authenticate, authorize('manage_company'), companyController.updateEmployeeParameters);
router.put('/:id/settings/mail-parameters', authenticate, authorize('manage_company'), companyController.updateMailParameters);
router.put('/:id/settings/attendance-parameters', authenticate, authorize('manage_company'), companyController.updateAttendanceParameters);
router.put('/:id/settings/salary-parameters', authenticate, authorize('manage_company'), companyController.updateSalaryParameters);
router.put('/:id/settings/other-settings', authenticate, authorize('manage_company'), companyController.updateOtherSettings);
router.put('/:id/settings/password-policy', authenticate, authorize('manage_company'), companyController.updatePasswordPolicy);

// My company settings (uses companyId from token)
router.get('/my-company/settings', authenticate, authorize('view_company'), companyController.getCompanySettings);
router.put('/my-company/settings', authenticate, authorize('manage_company'), companyController.updateCompanySettings);
router.put('/my-company/settings/custom-messages', authenticate, authorize('manage_company'), companyController.updateCustomMessages);
router.put('/my-company/settings/employee-parameters', authenticate, authorize('manage_company'), companyController.updateEmployeeParameters);
router.put('/my-company/settings/mail-parameters', authenticate, authorize('manage_company'), companyController.updateMailParameters);
router.put('/my-company/settings/attendance-parameters', authenticate, authorize('manage_company'), companyController.updateAttendanceParameters);
router.put('/my-company/settings/salary-parameters', authenticate, authorize('manage_company'), companyController.updateSalaryParameters);
router.put('/my-company/settings/other-settings', authenticate, authorize('manage_company'), companyController.updateOtherSettings);
router.put('/my-company/settings/password-policy', authenticate, authorize('manage_company'), companyController.updatePasswordPolicy);

module.exports = router;

