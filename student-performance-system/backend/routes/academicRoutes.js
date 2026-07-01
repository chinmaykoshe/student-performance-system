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

// All academic setup routes are protected and admin-only
router.use(protect);
router.use(authorize('admin'));

// Departments
router.route('/departments')
  .get(getDepartments)
  .post(createDepartment);
router.route('/departments/:id')
  .put(updateDepartment)
  .delete(deleteDepartment);

// Courses
router.route('/courses')
  .get(getCourses)
  .post(createCourse);
router.route('/courses/:id')
  .put(updateCourse)
  .delete(deleteCourse);

// Subjects
router.route('/subjects')
  .get(getSubjects)
  .post(createSubject);
router.route('/subjects/:id')
  .put(updateSubject)
  .delete(deleteSubject);

// Academic Years
router.route('/years')
  .get(getAcademicYears)
  .post(createAcademicYear);
router.route('/years/:id')
  .put(updateAcademicYear)
  .delete(deleteAcademicYear);

// Semesters
router.route('/semesters')
  .get(getSemesters)
  .post(createSemester);
router.route('/semesters/:id')
  .put(updateSemester)
  .delete(deleteSemester);

// Faculty Allocation
router.route('/faculty-allocation')
  .get(getFacultyAllocation);
router.route('/faculty-allocation/assign')
  .post(assignSubjectsToFaculty);

module.exports = router;
