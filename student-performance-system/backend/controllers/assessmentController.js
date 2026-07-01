const SkillAssessment = require('../models/SkillAssessment');
const Student = require('../models/Student');
const User = require('../models/User');

// @desc    Submit assessment
// @route   POST /api/assessments/submit
// @access  Private (Student)
exports.submitAssessment = async (req, res) => {
  try {
    const { category, answers } = req.body;

    if (!category || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, error: 'Category and answers list are required' });
    }

    // Compute proficiency score
    let correctCount = 0;
    const gradedAnswers = answers.map((ans) => {
      const isCorrect = ans.selectedOption === ans.correctOption;
      if (isCorrect) correctCount++;
      return {
        question: ans.question,
        selectedOption: ans.selectedOption,
        correctOption: ans.correctOption,
        isCorrect
      };
    });

    const score = Math.round((correctCount / answers.length) * 100);

    const assessment = await SkillAssessment.create({
      user: req.user._id,
      category,
      score,
      answers: gradedAnswers
    });

    res.status(201).json({
      success: true,
      data: assessment
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get current user's assessments
// @route   GET /api/assessments/my
// @access  Private (Student)
exports.getMyAssessments = async (req, res) => {
  try {
    const assessments = await SkillAssessment.find({ user: req.user._id }).sort('-createdAt');
    res.status(200).json({ success: true, count: assessments.length, data: assessments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get all assessment metrics (Admin, Faculty)
// @route   GET /api/assessments/all
// @access  Private (Admin, Faculty)
exports.getAllAssessments = async (req, res) => {
  try {
    const assessments = await SkillAssessment.find({})
      .populate('user', 'name email role')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: assessments.length, data: assessments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Assign an assessment to a student manually
// @route   POST /api/assessments/assign
// @access  Private (Admin, Faculty)
exports.assignAssessment = async (req, res) => {
  try {
    const { studentId, category, score } = req.body;
    
    if (!studentId || !category || score === undefined) {
      return res.status(400).json({ success: false, error: 'Student ID, category, and score are required.' });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, error: 'Student not found.' });
    }

    const assessment = await SkillAssessment.create({
      user: studentId,
      category,
      score: Number(score),
      answers: []
    });

    await assessment.populate('user', 'name email role');

    res.status(201).json({ success: true, data: assessment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
