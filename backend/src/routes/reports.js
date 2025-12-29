const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const dashboardController = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');
const { protectAuditorWrite } = require('../middleware/auditorProtection');
const path = require('path');
const fs = require('fs');

const { reportValidation } = require('../middleware/validation');

// Dashboard analytics
router.get('/dashboard-analytics', authenticate, authorize('view_reports'), dashboardController.getDashboardAnalytics);

// Statutory Reports (month and year as query params)
router.get('/statutory/pf', reportValidation.getReport, authenticate, authorize('view_reports'), reportsController.getPFReport);
router.get('/statutory/esi', reportValidation.getReport, authenticate, authorize('view_reports'), reportsController.getESIReport);
router.get('/statutory/tds', reportValidation.getReport, authenticate, authorize('view_reports'), reportsController.getTDSReport);
router.get('/statutory/pt', reportValidation.getReport, authenticate, authorize('view_reports'), reportsController.getPTReport);

// Payroll Reports
router.get('/payroll/register', reportValidation.getReport, authenticate, authorize('view_reports'), reportsController.getSalaryRegister);
router.get('/payroll/summary', reportValidation.getReport, authenticate, authorize('view_reports'), reportsController.getPayrollSummary);
router.get('/payslip/:id', authenticate, authorize('view_reports'), reportsController.getPayslip);

// Reconciliation Reports
router.get('/reconciliation', reportValidation.getReport, authenticate, authorize('view_reports'), reportsController.getReconciliationReport);

// Bank Transfer Report
router.get('/bank-transfer', reportValidation.getReport, authenticate, authorize('view_reports'), reportsController.getBankTransferReport);

// Employee History
router.get('/employee-history/:id', authenticate, authorize('view_reports'), reportsController.getEmployeeHistory);

// Audit Logs
router.get('/audit-logs', authenticate, authorize('view_audit_logs'), reportsController.getAuditLogs);
router.get('/audit-logs/export', authenticate, authorize('view_audit_logs'), reportsController.exportAuditLogs);

// Custom Reports
router.get('/custom', authenticate, authorize('view_reports'), reportsController.getCustomReports);
router.post('/custom', authenticate, authorize('manage_reports'), protectAuditorWrite, reportsController.createCustomReport);
router.put('/custom/:id', authenticate, authorize('manage_reports'), protectAuditorWrite, reportsController.updateCustomReport);
router.delete('/custom/:id', authenticate, authorize('manage_reports'), protectAuditorWrite, reportsController.deleteCustomReport);
router.post('/custom/:id/execute', authenticate, authorize('view_reports'), reportsController.executeCustomReport);

// Download report file
router.get('/download/*', authenticate, authorize('view_reports'), (req, res) => {
  try {
    const filePath = path.join(__dirname, '../../uploads', req.params[0]);
    
    // Security check: ensure file is within uploads directory
    const normalizedPath = path.normalize(filePath);
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!normalizedPath.startsWith(uploadsDir)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    res.download(filePath, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Error downloading file' });
        }
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ success: false, message: 'Error downloading file' });
  }
});

module.exports = router;

