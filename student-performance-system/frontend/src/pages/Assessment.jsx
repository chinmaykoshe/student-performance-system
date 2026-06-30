import React, { useState } from 'react';
import { api } from '../context/AuthContext';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import { BookOpen, AlertTriangle, CheckCircle, ArrowRight, Award, RefreshCw, BarChart2 } from 'lucide-react';

const categories = {
  'Programming Fundamentals': [
    {
      question: 'Which data structure follows the Last-In, First-Out (LIFO) principle?',
      options: ['Queue', 'Stack', 'Array', 'Linked List'],
      correct: 'Stack'
    },
    {
      question: 'What is the time complexity of searching in a balanced Binary Search Tree (BST)?',
      options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'],
      correct: 'O(log n)'
    },
    {
      question: 'Which of the following is NOT a fundamental pillar of Object-Oriented Programming (OOP)?',
      options: ['Abstraction', 'Compilation', 'Inheritance', 'Polymorphism'],
      correct: 'Compilation'
    },
    {
      question: 'What does the "const" keyword signify in JavaScript?',
      options: ['A variable that can be re-declared', 'A read-only reference to a value', 'A variable scoped globally only', 'An asynchronous constant block'],
      correct: 'A read-only reference to a value'
    },
    {
      question: 'Which algorithm is typically used to find the shortest path in a weighted graph?',
      options: ['Binary Search', 'Dijkstra\'s Algorithm', 'Quick Sort', 'Depth First Search'],
      correct: 'Dijkstra\'s Algorithm'
    }
  ],
  'Web Development': [
    {
      question: 'What does CSS stand for?',
      options: ['Computer Style Sheets', 'Creative Style System', 'Cascading Style Sheets', 'Complex Style Syntax'],
      correct: 'Cascading Style Sheets'
    },
    {
      question: 'Which React Hook is primarily used to perform side effects in functional components?',
      options: ['useState', 'useContext', 'useEffect', 'useReducer'],
      correct: 'useEffect'
    },
    {
      question: 'Which HTTP method is idempotent and designed to update an existing resource completely?',
      options: ['POST', 'GET', 'PUT', 'DELETE'],
      correct: 'PUT'
    },
    {
      question: 'What is the purpose of the "key" prop in React list rendering?',
      options: ['To style individual list elements', 'To uniquely identify elements and optimize DOM diffing', 'To store secure cryptographic keys', 'To bind click handlers to items'],
      correct: 'To uniquely identify elements and optimize DOM diffing'
    },
    {
      question: 'Which of the following is a key-value storage mechanism accessible client-side in browsers?',
      options: ['MongoDB', 'Express Session', 'LocalStorage', 'Mongoose Schema'],
      correct: 'LocalStorage'
    }
  ],
  'Data Science': [
    {
      question: 'Which algorithm is commonly used for classification tasks in machine learning?',
      options: ['K-Means Clustering', 'Linear Regression', 'Random Forest Classifier', 'Principal Component Analysis'],
      correct: 'Random Forest Classifier'
    },
    {
      question: 'What metric is used to evaluate the dispersion of values relative to their mean?',
      options: ['Standard Deviation', 'Median', 'Mode', 'Coefficient of Correlation'],
      correct: 'Standard Deviation'
    },
    {
      question: 'What is the main purpose of "Data Normalization" before training an ML model?',
      options: ['To increase database speed', 'To scale numerical features to a uniform range', 'To convert text to numbers', 'To remove null parameters entirely'],
      correct: 'To scale numerical features to a uniform range'
    },
    {
      question: 'In statistical testing, what does the "p-value" represent?',
      options: ['Probability score of passing class', 'Probability of obtaining results at least as extreme as observed under null hypothesis', 'Parameters threshold value', 'Prediction confidence level'],
      correct: 'Probability of obtaining results at least as extreme as observed under null hypothesis'
    },
    {
      question: 'Which of the following libraries is widely used for tabular data manipulation in Python?',
      options: ['NumPy', 'Matplotlib', 'Pandas', 'Scikit-Learn'],
      correct: 'Pandas'
    }
  ]
};

const Assessment = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [error, setError] = useState('');

  const startQuiz = (cat) => {
    setSelectedCategory(cat);
    setCurrentQuiz(categories[cat]);
    setQuizIndex(0);
    setSelectedAnswers({});
    setQuizResult(null);
    setError('');
  };

  const handleSelectOption = (option) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [quizIndex]: option
    });
  };

  const handleNext = () => {
    if (quizIndex < currentQuiz.length - 1) {
      setQuizIndex(quizIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (quizIndex > 0) {
      setQuizIndex(quizIndex - 1);
    }
  };

  const handleSubmit = async () => {
    // Validate all answered
    if (Object.keys(selectedAnswers).length < currentQuiz.length) {
      return setError('Please answer all questions before submitting.');
    }

    setSubmitting(true);
    setError('');

    const formattedAnswers = currentQuiz.map((q, idx) => ({
      question: q.question,
      selectedOption: selectedAnswers[idx],
      correctOption: q.correct
    }));

    try {
      const res = await api.post('/assessments/submit', {
        category: selectedCategory,
        answers: formattedAnswers
      });

      if (res.data?.success) {
        setQuizResult(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Submit assessment failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title="Skill Assessment Terminal" />

        <main className="flex-1 p-8 max-w-4xl mx-auto w-full space-y-8">
          
          {/* Main workspace */}
          {!selectedCategory ? (
            <div className="space-y-6">
              <div className="text-center py-6">
                <h2 className="text-2xl font-bold">Select Skill Domain</h2>
                <p className="text-sm text-slate-400 mt-1.5">Answer standard multiple-choice questions to update your AI career recommendations.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.keys(categories).map((cat) => (
                  <GlassCard key={cat} className="flex flex-col justify-between h-56 p-6 border hover:border-brand-500/30 transition-all duration-300">
                    <div>
                      <div className="p-3 bg-brand-500/10 text-brand-500 rounded-2xl w-fit mb-4">
                        <BookOpen size={24} />
                      </div>
                      <h3 className="font-bold text-slate-800 dark:text-white text-base">{cat}</h3>
                      <p className="text-xs text-slate-400 mt-2">5 Questions • 60 seconds per question recommended</p>
                    </div>
                    <button
                      onClick={() => startQuiz(cat)}
                      className="mt-6 flex items-center justify-between px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all w-full shadow-md shadow-brand-500/10"
                    >
                      <span>Launch Assessment</span>
                      <ArrowRight size={14} />
                    </button>
                  </GlassCard>
                ))}
              </div>
            </div>
          ) : quizResult ? (
            /* Result Scorecard Page */
            <GlassCard className="p-8 text-center border border-emerald-500/20 max-w-xl mx-auto animate-in fade-in duration-300">
              <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-full w-fit mx-auto mb-6">
                <Award size={48} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Assessment Complete!</h2>
              <p className="text-sm text-slate-400 mt-1">{selectedCategory}</p>

              <div className="my-8">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Your Score</span>
                <h3 className="text-6xl font-black text-emerald-500 mt-2">{quizResult.score}%</h3>
                <p className="text-xs text-slate-400 mt-2 font-medium">
                  Result: {quizResult.score >= 70 ? 'Proficient' : 'Needs Review'}
                </p>
              </div>

              <div className="space-y-3 mb-8 text-left max-h-56 overflow-y-auto pr-2">
                {quizResult.answers.map((ans, idx) => (
                  <div key={idx} className={`p-3 rounded-xl border text-xs ${ans.isCorrect ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/5 border-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                    <p className="font-bold">Q{idx + 1}: {ans.question}</p>
                    <p className="mt-1 font-semibold">Your answer: {ans.selectedOption} {ans.isCorrect ? '✓' : '✗'}</p>
                    {!ans.isCorrect && <p className="text-slate-450 mt-0.5">Correct answer: {ans.correctOption}</p>}
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="flex-1 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all"
                >
                  Return to Categories
                </button>
                <button
                  onClick={() => startQuiz(selectedCategory)}
                  className="flex-1 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-lg shadow-brand-500/15 transition-all"
                >
                  Retake Quiz
                </button>
              </div>
            </GlassCard>
          ) : (
            /* Quiz Running Page */
            <GlassCard className="p-8 border max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-8 border-b border-slate-150 dark:border-slate-800/30 pb-4">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg">{selectedCategory}</h3>
                  <span className="text-xs text-slate-400">Question {quizIndex + 1} of {currentQuiz.length}</span>
                </div>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs text-slate-400 hover:text-rose-500 font-semibold transition-colors"
                >
                  Exit Quiz
                </button>
              </div>

              {error && (
                <div className="flex items-center space-x-2 rounded-2xl bg-rose-500/10 p-4 text-xs text-rose-500 border border-rose-500/20 mb-6">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Progress bar */}
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full mb-8 overflow-hidden">
                <div
                  className="h-full bg-brand-500 transition-all duration-300"
                  style={{ width: `${((quizIndex + 1) / currentQuiz.length) * 100}%` }}
                />
              </div>

              {/* Question */}
              <div className="mb-8">
                <h4 className="text-base font-bold text-slate-800 dark:text-white leading-relaxed">
                  {currentQuiz[quizIndex]?.question}
                </h4>
              </div>

              {/* Options */}
              <div className="space-y-3.5 mb-8">
                {currentQuiz[quizIndex]?.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full text-left px-5 py-4 rounded-2xl border text-sm font-semibold transition-all duration-200 ${
                      selectedAnswers[quizIndex] === opt
                        ? 'bg-brand-500/10 border-brand-500/50 text-brand-500'
                        : 'bg-white/30 dark:bg-slate-800/20 border-slate-200/40 dark:border-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {/* Navigation Actions */}
              <div className="flex justify-between items-center border-t border-slate-150 dark:border-slate-800/30 pt-6">
                <button
                  onClick={handlePrevious}
                  disabled={quizIndex === 0}
                  className="px-5 py-2.5 rounded-xl border border-slate-250 dark:border-slate-750 text-xs font-bold disabled:opacity-30 transition-all"
                >
                  Previous
                </button>

                {quizIndex === currentQuiz.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-lg shadow-brand-500/15 flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {submitting && <RefreshCw size={12} className="animate-spin" />}
                    <span>{submitting ? 'Submitting...' : 'Submit Answers'}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    disabled={!selectedAnswers[quizIndex]}
                    className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 dark:bg-slate-200 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold disabled:opacity-30 transition-all"
                  >
                    Next
                  </button>
                )}
              </div>
            </GlassCard>
          )}

        </main>
      </div>
    </div>
  );
};

export default Assessment;
