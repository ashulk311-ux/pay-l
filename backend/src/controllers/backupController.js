const backupService = require('../services/backupService');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');

/**
 * Create database backup
 */
exports.createDatabaseBackup = async (req, res) => {
  try {
    const result = await backupService.createDatabaseBackup();
    
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'backup',
      action: 'create',
      entityType: 'Backup',
      description: `Database backup created: ${result.filename}`
    });

    res.json({
      success: true,
      message: 'Database backup created successfully',
      data: result
    });
  } catch (error) {
    logger.error('Create database backup error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create database backup' });
  }
};

/**
 * Create file backup
 */
exports.createFileBackup = async (req, res) => {
  try {
    const result = await backupService.createFileBackup();
    
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'backup',
      action: 'create',
      entityType: 'Backup',
      description: `File backup created: ${result.filename}`
    });

    res.json({
      success: true,
      message: 'File backup created successfully',
      data: result
    });
  } catch (error) {
    logger.error('Create file backup error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create file backup' });
  }
};

/**
 * Create full backup
 */
exports.createFullBackup = async (req, res) => {
  try {
    const result = await backupService.createFullBackup();
    
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'backup',
      action: 'create',
      entityType: 'Backup',
      description: 'Full backup created (database + files)'
    });

    res.json({
      success: true,
      message: 'Full backup created successfully',
      data: result
    });
  } catch (error) {
    logger.error('Create full backup error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create full backup' });
  }
};

/**
 * List all backups
 */
exports.listBackups = async (req, res) => {
  try {
    const backups = await backupService.listBackups();
    
    res.json({
      success: true,
      data: backups
    });
  } catch (error) {
    logger.error('List backups error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to list backups' });
  }
};

/**
 * Download backup file
 */
exports.downloadBackup = async (req, res) => {
  try {
    const { filename } = req.params;
    const path = require('path');
    const fs = require('fs').promises;
    
    const backupDir = path.join(__dirname, '../../backups');
    const filepath = path.join(backupDir, filename);
    
    // Check if file exists
    await fs.access(filepath);
    
    res.download(filepath, filename, (err) => {
      if (err) {
        logger.error('Download backup error:', err);
        res.status(500).json({ success: false, message: 'Failed to download backup' });
      }
    });
  } catch (error) {
    logger.error('Download backup error:', error);
    res.status(404).json({ success: false, message: 'Backup file not found' });
  }
};

/**
 * Cleanup old backups
 */
exports.cleanupOldBackups = async (req, res) => {
  try {
    const result = await backupService.cleanupOldBackups();
    
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'backup',
      action: 'delete',
      description: `Cleaned up ${result.deletedCount} old backup files`
    });

    res.json({
      success: true,
      message: 'Old backups cleaned up successfully',
      data: result
    });
  } catch (error) {
    logger.error('Cleanup backups error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to cleanup old backups' });
  }
};

/**
 * Restore database from backup (Admin only)
 */
exports.restoreDatabase = async (req, res) => {
  try {
    const { filename } = req.body;
    
    if (!filename) {
      return res.status(400).json({ success: false, message: 'Backup filename is required' });
    }

    const result = await backupService.restoreDatabase(filename);
    
    await createAuditLog({
      userId: req.user.id,
      companyId: req.user.companyId,
      module: 'backup',
      action: 'restore',
      description: `Database restored from backup: ${filename}`
    });

    res.json({
      success: true,
      message: 'Database restored successfully',
      data: result
    });
  } catch (error) {
    logger.error('Restore database error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to restore database' });
  }
};



