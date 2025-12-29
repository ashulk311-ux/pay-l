const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/employee/:employeeId', authenticate, authorize('view_employee'), documentController.getEmployeeDocuments);
router.post('/upload/:employeeId', authenticate, authorize('manage_employee'), documentController.uploadMiddleware.single('file'), documentController.uploadDocument);
router.get('/download/:documentId', authenticate, authorize('view_employee'), documentController.downloadDocument);
router.post('/verify/:documentId', authenticate, authorize('manage_employee'), documentController.verifyDocument);
router.delete('/:documentId', authenticate, authorize('manage_employee'), documentController.deleteDocument);

module.exports = router;



