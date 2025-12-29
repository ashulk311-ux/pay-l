const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('manage_departments'), departmentController.getAllDepartments);
router.get('/:id', authenticate, authorize('manage_departments'), departmentController.getDepartment);
router.post('/', authenticate, authorize('manage_departments'), departmentController.createDepartment);
router.put('/:id', authenticate, authorize('manage_departments'), departmentController.updateDepartment);
router.delete('/:id', authenticate, authorize('manage_departments'), departmentController.deleteDepartment);

module.exports = router;



