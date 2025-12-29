const express = require('express');
const router = express.Router();
const dynamicFieldController = require('../controllers/dynamicFieldController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('manage_employee'), dynamicFieldController.getAllFields);
router.get('/:id', authenticate, authorize('manage_employee'), dynamicFieldController.getField);
router.post('/', authenticate, authorize('manage_employee'), dynamicFieldController.createField);
router.put('/:id', authenticate, authorize('manage_employee'), dynamicFieldController.updateField);
router.delete('/:id', authenticate, authorize('manage_employee'), dynamicFieldController.deleteField);

module.exports = router;



