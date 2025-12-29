const express = require('express');
const router = express.Router();
const countryController = require('../controllers/countryController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('view_company'), countryController.getAllCountries);
router.get('/:id', authenticate, authorize('view_company'), countryController.getCountry);
router.post('/', authenticate, authorize('manage_company'), countryController.createCountry);
router.put('/:id', authenticate, authorize('manage_company'), countryController.updateCountry);
router.delete('/:id', authenticate, authorize('manage_company'), countryController.deleteCountry);

module.exports = router;


