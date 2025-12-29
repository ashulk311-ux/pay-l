const express = require('express');
const router = express.Router();
const stateController = require('../controllers/stateController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('view_company'), stateController.getAllStates);
router.get('/:id', authenticate, authorize('view_company'), stateController.getState);
router.post('/', authenticate, authorize('manage_company'), stateController.createState);
router.put('/:id', authenticate, authorize('manage_company'), stateController.updateState);
router.delete('/:id', authenticate, authorize('manage_company'), stateController.deleteState);

module.exports = router;


