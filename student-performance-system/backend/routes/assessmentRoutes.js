const express = require('express');
const router = express.Router();
const { submitAssessment, getMyAssessments, getAllAssessments, assignAssessment } = require('../controllers/assessmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/submit', protect, submitAssessment);
router.get('/my', protect, getMyAssessments);
router.get('/all', protect, authorize('admin', 'faculty'), getAllAssessments);
router.post('/assign', protect, authorize('admin', 'faculty'), assignAssessment);

module.exports = router;
