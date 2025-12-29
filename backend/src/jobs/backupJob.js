const cron = require('node-cron');
const backupService = require('../services/backupService');
const logger = require('../utils/logger');

/**
 * Scheduled Backup Jobs
 * Runs automated backups at configured intervals
 */

let backupJob = null;

/**
 * Start scheduled backup jobs
 */
function startBackupJobs() {
  // Daily full backup at 2 AM
  backupJob = cron.schedule('0 2 * * *', async () => {
    try {
      logger.info('Starting scheduled daily backup...');
      await backupService.createFullBackup();
      logger.info('Scheduled daily backup completed successfully');
      
      // Cleanup old backups after successful backup
      await backupService.cleanupOldBackups();
    } catch (error) {
      logger.error('Scheduled backup error:', error);
    }
  }, {
    scheduled: false,
    timezone: 'Asia/Kolkata'
  });

  // Start the job
  backupJob.start();
  logger.info('Scheduled backup jobs started (Daily at 2 AM)');
}

/**
 * Stop scheduled backup jobs
 */
function stopBackupJobs() {
  if (backupJob) {
    backupJob.stop();
    logger.info('Scheduled backup jobs stopped');
  }
}

module.exports = {
  startBackupJobs,
  stopBackupJobs
};



