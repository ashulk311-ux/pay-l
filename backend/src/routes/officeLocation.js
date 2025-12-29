const express = require('express');
const router = express.Router();
const officeLocationController = require('../controllers/officeLocationController');
const { authenticate, authorize } = require('../middleware/auth');

// Office Location Management
router.get('/', authenticate, authorize('view_attendance'), officeLocationController.getAllLocations);
router.get('/:id', authenticate, authorize('view_attendance'), officeLocationController.getLocation);
router.post('/', authenticate, authorize('manage_attendance'), officeLocationController.createLocation);
router.put('/:id', authenticate, authorize('manage_attendance'), officeLocationController.updateLocation);
router.delete('/:id', authenticate, authorize('manage_attendance'), officeLocationController.deleteLocation);

module.exports = router;



