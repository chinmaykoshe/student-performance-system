const mongoose = require('mongoose');
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const SkillAssessment = require('../models/SkillAssessment');
const { Project, Task, Message, Event, TeamGroup } = require('../models/Workspace');

async function wipeAndSeed() {
  try {
    console.log('--- NUKING ENTIRE DATABASE ---');
    // Drop the entire database to guarantee EVERYTHING is deleted
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
      console.log('Database completely wiped!');
    } else {
      console.log('No DB connection found to drop.');
    }

    console.log('--- SEEDING EXTENSIVE DUMMY DATA ---');
    
    // 1. Core Users (Plain Text Passwords as requested)
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
      role: 'faculty'
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
      department: 'Computer Applications (MCA)'
    });

    // 3. Extensive Student Data
    const studentsData = [
      {
        user: studentUser1._id, name: studentUser1.name, email: studentUser1.email,
        rollNumber: 'MCA-2026-001', department: 'Computer Applications (MCA)', semester: 4,
        attendancePercentage: 85, assignmentMarks: 90, internalMarks: 88, previousCGPA: 8.5, studyHours: 5, backlogs: 0,
        prediction: { result: 'Pass', confidence: 92, lastCalculated: new Date() }
      },
      {
        user: studentUser2._id, name: studentUser2.name, email: studentUser2.email,
        rollNumber: 'MCA-2026-002', department: 'Computer Applications (MCA)', semester: 4,
        attendancePercentage: 60, assignmentMarks: 45, internalMarks: 40, previousCGPA: 5.5, studyHours: 2, backlogs: 2,
        isFlagged: true, flagReason: 'Low attendance and marks',
        prediction: { result: 'Fail', confidence: 85, lastCalculated: new Date() }
      },
      {
        user: studentUser3._id, name: studentUser3.name, email: studentUser3.email,
        rollNumber: 'MCA-2026-003', department: 'Computer Applications (MCA)', semester: 4,
        attendancePercentage: 95, assignmentMarks: 98, internalMarks: 95, previousCGPA: 9.8, studyHours: 6, backlogs: 0,
        prediction: { result: 'Pass', confidence: 99, lastCalculated: new Date() }
      },
      {
        user: studentUser4._id, name: studentUser4.name, email: studentUser4.email,
        rollNumber: 'MCA-2026-004', department: 'Information Technology (IT)', semester: 2,
        attendancePercentage: 72, assignmentMarks: 65, internalMarks: 60, previousCGPA: 7.1, studyHours: 3, backlogs: 1,
        prediction: { result: 'Pass', confidence: 60, lastCalculated: new Date() }
      },
      {
        user: studentUser5._id, name: studentUser5.name, email: studentUser5.email,
        rollNumber: 'MCA-2026-005', department: 'Computer Science (CS)', semester: 6,
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
      { user: studentUser3._id, category: 'Data Science', score: 95, answers: [] },
      { user: studentUser4._id, category: 'Programming Fundamentals', score: 65, answers: [] },
      { user: studentUser5._id, category: 'Web Development', score: 30, answers: [] }
    ]);

    // 5. Admin Workspaces Data
    await Project.create([
      { title: 'Curriculum Revamp', owner: 'Admin Team', status: 'In progress', dueDate: '2026-08-15' },
      { title: 'Campus Wi-Fi Upgrade', owner: 'IT Dept', status: 'Planned', dueDate: '2026-09-01' },
      { title: 'Annual Tech Fest', owner: 'Student Council', status: 'Review', dueDate: '2026-10-20' },
      { title: 'Alumni Network Portal', owner: 'Placement Cell', status: 'In progress', dueDate: '2026-11-05' },
      { title: 'Library Digitalization', owner: 'Library Staff', status: 'Planned', dueDate: '2026-12-01' }
    ]);

    await Task.create([
      { title: 'Approve new syllabus', priority: 'High', due: '2026-07-10' },
      { title: 'Order lab equipment', priority: 'Medium', due: '2026-07-25' },
      { title: 'Send newsletters', priority: 'Low', due: '2026-07-30' },
      { title: 'Review faculty applications', priority: 'High', due: '2026-08-01' },
      { title: 'Schedule guest lectures', priority: 'Medium', due: '2026-08-15' }
    ]);

    await Message.create([
      { sender: 'Dr. Connor', content: 'The mid-term papers have been graded. Check the portal.', timeString: '09:30 AM' },
      { sender: 'IT Support', content: 'Server maintenance scheduled for tonight from 2 AM to 4 AM.', timeString: '02:15 PM' },
      { sender: 'Dean Office', content: 'Mandatory faculty meeting tomorrow at 10 AM in the main hall.', timeString: '04:00 PM' },
      { sender: 'System Admin', content: 'Database migration completed successfully. Passwords are now plain text.', timeString: '05:45 PM' }
    ]);

    await Event.create([
      { title: 'Mid-term Exams Start', time: '09:00 AM', date: '2026-07-15' },
      { title: 'Faculty Meeting', time: '10:00 AM', date: '2026-07-02' },
      { title: 'Tech Symposium', time: '11:00 AM', date: '2026-08-05' },
      { title: 'Freshers Orientation', time: '09:30 AM', date: '2026-09-01' },
      { title: 'Convocation Ceremony', time: '02:00 PM', date: '2026-12-15' }
    ]);

    await TeamGroup.create([
      { name: 'Admissions Committee', ownership: 'Registrar', membersCount: 5 },
      { name: 'Disciplinary Board', ownership: 'Dean', membersCount: 3 },
      { name: 'IT Infrastructure', ownership: 'Head of IT', membersCount: 8 },
      { name: 'Cultural Committee', ownership: 'Student Activities Coordinator', membersCount: 12 },
      { name: 'Research Wing', ownership: 'Head of Research', membersCount: 15 }
    ]);

    console.log('--- SEEDING COMPLETE ---');
    console.log('Login with:');
    console.log('Admin: admin@system.com / admin');
    console.log('Faculty: faculty@system.com / faculty');
    console.log('Student: john@system.com / student');

  } catch (err) {
    console.error('Error in seeder:', err);
  }
}

module.exports = wipeAndSeed;
