import React, { useEffect, useState } from 'react';
import { useAuth, api } from '../context/AuthContext';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import { 
  FileText, 
  Clock, 
  Award, 
  AlertTriangle, 
  CheckCircle, 
  BookOpen, 
  LineChart as LineChartIcon,
  Plus,
  Star,
  Trophy,
  Zap,
  Target,
  GraduationCap
} from 'lucide-react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

// Register ChartJS modules
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const StudentDashboard = () => {
  const { profile } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [milestones, setMilestones] = useState([]);
  const [newMilestone, setNewMilestone] = useState('');
  const [addingMilestone, setAddingMilestone] = useState(false);

  useEffect(() => {
    const fetchStudentProfile = async () => {
      try {
        if (profile?._id) {
          const res = await api.get(`/students/${profile._id}`);
          if (res.data && res.data.success) {
            setStudentData(res.data.data);
            setMilestones(res.data.data.roadmapMilestones || []);
          }
        }
      } catch (err) {
        setError('Failed to fetch performance profile.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProfile();
  }, [profile]);

  const handleAddMilestone = async () => {
    if (!newMilestone.trim() || !studentData) return;
    try {
      setAddingMilestone(true);
      const res = await api.post(`/students/${studentData._id}/milestones`, { title: newMilestone.trim() });
      if (res.data?.success) {
        setMilestones(res.data.data);
        setNewMilestone('');
      }
    } catch (err) {
      console.error('Add milestone failed:', err.message);
    } finally {
      setAddingMilestone(false);
    }
  };

  const handleToggleMilestone = async (milestoneId) => {
    if (!studentData) return;
    try {
      const res = await api.patch(`/students/${studentData._id}/milestones/${milestoneId}`);
      if (res.data?.success) setMilestones(res.data.data);
    } catch (err) {
      console.error('Toggle milestone failed:', err.message);
    }
  };

  const handleDownloadPDF = async () => {
    if (!studentData) return;
    try {
      // Fetch as blob
      const response = await api.get(`/report/pdf/${studentData._id}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Report_Card_${studentData.rollNumber}.pdf`;
      link.click();
    } catch (err) {
      alert('Error downloading report card: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !studentData) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
        <AlertTriangle size={48} className="text-rose-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Profile Access Error</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center max-w-md">
          {error || 'No academic profile matches your login. Contact administration to create your student record.'}
        </p>
      </div>
    );
  }

  // Chart Configuration (Radar Chart of academic dimensions)
  const chartData = {
    labels: ['Attendance', 'Assignment Marks', 'Internal Marks', 'CGPA (scaled)', 'Study Hours (scaled)'],
    datasets: [
      {
        label: 'My Metrics',
        data: [
          studentData.attendancePercentage,
          studentData.assignmentMarks,
          studentData.internalMarks,
          studentData.previousCGPA * 10,      // Scale to match 100 max
          (studentData.studyHours / 12) * 100 // Scale to match 100 max (assuming 12 max study hours)
        ],
        backgroundColor: 'rgba(14, 165, 233, 0.2)',
        borderColor: 'rgba(14, 165, 233, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(14, 165, 233, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(14, 165, 233, 1)',
      }
    ]
  };

  const chartOptions = {
    scales: {
      r: {
        angleLines: {
          display: true,
          color: 'rgba(148, 163, 184, 0.2)'
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.2)'
        },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          display: false
        },
        pointLabels: {
          font: {
            family: 'Outfit',
            size: 11,
            weight: 'semibold'
          },
          color: '#64748b'
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  const isPassing = studentData.prediction?.result === 'Pass';

  // Gamification Badges (Quick Win #7)
  const badges = [];
  if (studentData.attendancePercentage >= 90) badges.push({ icon: Star, label: 'Perfect Attendance', color: 'text-amber-500 bg-amber-500/10' });
  else if (studentData.attendancePercentage >= 75) badges.push({ icon: CheckCircle, label: 'Good Attendance', color: 'text-emerald-500 bg-emerald-500/10' });
  if (studentData.internalMarks >= 80) badges.push({ icon: Trophy, label: 'High Achiever', color: 'text-violet-500 bg-violet-500/10' });
  if (studentData.studyHours >= 6) badges.push({ icon: Zap, label: 'Dedicated Learner', color: 'text-cyan-500 bg-cyan-500/10' });
  if (studentData.backlogs === 0) badges.push({ icon: Award, label: 'Backlog Free', color: 'text-brand-500 bg-brand-500/10' });
  if (milestones.filter(m => m.completed).length >= 3) badges.push({ icon: Target, label: 'Milestone Achiever', color: 'text-rose-500 bg-rose-500/10' });
  if (studentData.previousCGPA >= 8.5) badges.push({ icon: Star, label: "Dean's List", color: 'text-yellow-500 bg-yellow-500/10' });

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      
      {/* Background Orbs */}
      <div className="absolute top-[10%] right-[10%] h-[300px] w-[300px] rounded-full bg-brand-400/10 blur-[100px] pointer-events-none"></div>

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title="My Performance Portal" />

        <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
          
          {/* Section 1: Dashboard Top Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-brand-600 to-brand-500 rounded-3xl p-8 text-white shadow-xl shadow-brand-500/10 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-12 hidden lg:flex">
              <GraduationCap size={150} />
            </div>
            
            <div className="z-10">
              <h2 className="text-3xl font-bold font-sans">Hello, {studentData.name}!</h2>
              <p className="mt-2 text-brand-100 max-w-xl">
                Here is your AI-powered performance analysis. Keep tracking your metrics to improve your outcomes.
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-brand-100">
                <span className="bg-white/20 px-3 py-1 rounded-full border border-white/10">Roll: {studentData.rollNumber}</span>
                <span className="bg-white/20 px-3 py-1 rounded-full border border-white/10">Semester: {studentData.semester}</span>
                <span className="bg-white/20 px-3 py-1 rounded-full border border-white/10">{studentData.department}</span>
              </div>
            </div>

            <button
              onClick={handleDownloadPDF}
              className="z-10 px-6 py-3.5 self-start md:self-center bg-white text-brand-600 hover:bg-brand-50 font-bold rounded-2xl flex items-center space-x-2 shadow-lg shadow-black/5 hover:scale-[1.03] active:scale-[0.98] transition-all"
            >
              <FileText size={18} />
              <span>Download Report Card</span>
            </button>
          </div>

          {/* Section 2: Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Attendance */}
            <GlassCard className="flex items-center space-x-4">
              <div className={`p-3.5 rounded-2xl ${studentData.attendancePercentage >= 75 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                <Clock size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance</p>
                <p className="text-2xl font-bold mt-1 text-slate-800 dark:text-white">{studentData.attendancePercentage}%</p>
                <span className={`text-[10px] font-bold ${studentData.attendancePercentage >= 75 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {studentData.attendancePercentage >= 75 ? 'On Track' : 'Below 75% Risk'}
                </span>
              </div>
            </GlassCard>

            {/* Internals */}
            <GlassCard className="flex items-center space-x-4">
              <div className="p-3.5 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <BookOpen size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Internal Marks</p>
                <p className="text-2xl font-bold mt-1 text-slate-800 dark:text-white">{studentData.internalMarks}/100</p>
                <span className="text-[10px] text-slate-400 font-semibold">Weightage: 30%</span>
              </div>
            </GlassCard>

            {/* CGPA */}
            <GlassCard className="flex items-center space-x-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Award size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Previous CGPA</p>
                <p className="text-2xl font-bold mt-1 text-slate-800 dark:text-white">{studentData.previousCGPA}</p>
                <span className="text-[10px] text-slate-400 font-semibold">Scale: 10.0 Max</span>
              </div>
            </GlassCard>

            {/* Backlogs */}
            <GlassCard className="flex items-center space-x-4">
              <div className={`p-3.5 rounded-2xl ${studentData.backlogs === 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Backlogs</p>
                <p className="text-2xl font-bold mt-1 text-slate-800 dark:text-white">{studentData.backlogs}</p>
                <span className={`text-[10px] font-bold ${studentData.backlogs === 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {studentData.backlogs === 0 ? 'Clear History' : 'Immediate Action Required'}
                </span>
              </div>
            </GlassCard>

          </div>

          {/* Section 3: Performance Insights & Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* AI Prediction Card */}
            <GlassCard className="lg:col-span-2 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">AI Performance Analysis</h3>
                
                <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 rounded-2xl mb-6 border ${
                  isPassing 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-200' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-200'
                }`}>
                  <div className="flex items-center space-x-4">
                    {isPassing ? (
                      <CheckCircle size={40} className="text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle size={40} className="text-rose-500 shrink-0" />
                    )}
                    <div>
                      <h4 className="text-base font-bold">Predicted Class: {studentData.prediction?.result?.toUpperCase()}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Confidence Score: <strong>{studentData.prediction?.confidence}%</strong>
                      </p>
                    </div>
                  </div>
                  <span className={`mt-3 sm:mt-0 px-4 py-2 rounded-xl text-xs font-bold ${
                    isPassing ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                  }`}>
                    {isPassing ? 'Satisfactory Outcome' : 'Needs Immediate Action'}
                  </span>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">AI-Driven Recommendations:</h4>
                  <ul className="space-y-3">
                    {studentData.prediction?.suggestions && studentData.prediction.suggestions.length > 0 ? (
                      studentData.prediction.suggestions.map((sug, idx) => (
                        <li key={idx} className="flex items-start space-x-3 text-sm text-slate-600 dark:text-slate-400">
                          <span className="h-5 w-5 shrink-0 flex items-center justify-center rounded-full bg-brand-500/10 text-brand-500 text-xs font-bold mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{sug}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-slate-500 italic">No recommendations available. Keep maintaining your academic goals.</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-800/50 text-xs text-slate-400 text-center">
                *Predictions are updated automatically when faculty enters internal test or attendance details.
              </div>
            </GlassCard>

            {/* Radar metrics chart */}
            <GlassCard className="flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Academic Breakdown</h3>
                <LineChartIcon size={18} className="text-slate-400" />
              </div>
              
              <div className="w-full max-w-[280px] h-[280px] flex items-center justify-center">
                <Radar data={chartData} options={chartOptions} />
              </div>
              
              <div className="mt-6 w-full grid grid-cols-2 gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                <div className="flex items-center space-x-2 justify-center">
                  <span className="h-3 w-3 rounded bg-brand-500"></span>
                  <span>Personal metrics</span>
                </div>
                <div className="flex items-center space-x-2 justify-center">
                  <span className="h-3 w-3 rounded bg-slate-200 dark:bg-slate-700"></span>
                  <span>Target base</span>
                </div>
              </div>
            </GlassCard>

          </div>

          {/* Gamification Badges (Quick Win #7) */}
          {badges.length > 0 && (
            <GlassCard>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Your Achievements</h3>
                <Trophy size={18} className="text-amber-500" />
              </div>
              <div className="flex flex-wrap gap-3">
                {badges.map((badge, i) => (
                  <div key={i} className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold border border-white/10 ${badge.color}`}>
                    <badge.icon size={15} />
                    <span>{badge.label}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Roadmap Milestones (Quick Win #9) */}
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">My Learning Roadmap</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {milestones.filter(m => m.completed).length} of {milestones.length} milestones completed
                </p>
              </div>
              <Target size={18} className="text-brand-500" />
            </div>

            {milestones.length > 0 && (
              <div className="mb-5">
                <div className="h-2 rounded-full bg-slate-200/50 dark:bg-slate-800/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500"
                    style={{ width: `${Math.round((milestones.filter(m => m.completed).length / milestones.length) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 text-right font-semibold">
                  {Math.round((milestones.filter(m => m.completed).length / milestones.length) * 100)}% complete
                </p>
              </div>
            )}

            <ul className="space-y-2.5 mb-5">
              {milestones.length === 0 && (
                <li className="text-sm text-slate-400 italic text-center py-4">No milestones yet. Add your first goal below!</li>
              )}
              {milestones.map((m) => (
                <li key={m._id} className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200/20 dark:border-slate-800/30 hover:border-slate-300/30 transition-all">
                  <button
                    onClick={() => handleToggleMilestone(m._id)}
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-200 ${
                      m.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600 hover:border-brand-400'
                    }`}
                  >
                    {m.completed && <CheckCircle size={12} />}
                  </button>
                  <span className={`flex-1 text-sm ${m.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>{m.title}</span>
                </li>
              ))}
            </ul>

            <div className="flex space-x-3">
              <input
                type="text"
                value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMilestone()}
                placeholder="Add a new learning goal..."
                className="glass-input flex-1 px-4 py-2.5 rounded-xl text-sm"
                maxLength={120}
              />
              <button
                onClick={handleAddMilestone}
                disabled={addingMilestone || !newMilestone.trim()}
                className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold flex items-center space-x-1.5 disabled:opacity-50 transition-all"
              >
                <Plus size={15} />
                <span className="hidden sm:inline">{addingMilestone ? 'Adding...' : 'Add'}</span>
              </button>
            </div>
          </GlassCard>

        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
