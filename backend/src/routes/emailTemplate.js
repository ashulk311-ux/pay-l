const express = require('express');
const router = express.Router();
const emailTemplateController = require('../controllers/emailTemplateController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('manage_templates'), emailTemplateController.getAllTemplates);
router.get('/:id', authenticate, authorize('manage_templates'), emailTemplateController.getTemplate);
router.post('/', authenticate, authorize('manage_templates'), emailTemplateController.createTemplate);
router.put('/:id', authenticate, authorize('manage_templates'), emailTemplateController.updateTemplate);
router.delete('/:id', authenticate, authorize('manage_templates'), emailTemplateController.deleteTemplate);

module.exports = router;



