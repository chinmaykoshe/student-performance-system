const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

const {
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getCourses, createCourse, updateCourse, deleteCourse,
  getSubjects, createSubject, updateSubject, deleteSubject,
  getAcademicYears, createAcademicYear, updateAcademicYear, deleteAcademicYear,
  getSemesters, createSemester, updateSemester, deleteSemester,
  getFacultyAllocation, assignSubjectsToFaculty
} = require('../controllers/academicController');

// All academic setup routes are protected
router.use(protect);

// Departments
router.route('/departments')
  .get(authorize('admin', 'faculty', 'student'), getDepartments)
  .post(authorize('admin'), createDepartment);
router.route('/departments/:id')
  .put(authorize('admin'), updateDepartment)
  .delete(authorize('admin'), deleteDepartment);

// Courses
router.route('/courses')
  .get(authorize('admin', 'faculty', 'student'), getCourses)
  .post(authorize('admin'), createCourse);
router.route('/courses/:id')
  .put(authorize('admin'), updateCourse)
  .delete(authorize('admin'), deleteCourse);

// Subjects
router.route('/subjects')
  .get(authorize('admin', 'faculty', 'student'), getSubjects)
  .post(authorize('admin'), createSubject);
router.route('/subjects/:id')
  .put(authorize('admin'), updateSubject)
  .delete(authorize('admin'), deleteSubject);

// Academic Years
router.route('/years')
  .get(authorize('admin', 'faculty', 'student'), getAcademicYears)
  .post(authorize('admin'), createAcademicYear);
router.route('/years/:id')
  .put(authorize('admin'), updateAcademicYear)
  .delete(authorize('admin'), deleteAcademicYear);

// Semesters
router.route('/semesters')
  .get(authorize('admin', 'faculty', 'student'), getSemesters)
  .post(authorize('admin'), createSemester);
router.route('/semesters/:id')
  .put(authorize('admin'), updateSemester)
  .delete(authorize('admin'), deleteSemester);

// Faculty Allocation
router.route('/faculty-allocation')
  .get(authorize('admin', 'faculty'), getFacultyAllocation)
  .post(authorize('admin'), assignSubjectsToFaculty);

module.exports = router;
