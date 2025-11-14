const express = require('express');
const router = express.Router();
const supplementaryController = require('../controllers/supplementaryController');
const { authenticate, authorize } = require('../middleware/auth');
const { supplementaryValidation } = require('../middleware/validation');

router.get('/', authenticate, authorize('view_supplementary'), supplementaryController.getAllSupplementary);
router.get('/:id', authenticate, authorize('view_supplementary'), supplementaryController.getSupplementary);
router.post('/', supplementaryValidation.create, authenticate, authorize('manage_supplementary'), supplementaryController.createSupplementary);
router.post('/bulk', authenticate, authorize('manage_supplementary'), supplementaryController.bulkCreate);
router.put('/:id', authenticate, authorize('manage_supplementary'), supplementaryController.updateSupplementary);
router.delete('/:id', authenticate, authorize('manage_supplementary'), supplementaryController.deleteSupplementary);

module.exports = router;

