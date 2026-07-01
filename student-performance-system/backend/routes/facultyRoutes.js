const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

const {
  getMySubjects,
  getStudentsBySubject,
  markAttendance,
  enterMarks,
  getAttendanceByDate,
  getMarksByAssessment
} = require('../controllers/facultyController');

// All routes require authentication and faculty role
router.use(protect);
router.use(authorize('faculty', 'admin'));

router.get('/my-subjects', getMySubjects);
router.get('/subjects/:subjectId/students', getStudentsBySubject);

router.post('/attendance', markAttendance);
router.get('/attendance', getAttendanceByDate);

router.post('/marks', enterMarks);
router.get('/marks', getMarksByAssessment);

module.exports = router;
