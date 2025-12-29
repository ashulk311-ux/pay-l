const express = require('express');
const router = express.Router();
const governmentApiController = require('../controllers/governmentApiController');
const { authenticate, authorize } = require('../middleware/auth');

// PF/ESI Government API Integration
router.post('/pf/submit-challan', authenticate, authorize('manage_payroll'), governmentApiController.submitPFChallan);
router.post('/esi/submit-challan', authenticate, authorize('manage_payroll'), governmentApiController.submitESIChallan);
router.post('/pf/verify-uan', authenticate, authorize('view_employee'), governmentApiController.verifyUAN);
router.post('/esi/verify-number', authenticate, authorize('view_employee'), governmentApiController.verifyESINumber);
router.get('/pf/contribution-history', authenticate, authorize('view_employee'), governmentApiController.getPFContributionHistory);
router.get('/esi/contribution-history', authenticate, authorize('view_employee'), governmentApiController.getESIContributionHistory);
router.get('/pf/challan/:challanNumber/download', authenticate, authorize('view_reports'), governmentApiController.downloadPFChallan);
router.get('/esi/challan/:challanNumber/download', authenticate, authorize('view_reports'), governmentApiController.downloadESIChallan);

module.exports = router;



