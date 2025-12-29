const express = require('express');
const router = express.Router();
const fullAndFinalController = require('../controllers/fullAndFinalController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('view_supplementary'), fullAndFinalController.getAllSettlements);
router.get('/:id', authenticate, authorize('view_supplementary'), fullAndFinalController.getSettlement);
router.post('/', authenticate, authorize('manage_supplementary'), fullAndFinalController.createSettlement);
router.put('/:id', authenticate, authorize('manage_supplementary'), fullAndFinalController.updateSettlement);
router.put('/:id/approve', authenticate, authorize('manage_supplementary'), fullAndFinalController.approveSettlement);
router.put('/:id/mark-paid', authenticate, authorize('manage_supplementary'), fullAndFinalController.markAsPaid);

module.exports = router;



