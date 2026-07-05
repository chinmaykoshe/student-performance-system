import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import { PageShell } from '../components/AdminUI';
import TokenUsageWidget from '../components/TokenUsageWidget';
import { 
  Sparkles, 
  MessageSquare, 
  FileCheck, 
  Send, 
  RefreshCw, 
  AlertCircle, 
  Target, 
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  ShieldAlert
} from 'lucide-react';

const AICareerCoach = () => {
  const [activeTab, setActiveTab] = useState('counselor');

  // ── Live usage state (updated after each AI call) ─────────────────────────
  const [liveUsage, setLiveUsage] = useState(null);

  // ── Counselor state ───────────────────────────────────────────────────────
  const [counselingData, setCounselingData]   = useState(null);
  const [loadingCounsel, setLoadingCounsel]   = useState(false);
  const [counselError, setCounselError]       = useState('');

  // ── Interviewer state ─────────────────────────────────────────────────────
  const [targetRole, setTargetRole]           = useState('Software Developer');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [chatHistory, setChatHistory]         = useState([]);
  const [userMsg, setUserMsg]                 = useState('');
  const [sendingMsg, setSendingMsg]           = useState(false);
  const [interviewError, setInterviewError]   = useState('');

  // ── ATS state ─────────────────────────────────────────────────────────────
  const [jobDescription, setJobDescription]   = useState('');
  const [atsResult, setAtsResult]             = useState(null);
  const [analyzingAts, setAnalyzingAts]       = useState(false);
  const [atsError, setAtsError]               = useState('');

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────
  const isLimitError = (err) =>
    err?.response?.status === 429 || err?.response?.data?.limitExceeded;

  const limitMessage = (err) =>
    err?.response?.data?.error || 'AI token limit reached. Please try again later.';

  // ─────────────────────────────────────────────────────────────────────────
  // AI Counselor
  // ─────────────────────────────────────────────────────────────────────────
  const fetchCounseling = async () => {
    setLoadingCounsel(true);
    setCounselError('');
    try {
      const res = await api.post('/ai/counsel');
      if (res.data?.success) {
        setCounselingData(res.data.data);
        if (res.data.usage) setLiveUsage(res.data.usage);
      }
    } catch (err) {
      setCounselError(isLimitError(err) ? limitMessage(err) : 'Failed to fetch AI guidance.');
      if (err?.response?.data?.usage) setLiveUsage(err.response.data.usage);
    } finally {
      setLoadingCounsel(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'counselor' && !counselingData) fetchCounseling();
  }, [activeTab]);

  // ─────────────────────────────────────────────────────────────────────────
  // Mock Interview
  // ─────────────────────────────────────────────────────────────────────────
  const startMockInterview = () => {
    setInterviewStarted(true);
    setInterviewError('');
    setChatHistory([
      { role: 'interviewer', message: `Welcome! I'm your AI Technical Interviewer for the ${targetRole} role. Let's begin — please introduce yourself and describe your core tech stack.` }
    ]);
  };

  const handleSendInterviewMessage = async () => {
    if (!userMsg.trim()) return;
    const studentMessage = userMsg.trim();
    setUserMsg('');
    setInterviewError('');
    const updatedHistory = [...chatHistory, { role: 'user', message: studentMessage }];
    setChatHistory(updatedHistory);
    setSendingMsg(true);

    try {
      const res = await api.post('/ai/interview', {
        role: targetRole,
        chatHistory: updatedHistory,
        userMessage: studentMessage
      });
      if (res.data?.success) {
        setChatHistory([...updatedHistory, { role: 'interviewer', message: res.data.response }]);
        if (res.data.usage) setLiveUsage(res.data.usage);
      }
    } catch (err) {
      const msg = isLimitError(err) ? limitMessage(err) : 'Connection error. Please retry.';
      setInterviewError(msg);
      if (err?.response?.data?.usage) setLiveUsage(err.response.data.usage);
    } finally {
      setSendingMsg(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ATS Matcher
  // ─────────────────────────────────────────────────────────────────────────
  const handleAnalyzeATS = async () => {
    if (!jobDescription.trim()) return;
    setAnalyzingAts(true);
    setAtsError('');
    try {
      const studentProfile = await api.get('/students/my').catch(() => null);
      const studentData    = studentProfile?.data?.data || {};

      const res = await api.post('/ai/ats-score', {
        jobDescription: jobDescription.trim(),
        skills: ['Programming Fundamentals', 'JavaScript', 'Python', 'Web Development', 'MongoDB'],
        milestones: studentData.roadmapMilestones || []
      });
      if (res.data?.success) {
        setAtsResult(res.data.data);
        if (res.data.usage) setLiveUsage(res.data.usage);
      }
    } catch (err) {
      setAtsError(isLimitError(err) ? limitMessage(err) : 'ATS evaluation failed. Check job description.');
      if (err?.response?.data?.usage) setLiveUsage(err.response.data.usage);
    } finally {
      setAnalyzingAts(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Shared: Limit-reached banner
  // ─────────────────────────────────────────────────────────────────────────
  const LimitBanner = ({ message }) => (
    <div className="flex items-start space-x-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-600 dark:text-amber-400">
      <ShieldAlert size={16} className="shrink-0 mt-0.5" />
      <span className="leading-relaxed font-semibold">{message}</span>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 text-slate-900">
      <Header title="Gemini AI Career Co-Pilot" />
      <PageShell maxWidth="max-w-5xl">

          {/* ── Top layout: tabs + token widget ────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-850 p-1.5 rounded-2xl w-fit space-x-1 border border-slate-200/50 dark:border-slate-800/50">
              {[
                { id: 'counselor', label: 'AI Counselor',   icon: Sparkles },
                { id: 'interview', label: 'Mock Interview',  icon: MessageSquare },
                { id: 'ats',       label: 'ATS Matcher',     icon: FileCheck }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-slate-800 text-brand-500 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
                  }`}
                >
                  <tab.icon size={14} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Token Usage Widget — always visible */}
            <div className="w-full sm:w-72 shrink-0">
              <TokenUsageWidget liveUsage={liveUsage} />
            </div>
          </div>

          {/* ── Tab: AI Counselor ────────────────────────────────────────── */}
          {activeTab === 'counselor' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">AI Career Guidance</h2>
                  <p className="text-xs text-slate-450 mt-0.5">Custom career analysis from your CGPA and assessment scores.</p>
                </div>
                <button
                  onClick={fetchCounseling}
                  disabled={loadingCounsel}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-brand-500 transition-colors disabled:opacity-50"
                  title="Reload recommendations"
                >
                  <RefreshCw size={15} className={loadingCounsel ? 'animate-spin' : ''} />
                </button>
              </div>

              {counselError && (counselError.includes('limit') || counselError.includes('Limit')
                ? <LimitBanner message={counselError} />
                : (
                  <div className="flex items-center space-x-2 rounded-2xl bg-rose-500/10 p-4 text-xs text-rose-500 border border-rose-500/20">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{counselError}</span>
                  </div>
                )
              )}

              {loadingCounsel ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <RefreshCw className="animate-spin text-brand-500" size={32} />
                  <p className="text-sm text-slate-400 font-medium">Gemini is synthesising your counselling report…</p>
                </div>
              ) : counselingData ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-6">
                    <GlassCard>
                      <h3 className="font-bold text-sm uppercase text-brand-500 tracking-wider mb-4 flex items-center space-x-1.5">
                        <TrendingUp size={16} />
                        <span>Identified Strengths &amp; Gaps</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                        <div>
                          <h4 className="text-xs font-bold text-emerald-500 uppercase mb-2.5">Strengths</h4>
                          <ul className="space-y-2">
                            {counselingData.strengths?.map((str, i) => (
                              <li key={i} className="text-sm text-slate-650 dark:text-slate-355 flex items-start space-x-2 leading-relaxed">
                                <span className="text-emerald-500 mt-0.5">•</span>
                                <span>{str}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-amber-500 uppercase mb-2.5">Improvement Areas</h4>
                          <ul className="space-y-2">
                            {counselingData.gaps?.map((gap, i) => (
                              <li key={i} className="text-sm text-slate-650 dark:text-slate-355 flex items-start space-x-2 leading-relaxed">
                                <span className="text-amber-500 mt-0.5">•</span>
                                <span>{gap}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </GlassCard>

                    <GlassCard>
                      <h3 className="font-bold text-sm uppercase text-violet-500 tracking-wider mb-4 flex items-center space-x-1.5">
                        <Target size={16} />
                        <span>Suggested Roadmap Milestones</span>
                      </h3>
                      <ol className="space-y-3.5 mt-4">
                        {counselingData.roadmapSteps?.map((step, i) => (
                          <li key={i} className="flex items-start space-x-3 text-sm text-slate-650 dark:text-slate-355">
                            <span className="h-5 w-5 shrink-0 flex items-center justify-center rounded-full bg-violet-500/10 text-violet-500 text-xs font-black mt-0.5">
                              {i + 1}
                            </span>
                            <span className="leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </GlassCard>
                  </div>

                  <div className="space-y-6">
                    {counselingData.careerPaths?.map((path, idx) => (
                      <GlassCard key={idx} className="border border-white/10 relative overflow-hidden flex flex-col justify-between h-48">
                        <div className="absolute right-[-10%] top-[-10%] h-24 w-24 rounded-full bg-brand-500/5 blur-xl" />
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-extrabold text-slate-800 dark:text-white text-base truncate pr-2">{path.role}</h4>
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20 shrink-0">
                              {path.match} Match
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed mt-2">{path.reason}</p>
                        </div>
                        <span className="text-[10px] text-brand-500 font-bold flex items-center space-x-1 mt-4">
                          <span>Focus Skill Domain</span>
                          <ArrowRight size={10} />
                        </span>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 italic text-slate-400">
                  No guidance available. Click reload to generate.
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Mock Interview ─────────────────────────────────────── */}
          {activeTab === 'interview' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {interviewError && (
                interviewError.includes('limit') || interviewError.includes('Limit')
                  ? <LimitBanner message={interviewError} />
                  : (
                    <div className="flex items-center space-x-2 rounded-2xl bg-rose-500/10 p-4 text-xs text-rose-500 border border-rose-500/20">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{interviewError}</span>
                    </div>
                  )
              )}

              {!interviewStarted ? (
                <GlassCard className="p-8 text-center border border-white/10">
                  <div className="p-4 bg-brand-500/10 text-brand-500 rounded-full w-fit mx-auto mb-6">
                    <BrainCircuit size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">Technical Mock Interview Simulator</h3>
                  <p className="text-sm text-slate-450 mt-1.5 max-w-md mx-auto">
                    Simulate a technical coding interview with immediate AI evaluation on each answer.
                  </p>
                  <div className="my-8 max-w-sm mx-auto">
                    <label className="block text-left text-xs font-bold text-slate-400 uppercase mb-2 pl-1">Target Job Role</label>
                    <select
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="glass-input w-full px-4 py-3 rounded-2xl text-xs font-semibold"
                    >
                      <option value="Software Developer">Software Developer</option>
                      <option value="Frontend Developer (React)">Frontend Developer (React)</option>
                      <option value="Backend Developer (Node.js)">Backend Developer (Node.js)</option>
                      <option value="Data Analyst / Scientist">Data Analyst / Scientist</option>
                      <option value="Cloud Architect">Cloud Architect</option>
                    </select>
                  </div>
                  <button
                    onClick={startMockInterview}
                    className="px-8 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/15"
                  >
                    Start Session
                  </button>
                </GlassCard>
              ) : (
                <GlassCard className="flex flex-col h-[500px] p-0 border border-white/10 overflow-hidden">
                  {/* Chat header */}
                  <div className="px-6 py-4 bg-slate-100/50 dark:bg-slate-850 border-b border-slate-150 dark:border-slate-800/30 flex items-center justify-between shrink-0">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm">{targetRole} Interview</h4>
                      <span className="text-[10px] text-slate-400 font-semibold">Active Session</span>
                    </div>
                    <button
                      onClick={() => { setInterviewStarted(false); setInterviewError(''); }}
                      className="text-xs text-rose-500 hover:underline font-semibold"
                    >
                      End Interview
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/20 dark:bg-slate-900/10">
                    {chatHistory.map((chat, i) => (
                      <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-xs leading-relaxed ${
                          chat.role === 'user'
                            ? 'bg-brand-500 text-white font-medium rounded-tr-none'
                            : 'bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800/50 text-slate-800 dark:text-slate-250 rounded-tl-none'
                        }`}>
                          <p className="whitespace-pre-line">{chat.message}</p>
                        </div>
                      </div>
                    ))}
                    {sendingMsg && (
                      <div className="flex justify-start">
                        <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl rounded-tl-none px-5 py-3 text-xs text-slate-400 font-semibold flex items-center space-x-1.5">
                          <RefreshCw size={12} className="animate-spin" />
                          <span>Interviewer is evaluating…</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-slate-150 dark:border-slate-800/30 bg-slate-100/20 dark:bg-slate-850/50 flex space-x-3 shrink-0">
                    <input
                      type="text"
                      value={userMsg}
                      onChange={(e) => setUserMsg(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendInterviewMessage()}
                      placeholder="Type your technical answer here…"
                      className="glass-input flex-1 px-4 py-3 rounded-2xl text-xs"
                      disabled={sendingMsg}
                    />
                    <button
                      onClick={handleSendInterviewMessage}
                      disabled={sendingMsg || !userMsg.trim()}
                      className="p-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-semibold transition-all disabled:opacity-50"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </GlassCard>
              )}
            </div>
          )}

          {/* ── Tab: ATS Matcher ─────────────────────────────────────────── */}
          {activeTab === 'ats' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">ATS Job Description Keyword Matcher</h3>
                <p className="text-xs text-slate-450 mt-1">Paste a job description to get a keyword match score powered by Gemini AI.</p>
              </div>

              {atsError && (
                atsError.includes('limit') || atsError.includes('Limit')
                  ? <LimitBanner message={atsError} />
                  : (
                    <div className="flex items-center space-x-2 rounded-2xl bg-rose-500/10 p-4 text-xs text-rose-500 border border-rose-500/20">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{atsError}</span>
                    </div>
                  )
              )}

              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
                <div className="md:col-span-3 space-y-4">
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here (required skills, technologies, experience)…"
                    className="glass-input w-full h-64 p-4 rounded-2xl text-xs leading-relaxed font-semibold resize-none"
                  />
                  <button
                    onClick={handleAnalyzeATS}
                    disabled={analyzingAts || !jobDescription.trim()}
                    className="w-full py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/15 flex items-center justify-center space-x-1.5 disabled:opacity-50"
                  >
                    {analyzingAts && <RefreshCw size={14} className="animate-spin" />}
                    <span>{analyzingAts ? 'Running keyword match…' : 'Analyse Keyword Alignment'}</span>
                  </button>
                </div>

                <div className="md:col-span-2 space-y-6">
                  {atsResult ? (
                    <div className="space-y-5">
                      <GlassCard className="text-center p-6 border border-brand-500/10">
                        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">ATS Match Score</span>
                        <h4 className="text-5xl font-black text-brand-500 mt-2">{atsResult.matchScore}%</h4>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">
                          <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${atsResult.matchScore}%` }} />
                        </div>
                      </GlassCard>

                      <GlassCard>
                        <h5 className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-2.5">Missing Keywords</h5>
                        <div className="flex flex-wrap gap-2">
                          {atsResult.missingKeywords?.map((k, i) => (
                            <span key={i} className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-500 text-[10px] font-bold border border-rose-500/15">{k}</span>
                          ))}
                        </div>
                      </GlassCard>

                      <GlassCard>
                        <h5 className="text-xs font-bold text-brand-500 uppercase tracking-wider mb-3">Optimisation Tips</h5>
                        <ul className="space-y-2">
                          {atsResult.optimizationTips?.map((tip, i) => (
                            <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start space-x-2 leading-relaxed">
                              <span className="text-brand-500 mt-0.5">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </GlassCard>
                    </div>
                  ) : (
                    <div className="h-64 border border-dashed border-slate-350 dark:border-slate-850 rounded-2xl flex items-center justify-center text-center p-6 italic text-slate-400 text-xs">
                      Analyse a job description to see your keyword alignment scorecard.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </PageShell>
    </div>
  );
};

export default AICareerCoach;
