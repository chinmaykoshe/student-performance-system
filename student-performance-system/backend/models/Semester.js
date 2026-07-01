const mongoose = require('mongoose');

const SemesterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please specify the semester name (e.g., Semester 1)'],
    trim: true
  },
  number: {
    type: Number,
    required: true
  },
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  }
});

// Prevent duplicate semester numbers within the same course & academic year
SemesterSchema.index({ number: 1, academicYear: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Semester', SemesterSchema);
