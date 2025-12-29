const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unitController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('view_company'), unitController.getAllUnits);
router.get('/:id', authenticate, authorize('view_company'), unitController.getUnit);
router.post('/', authenticate, authorize('manage_company'), unitController.createUnit);
router.put('/:id', authenticate, authorize('manage_company'), unitController.updateUnit);
router.delete('/:id', authenticate, authorize('manage_company'), unitController.deleteUnit);

module.exports = router;


