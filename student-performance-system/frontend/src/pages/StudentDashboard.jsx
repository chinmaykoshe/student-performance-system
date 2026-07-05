import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';
import Header from '../components/Header';
import { PageShell } from '../components/AdminUI';
import { BookOpen, Calendar, TrendingUp, Download, Clock, Zap, Star, AlertTriangle, ArrowRight, Plus, CheckCircle, Circle, ClipboardList } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip as ChartTooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, Legend, Filler);

const StudentDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Roadmap milestone states
  const [newMilestone, setNewMilestone] = useState('');
  const [addingMilestone, setAddingMilestone] = useState(false);
  
  // Report Card state
  const [selectedSemester, setSelectedSemester] = useState(1);

  useEffect(() => {
    if (student && student.semester && student.semester.number) {
      setSelectedSemester(student.semester.number);
    }
  }, [student]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (profile?._id) {
        try {
          const res = await api.get(`/students/${profile._id}`);
          setStudent(res.data.data);
        } catch (err) {
          console.error(err);
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [profile]);

  useEffect(() => {
    if (!loading && !student) {
      navigate('/student/setup');
    }
  }, [loading, student, navigate]);

  if (loading || !student) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  const handleDownloadPDF = async () => {
    try {
      const response = await api.get(`/report/pdf/${student._id}?semester=${selectedSemester}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Report_Card_${student.rollNumber}.pdf`;
      link.click();
    } catch (err) {
      if (err.response && err.response.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errObj = JSON.parse(reader.result);
            alert(errObj.error || 'Error downloading report card.');
          } catch (e) {
            alert('Error downloading report card.');
          }
        };
        reader.readAsText(err.response.data);
      } else {
        alert(err.response?.data?.error || 'Error downloading report card.');
      }
    }
  };

  const handleToggleMilestone = async (milestoneId) => {
    try {
      const res = await api.patch(`/students/${student._id}/milestones/${milestoneId}`);
      if (res.data.success) {
        setStudent(prev => ({
          ...prev,
          roadmapMilestones: res.data.data
        }));
      }
    } catch (err) {
      alert('Failed to update milestone status.');
    }
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!newMilestone.trim()) return;
    setAddingMilestone(true);
    try {
      const res = await api.post(`/students/${student._id}/milestones`, { title: newMilestone.trim() });
      if (res.data.success) {
        setStudent(prev => ({
          ...prev,
          roadmapMilestones: res.data.data
        }));
        setNewMilestone('');
      }
    } catch (err) {
      alert('Failed to add milestone.');
    } finally {
      setAddingMilestone(false);
    }
  };

  // Mock data for the sparkline chart
  const gpaData = {
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Current'],
    datasets: [{
      label: 'GPA',
      data: [7.2, 7.8, 8.1, student.previousCGPA || 8.5],
      fill: true,
      backgroundColor: 'rgba(14, 165, 233, 0.1)',
      borderColor: 'rgba(14, 165, 233, 1)',
      tension: 0.4,
      pointRadius: 0
    }]
  };
  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { x: { display: false }, y: { display: false, min: 0, max: 10 } },
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    interaction: { intersect: false, mode: 'index' },
  };

  // Compute roadmap statistics
  const milestones = student.roadmapMilestones || [];
  const completedMilestones = milestones.filter(m => m.completed).length;
  const roadmapProgress = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 text-slate-900 pb-12">
      <Header title="Student Portal" subtitle="Your academic universe, visualized." />
      
      <PageShell maxWidth="max-w-6xl" className="space-y-6 mt-4">
        
        {/* Top Header Card */}
        <div className="bg-slate-900 rounded-3xl p-8 shadow-xl shadow-slate-900/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500 opacity-20 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {student.name.split(' ')[0]}!</h1>
            <p className="text-slate-400 font-medium flex items-center gap-2">
              <BookOpen size={16} /> 
              {student.department?.name || 'Department'} • {student.course?.name || 'Academic Program'} • {student.semester?.name || 'Current Semester'}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 bg-white/10 border border-white/10 text-white rounded-full text-xs font-bold tracking-wider font-mono">
                {student.rollNumber}
              </span>
              <span className="px-3 py-1 bg-white/10 border border-white/10 text-emerald-400 rounded-full text-xs font-bold tracking-wider flex items-center gap-1">
                <Star size={12} /> GPA: {student.previousCGPA}
              </span>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3 bg-white/10 p-2 rounded-2xl backdrop-blur-sm border border-white/10">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-brand-500 transition-colors"
            >
              {Array.from({ length: student.semester?.number || 1 }, (_, i) => i + 1).map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-500/20">
              <Download size={18} /> Download
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-500 text-sm font-bold uppercase tracking-wider">Attendance</span>
              <Calendar size={18} className="text-brand-500" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-800">{student.attendancePercentage}%</div>
              <p className="text-xs text-slate-400 mt-1 font-medium">Target: 75% min</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-500 text-sm font-bold uppercase tracking-wider">Internal Marks</span>
              <TrendingUp size={18} className="text-emerald-500" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-800">{student.internalMarks} / 100</div>
              <p className="text-xs text-slate-400 mt-1 font-medium">Across all subjects</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-500 text-sm font-bold uppercase tracking-wider">Study Hours</span>
              <Clock size={18} className="text-amber-500" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-800">{student.studyHours}h<span className="text-base text-slate-400 font-medium">/day</span></div>
              <p className="text-xs text-slate-400 mt-1 font-medium">Logged average</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute inset-0 opacity-10 group-hover:opacity-100 transition-opacity">
              <Line data={gpaData} options={chartOpts} />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-500 text-sm font-bold uppercase tracking-wider">CGPA Trend</span>
                <Zap size={18} className="text-brand-500" />
              </div>
              <div>
                <div className="text-3xl font-black text-slate-800">{student.previousCGPA}</div>
                <p className="text-xs text-brand-600 mt-1 font-bold">+0.4 from last sem</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Enrolled Subjects Grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Enrolled Subjects</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {student.enrolledSubjects && student.enrolledSubjects.length > 0 ? (
                student.enrolledSubjects.map(sub => (
                  <div key={sub._id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-tight">{sub.name}</h3>
                        <span className="text-[10px] font-mono font-medium text-slate-450 bg-slate-100 px-2 py-0.5 rounded-full mt-2 inline-block">
                          {sub.code}
                        </span>
                      </div>
                      <span className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-sm shrink-0">
                        {sub.credits}C
                      </span>
                    </div>
                    
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-slate-505">Attendance</span>
                          <span className="text-emerald-600">{student.attendancePercentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${student.attendancePercentage}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-slate-505">Internal Score</span>
                          <span className="text-brand-600">{student.internalMarks}/100</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${student.internalMarks}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
                  <BookOpen className="mx-auto text-slate-300 mb-3" size={32} />
                  <p className="text-slate-500 font-medium">No subjects enrolled yet.</p>
                  <p className="text-sm text-slate-400 mt-1">Contact your admin to assign subjects.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Learning Roadmap & Milestones */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Learning Roadmap</h2>
            
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div>
                <div className="flex justify-between items-center text-sm font-bold mb-2">
                  <span className="text-slate-705 flex items-center gap-1.5">
                    <ClipboardList size={16} className="text-brand-500" /> Roadmap Completion
                  </span>
                  <span className="text-brand-600">{roadmapProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-brand-500 h-2 rounded-full transition-all duration-500" style={{ width: `${roadmapProgress}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-450 mt-2 font-medium">
                  {completedMilestones} of {milestones.length} milestones achieved
                </p>
              </div>

              {/* Add Milestone Form */}
              <form onSubmit={handleAddMilestone} className="flex gap-2">
                <input 
                  type="text" 
                  value={newMilestone}
                  onChange={(e) => setNewMilestone(e.target.value)}
                  placeholder="New roadmap goal..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-brand-500"
                />
                <button
                  type="submit"
                  disabled={addingMilestone || !newMilestone.trim()}
                  className="p-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 disabled:opacity-50 transition-colors shrink-0"
                >
                  <Plus size={16} />
                </button>
              </form>

              {/* Milestones Checklist */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {milestones.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4 italic">No milestones in your roadmap. Add some goals above!</p>
                ) : (
                  milestones.map(milestone => (
                    <div 
                      key={milestone._id}
                      onClick={() => handleToggleMilestone(milestone._id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        milestone.completed 
                          ? 'bg-emerald-50/50 border-emerald-100 text-slate-500 line-through' 
                          : 'bg-slate-50 border-slate-100 text-slate-700 hover:border-slate-200'
                      }`}
                    >
                      {milestone.completed ? (
                        <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <Circle size={16} className="text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <span className="text-xs font-semibold leading-tight flex-1">
                        {milestone.title}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
        </div>

      </PageShell>
    </div>
  );
};

export default StudentDashboard;
