const express = require('express');
const router = express.Router();
const itDeclarationController = require('../controllers/itDeclarationController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/sections', authenticate, authorize('view_salary'), itDeclarationController.getSections);
router.get('/', authenticate, authorize('view_salary'), itDeclarationController.getITDeclaration);
router.post('/', authenticate, authorize('manage_salary'), itDeclarationController.submitITDeclaration);
router.post('/upload/:declarationId', authenticate, authorize('manage_salary'), itDeclarationController.uploadMiddleware.single('file'), itDeclarationController.uploadDocument);
router.post('/review/:id', authenticate, authorize('manage_salary'), itDeclarationController.reviewITDeclaration);
router.get('/all', authenticate, authorize('view_salary'), itDeclarationController.getAllITDeclarations);

module.exports = router;



