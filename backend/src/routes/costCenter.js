const express = require('express');
const router = express.Router();
const costCenterController = require('../controllers/costCenterController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('view_company'), costCenterController.getAllCostCenters);
router.get('/:id', authenticate, authorize('view_company'), costCenterController.getCostCenter);
router.post('/', authenticate, authorize('manage_company'), costCenterController.createCostCenter);
router.put('/:id', authenticate, authorize('manage_company'), costCenterController.updateCostCenter);
router.delete('/:id', authenticate, authorize('manage_company'), costCenterController.deleteCostCenter);

module.exports = router;


