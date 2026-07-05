const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Student = require('./models/Student');
const Department = require('./models/Department');
const Course = require('./models/Course');
const AcademicYear = require('./models/AcademicYear');
const Semester = require('./models/Semester');
const Subject = require('./models/Subject');
const MarksRecord = require('./models/MarksRecord');
const Faculty = require('./models/Faculty');
const { predictStudentPerformance } = require('./utils/predictionService');

const MONGO_URI = process.env.MONGO_ATLAS_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/student-performance-db';

const seedAll = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // --- 0. CLEAN UP COLLECTIONS TO PREVENT DUPLICATES ---
    console.log('Clearing existing dummy collections for a fresh seed...');
    await AcademicYear.deleteMany({});
    await Department.deleteMany({});
    await Course.deleteMany({});
    await Semester.deleteMany({});
    await Subject.deleteMany({});
    await Faculty.deleteMany({});
    await Student.deleteMany({});
    await MarksRecord.deleteMany({});
    // Delete all users to ensure fresh credentials are seeded
    await User.deleteMany({});

    // --- 1. SEED ACADEMIC YEARS ---
    console.log('Seeding Academic Years...');
    const academicYears = [
      { year: '2023-2024', startDate: new Date('2023-07-01'), endDate: new Date('2024-06-30'), isCurrent: false },
      { year: '2024-2025', startDate: new Date('2024-07-01'), endDate: new Date('2025-06-30'), isCurrent: true },
      { year: '2025-2026', startDate: new Date('2025-07-01'), endDate: new Date('2026-06-30'), isCurrent: false }
    ];

    let currentYearObj;
    for (const ay of academicYears) {
      currentYearObj = await AcademicYear.create(ay);
    }

    // --- 2. SEED DEPARTMENTS ---
    console.log('Seeding Departments...');
    const departments = [
      { name: 'Computer Applications', code: 'COMP', description: 'Department of Computer Applications covering MCA and BCA programs.' },
      { name: 'Information Technology', code: 'IT', description: 'Department of IT.' },
      { name: 'Business Administration', code: 'BBA', description: 'Department of Management and Business Administration.' }
    ];

    const savedDepts = {};
    for (const dept of departments) {
      const d = await Department.create(dept);
      savedDepts[dept.code] = d;
    }

    // --- 3. SEED COURSES ---
    console.log('Seeding Courses...');
    const courses = [
      { name: 'Master of Computer Applications', code: 'MCA', department: savedDepts['COMP']._id, durationYears: 2, totalSemesters: 4 },
      { name: 'Bachelor of Computer Applications', code: 'BCA', department: savedDepts['COMP']._id, durationYears: 3, totalSemesters: 6 },
      { name: 'B.Sc. Information Technology', code: 'BSCIT', department: savedDepts['IT']._id, durationYears: 3, totalSemesters: 6 },
      { name: 'Master of Business Administration', code: 'MBA', department: savedDepts['BBA']._id, durationYears: 2, totalSemesters: 4 }
    ];

    const savedCourses = {};
    for (const crs of courses) {
      const c = await Course.create(crs);
      savedCourses[crs.code] = c;
    }

    // --- 4. SEED SEMESTERS ---
    console.log('Seeding Semesters...');
    const semestersToCreate = [
      { name: 'MCA Semester 1', number: 1, academicYear: currentYearObj._id, course: savedCourses['MCA']._id },
      { name: 'MCA Semester 2', number: 2, academicYear: currentYearObj._id, course: savedCourses['MCA']._id },
      { name: 'BCA Semester 1', number: 1, academicYear: currentYearObj._id, course: savedCourses['BCA']._id },
      { name: 'MBA Semester 1', number: 1, academicYear: currentYearObj._id, course: savedCourses['MBA']._id }
    ];

    for (const sem of semestersToCreate) {
      await Semester.create(sem);
    }

    const mcaSem1 = await Semester.findOne({ number: 1, course: savedCourses['MCA']._id });

    // --- 5. SEED SUBJECTS ---
    console.log('Seeding Subjects...');
    const subjects = [
      // MCA Sem 1
      { name: 'Advanced Data Structures', code: 'MCA101', type: 'Theory', credits: 4, course: savedCourses['MCA']._id, semesterNumber: 1 },
      { name: 'Java Programming', code: 'MCA102', type: 'Theory', credits: 4, course: savedCourses['MCA']._id, semesterNumber: 1 },
      { name: 'Machine Learning Basics', code: 'MCA103', type: 'Theory', credits: 4, course: savedCourses['MCA']._id, semesterNumber: 1 },
      { name: 'Java Lab', code: 'MCA104', type: 'Practical', credits: 2, course: savedCourses['MCA']._id, semesterNumber: 1, maxInternalMarks: 50, maxExternalMarks: 50 },
      // MCA Sem 2
      { name: 'Cloud Computing', code: 'MCA201', type: 'Theory', credits: 4, course: savedCourses['MCA']._id, semesterNumber: 2 },
      { name: 'Web Technologies', code: 'MCA202', type: 'Theory', credits: 4, course: savedCourses['MCA']._id, semesterNumber: 2 },
      // BCA Sem 1
      { name: 'C Programming', code: 'BCA101', type: 'Theory', credits: 3, course: savedCourses['BCA']._id, semesterNumber: 1 },
      { name: 'Mathematics-I', code: 'BCA102', type: 'Theory', credits: 3, course: savedCourses['BCA']._id, semesterNumber: 1 },
      // MBA Sem 1
      { name: 'Principles of Management', code: 'MBA101', type: 'Theory', credits: 3, course: savedCourses['MBA']._id, semesterNumber: 1 },
      { name: 'Financial Accounting', code: 'MBA102', type: 'Theory', credits: 4, course: savedCourses['MBA']._id, semesterNumber: 1 }
    ];

    for (const sub of subjects) {
      await Subject.create(sub);
    }

    const mcaSubjects = await Subject.find({ course: savedCourses['MCA']._id, semesterNumber: 1 });

    // --- 5.5 SEED ADMIN ---
    console.log('Seeding Admin...');
    let adminUser = await User.findOne({ email: 'admin@system.com' });
    if (!adminUser) {
      await User.create({
        name: 'System Admin',
        email: 'admin@system.com',
        password: 'admin',
        role: 'admin'
      });
    }

    // --- 6. SEED FACULTY ---
    console.log('Seeding Faculty...');
    const facultyData = [
      { name: 'Demo Faculty', email: 'faculty@system.com', password: 'faculty', role: 'faculty', dept: savedDepts['COMP'].name },
      { name: 'Dr. Alan Turing', email: 'alan.turing@system.com', password: 'password123', role: 'faculty', dept: savedDepts['COMP'].name },
      { name: 'Dr. Grace Hopper', email: 'grace.hopper@system.com', password: 'password123', role: 'faculty', dept: savedDepts['COMP'].name },
      { name: 'Prof. Tim Berners-Lee', email: 'tim.berners@system.com', password: 'password123', role: 'faculty', dept: savedDepts['IT'].name },
      { name: 'Dr. Ada Lovelace', email: 'ada.lovelace@system.com', password: 'password123', role: 'faculty', dept: savedDepts['BBA'].name },
      { name: 'Prof. John von Neumann', email: 'john.neumann@system.com', password: 'password123', role: 'faculty', dept: 'Mathematics' }
    ];

    let firstFacultyUser;
    for (const f of facultyData) {
      const user = await User.create({ name: f.name, email: f.email, password: f.password, role: f.role });
      if (!firstFacultyUser) firstFacultyUser = user;

      await Faculty.create({ user: user._id, name: f.name, email: f.email, department: f.dept });
    }

    // Assign all MCA subjects to the Demo Faculty user so they appear in their dashboard
    const mcaSubjectIds = mcaSubjects.map(sub => sub._id);
    await User.findByIdAndUpdate(firstFacultyUser._id, {
      $set: { assignedSubjects: mcaSubjectIds }
    });

    // --- 7. SEED STUDENTS, MARKS & PREDICTIONS ---
    console.log('Seeding Students & Marks & ML Predictions...');
    const studentData = [
      { roll: 'MCA2024001', name: 'Alice Smith', email: 'alice.mca@system.com', metrics: { attendance: 85, assignment: 80, internal: 75, cgpa: 8.5, study: 5, backlogs: 0 } },
      { roll: 'MCA2024002', name: 'Bob Johnson', email: 'bob.mca@system.com', metrics: { attendance: 45, assignment: 40, internal: 30, cgpa: 5.2, study: 2, backlogs: 2 } },
      { roll: 'MCA2024003', name: 'Charlie Brown', email: 'charlie.mca@system.com', metrics: { attendance: 72, assignment: 65, internal: 55, cgpa: 7.0, study: 4, backlogs: 0 } },
      { roll: 'MCA2024004', name: 'Diana Prince', email: 'diana.mca@system.com', metrics: { attendance: 95, assignment: 90, internal: 85, cgpa: 9.2, study: 6, backlogs: 0 } },
      { roll: 'MCA2024005', name: 'Evan Wright', email: 'evan.mca@system.com', metrics: { attendance: 60, assignment: 55, internal: 40, cgpa: 6.1, study: 3, backlogs: 1 } },
      { roll: 'MCA2024006', name: 'Fiona Gallagher', email: 'fiona.mca@system.com', metrics: { attendance: 88, assignment: 75, internal: 65, cgpa: 7.8, study: 4, backlogs: 0 } },
      { roll: 'MCA2024007', name: 'George Miller', email: 'george.mca@system.com', metrics: { attendance: 30, assignment: 20, internal: 25, cgpa: 4.5, study: 1, backlogs: 3 } },
      { roll: 'MCA2024008', name: 'Hannah Abbott', email: 'hannah.mca@system.com', metrics: { attendance: 76, assignment: 70, internal: 60, cgpa: 7.2, study: 4, backlogs: 0 } },
      { roll: 'MCA2024009', name: 'Ian Malcolm', email: 'ian.mca@system.com', metrics: { attendance: 50, assignment: 60, internal: 45, cgpa: 6.5, study: 3, backlogs: 1 } },
      { roll: 'MCA2024010', name: 'Julia Roberts', email: 'julia.mca@system.com', metrics: { attendance: 92, assignment: 85, internal: 80, cgpa: 8.9, study: 5, backlogs: 0 } },
      { roll: 'MCA2024011', name: 'Kevin Hart', email: 'kevin.mca@system.com', metrics: { attendance: 68, assignment: 50, internal: 50, cgpa: 6.8, study: 3, backlogs: 0 } },
      { roll: 'MCA2024012', name: 'Laura Croft', email: 'laura.mca@system.com', metrics: { attendance: 80, assignment: 85, internal: 70, cgpa: 8.1, study: 4, backlogs: 0 } }
    ];

    for (const s of studentData) {
      // Create User
      const user = await User.create({ name: s.name, email: s.email, password: s.roll.toLowerCase(), role: 'student' });

      // Run ML Prediction
      console.log(`Running ML Prediction for ${s.name}...`);
      const predictionPayload = {
        attendancePercentage: s.metrics.attendance,
        assignmentMarks: s.metrics.assignment,
        internalMarks: s.metrics.internal,
        previousCGPA: s.metrics.cgpa,
        studyHours: s.metrics.study
      };
      
      const predictionResult = await predictStudentPerformance(predictionPayload);

      // Create Student
      const student = await Student.create({
        rollNumber: s.roll,
        name: s.name,
        email: s.email,
        department: savedDepts['COMP']._id,
        course: savedCourses['MCA']._id,
        academicYear: currentYearObj._id,
        semester: mcaSem1._id,
        assignedFaculty: firstFacultyUser._id,
        enrolledSubjects: mcaSubjects.map(sub => sub._id),
        attendancePercentage: s.metrics.attendance,
        assignmentMarks: s.metrics.assignment,
        internalMarks: s.metrics.internal,
        previousCGPA: s.metrics.cgpa,
        studyHours: s.metrics.study,
        backlogs: s.metrics.backlogs,
        prediction: {
          result: predictionResult.result,
          confidence: predictionResult.confidence,
          suggestions: predictionResult.suggestions,
          predictedAt: new Date()
        }
      });

      // Create Subject Marks
      console.log(`Seeding subject marks for ${s.name}...`);
      for (const subject of mcaSubjects) {
        const maxInt = subject.maxInternalMarks || 40;
        const maxExt = subject.maxExternalMarks || 60;

        const scale = s.metrics.cgpa / 10;

        const mockIntMarks = Math.min(maxInt, Math.round(maxInt * scale + (Math.random() * 5 - 2)));
        const mockExtMarks = Math.min(maxExt, Math.round(maxExt * scale + (Math.random() * 8 - 4)));

        // Internal Marks
        await MarksRecord.create({
          student: student._id,
          subject: subject._id,
          faculty: firstFacultyUser._id,
          assessmentType: 'Internal 1',
          marksObtained: Math.max(0, mockIntMarks),
          maxMarks: maxInt
        });

        // External Marks
        await MarksRecord.create({
          student: student._id,
          subject: subject._id,
          faculty: firstFacultyUser._id,
          assessmentType: 'End Semester',
          marksObtained: Math.max(0, mockExtMarks),
          maxMarks: maxExt
        });
      }
    }

    console.log('✅ DATABASE FULLY SEEDED IN A SINGLE SHOT!');
    process.exit();
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedAll();
