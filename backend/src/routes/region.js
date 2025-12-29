const express = require('express');
const router = express.Router();
const regionController = require('../controllers/regionController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('manage_regions'), regionController.getAllRegions);
router.get('/:id', authenticate, authorize('manage_regions'), regionController.getRegion);
router.post('/', authenticate, authorize('manage_regions'), regionController.createRegion);
router.put('/:id', authenticate, authorize('manage_regions'), regionController.updateRegion);
router.delete('/:id', authenticate, authorize('manage_regions'), regionController.deleteRegion);

module.exports = router;



