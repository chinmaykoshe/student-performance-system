const express = require('express');
const router  = express.Router();
const { getCareerCounsel, conductMockInterview, analyzeATSResume, getTokenUsage } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.get('/usage',     protect, getTokenUsage);
router.post('/counsel',  protect, getCareerCounsel);
router.post('/interview',protect, conductMockInterview);
router.post('/ats-score',protect, analyzeATSResume);

module.exports = router;
