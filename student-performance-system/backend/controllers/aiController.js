const axios = require('axios');
const Student = require('../models/Student');
const SkillAssessment = require('../models/SkillAssessment');
const { canUseTokens, recordUsage, getUsage } = require('../utils/tokenTracker');

// ─── Gemini API helper ────────────────────────────────────────────────────────
/**
 * Call Gemini and return { text, tokensUsed }.
 * Throws on API error so callers can fall back gracefully.
 */
const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    throw new Error('Gemini API key is not configured');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 600   // Keep tight — enough for structured JSON but not bloated prose
    }
  };

  const response = await axios.post(url, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 12000
  });

  const text       = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const tokensUsed = response.data?.usageMetadata?.totalTokenCount || 0;

  return { text, tokensUsed };
};

// ─── Shared limit-check helper ────────────────────────────────────────────────
function limitDenied(res, check, usage) {
  return res.status(429).json({
    success: false,
    limitExceeded: true,
    reason: check.reason,
    error: check.message,
    usage
  });
}

// ─── GET /api/ai/usage ────────────────────────────────────────────────────────
// @desc    Return current token usage for the logged-in user
// @access  Private (Student / Faculty / Admin)
exports.getTokenUsage = (req, res) => {
  const usage = getUsage(req.user._id.toString());
  res.status(200).json({ success: true, usage });
};

// ─── POST /api/ai/counsel ─────────────────────────────────────────────────────
// @desc    AI Career Recommendations
// @access  Private (Student)
exports.getCareerCounsel = async (req, res) => {
  const userId = req.user._id.toString();
  const check  = canUseTokens(userId);
  const usage  = getUsage(userId);

  if (!check.allowed) return limitDenied(res, check, usage);

  try {
    const student = await Student.findOne({ email: req.user.email });
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student profile not found' });
    }

    const assessments       = await SkillAssessment.find({ user: req.user._id });
    const assessmentDetails = assessments.map(a => `${a.category}: ${a.score}%`).join(', ') || 'None';

    // Compact prompt — minimal tokens, structured output only
    const prompt = `You are an academic career counselor. Respond ONLY in raw JSON (no markdown, no extra text).
Student: ${student.department}, Semester ${student.semester}, CGPA ${student.previousCGPA}/10, Skills: ${assessmentDetails}, Status: ${student.prediction?.result || 'N/A'}.
Return exactly:
{"strengths":["<2 key strengths>"],"gaps":["<2 key gaps>"],"careerPaths":[{"role":"<role>","match":"<pct>%","reason":"<1 sentence>"},{"role":"<role>","match":"<pct>%","reason":"<1 sentence>"}],"roadmapSteps":["<step1>","<step2>","<step3>"]}`;

    let guidanceJson = null;
    let tokensUsed   = 0;

    try {
      const result = await callGemini(prompt);
      tokensUsed   = result.tokensUsed;
      const clean  = result.text.replace(/```(json)?/gi, '').trim();
      guidanceJson = JSON.parse(clean);
      recordUsage(userId, tokensUsed);
    } catch (geminiError) {
      console.warn('Gemini counsel fallback:', geminiError.message);

      const isGoodCgpa = student.previousCGPA >= 8.0;
      const avgScore   = assessments.length > 0
        ? assessments.reduce((s, a) => s + a.score, 0) / assessments.length
        : 50;

      guidanceJson = {
        strengths: [
          isGoodCgpa ? `Strong academic consistency (CGPA ${student.previousCGPA})` : 'Active learner with consistent participation',
          avgScore >= 75 ? 'Strong core technical comprehension' : 'Dedicated to learning new frameworks'
        ],
        gaps: [
          student.attendancePercentage < 75
            ? `Low attendance (${student.attendancePercentage}%) affecting classroom learning`
            : 'Needs more hands-on project experience',
          avgScore < 70 ? 'Improve programming proficiency scores' : 'Deeper command over design patterns'
        ],
        careerPaths: [
          { role: student.department.includes('MCA') ? 'Full-Stack Developer' : 'Software Engineer', match: avgScore >= 80 ? '92%' : '78%', reason: 'Matches department profile and academic performance.' },
          { role: 'Cloud Architect / DevOps Engineer', match: isGoodCgpa ? '85%' : '70%', reason: 'Good foundation in system configurations and frameworks.' }
        ],
        roadmapSteps: [
          'Enroll in an advanced web framework course (React / Spring Boot / Node.js).',
          'Complete a capstone project and publish it on GitHub.',
          'Practise algorithms weekly to strengthen problem-solving skills.'
        ]
      };
    }

    const updatedUsage = getUsage(userId);
    res.status(200).json({ success: true, data: guidanceJson, tokensUsed, usage: updatedUsage });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── POST /api/ai/interview ───────────────────────────────────────────────────
// @desc    Mock Interview Chat
// @access  Private (Student)
exports.conductMockInterview = async (req, res) => {
  const userId = req.user._id.toString();
  const check  = canUseTokens(userId);
  const usage  = getUsage(userId);

  if (!check.allowed) return limitDenied(res, check, usage);

  try {
    const { role, chatHistory, userMessage } = req.body;

    if (!role || !userMessage) {
      return res.status(400).json({ success: false, error: 'Target role and message are required' });
    }

    // Compact prompt — trim history to last 3 exchanges to save tokens
    const recentHistory = (chatHistory || []).slice(-6);
    const historyPrompt = recentHistory
      .map(c => `${c.role === 'user' ? 'Student' : 'Interviewer'}: ${c.message}`)
      .join('\n');

    const prompt = `You are a technical interviewer for role: "${role}". Be concise (max 80 words). Review the student's last answer briefly, then ask ONE new technical question.
History:
${historyPrompt}
Student: ${userMessage}
Interviewer:`;

    let responseText = '';
    let tokensUsed   = 0;

    try {
      const result = await callGemini(prompt);
      responseText = result.text;
      tokensUsed   = result.tokensUsed;
      recordUsage(userId, tokensUsed);
    } catch (err) {
      console.warn('Gemini interview fallback:', err.message);
      const mockQuestions = [
        'Can you explain the difference between virtual DOM and real DOM in React?',
        'What is the event loop in Node.js and how does it handle async code?',
        'How do you secure a REST API against common vulnerabilities like CSRF?',
        'When would you choose MongoDB over a relational database?',
        'How would you optimize load time for a heavy web application?'
      ];
      const idx    = Math.min(Math.floor((chatHistory || []).length / 2), mockQuestions.length - 1);
      responseText = `Good response. Next question:\n\n${mockQuestions[idx]}`;
    }

    const updatedUsage = getUsage(userId);
    res.status(200).json({ success: true, response: responseText, tokensUsed, usage: updatedUsage });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── POST /api/ai/ats-score ───────────────────────────────────────────────────
// @desc    ATS Resume Keyword Analysis
// @access  Private (Student)
exports.analyzeATSResume = async (req, res) => {
  const userId = req.user._id.toString();
  const check  = canUseTokens(userId);
  const usage  = getUsage(userId);

  if (!check.allowed) return limitDenied(res, check, usage);

  try {
    const { jobDescription, skills, milestones } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ success: false, error: 'Job description is required' });
    }

    const skillList     = skills     ? skills.join(', ')                     : 'None';
    const milestoneList = milestones ? milestones.map(m => m.title).join(', ') : 'None';

    // Compact prompt
    const prompt = `ATS evaluator. Respond ONLY in raw JSON (no markdown).
Job: "${jobDescription.slice(0, 400)}"
Skills: "${skillList}"
Milestones: "${milestoneList}"
Return exactly:
{"matchScore":<0-100>,"missingKeywords":["<kw1>","<kw2>"],"optimizationTips":["<tip1>","<tip2>"]}`;

    let resultJson = null;
    let tokensUsed = 0;

    try {
      const result = await callGemini(prompt);
      tokensUsed   = result.tokensUsed;
      const clean  = result.text.replace(/```(json)?/gi, '').trim();
      resultJson   = JSON.parse(clean);
      recordUsage(userId, tokensUsed);
    } catch (err) {
      console.warn('Gemini ATS fallback:', err.message);

      const jdUpper          = jobDescription.toUpperCase();
      const techStack        = ['REACT', 'NODE', 'DOCKER', 'KUBERNETES', 'MONGODB', 'EXPRESS', 'PYTHON', 'JAVASCRIPT', 'TYPESCRIPT', 'AWS', 'GIT'];
      const detected         = [];
      const missing          = [];

      techStack.forEach(tech => {
        if (jdUpper.includes(tech)) {
          (skillList.toUpperCase().includes(tech) || milestoneList.toUpperCase().includes(tech))
            ? detected.push(tech)
            : missing.push(tech);
        }
      });

      resultJson = {
        matchScore:       Math.min(40 + detected.length * 12, 96),
        missingKeywords:  missing.slice(0, 2).length > 0 ? missing.slice(0, 2) : ['CI/CD pipelines', 'TypeScript'],
        optimizationTips: [
          'Add exact matching keywords from the job description to your project summary.',
          'Quantify technical outcomes with numbers (e.g. "reduced load time by 30%").'
        ]
      };
    }

    const updatedUsage = getUsage(userId);
    res.status(200).json({ success: true, data: resultJson, tokensUsed, usage: updatedUsage });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
