const express = require('express');
const router = express.Router();
const incrementController = require('../controllers/incrementController');
const { authenticate, authorize } = require('../middleware/auth');
const { incrementValidation } = require('../middleware/validation');

router.get('/', authenticate, authorize('view_increment'), incrementController.getAllIncrements);
router.get('/:id', authenticate, authorize('view_increment'), incrementController.getIncrement);
router.get('/:id/audit', authenticate, authorize('view_increment'), incrementController.getIncrementAudit);
router.post('/', incrementValidation.create, authenticate, authorize('manage_increment'), incrementController.createIncrement);
router.post('/bulk', authenticate, authorize('manage_increment'), incrementController.bulkCreate);
router.post('/bulk-grade', authenticate, authorize('manage_increment'), incrementController.createBulkIncrementByGrade);
router.put('/:id', authenticate, authorize('manage_increment'), incrementController.updateIncrement);
router.put('/:id/approve', authenticate, authorize('manage_increment'), incrementController.approveIncrement);
router.put('/:id/reject', authenticate, authorize('manage_increment'), incrementController.rejectIncrement);
router.put('/:id/apply', authenticate, authorize('manage_increment'), incrementController.applyIncrement);

module.exports = router;

