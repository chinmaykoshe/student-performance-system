const mongoose = require('mongoose');

const SystemSettingSchema = new mongoose.Schema({
  attendanceThreshold: {
    type: Number,
    required: true,
    default: 75,
    min: 0,
    max: 100
  },
  marksThreshold: {
    type: Number,
    required: true,
    default: 40,
    min: 0,
    max: 100
  },
  emailAlertsEnabled: {
    type: Boolean,
    required: true,
    default: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SystemSetting', SystemSettingSchema);
