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
    const student = await Student.findById(req.params.id).populate('assignedFaculty', 'name email');

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

// @desc    Create student
// @route   POST /api/students
// @access  Private (Admin)
exports.createStudent = async (req, res) => {
  try {
    const {
      rollNumber,
      name,
      email,
      department,
      semester,
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
      password: rollNumber.toLowerCase(), // Default password is roll number (lowercase)
      role: 'student'
    });

    // Create student profile
    const student = await Student.create({
      rollNumber,
      name,
      email,
      department,
      semester,
      attendancePercentage,
      assignmentMarks,
      internalMarks,
      previousCGPA,
      studyHours,
      backlogs
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

    // Trigger email alerts asynchronously
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

        if (!student) {
          if (!user) {
            // Create user
            user = await User.create({
              name,
              email,
              password: rollNumber.toLowerCase(),
              role: 'student'
            });
          }

          // Create student
          student = new Student({
            rollNumber,
            name,
            email,
            department,
            semester,
            attendancePercentage,
            assignmentMarks,
            internalMarks,
            previousCGPA,
            studyHours,
            backlogs
          });
        } else {
          // Update existing student
          student.name = name;
          student.email = email;
          student.department = department;
          student.semester = semester;
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

    const students = await Student.find(queryObj);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Student Performance Report');

    // Add Columns
    worksheet.columns = [
      { header: 'Roll Number', key: 'rollNumber', width: 15 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Department', key: 'department', width: 25 },
      { header: 'Semester', key: 'semester', width: 10 },
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
        department: student.department,
        semester: student.semester,
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
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    // Security Check: Students can only download their own report
    if (req.user.role === 'student' && req.user.email !== student.email) {
      return res.status(403).json({ success: false, error: 'Not authorized to download other student reports' });
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Report_Card_${student.rollNumber}.pdf`
    );

    doc.pipe(res);

    // Document styling
    // Primary header box
    doc
      .rect(0, 0, 595, 120)
      .fill('#1e3a8a'); // Deep Dark Navy Blue

    doc.fillColor('#ffffff');
    doc.fontSize(20).text('ACADEMIC PERFORMANCE REPORT CARD', 50, 40, { align: 'center', bold: true });
    doc.fontSize(11).text('Cloud-Based Student Performance Prediction System', 50, 70, { align: 'center' });

    // Section 1: Student Information
    doc.fillColor('#000000').fontSize(14).text('STUDENT PROFILE', 50, 150, { underline: true });
    doc.fontSize(11);
    
    // Details layout in 2 columns
    doc.text(`Roll Number: ${student.rollNumber}`, 50, 180);
    doc.text(`Name: ${student.name}`, 50, 200);
    doc.text(`Email: ${student.email}`, 50, 220);

    doc.text(`Department: ${student.department}`, 320, 180);
    doc.text(`Semester: ${student.semester}`, 320, 200);
    doc.text(`Current Date: ${new Date().toLocaleDateString()}`, 320, 220);

    // Divider
    doc.moveTo(50, 250).lineTo(545, 250).stroke('#e5e7eb');

    // Section 2: Academic Statistics Table
    doc.fontSize(14).text('ACADEMIC STANDING', 50, 270, { underline: true });
    
    // Draw table
    const tableTop = 300;
    doc.rect(50, tableTop, 495, 20).fill('#f3f4f6');
    doc.fillColor('#000000').fontSize(10);
    doc.text('Academic Metrics', 60, tableTop + 5);
    doc.text('Values Obtained', 300, tableTop + 5, { align: 'right', width: 230 });

    const metrics = [
      { name: 'Attendance Percentage', val: `${student.attendancePercentage}%` },
      { name: 'Assignment Marks (out of 100)', val: `${student.assignmentMarks}` },
      { name: 'Internal Marks (out of 100)', val: `${student.internalMarks}` },
      { name: 'Previous Semester CGPA', val: `${student.previousCGPA}` },
      { name: 'Daily Study Hours', val: `${student.studyHours} hrs` },
      { name: 'Active Backlogs', val: `${student.backlogs}` }
    ];

    let currentY = tableTop + 20;
    metrics.forEach((m, index) => {
      // Draw background row stripes
      if (index % 2 === 1) {
        doc.rect(50, currentY, 495, 20).fill('#fafafa');
      }
      doc.fillColor('#374151');
      doc.text(m.name, 60, currentY + 5);
      doc.text(m.val, 300, currentY + 5, { align: 'right', width: 230 });
      currentY += 20;
    });

    // Divider
    doc.moveTo(50, currentY + 15).lineTo(545, currentY + 15).stroke('#e5e7eb');

    // Section 3: Performance Prediction & ML Insights
    const predictionY = currentY + 30;
    doc.fillColor('#000000').fontSize(14).text('AI-POWERED PERFORMANCE PREDICTION', 50, predictionY, { underline: true });

    // Drawing a badge for Pass/Fail
    const resultBoxColor = student.prediction.result === 'Pass' ? '#dcfce7' : '#fee2e2';
    const resultTextColor = student.prediction.result === 'Pass' ? '#15803d' : '#b91c1c';
    
    doc.rect(50, predictionY + 25, 495, 60).fill(resultBoxColor);
    
    doc.fillColor(resultTextColor).fontSize(14).text(`PREDICTED OUTCOME: ${student.prediction.result.toUpperCase()}`, 70, predictionY + 35, { bold: true });
    doc.fontSize(10).fillColor('#374151').text(`AI Confidence Level: ${student.prediction.confidence}% | Analyzed on: ${student.prediction.predictedAt ? new Date(student.prediction.predictedAt).toLocaleDateString() : new Date().toLocaleDateString()}`, 70, predictionY + 58);

    // Section 4: Actionable Recommendations
    const recY = predictionY + 105;
    doc.fillColor('#000000').fontSize(14).text('ACTIONABLE RECOMMENDATIONS', 50, recY, { underline: true });
    
    doc.fontSize(10).fillColor('#4b5563');
    let suggestionY = recY + 25;
    
    student.prediction.suggestions.forEach(sug => {
      doc.text(`•  ${sug}`, 60, suggestionY, { width: 475 });
      suggestionY += doc.heightOfString(`•  ${sug}`, { width: 475 }) + 5;
    });

    // Footer info
    doc.fontSize(8).fillColor('#9ca3af').text('Disclaimer: This is an AI-generated analysis based on Random Forest Machine Learning classifier patterns. Actual academic performance depends on exams and standard university guidelines.', 50, 740, { align: 'center', width: 495 });

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
