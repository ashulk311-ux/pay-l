const express = require('express');
const router = express.Router();
const hrLetterController = require('../controllers/hrLetterController');
const { authenticate, authorize } = require('../middleware/auth');

// HR Letter Generation
router.post('/offer-letter', authenticate, authorize('manage_employee'), hrLetterController.generateOfferLetter);
router.post('/relieving-letter', authenticate, authorize('manage_employee'), hrLetterController.generateRelievingLetter);
router.post('/experience-certificate', authenticate, authorize('manage_employee'), hrLetterController.generateExperienceCertificate);
router.post('/salary-certificate', authenticate, authorize('manage_employee'), hrLetterController.generateSalaryCertificate);
router.get('/download/:filename', authenticate, authorize('view_employee'), hrLetterController.downloadLetter);

module.exports = router;



