const DirectMessage = require('../models/DirectMessage');
const User = require('../models/User');

// @desc    Get contacts (All users now visible, with block status and unread count)
// @route   GET /api/messages/contacts
// @access  Private
exports.getContacts = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    let query = { _id: { $ne: currentUserId } };
    
    // Students can only see Faculty and Admin; Faculty and Admin can see everyone (including other Faculty/Admin/Students)
    if (req.user.role === 'student') {
      query.role = { $in: ['faculty', 'admin'] };
    }
    
    const users = await User.find(query).select('name email role blockedUsers');
    
    // Get current user to check blocked list
    const currentUser = await User.findById(currentUserId).select('blockedUsers');
    const myBlockedList = (currentUser.blockedUsers || []).map(id => id.toString());

    // Fetch all unread messages for the current user
    const unreadMessages = await DirectMessage.find({
      receiver: currentUserId,
      isRead: false
    }).select('sender');

    const unreadCountMap = {};
    unreadMessages.forEach(msg => {
      const senderId = msg.sender.toString();
      unreadCountMap[senderId] = (unreadCountMap[senderId] || 0) + 1;
    });

    const contacts = await Promise.all(users.map(async u => {
      const userObj = u.toObject();
      const uIdStr = userObj._id.toString();
      
      userObj.isBlockedByMe = myBlockedList.includes(uIdStr);
      
      // Check if they blocked us
      const theyBlockedList = (u.blockedUsers || []).map(id => id.toString());
      userObj.hasBlockedMe = theyBlockedList.includes(currentUserId.toString());
      
      // Add unread count
      userObj.unreadCount = unreadCountMap[uIdStr] || 0;

      // Add last message preview
      const lastMsg = await DirectMessage.findOne({
        $or: [
          { sender: currentUserId, receiver: u._id },
          { sender: u._id, receiver: currentUserId }
        ]
      }).sort({ createdAt: -1 }).select('content createdAt');

      userObj.lastMessage = lastMsg ? lastMsg.content : '';
      userObj.lastMessageTime = lastMsg ? lastMsg.createdAt : null;

      // remove sensitive field
      delete userObj.blockedUsers;
      
      return userObj;
    }));

    // Sort: contacts with last message first, then alphabetical
    contacts.sort((a, b) => {
      if (a.lastMessageTime && b.lastMessageTime) {
        return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
      }
      if (a.lastMessageTime) return -1;
      if (b.lastMessageTime) return 1;
      return a.name.localeCompare(b.name);
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

    const senderUser = await User.findById(req.user._id);
    const receiverUser = await User.findById(receiverId);

    if (!receiverUser) {
      return res.status(404).json({ success: false, error: 'Receiver user not found' });
    }

    // Convert ObjectIds to strings to avoid type-mismatch with includes()
    const senderBlockedList = (senderUser.blockedUsers || []).map(id => id.toString());
    const receiverBlockedList = (receiverUser.blockedUsers || []).map(id => id.toString());

    if (senderBlockedList.includes(receiverId)) {
      return res.status(403).json({ success: false, error: 'You have blocked this user' });
    }
    if (receiverBlockedList.includes(req.user._id.toString())) {
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
    
    const blockedIds = user.blockedUsers.map(id => id.toString());
    if (!blockedIds.includes(userToBlock)) {
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
    
    if (user.blockedUsers) {
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
