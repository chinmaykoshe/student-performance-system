import React, { useState } from 'react';
import { api } from '../context/AuthContext';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import { PageShell } from '../components/AdminUI';
import { BookOpen, AlertTriangle, CheckCircle, ArrowRight, Award, RefreshCw, BarChart2 } from 'lucide-react';

// Dynamic categories from backend will be used instead of static data

const Assessment = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [error, setError] = useState('');

  const [templates, setTemplates] = useState([]);
  const [fetchingTemplates, setFetchingTemplates] = useState(true);
  
  React.useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await api.get('/assessment-templates');
        if (res.data.success) {
          setTemplates(res.data.data);
        }
      } catch (err) {
        setError('Failed to fetch assessments from the server.');
      } finally {
        setFetchingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  const startQuiz = (template) => {
    setSelectedCategory(template.title);
    setCurrentQuiz(template.questions);
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
      correctOption: q.correctOption
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
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 text-slate-900">
      <Header title="Skill Assessments & Tasks" />
      <PageShell maxWidth="max-w-7xl">
          
          {/* Main workspace */}
          {!selectedCategory ? (
            <div className="space-y-6">
              <div className="text-center py-6">
                <h2 className="text-2xl font-bold">Select Skill Domain</h2>
                <p className="text-sm text-slate-400 mt-1.5">Answer standard multiple-choice questions to update your AI career recommendations.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {fetchingTemplates ? (
                  <div className="col-span-3 text-center py-10 text-slate-500">Loading assessments...</div>
                ) : templates.length === 0 ? (
                  <div className="col-span-3 text-center py-10 text-slate-500">No custom assessments created by faculty yet.</div>
                ) : templates.map((template) => (
                  <GlassCard key={template._id} className="flex flex-col justify-between h-56 p-6 border hover:border-brand-500/30 transition-all duration-300">
                    <div>
                      <div className="p-3 bg-brand-500/10 text-brand-500 rounded-2xl w-fit mb-4">
                        <BookOpen size={24} />
                      </div>
                      <h3 className="font-bold text-slate-800 text-base">{template.title}</h3>
                      <p className="text-xs text-slate-400 mt-2">{template.questions.length} Questions • {template.questions.length * 12} seconds recommended</p>
                    </div>
                    <button
                      onClick={() => startQuiz(template)}
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
                  onClick={() => startQuiz(templates.find(t => t.title === selectedCategory))}
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

        </PageShell>
    </div>
  );
};

export default Assessment;
