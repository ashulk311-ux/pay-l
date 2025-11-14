const express = require('express');
const router = express.Router();
const statutoryController = require('../controllers/statutoryController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/:companyId', authenticate, authorize('view_statutory'), statutoryController.getConfigurations);
router.post('/', authenticate, authorize('manage_statutory'), statutoryController.createConfiguration);
router.put('/:id', authenticate, authorize('manage_statutory'), statutoryController.updateConfiguration);
router.get('/tds/slabs', authenticate, authorize('view_statutory'), statutoryController.getTDSSlabs);
router.post('/tds/slabs', authenticate, authorize('manage_statutory'), statutoryController.updateTDSSlabs);

module.exports = router;

