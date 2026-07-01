const DirectMessage = require('../models/DirectMessage');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

// @desc    Get contacts (All users now visible, with block status)
// @route   GET /api/messages/contacts
// @access  Private
exports.getContacts = async (req, res) => {
  try {
    // Filter users based on role
    let query = { _id: { $ne: req.user._id } };
    if (req.user.role === 'student') {
      // Students can only see Faculty and Admin
      query.role = { $in: ['faculty', 'admin'] };
    }
    const users = await User.find(query).select('name email role');
    
    // Get current user to check blocked list
    const currentUser = await User.findById(req.user._id).select('blockedUsers');
    const blockedList = currentUser.blockedUsers ? currentUser.blockedUsers.map(id => id.toString()) : [];

    // Map users to include isBlocked flag
    const contacts = users.map(u => {
      const userObj = u.toObject();
      userObj.isBlocked = blockedList.includes(userObj._id.toString());
      return userObj;
    });

    res.status(200).json({ success: true, count: contacts.length, data: contacts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get chat history with a specific user
// @route   GET /api/messages/:userId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const currentUserId = req.user._id;

    const messages = await DirectMessage.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId }
      ]
    }).sort('createdAt');

    // Mark as read if the current user is the receiver
    await DirectMessage.updateMany(
      { sender: otherUserId, receiver: currentUserId, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ success: true, count: messages.length, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    
    if (!receiverId || !content) {
      return res.status(400).json({ success: false, error: 'Receiver and content are required' });
    }

    // Check block status
    const senderUser = await User.findById(req.user._id);
    const receiverUser = await User.findById(receiverId);

    if (senderUser.blockedUsers?.includes(receiverId)) {
      return res.status(403).json({ success: false, error: 'You have blocked this user' });
    }
    if (receiverUser.blockedUsers?.includes(req.user._id)) {
      return res.status(403).json({ success: false, error: 'You are blocked by this user' });
    }
    if (senderUser.role === 'student' && receiverUser.role === 'student') {
      return res.status(403).json({ success: false, error: 'Students cannot message other students directly' });
    }

    const message = await DirectMessage.create({
      sender: req.user._id,
      receiver: receiverId,
      content
    });

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Block a user
// @route   POST /api/messages/block/:userId
// @access  Private
exports.blockUser = async (req, res) => {
  try {
    const userToBlock = req.params.userId;
    if (userToBlock === req.user._id.toString()) {
      return res.status(400).json({ success: false, error: 'You cannot block yourself' });
    }

    const user = await User.findById(req.user._id);
    if (!user.blockedUsers) user.blockedUsers = [];
    
    if (!user.blockedUsers.includes(userToBlock)) {
      user.blockedUsers.push(userToBlock);
      await user.save();
    }
    
    res.status(200).json({ success: true, message: 'User blocked successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Unblock a user
// @route   POST /api/messages/unblock/:userId
// @access  Private
exports.unblockUser = async (req, res) => {
  try {
    const userToUnblock = req.params.userId;
    const user = await User.findById(req.user._id);
    
    if (user.blockedUsers && user.blockedUsers.includes(userToUnblock)) {
      user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== userToUnblock);
      await user.save();
    }
    
    res.status(200).json({ success: true, message: 'User unblocked successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get total unread messages count for current user
// @route   GET /api/messages/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await DirectMessage.countDocuments({
      receiver: req.user._id,
      isRead: false
    });
    res.status(200).json({ success: true, count: unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
