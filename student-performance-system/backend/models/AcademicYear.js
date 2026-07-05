const mongoose = require('mongoose');

const AcademicYearSchema = new mongoose.Schema({
  year: {
    type: String,
    required: [true, 'Please specify the academic year (e.g., 2024-2025)'],
    unique: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isCurrent: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure only one Academic Year is marked as current at a time
AcademicYearSchema.pre('save', async function(next) {
  if (this.isCurrent) {
    await this.constructor.updateMany({ _id: { $ne: this._id } }, { isCurrent: false });
  }
  next();
});

module.exports = mongoose.model('AcademicYear', AcademicYearSchema);
