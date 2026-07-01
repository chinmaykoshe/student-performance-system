const DirectMessage = require('../models/DirectMessage');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

// @desc    Get contacts (Students see Faculties, Faculties see assigned Students)
// @route   GET /api/messages/contacts
// @access  Private
exports.getContacts = async (req, res) => {
  try {
    const userRole = req.user.role;
    let contacts = [];

    if (userRole === 'student') {
      // Students can message any faculty for now
      const faculties = await Faculty.find({}).populate('user', 'name email role');
      contacts = faculties.map(f => f.user).filter(u => u); // extract populated user
    } else if (userRole === 'faculty') {
      // Faculty can message any assigned students
      const students = await Student.find({}).populate('user', 'name email role');
      contacts = students.map(s => s.user).filter(u => u);
    } else {
      // Admin sees everyone
      contacts = await User.find({ _id: { $ne: req.user._id } }).select('name email role');
    }

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
