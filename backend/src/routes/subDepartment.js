const express = require('express');
const router = express.Router();
const subDepartmentController = require('../controllers/subDepartmentController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('view_company'), subDepartmentController.getAllSubDepartments);
router.get('/:id', authenticate, authorize('view_company'), subDepartmentController.getSubDepartment);
router.post('/', authenticate, authorize('manage_company'), subDepartmentController.createSubDepartment);
router.put('/:id', authenticate, authorize('manage_company'), subDepartmentController.updateSubDepartment);
router.delete('/:id', authenticate, authorize('manage_company'), subDepartmentController.deleteSubDepartment);

module.exports = router;


