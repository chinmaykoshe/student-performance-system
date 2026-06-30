const express = require('express');
const router = express.Router();
const { generateResumePDF } = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate', protect, generateResumePDF);

module.exports = router;
