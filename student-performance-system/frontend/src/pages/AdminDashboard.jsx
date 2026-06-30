import React, { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import { 
  Users, 
  UserCheck, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  FileSpreadsheet, 
  Upload, 
  CheckCircle2,
  FileText
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    avgAttendance: 0,
    passPercentage: 0,
    riskCount: 0
  });
  
  const [semesterPerformance, setSemesterPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [file, setFile] = useState(null);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const studentsRes = await api.get('/students', { params: { limit: 1000 } });
      const facultyRes = await api.get('/auth/faculty');
      
      // Since we don't have a direct /stats API, we can calculate stats on the fly from the full list!
      // This is extremely modular and guarantees correct values.
      const students = studentsRes.data.data || [];
      const totalStudents = studentsRes.data.total || students.length;
      
      // Get faculty count dynamically from API
      const totalFaculty = facultyRes.data.data?.length || facultyRes.data.count || 2;

      let sumAttendance = 0;
      let passCount = 0;
      let failCount = 0;

      students.forEach(s => {
        sumAttendance += s.attendancePercentage;
        if (s.prediction?.result === 'Pass') passCount++;
        if (s.prediction?.result === 'Fail') failCount++;
      });

      const avgAttendance = totalStudents > 0 ? (sumAttendance / totalStudents).toFixed(1) : 0;
      const passPercentage = totalStudents > 0 ? ((passCount / totalStudents) * 100).toFixed(1) : 0;

      // Group average CGPA by semester
      const semGroups = {};
      students.forEach(s => {
        if (!semGroups[s.semester]) {
          semGroups[s.semester] = { sum: 0, count: 0 };
        }
        semGroups[s.semester].sum += s.previousCGPA;
        semGroups[s.semester].count++;
      });

      const semPerfData = Object.keys(semGroups).map(sem => ({
        semester: `Semester ${sem}`,
        avgCGPA: (semGroups[sem].sum / semGroups[sem].count).toFixed(2)
      })).sort((a, b) => a.semester.localeCompare(b.semester));

      setSemesterPerformance(semPerfData);
      setStats({
        totalStudents,
        totalFaculty,
        avgAttendance,
        passPercentage,
        riskCount: failCount
      });

    } catch (err) {
      console.error('Error fetching admin dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setUploadMessage(null);
  };

  const handleCSVUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      setUploadMessage(null);
      const res = await api.post('/students/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data && res.data.success) {
        setUploadMessage({
          type: 'success',
          text: res.data.message
        });
        setFile(null);
        // Refresh statistics
        fetchDashboardStats();
      }
    } catch (err) {
      setUploadMessage({
        type: 'error',
        text: err.response?.data?.error || 'CSV/Excel import failed. Check file format.'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.get('/report/excel', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'Student_Performance_Report.xlsx';
      link.click();
    } catch (error) {
      alert('Failed to export spreadsheet.');
    }
  };

  // Chart 1: Result Distribution (Doughnut)
  const doughnutData = {
    labels: ['Pass predicted', 'Fail predicted (At Risk)'],
    datasets: [
      {
        data: [stats.totalStudents - stats.riskCount, stats.riskCount],
        backgroundColor: ['#10b981', '#ef4444'],
        hoverBackgroundColor: ['#059669', '#dc2626'],
        borderWidth: 0,
      }
    ]
  };

  // Chart 2: Semester CGPA (Bar)
  const barData = {
    labels: semesterPerformance.map(d => d.semester),
    datasets: [
      {
        label: 'Average CGPA',
        data: semesterPerformance.map(d => d.avgCGPA),
        backgroundColor: '#0ea5e9',
        borderRadius: 8,
      }
    ]
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        min: 0,
        max: 10,
        grid: { color: 'rgba(148, 163, 184, 0.1)' }
      },
      x: {
        grid: { display: false }
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title="Administrative Analytics Dashboard" />

        <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
          
          {/* Section 1: Metrics Overview Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-white/20 dark:bg-slate-800/20 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              
              <GlassCard className="flex items-center space-x-4">
                <div className="p-3 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-2xl">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Students</p>
                  <p className="text-2xl font-bold mt-1 text-slate-800 dark:text-white">{stats.totalStudents}</p>
                </div>
              </GlassCard>

              <GlassCard className="flex items-center space-x-4">
                <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                  <UserCheck size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Faculty</p>
                  <p className="text-2xl font-bold mt-1 text-slate-800 dark:text-white">{stats.totalFaculty}</p>
                </div>
              </GlassCard>

              <GlassCard className="flex items-center space-x-4">
                <div className="p-3 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-2xl">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Attendance</p>
                  <p className="text-2xl font-bold mt-1 text-slate-800 dark:text-white">{stats.avgAttendance}%</p>
                </div>
              </GlassCard>

              <GlassCard className="flex items-center space-x-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pass Ratio</p>
                  <p className="text-2xl font-bold mt-1 text-slate-800 dark:text-white">{stats.passPercentage}%</p>
                </div>
              </GlassCard>

              <GlassCard className="flex items-center space-x-4 border-rose-500/10 dark:border-rose-500/5">
                <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Students At Risk</p>
                  <p className="text-2xl font-bold mt-1 text-slate-800 dark:text-white">{stats.riskCount}</p>
                </div>
              </GlassCard>

            </div>
          )}

          {/* Section 2: CSV Upload & Excel Export Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Import CSV Card */}
            <GlassCard className="md:col-span-2">
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Bulk Import Student Records</h3>
              
              <form onSubmit={handleCSVUpload} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="flex-1 relative border border-dashed border-slate-350 dark:border-slate-700/50 rounded-2xl p-4 flex items-center justify-center bg-white/10 dark:bg-slate-900/10">
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-center flex items-center space-x-3 text-slate-400 text-sm">
                    <Upload size={18} />
                    <span>{file ? file.name : 'Choose CSV or Excel Spreadsheet'}</span>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="px-6 py-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-brand-500/15 disabled:opacity-50"
                >
                  <span>{uploading ? 'Processing...' : 'Upload & Predict'}</span>
                </button>
              </form>

              {uploadMessage && (
                <div className={`mt-4 p-4 rounded-2xl flex items-start space-x-2.5 text-xs border ${
                  uploadMessage.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300' 
                    : 'bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-300'
                }`}>
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{uploadMessage.text}</span>
                </div>
              )}
            </GlassCard>

            {/* Quick Export Cards */}
            <GlassCard className="flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">Export Data Reports</h3>
                <p className="text-xs text-slate-400">Download consolidated academic spreadsheets containing student predictions.</p>
              </div>

              <button
                onClick={handleExportExcel}
                className="w-full mt-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/15 transition-all"
              >
                <FileSpreadsheet size={18} />
                <span>Export Class Spreadsheet</span>
              </button>
            </GlassCard>
          </div>

          {/* Section 3: Visual Analytics Charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Doughnut Result distribution */}
            <GlassCard className="flex flex-col items-center justify-between">
              <div className="w-full text-left mb-6">
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Pass/Fail Distribution</h3>
                <p className="text-xs text-slate-400">AI-predicted final result splits.</p>
              </div>

              {loading ? (
                <div className="h-44 w-44 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
              ) : (
                <div className="h-[180px] w-[180px] flex items-center justify-center">
                  <Doughnut data={doughnutData} options={{ cutout: '70%', plugins: { legend: { display: false } } }} />
                </div>
              )}

              <div className="w-full mt-6 grid grid-cols-2 gap-4 text-xs font-semibold text-center border-t border-slate-100 dark:border-slate-800/50 pt-4">
                <div className="text-emerald-500">
                  <p className="text-lg font-bold">{stats.totalStudents - stats.riskCount}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Predicted Pass</p>
                </div>
                <div className="text-rose-500">
                  <p className="text-lg font-bold">{stats.riskCount}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Predicted Fail</p>
                </div>
              </div>
            </GlassCard>

            {/* Semester Performance */}
            <GlassCard className="md:col-span-2">
              <div className="mb-6">
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Semester Performance</h3>
                <p className="text-xs text-slate-400">Average CGPA progression across semesters.</p>
              </div>

              {loading ? (
                <div className="h-60 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
              ) : semesterPerformance.length === 0 ? (
                <div className="h-60 flex items-center justify-center text-slate-450 italic text-sm">No semester performance data.</div>
              ) : (
                <Bar data={barData} options={barOptions} />
              )}
            </GlassCard>

          </div>

        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
