const express = require('express');
const router = express.Router();
const gdprController = require('../controllers/gdprController');
const { authenticate, authorize } = require('../middleware/auth');

// GDPR Compliance Routes
router.get('/export/:employeeId', authenticate, authorize('view_employee'), gdprController.exportPersonalData);
router.get('/can-delete/:employeeId', authenticate, authorize('manage_employee'), gdprController.canDeleteData);
router.post('/anonymize/:employeeId', authenticate, authorize('manage_employee'), gdprController.anonymizePersonalData);

module.exports = router;



