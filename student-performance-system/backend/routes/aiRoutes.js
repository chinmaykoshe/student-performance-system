const express = require('express');
const router  = express.Router();
const { getCareerCounsel, conductMockInterview, analyzeATSResume, getTokenUsage, generateAssessment, copilotChat } = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/usage',     protect, getTokenUsage);
router.post('/counsel',  protect, getCareerCounsel);
router.post('/interview',protect, conductMockInterview);
router.post('/ats-score',protect, analyzeATSResume);
router.post('/generate-assessment', protect, authorize('faculty', 'admin'), generateAssessment);
router.post('/chat', protect, copilotChat);

module.exports = router;
