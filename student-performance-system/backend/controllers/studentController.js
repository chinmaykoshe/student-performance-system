const Student = require('../models/Student');
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const { predictStudentPerformance } = require('../utils/predictionService');
const { sendLowAttendanceAlert, sendLowMarksAlert, sendPredictionNotification } = require('../utils/emailService');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { createLog } = require('./systemController');

const Department = require('../models/Department');
const Course = require('../models/Course');
const AcademicYear = require('../models/AcademicYear');
const Semester = require('../models/Semester');
const Subject = require('../models/Subject');
const MarksRecord = require('../models/MarksRecord');

// @desc    Get all students
// @route   GET /api/students
// @access  Private (Admin, Faculty)
exports.getStudents = async (req, res) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude from filtering
    const removeFields = ['select', 'sort', 'page', 'limit', 'search'];
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Parse back to object
    let finalQueryObj = JSON.parse(queryStr);

    // Handle Search
    if (req.query.search) {
      finalQueryObj.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { rollNumber: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Role-based filtering: Faculty only sees assigned students or students in their department
    if (req.user.role === 'faculty') {
      const faculty = await Faculty.findOne({ email: req.user.email });
      if (faculty) {
        // Option 1: Filter by assigned department
        finalQueryObj.department = faculty.department;
      }
    }

    query = Student.find(finalQueryObj);

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Populate references so frontend gets readable values
    query = query
      .populate('department', 'name code')
      .populate('course', 'name code')
      .populate('semester', 'name number')
      .populate('academicYear', 'year');

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('rollNumber');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Student.countDocuments(finalQueryObj);

    query = query.skip(startIndex).limit(limit);

    // Execute query
    const students = await query.populate('assignedFaculty', 'name email');

    // Pagination result
    const pagination = {};
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: students.length,
      total,
      pagination,
      data: students
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('department', 'name code')
      .populate('course', 'name code')
      .populate('academicYear', 'year')
      .populate('semester', 'name number')
      .populate('enrolledSubjects', 'name code type credits maxTotalMarks')
      .populate('assignedFaculty', 'name email');

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    // Security Check: Students can only view their own profile
    if (req.user.role === 'student' && req.user.email !== student.email) {
      return res.status(403).json({ success: false, error: 'Not authorized to view other students' });
    }

    res.status(200).json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update current student metrics
// @route   PUT /api/students/my-metrics
// @access  Private (Student)
exports.updateMyMetrics = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, error: 'Only students can update their own metrics' });
    }

    const { attendancePercentage, assignmentMarks, internalMarks, studyHours, previousCGPA } = req.body;
    
    // Find the student profile linked to this user email
    let student = await Student.findOne({ email: req.user.email });
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student profile not found' });
    }

    // Update only allowed fields
    if (attendancePercentage !== undefined) student.attendancePercentage = attendancePercentage;
    if (assignmentMarks !== undefined) student.assignmentMarks = assignmentMarks;
    if (internalMarks !== undefined) student.internalMarks = internalMarks;
    if (studyHours !== undefined) student.studyHours = studyHours;
    if (previousCGPA !== undefined) student.previousCGPA = previousCGPA;

    // Recalculate AI performance predictions automatically based on updated metrics
    const predictionResult = await predictStudentPerformance(student);
    student.prediction = {
      result: predictionResult.result,
      confidence: predictionResult.confidence,
      suggestions: predictionResult.suggestions,
      predictedAt: new Date()
    };

    await student.save();

    res.status(200).json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Create student
// @route   POST /api/students
// @access  Private (Admin)
exports.createStudent = async (req, res) => {
  try {
    const {
      rollNumber,
      name,
      email,
      department,   // ObjectId string
      course,       // ObjectId string
      academicYear, // ObjectId string
      semester,     // ObjectId string
      division,
      enrolledSubjects,
      attendancePercentage,
      assignmentMarks,
      internalMarks,
      previousCGPA,
      studyHours,
      backlogs
    } = req.body;

    // Check if student user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, error: 'User with this email already exists' });
    }

    // Check if roll number already exists
    let existingStudent = await Student.findOne({ rollNumber: rollNumber.toUpperCase() });
    if (existingStudent) {
      return res.status(400).json({ success: false, error: 'Student with this roll number already exists' });
    }

    // Create a User account for the student
    user = await User.create({
      name,
      email,
      password: `${email.toLowerCase()}@123`,
      role: 'student'
    });

    // Create student profile
    const student = await Student.create({
      rollNumber,
      name,
      email,
      department,
      course,
      academicYear,
      semester,
      division: division || 'A',
      enrolledSubjects: enrolledSubjects || [],
      attendancePercentage: attendancePercentage || 0,
      assignmentMarks: assignmentMarks || 0,
      internalMarks: internalMarks || 0,
      previousCGPA: previousCGPA || 0,
      studyHours: studyHours || 0,
      backlogs: backlogs || 0
    });

    // Generate ML prediction
    const predictionResult = await predictStudentPerformance(student);
    student.prediction = {
      result: predictionResult.result,
      confidence: predictionResult.confidence,
      suggestions: predictionResult.suggestions,
      predictedAt: new Date()
    };
    await student.save();

    if (student.attendancePercentage < 75.0) {
      sendLowAttendanceAlert(student);
      createLog('EMAIL_ALERT', 'system', `Sent low attendance alert to ${student.name} (${student.email})`);
    }
    if (student.internalMarks < 40.0) {
      sendLowMarksAlert(student);
      createLog('EMAIL_ALERT', 'system', `Sent low internal marks alert to ${student.name} (${student.email})`);
    }
    sendPredictionNotification(student);

    createLog('STUDENT_CREATE', req.user.email, `Created student record for ${student.name} (${student.rollNumber})`);

    res.status(201).json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Self-setup student profile (for newly registered / OAuth students)
// @route   POST /api/students/setup
// @access  Private (Student)
exports.setupProfile = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, error: 'Only students can set up their profile' });
    }

    const {
      rollNumber,
      department,
      course,
      academicYear,
      semester,
      division,
      attendancePercentage,
      assignmentMarks,
      internalMarks,
      previousCGPA,
      studyHours,
      backlogs
    } = req.body;

    const email = req.user.email;
    const name = req.user.name || 'Student';

    let existingProfile = await Student.findOne({ email });
    if (existingProfile) {
      return res.status(400).json({ success: false, error: 'Student profile already exists for this account' });
    }

    let existingRoll = await Student.findOne({ rollNumber: rollNumber.toUpperCase() });
    if (existingRoll) {
      return res.status(400).json({ success: false, error: 'Student with this roll number already exists' });
    }

    const student = await Student.create({
      rollNumber,
      name,
      email,
      department,
      course,
      academicYear,
      semester,
      division: division || 'A',
      enrolledSubjects: [],
      attendancePercentage: attendancePercentage || 0,
      assignmentMarks: assignmentMarks || 0,
      internalMarks: internalMarks || 0,
      previousCGPA: previousCGPA || 0,
      studyHours: studyHours || 0,
      backlogs: backlogs || 0
    });

    const predictionResult = await predictStudentPerformance(student);
    student.prediction = {
      result: predictionResult.result,
      confidence: predictionResult.confidence,
      suggestions: predictionResult.suggestions,
      predictedAt: new Date()
    };
    await student.save();

    createLog('STUDENT_SETUP', req.user.email, `Student completed their own profile setup (${student.rollNumber})`);

    res.status(201).json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private (Admin, Faculty)
exports.updateStudent = async (req, res) => {
  try {
    let student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    // Fields role based restrictions
    let fieldsToUpdate = {};

    if (req.user.role === 'admin') {
      // Admin can update all fields
      fieldsToUpdate = { ...req.body };
      
      // Update corresponding User email/name if changed
      if (req.body.email || req.body.name) {
        const user = await User.findOne({ email: student.email });
        if (user) {
          if (req.body.name) user.name = req.body.name;
          if (req.body.email) user.email = req.body.email;
          await user.save();
        }
      }
    } else if (req.user.role === 'faculty') {
      // Faculty can only update academic performance statistics
      const allowedFields = [
        'attendancePercentage',
        'assignmentMarks',
        'internalMarks',
        'previousCGPA',
        'studyHours',
        'backlogs'
      ];
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          fieldsToUpdate[field] = req.body[field];
        }
      });
    }

    // Update fields in database
    student = await Student.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    // Re-generate ML prediction automatically since academic stats changed
    const predictionResult = await predictStudentPerformance(student);
    student.prediction = {
      result: predictionResult.result,
      confidence: predictionResult.confidence,
      suggestions: predictionResult.suggestions,
      predictedAt: new Date()
    };
    await student.save();

    // Trigger low attendance or marks alerts
    if (student.attendancePercentage < 75.0) {
      sendLowAttendanceAlert(student);
      createLog('EMAIL_ALERT', 'system', `Sent low attendance alert to ${student.name} (${student.email})`);
    }
    if (student.internalMarks < 40.0) {
      sendLowMarksAlert(student);
      createLog('EMAIL_ALERT', 'system', `Sent low internal marks alert to ${student.name} (${student.email})`);
    }
    sendPredictionNotification(student);

    createLog('STUDENT_UPDATE', req.user.email, `Updated student record for ${student.name} (${student.rollNumber})`);

    res.status(200).json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private (Admin)
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    // Delete related User account
    await User.findOneAndDelete({ email: student.email });

    // Delete Student profile
    await Student.findByIdAndDelete(req.params.id);

    createLog('STUDENT_DELETE', req.user.email, `Deleted student ${student.name} (${student.rollNumber})`);

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Predict student performance manually (trigger prediction)
// @route   POST /api/students/:id/predict
// @access  Private (Admin, Faculty)
exports.predictStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const predictionResult = await predictStudentPerformance(student);
    student.prediction = {
      result: predictionResult.result,
      confidence: predictionResult.confidence,
      suggestions: predictionResult.suggestions,
      predictedAt: new Date()
    };
    await student.save();

    sendPredictionNotification(student);

    res.status(200).json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Import students from CSV / Excel file
// @route   POST /api/students/import
// @access  Private (Admin)
exports.importStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a CSV or Excel file' });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    let records = [];

    if (fileExtension === '.csv') {
      // Parse CSV
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => {
            records.push(row);
          })
          .on('end', resolve)
          .on('error', reject);
      });
    } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      // Parse Excel
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      records = XLSX.utils.sheet_to_json(sheet);
    } else {
      fs.unlinkSync(filePath); // clean up
      return res.status(400).json({ success: false, error: 'Unsupported file type. Upload CSV or Excel.' });
    }

    // Process records
    const importedStudents = [];
    const errors = [];

    for (let record of records) {
      try {
        // Map columns correctly (case-insensitive checks)
        const rollNumber = record['Roll Number'] || record['rollNumber'] || record['RollNo'];
        const name = record['Name'] || record['name'];
        const email = record['Email'] || record['email'];
        const department = record['Department'] || record['department'] || 'Computer Applications (MCA)';
        const semester = parseInt(record['Semester'] || record['semester'] || 1);
        const attendancePercentage = parseFloat(record['Attendance Percentage'] || record['attendancePercentage'] || record['Attendance'] || 75);
        const assignmentMarks = parseFloat(record['Assignment Marks'] || record['assignmentMarks'] || 75);
        const internalMarks = parseFloat(record['Internal Marks'] || record['internalMarks'] || 75);
        const previousCGPA = parseFloat(record['Previous Semester CGPA'] || record['previousCGPA'] || record['CGPA'] || 7.0);
        const studyHours = parseFloat(record['Study Hours'] || record['studyHours'] || 4);
        const backlogs = parseInt(record['Backlogs'] || record['backlogs'] || 0);

        if (!rollNumber || !name || !email) {
          errors.push({ record, error: 'Roll Number, Name, and Email are required.' });
          continue;
        }

        // Check if student exists
        let student = await Student.findOne({ rollNumber: rollNumber.toUpperCase() });
        let user = await User.findOne({ email });

        // Dynamically resolve references
        let deptDoc = await Department.findOne({
          $or: [
            { name: { $regex: new RegExp('^' + department.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') } },
            { code: { $regex: new RegExp('^' + department.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') } }
          ]
        });
        if (!deptDoc) deptDoc = await Department.findOne({});

        let courseDoc = await Course.findOne({ department: deptDoc?._id });
        if (!courseDoc) courseDoc = await Course.findOne({});

        let yearDoc = await AcademicYear.findOne({ isCurrent: true });
        if (!yearDoc) yearDoc = await AcademicYear.findOne({});

        let semDoc = await Semester.findOne({ 
          course: courseDoc?._id,
          number: semester
        });
        if (!semDoc) {
          semDoc = await Semester.findOne({ course: courseDoc?._id }) || await Semester.findOne({});
        }

        if (!student) {
          if (!user) {
            // Create user
            user = await User.create({
              name,
              email,
              password: `${email.toLowerCase()}@123`,
              role: 'student'
            });
          }

          // Create student with resolved ObjectIds
          student = new Student({
            rollNumber,
            name,
            email,
            department: deptDoc?._id,
            course: courseDoc?._id,
            academicYear: yearDoc?._id,
            semester: semDoc?._id,
            division: 'A',
            attendancePercentage,
            assignmentMarks,
            internalMarks,
            previousCGPA,
            studyHours,
            backlogs
          });
        } else {
          // Update existing student with resolved ObjectIds
          student.name = name;
          student.email = email;
          student.department = deptDoc?._id;
          student.course = courseDoc?._id;
          student.academicYear = yearDoc?._id;
          student.semester = semDoc?._id;
          student.attendancePercentage = attendancePercentage;
          student.assignmentMarks = assignmentMarks;
          student.internalMarks = internalMarks;
          student.previousCGPA = previousCGPA;
          student.studyHours = studyHours;
          student.backlogs = backlogs;
        }

        // Run prediction
        const predictionResult = await predictStudentPerformance(student);
        student.prediction = {
          result: predictionResult.result,
          confidence: predictionResult.confidence,
          suggestions: predictionResult.suggestions,
          predictedAt: new Date()
        };

        await student.save();
        importedStudents.push(student);

        // Low attendance & marks alert checks
        if (student.attendancePercentage < 75.0) {
          sendLowAttendanceAlert(student);
        }
        if (student.internalMarks < 40.0) {
          sendLowMarksAlert(student);
        }
      } catch (err) {
        errors.push({ record, error: err.message });
      }
    }

    // Delete the temp upload file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    createLog('STUDENT_IMPORT', req.user.email, `Bulk imported student records. Processed: ${records.length}, Success: ${importedStudents.length}, Errors: ${errors.length}`);

    res.status(200).json({
      success: true,
      message: `Processed ${records.length} records. Successfully imported ${importedStudents.length} students.`,
      errorsCount: errors.length,
      errors
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Export students report as Excel
// @route   GET /api/reports/excel
// @access  Private (Admin, Faculty)
exports.exportExcel = async (req, res) => {
  try {
    let queryObj = {};
    if (req.user.role === 'faculty') {
      const faculty = await Faculty.findOne({ email: req.user.email });
      if (faculty) {
        queryObj.department = faculty.department;
      }
    }

    const students = await Student.find(queryObj)
      .populate('department', 'name')
      .populate('semester', 'name');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Student Performance Report');

    // Add Columns
    worksheet.columns = [
      { header: 'Roll Number', key: 'rollNumber', width: 15 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Department', key: 'department', width: 25 },
      { header: 'Semester', key: 'semester', width: 15 },
      { header: 'Attendance %', key: 'attendancePercentage', width: 15 },
      { header: 'Assignment Marks', key: 'assignmentMarks', width: 18 },
      { header: 'Internal Marks', key: 'internalMarks', width: 15 },
      { header: 'CGPA', key: 'previousCGPA', width: 10 },
      { header: 'Study Hours', key: 'studyHours', width: 12 },
      { header: 'Backlogs', key: 'backlogs', width: 10 },
      { header: 'Prediction Result', key: 'predictionResult', width: 18 },
      { header: 'Confidence %', key: 'confidence', width: 15 }
    ];

    // Style Header Row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1A365D' } // Deep dark Navy blue
    };

    // Add Data
    students.forEach(student => {
      worksheet.addRow({
        rollNumber: student.rollNumber,
        name: student.name,
        email: student.email,
        department: student.department?.name || student.department || '—',
        semester: student.semester?.name || student.semester || '—',
        attendancePercentage: student.attendancePercentage,
        assignmentMarks: student.assignmentMarks,
        internalMarks: student.internalMarks,
        previousCGPA: student.previousCGPA,
        studyHours: student.studyHours,
        backlogs: student.backlogs,
        predictionResult: student.prediction ? student.prediction.result : 'Pending',
        confidence: student.prediction ? student.prediction.confidence : 0
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + 'Student_Performance_Report.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Export individual student report as PDF (Report Card)
// @route   GET /api/reports/pdf/:id
// @access  Private
exports.exportPDF = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('department', 'name code')
      .populate('course', 'name code')
      .populate('semester', 'name number')
      .populate('academicYear', 'year');

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    // Security Check: Students can only download their own report
    if (req.user.role === 'student' && req.user.email !== student.email) {
      return res.status(403).json({ success: false, error: 'Not authorized to download other student reports' });
    }

    // Determine target semester number
    const semNumber = parseInt(req.query.semester) || (student.semester ? student.semester.number : 1);

    // Validate that student is not trying to access future semesters
    if (student.semester && semNumber > student.semester.number) {
      return res.status(400).json({ success: false, error: 'Report card not available for future semesters.' });
    }

    // Fetch all subjects for this course and semester
    const subjects = await Subject.find({ course: student.course._id, semesterNumber: semNumber });
    if (!subjects || subjects.length === 0) {
      return res.status(400).json({ success: false, error: 'No subjects registered for this semester yet.' });
    }

    // Fetch marks records for this student and subjects
    const subjectIds = subjects.map(s => s._id);
    const marksRecords = await MarksRecord.find({
      student: student._id,
      subject: { $in: subjectIds }
    }).populate('subject');

    if (!marksRecords || marksRecords.length === 0) {
      return res.status(400).json({ success: false, error: 'No marks records found for this semester yet.' });
    }

    // Get semester name
    const semesterDoc = await Semester.findOne({
      number: semNumber,
      course: student.course._id,
      academicYear: student.academicYear._id
    });
    const semesterName = semesterDoc ? semesterDoc.name : `Semester ${semNumber}`;

    // Compile marks data per subject
    const subjectMarks = subjects.map(sub => {
      // Find internal & external records
      const internalRec = marksRecords.find(r => r.subject._id.toString() === sub._id.toString() && r.assessmentType === 'Internal 1');
      const externalRec = marksRecords.find(r => r.subject._id.toString() === sub._id.toString() && r.assessmentType === 'End Semester');

      const internalObtained = internalRec ? internalRec.marksObtained : 0;
      const externalObtained = externalRec ? externalRec.marksObtained : 0;

      const totalObtained = internalObtained + externalObtained;
      const maxTotal = sub.maxTotalMarks || 100;
      const pct = (totalObtained / maxTotal) * 100;

      // Grade logic
      let grade = 'F';
      if (pct >= 90) grade = 'O';
      else if (pct >= 80) grade = 'A+';
      else if (pct >= 70) grade = 'A';
      else if (pct >= 60) grade = 'B+';
      else if (pct >= 50) grade = 'B';
      else if (pct >= 40) grade = 'C';

      const status = pct >= 40 ? 'Pass' : 'Fail';

      return {
        code: sub.code,
        name: sub.name,
        credits: sub.credits,
        internalObtained,
        maxInternal: sub.maxInternalMarks || 40,
        externalObtained,
        maxExternal: sub.maxExternalMarks || 60,
        totalObtained,
        maxTotal,
        grade,
        status
      };
    });

    // Calculate overall statistics
    const totalCredits = subjectMarks.reduce((sum, s) => sum + s.credits, 0);
    const totalObtainedMarks = subjectMarks.reduce((sum, s) => sum + s.totalObtained, 0);
    const totalMaxMarks = subjectMarks.reduce((sum, s) => sum + s.maxTotal, 0);
    const overallPercentage = totalMaxMarks > 0 ? ((totalObtainedMarks / totalMaxMarks) * 100).toFixed(2) : '0.00';
    const isOverallPass = subjectMarks.every(s => s.status === 'Pass');

    // Create PDF Document
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Marksheet_Sem${semNumber}_${student.rollNumber}.pdf`
    );

    doc.pipe(res);

    // Decorative Header Banner
    doc.rect(0, 0, 595, 110).fill('#0f172a'); // Slate-900 Theme

    // Banner Text
    doc.fillColor('#ffffff');
    doc.fontSize(22).font('Helvetica-Bold').text('ACADEMIC MARKSHEET / TRANSCRIPT', 50, 35, { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Cloud-Based Student Performance Prediction System', 50, 65, { align: 'center' });
    doc.fontSize(9).fillColor('#94a3b8').text('OFFICIAL INSTITUTE RECORD', 50, 80, { align: 'center' });

    // Profile Box Layout
    doc.fillColor('#1e293b');
    doc.fontSize(12).font('Helvetica-Bold').text('STUDENT PROFILE', 50, 135, { underline: true });
    
    doc.fontSize(10).font('Helvetica');
    // 2-Column Info Grid
    const col1X = 50;
    const col2X = 320;
    
    doc.fillColor('#64748b').text('Name:', col1X, 160).fillColor('#1e293b').font('Helvetica-Bold').text(student.name, col1X + 80, 160).font('Helvetica');
    doc.fillColor('#64748b').text('Roll Number:', col1X, 175).fillColor('#1e293b').font('Helvetica-Bold').text(student.rollNumber, col1X + 80, 175).font('Helvetica');
    doc.fillColor('#64748b').text('Department:', col1X, 190).fillColor('#1e293b').text(student.department?.name || '—', col1X + 80, 190);
    doc.fillColor('#64748b').text('Course:', col1X, 205).fillColor('#1e293b').text(student.course?.name || '—', col1X + 80, 205);

    doc.fillColor('#64748b').text('Academic Year:', col2X, 160).fillColor('#1e293b').text(student.academicYear?.year || '—', col2X + 90, 160);
    doc.fillColor('#64748b').text('Semester/Term:', col2X, 175).fillColor('#1e293b').font('Helvetica-Bold').text(semesterName, col2X + 90, 175).font('Helvetica');
    doc.fillColor('#64748b').text('Division:', col2X, 190).fillColor('#1e293b').text(student.division || 'A', col2X + 90, 190);
    doc.fillColor('#64748b').text('Date of Issue:', col2X, 205).fillColor('#1e293b').text(new Date().toLocaleDateString(), col2X + 90, 205);

    // Divider Line
    doc.moveTo(50, 225).lineTo(545, 225).stroke('#cbd5e1');

    // Table Header
    const tableTop = 245;
    doc.rect(50, tableTop, 495, 25).fill('#334155'); // Slate-700
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
    doc.text('SUBJECT', 60, tableTop + 8);
    doc.text('INTERNAL', 250, tableTop + 8, { width: 60, align: 'center' });
    doc.text('EXTERNAL', 315, tableTop + 8, { width: 60, align: 'center' });
    doc.text('TOTAL', 380, tableTop + 8, { width: 60, align: 'center' });
    doc.text('GRADE', 445, tableTop + 8, { width: 50, align: 'center' });
    doc.text('STATUS', 500, tableTop + 8, { width: 40, align: 'center' });

    let currentY = tableTop + 25;
    doc.font('Helvetica').fontSize(9);

    subjectMarks.forEach((sub, idx) => {
      // Row Background Stripe
      if (idx % 2 === 1) {
        doc.rect(50, currentY, 495, 24).fill('#f8fafc');
      } else {
        doc.rect(50, currentY, 495, 24).fill('#ffffff');
      }
      
      doc.fillColor('#0f172a');
      doc.text(`${sub.name} (${sub.code})`, 60, currentY + 8, { width: 185, height: 12, ellipsis: true });
      doc.text(`${sub.internalObtained}/${sub.maxInternal}`, 250, currentY + 8, { width: 60, align: 'center' });
      doc.text(`${sub.externalObtained}/${sub.maxExternal}`, 315, currentY + 8, { width: 60, align: 'center' });
      doc.text(`${sub.totalObtained}/${sub.maxTotal}`, 380, currentY + 8, { width: 60, align: 'center' });
      
      // Highlight Grade
      doc.font('Helvetica-Bold');
      doc.text(sub.grade, 445, currentY + 8, { width: 50, align: 'center' });
      
      // Pass/Fail Color Status
      if (sub.status === 'Pass') {
        doc.fillColor('#15803d');
      } else {
        doc.fillColor('#b91c1c');
      }
      doc.text(sub.status, 500, currentY + 8, { width: 40, align: 'center' });
      doc.font('Helvetica'); // Reset font

      currentY += 24;
    });

    // Outer Border Box for Table
    doc.rect(50, tableTop, 495, currentY - tableTop).stroke('#cbd5e1');

    // Summary Section
    const summaryY = currentY + 25;
    doc.rect(50, summaryY, 495, 75).fill('#f1f5f9');
    doc.rect(50, summaryY, 495, 75).stroke('#cbd5e1');

    doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text('ACADEMIC SUMMARY', 65, summaryY + 12);
    doc.font('Helvetica').fontSize(9);

    doc.text(`Total Subjects: ${subjects.length}`, 65, summaryY + 32);
    doc.text(`Total Earned Credits: ${totalCredits}`, 65, summaryY + 48);

    doc.text(`Marks Obtained: ${totalObtainedMarks} / ${totalMaxMarks}`, 230, summaryY + 32);
    doc.text(`Percentage: ${overallPercentage}%`, 230, summaryY + 48);

    doc.text('Overall Status:', 400, summaryY + 32);
    doc.font('Helvetica-Bold');
    if (isOverallPass) {
      doc.fillColor('#15803d').text('PASS', 475, summaryY + 32);
    } else {
      doc.fillColor('#b91c1c').text('FAIL', 475, summaryY + 32);
    }

    doc.fillColor('#1e293b');
    doc.text(`Attendance: ${student.attendancePercentage}%`, 400, summaryY + 48);

    // Signatures
    const sigY = summaryY + 140;
    doc.moveTo(70, sigY).lineTo(200, sigY).stroke('#94a3b8');
    doc.moveTo(390, sigY).lineTo(520, sigY).stroke('#94a3b8');
    
    doc.fillColor('#64748b').font('Helvetica').fontSize(9);
    doc.text('Signature of Class Coordinator', 70, sigY + 5, { align: 'center', width: 130 });
    doc.text('Signature of Controller of Exams', 390, sigY + 5, { align: 'center', width: 130 });

    // Verification Footer
    doc.fontSize(8).fillColor('#94a3b8').text('This is an official document generated by the Student Performance Prediction & Management System.', 50, 750, { align: 'center', width: 495 });

    doc.end();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// QUICK WIN #4 — Content Moderation Flag
// @desc    Toggle isFlagged on a student record (admin content moderation)
// @route   PATCH /api/students/:id/flag
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────────────────────
exports.flagStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const { flagReason } = req.body;
    student.isFlagged = !student.isFlagged;
    student.flagReason = student.isFlagged ? (flagReason || 'Flagged for review') : '';
    await student.save();

    createLog(
      student.isFlagged ? 'STUDENT_FLAGGED' : 'STUDENT_UNFLAGGED',
      req.user.email,
      `${student.isFlagged ? 'Flagged' : 'Unflagged'} student ${student.name} (${student.rollNumber})`
    );

    res.status(200).json({
      success: true,
      isFlagged: student.isFlagged,
      flagReason: student.flagReason,
      data: student
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// QUICK WIN #9 — Roadmap Milestones
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Add a new milestone to a student's roadmap
// @route   POST /api/students/:id/milestones
// @access  Private
exports.addMilestone = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Milestone title is required.' });
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    if (req.user.role === 'student' && req.user.email !== student.email) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    student.roadmapMilestones.push({ title: title.trim() });
    await student.save();

    res.status(201).json({ success: true, data: student.roadmapMilestones });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Toggle completed state of a milestone
// @route   PATCH /api/students/:id/milestones/:milestoneId
// @access  Private
exports.toggleMilestone = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    if (req.user.role === 'student' && req.user.email !== student.email) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const milestone = student.roadmapMilestones.id(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, error: 'Milestone not found' });
    }

    milestone.completed = !milestone.completed;
    await student.save();

    res.status(200).json({ success: true, data: student.roadmapMilestones });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete a milestone
// @route   DELETE /api/students/:id/milestones/:milestoneId
// @access  Private (Admin)
exports.deleteMilestone = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    student.roadmapMilestones = student.roadmapMilestones.filter(
      (m) => m._id.toString() !== req.params.milestoneId
    );
    await student.save();

    res.status(200).json({ success: true, data: student.roadmapMilestones });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
