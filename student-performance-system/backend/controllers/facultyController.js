const Student = require('../models/Student');
const Subject = require('../models/Subject');
const AttendanceRecord = require('../models/AttendanceRecord');
const MarksRecord = require('../models/MarksRecord');

// Get subjects assigned to the logged-in faculty
exports.getMySubjects = async (req, res) => {
  try {
    const user = req.user;
    if (!user.assignedSubjects || user.assignedSubjects.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const subjects = await Subject.find({ _id: { $in: user.assignedSubjects } })
      .populate('course', 'name code')
      .sort('semesterNumber');

    res.status(200).json({ success: true, count: subjects.length, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get students enrolled in a specific subject (only if faculty is assigned to it)
exports.getStudentsBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    // Authorization check
    if (!req.user.assignedSubjects.includes(subjectId) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to view students for this subject.' });
    }

    // Students are enrolled in subjects via the `enrolledSubjects` array on Student model
    const students = await Student.find({ enrolledSubjects: subjectId })
      .populate('course', 'name code')
      .populate('semester', 'name number')
      .sort('rollNumber');

    res.status(200).json({ success: true, count: students.length, data: students });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Batch mark attendance
exports.markAttendance = async (req, res) => {
  try {
    const { subjectId, date, records } = req.body; // records: [{ studentId, status, remarks }]

    if (!req.user.assignedSubjects.includes(subjectId) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to mark attendance for this subject.' });
    }

    // Upsert attendance records
    const attendanceOps = records.map(record => ({
      updateOne: {
        filter: { student: record.studentId, subject: subjectId, date: new Date(date) },
        update: {
          $set: {
            faculty: req.user._id,
            status: record.status,
            remarks: record.remarks || ''
          }
        },
        upsert: true
      }
    }));

    await AttendanceRecord.bulkWrite(attendanceOps);

    res.status(200).json({ success: true, message: 'Attendance recorded successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Batch enter marks
exports.enterMarks = async (req, res) => {
  try {
    const { subjectId, assessmentType, maxMarks, records } = req.body; // records: [{ studentId, marksObtained, remarks }]

    if (!req.user.assignedSubjects.includes(subjectId) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to enter marks for this subject.' });
    }

    const marksOps = records.map(record => ({
      updateOne: {
        filter: { student: record.studentId, subject: subjectId, assessmentType },
        update: {
          $set: {
            faculty: req.user._id,
            marksObtained: record.marksObtained,
            maxMarks: maxMarks,
            remarks: record.remarks || ''
          }
        },
        upsert: true
      }
    }));

    await MarksRecord.bulkWrite(marksOps);

    res.status(200).json({ success: true, message: 'Marks recorded successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Fetch attendance for a subject on a specific date
exports.getAttendanceByDate = async (req, res) => {
  try {
    const { subjectId, date } = req.query;
    
    if (!req.user.assignedSubjects.includes(subjectId) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized.' });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const records = await AttendanceRecord.find({
      subject: subjectId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Fetch marks for a subject and assessment type
exports.getMarksByAssessment = async (req, res) => {
  try {
    const { subjectId, assessmentType } = req.query;

    if (!req.user.assignedSubjects.includes(subjectId) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized.' });
    }

    const records = await MarksRecord.find({
      subject: subjectId,
      assessmentType
    });

    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
