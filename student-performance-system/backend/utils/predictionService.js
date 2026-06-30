const axios = require('axios');

// Get ML API URL from environment variables, default to local port 5000
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

/**
 * Call Flask API to get prediction for a student
 * @param {Object} studentData 
 */
exports.predictStudentPerformance = async (studentData) => {
  const payload = {
    Attendance: studentData.attendancePercentage,
    AssignmentMarks: studentData.assignmentMarks,
    InternalMarks: studentData.internalMarks,
    CGPA: studentData.previousCGPA,
    StudyHours: studentData.studyHours
  };

  try {
    const response = await axios.post(`${ML_API_URL}/predict`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000 // 5 seconds timeout
    });

    if (response.data && response.data.Prediction) {
      return {
        result: response.data.Prediction, // 'Pass' or 'Fail'
        confidence: response.data.Confidence,
        suggestions: response.data.Suggestions
      };
    }
  } catch (error) {
    console.error('Error calling ML API:', error.message);
    
    // Fallback: Rule-Based Logic if ML API is offline
    console.log('Using rule-based fallback prediction...');
    return fallbackRulePrediction(payload);
  }
};

/**
 * Local rule-based prediction fallback if Flask API is unreachable
 */
function fallbackRulePrediction(data) {
  const { Attendance, AssignmentMarks, InternalMarks, CGPA, StudyHours } = data;
  
  let score = 
    0.3 * (Attendance / 100) + 
    0.25 * (InternalMarks / 100) + 
    0.2 * (AssignmentMarks / 100) + 
    0.15 * (CGPA / 10.0) + 
    0.1 * (StudyHours / 12.0);
    
  let result = 'Pass';
  let confidence = 70.0;
  const suggestions = [];

  if (Attendance < 50.0) {
    result = 'Fail';
    confidence = 85.0;
    suggestions.push(`Attendance is below 50% (${Attendance}%). Attendance must be increased immediately.`);
  } else if (InternalMarks < 35.0) {
    result = 'Fail';
    confidence = 80.0;
    suggestions.push(`Internal marks are critical (${InternalMarks}/100). Focus heavily on coursework and exam preparation.`);
  } else if (score < 0.45) {
    result = 'Fail';
    confidence = 75.0;
  }

  if (result === 'Fail') {
    if (Attendance < 75.0 && Attendance >= 50.0) {
      suggestions.push(`Attendance is below 75% (${Attendance}%). Improve attendance to increase your probability of passing.`);
    }
    if (InternalMarks < 40.0 && InternalMarks >= 35.0) {
      suggestions.push(`Internal marks (${InternalMarks}/100) are low. Please seek extra faculty guidance.`);
    }
    if (StudyHours < 4.0) {
      suggestions.push(`Self-study hours (${StudyHours} hrs/day) are low. Dedicate at least 4 hours to study daily.`);
    }
    if (suggestions.length === 0) {
      suggestions.push('Review study materials regularly and participate in tutorial sessions to improve marks.');
    }
  } else {
    confidence = Math.min(60.0 + score * 30.0, 99.0);
    if (Attendance < 75.0) {
      suggestions.push(`Attendance is borderline (${Attendance}%). Try to maintain at least 75% for regular status.`);
    } else {
      suggestions.push('Excellent progress! Continue your regular study routines and class attendance to ensure success.');
    }
  }

  return {
    result,
    confidence: Math.round(confidence * 100) / 100,
    suggestions
  };
}
