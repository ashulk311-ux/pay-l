const express = require('express');
const router = express.Router();
const incrementController = require('../controllers/incrementController');
const { authenticate, authorize } = require('../middleware/auth');
const { incrementValidation } = require('../middleware/validation');

router.get('/', authenticate, authorize('view_increment'), incrementController.getAllIncrements);
router.get('/:id', authenticate, authorize('view_increment'), incrementController.getIncrement);
router.post('/', incrementValidation.create, authenticate, authorize('manage_increment'), incrementController.createIncrement);
router.post('/bulk', authenticate, authorize('manage_increment'), incrementController.bulkCreate);
router.put('/:id', authenticate, authorize('manage_increment'), incrementController.updateIncrement);
router.put('/:id/approve', authenticate, authorize('manage_increment'), incrementController.approveIncrement);

module.exports = router;

