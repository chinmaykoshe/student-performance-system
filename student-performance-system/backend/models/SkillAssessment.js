const mongoose = require('mongoose');

const SkillAssessmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Programming Fundamentals', 'Web Development', 'Data Science']
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  answers: [
    {
      question: {
        type: String,
        required: true
      },
      selectedOption: {
        type: String,
        required: true
      },
      correctOption: {
        type: String,
        required: true
      },
      isCorrect: {
        type: Boolean,
        required: true
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SkillAssessment', SkillAssessmentSchema);
