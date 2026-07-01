const mongoose = require('mongoose');
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const SkillAssessment = require('../models/SkillAssessment');
const { Project, Task, Message, Event, TeamGroup } = require('../models/Workspace');

// New ERP Models
const Department = require('../models/Department');
const Course = require('../models/Course');
const Subject = require('../models/Subject');
const AcademicYear = require('../models/AcademicYear');
const Semester = require('../models/Semester');

async function wipeAndSeed() {
  try {
    console.log('--- NUKING ENTIRE DATABASE ---');
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
      console.log('Database completely wiped!');
    } else {
      console.log('No DB connection found to drop.');
    }

    console.log('--- SEEDING EXTENSIVE DUMMY DATA ---');
    
    // 0. Academic Structure Seed
    const deptMCA = await Department.create({ name: 'Computer Applications', code: 'MCA' });
    const deptIT = await Department.create({ name: 'Information Technology', code: 'IT' });
    const deptCS = await Department.create({ name: 'Computer Science', code: 'CS' });

    const courseMCA = await Course.create({ name: 'Master of Computer Applications', code: 'MCA-PG', department: deptMCA._id, durationYears: 2, totalSemesters: 4 });
    const courseBCA = await Course.create({ name: 'Bachelor of Computer Applications', code: 'BCA-UG', department: deptMCA._id, durationYears: 3, totalSemesters: 6 });

    const acYear = await AcademicYear.create({ year: '2025-2026', startDate: new Date('2025-07-01'), endDate: new Date('2026-06-30'), isCurrent: true });

    const sem4 = await Semester.create({ name: 'Semester 4', number: 4, academicYear: acYear._id, course: courseMCA._id });
    const sem2 = await Semester.create({ name: 'Semester 2', number: 2, academicYear: acYear._id, course: courseBCA._id });
    const sem6 = await Semester.create({ name: 'Semester 6', number: 6, academicYear: acYear._id, course: courseBCA._id });

    const subjReact = await Subject.create({ name: 'Advanced React', code: 'MCA401', course: courseMCA._id, semesterNumber: 4, credits: 4, type: 'Theory' });
    const subjNode = await Subject.create({ name: 'Node.js Backend', code: 'MCA402', course: courseMCA._id, semesterNumber: 4, credits: 4, type: 'Theory' });
    const subjDB = await Subject.create({ name: 'Database Systems', code: 'BCA201', course: courseBCA._id, semesterNumber: 2, credits: 3, type: 'Theory' });

    // 1. Core Users
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@system.com',
      password: 'admin',
      role: 'admin'
    });

    const facultyUser = await User.create({
      name: 'Dr. Sarah Connor',
      email: 'faculty@system.com',
      password: 'faculty',
      role: 'faculty',
      department: deptMCA._id,
      assignedSubjects: [subjReact._id, subjNode._id] // Allocated 2 subjects
    });

    const studentUser1 = await User.create({ name: 'John Doe', email: 'john@system.com', password: 'student', role: 'student' });
    const studentUser2 = await User.create({ name: 'Jane Smith', email: 'jane@system.com', password: 'student', role: 'student' });
    const studentUser3 = await User.create({ name: 'Alice Johnson', email: 'alice@system.com', password: 'student', role: 'student' });
    const studentUser4 = await User.create({ name: 'Bob Wilson', email: 'bob@system.com', password: 'student', role: 'student' });
    const studentUser5 = await User.create({ name: 'Emma Davis', email: 'emma@system.com', password: 'student', role: 'student' });

    // 2. Faculty Profile
    await Faculty.create({
      user: facultyUser._id,
      name: facultyUser.name,
      email: facultyUser.email,
      department: 'Computer Applications' // Keeping legacy string if strictly needed, though we moved to ref in User
    });

    // 3. Extensive Student Data
    const studentsData = [
      {
        user: studentUser1._id, name: studentUser1.name, email: studentUser1.email,
        rollNumber: 'MCA-2026-001', 
        department: deptMCA._id, course: courseMCA._id, academicYear: acYear._id, semester: sem4._id, enrolledSubjects: [subjReact._id, subjNode._id],
        attendancePercentage: 85, assignmentMarks: 90, internalMarks: 88, previousCGPA: 8.5, studyHours: 5, backlogs: 0,
        prediction: { result: 'Pass', confidence: 92, lastCalculated: new Date() }
      },
      {
        user: studentUser2._id, name: studentUser2.name, email: studentUser2.email,
        rollNumber: 'MCA-2026-002', 
        department: deptMCA._id, course: courseMCA._id, academicYear: acYear._id, semester: sem4._id, enrolledSubjects: [subjReact._id, subjNode._id],
        attendancePercentage: 60, assignmentMarks: 45, internalMarks: 40, previousCGPA: 5.5, studyHours: 2, backlogs: 2,
        isFlagged: true, flagReason: 'Low attendance and marks',
        prediction: { result: 'Fail', confidence: 85, lastCalculated: new Date() }
      },
      {
        user: studentUser3._id, name: studentUser3.name, email: studentUser3.email,
        rollNumber: 'MCA-2026-003', 
        department: deptMCA._id, course: courseMCA._id, academicYear: acYear._id, semester: sem4._id, enrolledSubjects: [subjReact._id, subjNode._id],
        attendancePercentage: 95, assignmentMarks: 98, internalMarks: 95, previousCGPA: 9.8, studyHours: 6, backlogs: 0,
        prediction: { result: 'Pass', confidence: 99, lastCalculated: new Date() }
      },
      {
        user: studentUser4._id, name: studentUser4.name, email: studentUser4.email,
        rollNumber: 'BCA-2026-004', 
        department: deptIT._id, course: courseBCA._id, academicYear: acYear._id, semester: sem2._id, enrolledSubjects: [subjDB._id],
        attendancePercentage: 72, assignmentMarks: 65, internalMarks: 60, previousCGPA: 7.1, studyHours: 3, backlogs: 1,
        prediction: { result: 'Pass', confidence: 60, lastCalculated: new Date() }
      },
      {
        user: studentUser5._id, name: studentUser5.name, email: studentUser5.email,
        rollNumber: 'BCA-2026-005', 
        department: deptCS._id, course: courseBCA._id, academicYear: acYear._id, semester: sem6._id, enrolledSubjects: [],
        attendancePercentage: 45, assignmentMarks: 30, internalMarks: 35, previousCGPA: 4.5, studyHours: 1, backlogs: 4,
        isFlagged: true, flagReason: 'Critically low performance across all metrics',
        prediction: { result: 'Fail', confidence: 98, lastCalculated: new Date() }
      }
    ];
    await Student.create(studentsData);

    // 4. Skill Assessments
    await SkillAssessment.create([
      { user: studentUser1._id, category: 'Programming Fundamentals', score: 90, answers: [] },
      { user: studentUser2._id, category: 'Web Development', score: 45, answers: [] },
      { user: studentUser3._id, category: 'Data Science', score: 95, answers: [] }
    ]);

    console.log('--- SEEDING COMPLETE ---');
  } catch (err) {
    console.error('Error in seeder:', err);
  }
}

module.exports = wipeAndSeed;
