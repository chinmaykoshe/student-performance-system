const AssessmentTemplate = require('../models/AssessmentTemplate');

// @desc    Create an assessment template
// @route   POST /api/assessment-templates
// @access  Private (Faculty, Admin)
exports.createTemplate = async (req, res) => {
  try {
    const { title, questions } = req.body;

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, error: 'Title and at least one question are required' });
    }

    const template = await AssessmentTemplate.create({
      title,
      createdBy: req.user._id,
      questions
    });

    res.status(201).json({ success: true, data: template });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get all assessment templates
// @route   GET /api/assessment-templates
// @access  Private
exports.getTemplates = async (req, res) => {
  try {
    const templates = await AssessmentTemplate.find({}).sort('-createdAt');
    res.status(200).json({ success: true, count: templates.length, data: templates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete a template
// @route   DELETE /api/assessment-templates/:id
// @access  Private (Faculty, Admin)
exports.deleteTemplate = async (req, res) => {
  try {
    const template = await AssessmentTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    // Only allow creator or Admin to delete
    if (template.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this template' });
    }

    await template.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
