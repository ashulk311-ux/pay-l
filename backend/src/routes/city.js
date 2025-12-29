const express = require('express');
const router = express.Router();
const cityController = require('../controllers/cityController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('view_company'), cityController.getAllCities);
router.get('/:id', authenticate, authorize('view_company'), cityController.getCity);
router.post('/', authenticate, authorize('manage_company'), cityController.createCity);
router.put('/:id', authenticate, authorize('manage_company'), cityController.updateCity);
router.delete('/:id', authenticate, authorize('manage_company'), cityController.deleteCity);

module.exports = router;


