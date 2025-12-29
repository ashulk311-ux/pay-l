const express = require('express');
const router = express.Router();
const form16Controller = require('../controllers/form16Controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('view_statutory'), form16Controller.getAllForm16s);
router.get('/:id', authenticate, authorize('view_statutory'), form16Controller.getForm16);
router.post('/generate', authenticate, authorize('manage_statutory'), form16Controller.generateForm16);
router.get('/:id/pdf', authenticate, authorize('view_statutory'), form16Controller.downloadForm16PDF);

module.exports = router;



