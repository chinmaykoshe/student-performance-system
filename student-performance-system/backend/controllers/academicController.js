const Department = require('../models/Department');
const Course = require('../models/Course');
const Subject = require('../models/Subject');
const AcademicYear = require('../models/AcademicYear');
const Semester = require('../models/Semester');
const User = require('../models/User');

// --- Departments ---

exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().populate('headOfDepartment', 'name email');
    res.status(200).json({ success: true, count: departments.length, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const department = await Department.create(req.body);
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!department) return res.status(404).json({ success: false, error: 'Department not found' });
    res.status(200).json({ success: true, data: department });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) return res.status(404).json({ success: false, error: 'Department not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// --- Courses ---

exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate('department', 'name code');
    res.status(200).json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });
    res.status(200).json({ success: true, data: course });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// --- Subjects ---

exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().populate('course', 'name code');
    res.status(200).json({ success: true, count: subjects.length, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createSubject = async (req, res) => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json({ success: true, data: subject });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!subject) return res.status(404).json({ success: false, error: 'Subject not found' });
    res.status(200).json({ success: true, data: subject });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ success: false, error: 'Subject not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// --- Academic Years ---

exports.getAcademicYears = async (req, res) => {
  try {
    const years = await AcademicYear.find().sort('-startDate');
    res.status(200).json({ success: true, count: years.length, data: years });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createAcademicYear = async (req, res) => {
  try {
    const year = await AcademicYear.create(req.body);
    res.status(201).json({ success: true, data: year });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateAcademicYear = async (req, res) => {
  try {
    const year = await AcademicYear.findById(req.params.id);
    if (!year) return res.status(404).json({ success: false, error: 'Academic Year not found' });
    
    // We use .save() here to trigger the pre-save hook that unsets other current years
    Object.assign(year, req.body);
    await year.save();
    
    res.status(200).json({ success: true, data: year });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteAcademicYear = async (req, res) => {
  try {
    const year = await AcademicYear.findByIdAndDelete(req.params.id);
    if (!year) return res.status(404).json({ success: false, error: 'Academic Year not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// --- Semesters ---

exports.getSemesters = async (req, res) => {
  try {
    const semesters = await Semester.find()
      .populate('course', 'name code')
      .populate('academicYear', 'year isCurrent');
    res.status(200).json({ success: true, count: semesters.length, data: semesters });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createSemester = async (req, res) => {
  try {
    const semester = await Semester.create(req.body);
    res.status(201).json({ success: true, data: semester });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateSemester = async (req, res) => {
  try {
    const semester = await Semester.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!semester) return res.status(404).json({ success: false, error: 'Semester not found' });
    res.status(200).json({ success: true, data: semester });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteSemester = async (req, res) => {
  try {
    const semester = await Semester.findByIdAndDelete(req.params.id);
    if (!semester) return res.status(404).json({ success: false, error: 'Semester not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// --- Faculty Allocation ---

exports.getFacultyAllocation = async (req, res) => {
  try {
    // Fetch all users with role 'faculty'
    const faculty = await User.find({ role: 'faculty' })
      .populate('department', 'name')
      .populate('assignedSubjects', 'name code semesterNumber');
    res.status(200).json({ success: true, count: faculty.length, data: faculty });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.assignSubjectsToFaculty = async (req, res) => {
  try {
    const { facultyId, subjectIds } = req.body;
    const faculty = await User.findOneAndUpdate(
      { _id: facultyId, role: 'faculty' },
      { assignedSubjects: subjectIds },
      { new: true, runValidators: true }
    ).populate('assignedSubjects', 'name code');
    
    if (!faculty) {
      return res.status(404).json({ success: false, error: 'Faculty not found' });
    }
    
    res.status(200).json({ success: true, data: faculty });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
