const express = require('express');
const router = express.Router();
const { getContacts, getMessages, sendMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.get('/contacts', protect, getContacts);
router.get('/:userId', protect, getMessages);
router.post('/', protect, sendMessage);

module.exports = router;
