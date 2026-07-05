const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a subject name'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Please add a subject code'],
    uppercase: true,
    trim: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  semesterNumber: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['Theory', 'Practical', 'Project'],
    default: 'Theory'
  },
  credits: {
    type: Number,
    required: true,
    min: 1
  },
  // Maximum marks allowed for this subject
  maxInternalMarks: {
    type: Number,
    default: 40
  },
  maxExternalMarks: {
    type: Number,
    default: 60
  },
  maxTotalMarks: {
    type: Number,
    default: 100
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

// Ensure subject codes are unique within a course
SubjectSchema.index({ code: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Subject', SubjectSchema);
