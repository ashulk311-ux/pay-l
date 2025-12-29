const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboardingController');
const { authenticate, authorize } = require('../middleware/auth');

// Public route for onboarding form (no auth required)
router.get('/form/:token', onboardingController.getOnboardingForm);
router.post('/submit/:token', onboardingController.submitOnboardingStep);

// Admin routes
router.post('/invite/:employeeId', authenticate, authorize('manage_employee'), onboardingController.sendOnboardingInvite);
router.get('/status/:employeeId', authenticate, authorize('view_employee'), onboardingController.getOnboardingStatus);

module.exports = router;



