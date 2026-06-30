const express = require('express');
const { getSettings, updateSettings, getAuditLogs } = require('../controllers/systemController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/settings')
  .get(getSettings)
  .put(authorize('admin'), updateSettings);

router.route('/logs')
  .get(authorize('admin'), getAuditLogs);

module.exports = router;
