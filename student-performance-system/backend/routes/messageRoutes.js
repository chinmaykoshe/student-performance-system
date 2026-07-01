const express = require('express');
const router = express.Router();
const { getContacts, getMessages, sendMessage, blockUser, unblockUser, getUnreadCount } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.get('/contacts', protect, getContacts);
router.get('/unread-count', protect, getUnreadCount);
router.post('/block/:userId', protect, blockUser);
router.post('/unblock/:userId', protect, unblockUser);
router.get('/:userId', protect, getMessages);
router.post('/', protect, sendMessage);

module.exports = router;
