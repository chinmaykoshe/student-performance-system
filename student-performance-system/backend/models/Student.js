const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  rollNumber: {
    type: String,
    required: [true, 'Please add a unique roll number'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ],
    lowercase: true
  },
  department: {
    type: String,
    required: [true, 'Please select a department'],
    trim: true
  },
  semester: {
    type: Number,
    required: [true, 'Please specify the semester'],
    min: [1, 'Semester cannot be less than 1'],
    max: [6, 'Semester cannot be more than 6']
  },
  attendancePercentage: {
    type: Number,
    required: [true, 'Please specify attendance percentage'],
    min: [0, 'Attendance cannot be negative'],
    max: [100, 'Attendance cannot exceed 100%']
  },
  assignmentMarks: {
    type: Number,
    required: [true, 'Please specify assignment marks'],
    min: [0, 'Marks cannot be negative'],
    max: [100, 'Marks cannot exceed 100']
  },
  internalMarks: {
    type: Number,
    required: [true, 'Please specify internal marks'],
    min: [0, 'Marks cannot be negative'],
    max: [100, 'Marks cannot exceed 100']
  },
  previousCGPA: {
    type: Number,
    required: [true, 'Please specify previous semester CGPA'],
    min: [0, 'CGPA cannot be negative'],
    max: [10, 'CGPA cannot exceed 10']
  },
  studyHours: {
    type: Number,
    required: [true, 'Please specify daily study hours'],
    min: [0, 'Study hours cannot be negative'],
    max: [24, 'Study hours cannot exceed 24']
  },
  backlogs: {
    type: Number,
    required: [true, 'Please specify number of backlogs'],
    min: [0, 'Backlogs cannot be negative']
  },
  prediction: {
    result: {
      type: String,
      enum: ['Pass', 'Fail', 'Pending'],
      default: 'Pending'
    },
    confidence: {
      type: Number,
      default: 0
    },
    suggestions: {
      type: [String],
      default: []
    },
    predictedAt: {
      type: Date
    }
  },
  assignedFaculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Content moderation flag — admin can flag a student record for review (Quick Win #4)
  isFlagged: {
    type: Boolean,
    default: false
  },
  flagReason: {
    type: String,
    default: ''
  },
  // Basic roadmap milestones checklist (Quick Win #9)
  roadmapMilestones: [
    {
      title: { type: String, required: true },
      completed: { type: Boolean, default: false },
      addedAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Student', StudentSchema);
