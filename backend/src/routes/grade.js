const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('view_company'), gradeController.getAllGrades);
router.get('/:id', authenticate, authorize('view_company'), gradeController.getGrade);
router.post('/', authenticate, authorize('manage_company'), gradeController.createGrade);
router.put('/:id', authenticate, authorize('manage_company'), gradeController.updateGrade);
router.delete('/:id', authenticate, authorize('manage_company'), gradeController.deleteGrade);

module.exports = router;


