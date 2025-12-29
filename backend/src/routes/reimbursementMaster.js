const express = require('express');
const router = express.Router();
const reimbursementMasterController = require('../controllers/reimbursementMasterController');
const { authenticate, authorize } = require('../middleware/auth');

// Categories
router.get('/categories', authenticate, authorize('view_reimbursement'), reimbursementMasterController.getAllCategories);
router.post('/categories', authenticate, authorize('manage_reimbursement'), reimbursementMasterController.createCategory);
router.put('/categories/:id', authenticate, authorize('manage_reimbursement'), reimbursementMasterController.updateCategory);

// Policies
router.get('/policies', authenticate, authorize('view_reimbursement'), reimbursementMasterController.getAllPolicies);
router.post('/policies', authenticate, authorize('manage_reimbursement'), reimbursementMasterController.createPolicy);
router.put('/policies/:id', authenticate, authorize('manage_reimbursement'), reimbursementMasterController.updatePolicy);

// Workflow Configs
router.get('/workflow-configs', authenticate, authorize('view_reimbursement'), reimbursementMasterController.getAllWorkflowConfigs);
router.post('/workflow-configs', authenticate, authorize('manage_reimbursement'), reimbursementMasterController.createWorkflowConfig);
router.put('/workflow-configs/:id', authenticate, authorize('manage_reimbursement'), reimbursementMasterController.updateWorkflowConfig);

module.exports = router;



