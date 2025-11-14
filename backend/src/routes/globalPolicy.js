const express = require('express');
const router = express.Router();
const globalPolicyController = require('../controllers/globalPolicyController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/:companyId', authenticate, authorize('view_global_policy'), globalPolicyController.getPolicies);
router.post('/:companyId', authenticate, authorize('manage_global_policy'), globalPolicyController.createPolicy);
router.put('/:companyId/:moduleName', authenticate, authorize('manage_global_policy'), globalPolicyController.updatePolicy);
router.delete('/:companyId/:moduleName', authenticate, authorize('manage_global_policy'), globalPolicyController.deletePolicy);

module.exports = router;

