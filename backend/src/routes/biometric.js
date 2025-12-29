const express = require('express');
const router = express.Router();
const biometricController = require('../controllers/biometricController');
const { authenticate, authorize } = require('../middleware/auth');

// Public endpoints for devices (no authentication required, uses API key)
router.post('/device/heartbeat', biometricController.deviceHeartbeat);
router.post('/device/push-attendance', biometricController.pushAttendance);

// Admin endpoints (require authentication)
router.get('/', authenticate, authorize('view_attendance'), biometricController.getAllDevices);
router.get('/:id', authenticate, authorize('view_attendance'), biometricController.getDevice);
router.post('/', authenticate, authorize('manage_attendance'), biometricController.registerDevice);
router.put('/:id', authenticate, authorize('manage_attendance'), biometricController.updateDevice);
router.delete('/:id', authenticate, authorize('manage_attendance'), biometricController.deleteDevice);
router.post('/:id/regenerate-credentials', authenticate, authorize('manage_attendance'), biometricController.regenerateCredentials);
router.post('/:id/trigger-sync', authenticate, authorize('manage_attendance'), biometricController.triggerSync);
router.get('/:id/logs', authenticate, authorize('view_attendance'), biometricController.getDeviceLogs);

// Employee mapping endpoints
router.post('/employee/map', authenticate, authorize('manage_attendance'), biometricController.mapEmployee);
router.get('/device/:deviceId/mappings', authenticate, authorize('view_attendance'), biometricController.getEmployeeMappings);
router.delete('/employee-mapping/:id', authenticate, authorize('manage_attendance'), biometricController.removeEmployeeMapping);

module.exports = router;



