const express = require('express');
const router = express.Router();
const levelController = require('../controllers/levelController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('view_company'), levelController.getAllLevels);
router.get('/:id', authenticate, authorize('view_company'), levelController.getLevel);
router.post('/', authenticate, authorize('manage_company'), levelController.createLevel);
router.put('/:id', authenticate, authorize('manage_company'), levelController.updateLevel);
router.delete('/:id', authenticate, authorize('manage_company'), levelController.deleteLevel);

module.exports = router;


