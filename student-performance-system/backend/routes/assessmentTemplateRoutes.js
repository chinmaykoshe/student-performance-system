const express = require('express');
const router = express.Router();
const { createTemplate, getTemplates, deleteTemplate } = require('../controllers/assessmentTemplateController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getTemplates);
router.post('/', protect, authorize('admin', 'faculty'), createTemplate);
router.delete('/:id', protect, authorize('admin', 'faculty'), deleteTemplate);

module.exports = router;
