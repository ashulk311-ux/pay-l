const express = require('express');
const router = express.Router();
const portalController = require('../controllers/portalController');
const { authenticate } = require('../middleware/auth');
const { portalValidation } = require('../middleware/validation');

// Employee Portal Routes (requires employee authentication)
router.get('/dashboard', authenticate, portalController.getDashboard);
router.get('/payslips', authenticate, portalController.getPayslips);
router.get('/payslip/:id', authenticate, portalController.getPayslip);
router.get('/attendance', authenticate, portalController.getAttendance);
router.get('/leave-balance', authenticate, portalController.getLeaveBalance);
router.post('/leave', portalValidation.applyLeave, authenticate, portalController.applyLeave);
router.get('/leave-history', authenticate, portalController.getLeaveHistory);
router.post('/it-declaration', authenticate, portalController.submitITDeclaration);
router.get('/it-declaration', authenticate, portalController.getITDeclaration);
router.get('/profile', authenticate, portalController.getProfile);
router.put('/profile', portalValidation.updateProfile, authenticate, portalController.updateProfile);
router.get('/helpdesk', authenticate, portalController.getQueries);
router.post('/helpdesk', portalValidation.raiseQuery, authenticate, portalController.raiseQuery);

module.exports = router;

