const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('view_company'), companyController.getAllCompanies);
router.get('/:id', authenticate, authorize('view_company'), companyController.getCompany);
router.post('/', authenticate, authorize('manage_company'), companyController.createCompany);
router.put('/:id', authenticate, authorize('manage_company'), companyController.updateCompany);
router.delete('/:id', authenticate, authorize('manage_company'), companyController.deleteCompany);
router.post('/:id/branches', authenticate, authorize('manage_company'), companyController.addBranch);
router.post('/:id/departments', authenticate, authorize('manage_company'), companyController.addDepartment);
router.post('/:id/designations', authenticate, authorize('manage_company'), companyController.addDesignation);

module.exports = router;

