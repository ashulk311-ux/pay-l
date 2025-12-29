const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const { authenticate, authorize } = require('../middleware/auth');

// Backup Routes (Super Admin only)
router.post('/database', authenticate, authorize('*'), backupController.createDatabaseBackup);
router.post('/files', authenticate, authorize('*'), backupController.createFileBackup);
router.post('/full', authenticate, authorize('*'), backupController.createFullBackup);
router.get('/list', authenticate, authorize('*'), backupController.listBackups);
router.get('/download/:filename', authenticate, authorize('*'), backupController.downloadBackup);
router.post('/cleanup', authenticate, authorize('*'), backupController.cleanupOldBackups);
router.post('/restore', authenticate, authorize('*'), backupController.restoreDatabase);

module.exports = router;



