const SystemSetting = require('../models/SystemSetting');
const AuditLog = require('../models/AuditLog');

// @desc    Get system settings
// @route   GET /api/settings
// @access  Private
exports.getSettings = async (req, res) => {
  try {
    let settings = await SystemSetting.findOne({});
    if (!settings) {
      // Create defaults
      settings = await SystemSetting.create({
        attendanceThreshold: 75,
        marksThreshold: 40,
        emailAlertsEnabled: true
      });
    }
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private/Admin
exports.updateSettings = async (req, res) => {
  try {
    let settings = await SystemSetting.findOne({});
    if (!settings) {
      settings = new SystemSetting(req.body);
    } else {
      settings.attendanceThreshold = req.body.attendanceThreshold ?? settings.attendanceThreshold;
      settings.marksThreshold = req.body.marksThreshold ?? settings.marksThreshold;
      settings.emailAlertsEnabled = req.body.emailAlertsEnabled ?? settings.emailAlertsEnabled;
      settings.updatedAt = new Date();
    }
    await settings.save();

    // Log the action
    await AuditLog.create({
      action: 'SETTINGS_UPDATE',
      performedBy: req.user.email,
      details: `Updated settings: Attendance threshold = ${settings.attendanceThreshold}%, Marks threshold = ${settings.marksThreshold}%, Alerts Enabled = ${settings.emailAlertsEnabled}`
    });

    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get audit logs
// @route   GET /api/settings/logs
// @access  Private/Admin
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({}).sort('-timestamp').limit(100);
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Helper function to create audit log from other controllers
exports.createLog = async (action, email, details) => {
  try {
    await AuditLog.create({ action, performedBy: email, details });
  } catch (err) {
    console.error('Audit Logging failed:', err.message);
  }
};
