const express = require('express');
const router = express.Router();
const { submitAssessment, getMyAssessments, getAllAssessments } = require('../controllers/assessmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/submit', protect, submitAssessment);
router.get('/my', protect, getMyAssessments);
router.get('/all', protect, authorize('admin', 'faculty'), getAllAssessments);

module.exports = router;
