const PDFDocument = require('pdfkit');
const Student = require('../models/Student');

// @desc    Generate ATS-Friendly PDF Resume
// @route   POST /api/resume/generate
// @access  Private (Student)
exports.generateResumePDF = async (req, res) => {
  try {
    const student = await Student.findOne({ email: req.user.email })
      .populate('department', 'name')
      .populate('semester', 'name');
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student profile not found' });
    }

    const { customProjects, customExperience } = req.body;

    // Create a PDF Document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 40, right: 40 }
    });

    // Set Response Headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Resume_${student.name.replace(/\s+/g, '_')}.pdf`);

    // Pipe PDF directly to response
    doc.pipe(res);

    // ─── Header Section ──────────────────────────────────────────────────────
    doc
      .font('Helvetica-Bold')
      .fontSize(22)
      .fillColor('#0f172a') // Slate 900
      .text(student.name, { align: 'center' });

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#475569') // Slate 600
      .text(`Email: ${student.email}  |  Roll Number: ${student.rollNumber}`, { align: 'center' })
      .moveDown(0.4);

    doc
      .text(`Department: ${student.department?.name || student.department || '—'}  |  Current Semester: ${student.semester?.name || student.semester || '—'}`, { align: 'center' })
      .moveDown(1.5);

    // Divider Line
    const drawDivider = () => {
      doc
        .strokeColor('#cbd5e1') // Slate 300
        .lineWidth(1)
        .moveTo(40, doc.y)
        .lineTo(555, doc.y)
        .stroke()
        .moveDown(0.8);
    };

    // ─── Section Header Helper ────────────────────────────────────────────────
    const addSectionHeader = (title) => {
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .fillColor('#0284c7') // Brand Sky Blue
        .text(title.toUpperCase(), { characterSpacing: 1 })
        .moveDown(0.4);
      drawDivider();
    };

    // ─── Education Section ────────────────────────────────────────────────────
    addSectionHeader('Education');
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#0f172a')
      .text(`Bharati Vidyapeeth's Institute of Management & Entrepreneurship Development`, { continued: true })
      .font('Helvetica')
      .fillColor('#475569')
      .text(` — Navi Mumbai, India`, { align: 'left' });

    doc
      .font('Helvetica-Oblique')
      .text(`${student.department?.name || student.department || '—'} (${student.semester?.name || student.semester || '—'})`, { continued: true })
      .font('Helvetica')
      .text(` | Current CGPA: ${student.previousCGPA}/10.0`, { align: 'left' })
      .moveDown(1.2);

    // ─── Academic Performance & Statistics ──────────────────────────────────
    addSectionHeader('Academic Performance Summary (AI Analyzed)');
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#0f172a')
      .text(`Current Term Attendance: `, { continued: true })
      .font('Helvetica')
      .fillColor('#475569')
      .text(`${student.attendancePercentage}%`, { continued: true })
      .font('Helvetica-Bold')
      .fillColor('#0f172a')
      .text(`  |  Internal Exam Marks: `, { continued: true })
      .font('Helvetica')
      .fillColor('#475569')
      .text(`${student.internalMarks}/100`, { align: 'left' })
      .moveDown(0.3);

    const isPassing = student.prediction?.result === 'Pass';
    doc
      .font('Helvetica-Bold')
      .fillColor('#0f172a')
      .text(`AI Prediction Status: `, { continued: true })
      .font('Helvetica')
      .fillColor(isPassing ? '#059669' : '#dc2626') // Green or Red
      .text(`${student.prediction?.result || 'N/A'} (Confidence Score: ${student.prediction?.confidence || 0}%)`, { align: 'left' })
      .moveDown(1.2);

    // ─── Technical Skills ─────────────────────────────────────────────────────
    addSectionHeader('Technical Skills');
    const skillsList = [
      `Programming: Programming Fundamentals, JavaScript, Python`,
      `Development: Web Development, Database Management (MongoDB, SQL)`,
      `Strengths: Analytical Thinking, Study consistency (${student.studyHours} hours/day)`
    ];
    
    doc.font('Helvetica').fontSize(10).fillColor('#475569');
    skillsList.forEach((skill) => {
      doc.text(`• ${skill}`).moveDown(0.3);
    });
    doc.moveDown(0.9);

    // ─── Completed Roadmap Achievements ─────────────────────────────────────
    const milestones = student.roadmapMilestones || [];
    const completedMilestones = milestones.filter((m) => m.completed);
    
    if (completedMilestones.length > 0) {
      addSectionHeader('Roadmap Goals & Achievements');
      doc.font('Helvetica').fontSize(10).fillColor('#475569');
      completedMilestones.forEach((milestone) => {
        doc.text(`• Successfully Completed: ${milestone.title}`).moveDown(0.3);
      });
      doc.moveDown(0.9);
    }

    // ─── Projects Section ────────────────────────────────────────────────────
    addSectionHeader('Academic & Personal Projects');
    if (customProjects && customProjects.length > 0) {
      customProjects.forEach((proj) => {
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('#0f172a')
          .text(proj.title)
          .font('Helvetica')
          .fillColor('#475569')
          .text(proj.description)
          .moveDown(0.6);
      });
    } else {
      // Default placeholder project
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#0f172a')
        .text(`AI Student Performance Prediction Portal (MERN & Flask)`)
        .font('Helvetica')
        .fillColor('#475569')
        .text(`Implemented a secure web application utilizing React, Express, MongoDB, and a Flask Random Forest ML API to forecast student success, manage learning roadmaps, and generate ATS-friendly resumes.`)
        .moveDown(0.6);
    }
    doc.moveDown(0.6);

    // ─── Experience Section (Optional) ──────────────────────────────────────
    if (customExperience && customExperience.length > 0) {
      addSectionHeader('Professional Experience');
      customExperience.forEach((exp) => {
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('#0f172a')
          .text(`${exp.role} — ${exp.company}`)
          .font('Helvetica')
          .fillColor('#475569')
          .text(exp.description)
          .moveDown(0.6);
      });
    }

    // End Document
    doc.end();

  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
