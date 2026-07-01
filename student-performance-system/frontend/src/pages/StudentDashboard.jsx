import React, { useEffect, useState } from 'react';
import { useAuth, api } from '../context/AuthContext';
import Header from '../components/Header';
import { PageShell } from '../components/AdminUI';
import { BookOpen, Calendar, TrendingUp, Download, Clock, Zap, Star, AlertTriangle, ArrowRight } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip as ChartTooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, Legend, Filler);

const StudentDashboard = () => {
  const { profile } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
        <AlertTriangle size={48} className="text-slate-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Profile Not Found</h2>
        <p className="text-slate-500 mt-2">Could not load academic data.</p>
      </div>
    );
  }

  const handleDownloadPDF = async () => {
    try {
      const response = await api.get(`/report/pdf/${student._id}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Report_Card_${student.rollNumber}.pdf`;
      link.click();
    } catch (err) {
      alert('Error downloading report card.');
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
              {student.course?.name || 'Academic Program'} • {student.semester?.name || 'Current Semester'}
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

          <div className="relative z-10 flex gap-3">
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-500/20">
              <Download size={18} /> Report Card
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

        {/* Subjects Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Enrolled Subjects</h2>
            <button className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              View Curriculum <ArrowRight size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {student.enrolledSubjects && student.enrolledSubjects.length > 0 ? (
              student.enrolledSubjects.map(sub => (
                <div key={sub._id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg leading-tight">{sub.name}</h3>
                      <span className="text-xs font-mono font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full mt-2 inline-block">
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
                        <span className="text-slate-500">Attendance</span>
                        <span className="text-emerald-600">85%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-500">Internal Score</span>
                        <span className="text-brand-600">32/40</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: '80%' }}></div>
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

      </PageShell>
    </div>
  );
};

export default StudentDashboard;
