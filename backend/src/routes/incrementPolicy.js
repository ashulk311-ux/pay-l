const express = require('express');
const router = express.Router();
const incrementPolicyController = require('../controllers/incrementPolicyController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('view_increment'), incrementPolicyController.getAllPolicies);
router.post('/', authenticate, authorize('manage_increment'), incrementPolicyController.createPolicy);
router.put('/:id', authenticate, authorize('manage_increment'), incrementPolicyController.updatePolicy);

module.exports = router;



