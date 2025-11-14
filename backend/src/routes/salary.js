const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/structure/:employeeId', authenticate, authorize('view_salary'), salaryController.getSalaryStructure);
router.post('/structure', authenticate, authorize('manage_salary'), salaryController.createSalaryStructure);
router.put('/structure/:id', authenticate, authorize('manage_salary'), salaryController.updateSalaryStructure);
router.post('/it-declaration', authenticate, authorize('manage_salary'), salaryController.submitITDeclaration);
router.get('/it-declaration/:employeeId', authenticate, authorize('view_salary'), salaryController.getITDeclaration);

module.exports = router;

