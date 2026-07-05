const mongoose = require('mongoose');

const MarksRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assessmentType: {
    type: String,
    enum: ['Internal 1', 'Internal 2', 'Assignment', 'Quiz', 'Practical', 'Viva', 'Mid Semester', 'End Semester', 'Project'],
    required: true
  },
  marksObtained: {
    type: Number,
    required: true,
    min: 0
  },
  maxMarks: {
    type: Number,
    required: true,
    min: 1
  },
  remarks: {
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// A student can only have one score per assessment type per subject
MarksRecordSchema.index({ student: 1, subject: 1, assessmentType: 1 }, { unique: true });

module.exports = mongoose.model('MarksRecord', MarksRecordSchema);
