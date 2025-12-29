const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('manage_branches'), branchController.getAllBranches);
router.get('/:id', authenticate, authorize('manage_branches'), branchController.getBranch);
router.post('/', authenticate, authorize('manage_branches'), branchController.createBranch);
router.put('/:id', authenticate, authorize('manage_branches'), branchController.updateBranch);
router.delete('/:id', authenticate, authorize('manage_branches'), branchController.deleteBranch);

module.exports = router;



