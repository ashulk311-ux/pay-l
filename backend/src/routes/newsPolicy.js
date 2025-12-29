const express = require('express');
const router = express.Router();
const newsPolicyController = require('../controllers/newsPolicyController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('manage_news_policies'), newsPolicyController.getAllNewsPolicies);
router.get('/:id', authenticate, authorize('manage_news_policies'), newsPolicyController.getNewsPolicy);
router.post('/', authenticate, authorize('manage_news_policies'), newsPolicyController.createNewsPolicy);
router.put('/:id', authenticate, authorize('manage_news_policies'), newsPolicyController.updateNewsPolicy);
router.delete('/:id', authenticate, authorize('manage_news_policies'), newsPolicyController.deleteNewsPolicy);

module.exports = router;



