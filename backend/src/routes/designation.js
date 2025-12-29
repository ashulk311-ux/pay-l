const express = require('express');
const router = express.Router();
const designationController = require('../controllers/designationController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('manage_designations'), designationController.getAllDesignations);
router.get('/:id', authenticate, authorize('manage_designations'), designationController.getDesignation);
router.post('/', authenticate, authorize('manage_designations'), designationController.createDesignation);
router.put('/:id', authenticate, authorize('manage_designations'), designationController.updateDesignation);
router.delete('/:id', authenticate, authorize('manage_designations'), designationController.deleteDesignation);

module.exports = router;



