const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a course name (e.g., Master of Computer Applications)'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Please add a course code (e.g., MCA)'],
    unique: true,
    uppercase: true,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  durationYears: {
    type: Number,
    required: true,
    min: 1
  },
  totalSemesters: {
    type: Number,
    required: true,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Course', CourseSchema);
