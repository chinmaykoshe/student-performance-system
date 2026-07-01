import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { api } from '../context/AuthContext';
import Header from '../components/Header';
import { 
  Users, 
  Briefcase, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  MoreHorizontal
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const StatCard = memo(({ title, value, icon, trend, positive }) => (
  <div className="glass-card flex flex-col justify-between">
    <div className="flex justify-between items-start mb-4">
      <span className="text-sm font-medium text-slate-500">{title}</span>
      <div className="p-2 rounded-xl bg-slate-50 text-slate-900 border border-slate-100/50">
        {icon}
      </div>
    </div>
    <div>
      <h2 className="text-2xl font-bold text-slate-900 font-sans">{value}</h2>
      <div className="flex items-center space-x-2 mt-2">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${positive ? 'bg-[#F3F0EB] text-[#B8A284]' : 'bg-rose-50 text-rose-600'}`}>
          {trend}
        </span>
        <span className="text-xs text-slate-500 font-medium">vs last month</span>
      </div>
    </div>
  </div>
));

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    avgAttendance: 0,
    passPercentage: 0,
    riskCount: 0
  });
  
  const [semesterPerformance, setSemesterPerformance] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      
      const studentsRes = await api.get('/students', { params: { limit: 100 } });
      const facultyRes = await api.get('/auth/faculty');
      
      const students = studentsRes.data.data || [];
      const totalStudents = studentsRes.data.total || students.length;
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

      const semGroups = {};
      students.forEach(s => {
        if (!semGroups[s.semester]) {
          semGroups[s.semester] = { sum: 0, count: 0 };
        }
        semGroups[s.semester].sum += s.previousCGPA;
        semGroups[s.semester].count++;
      });

      const semPerfData = Object.keys(semGroups).map(sem => ({
        semester: `Sem ${sem}`,
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
      setRecentStudents(students.slice(0, 5));

    } catch (err) {
      console.error('Error fetching admin dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const lineData = useMemo(() => ({
    labels: semesterPerformance.map(d => d.semester),
    datasets: [
      {
        label: 'Average CGPA',
        data: semesterPerformance.map(d => d.avgCGPA),
        borderColor: '#1C1C1C',
        backgroundColor: '#1C1C1C',
        borderWidth: 2,
        tension: 0.4, // Smooth curved lines
        pointRadius: 4,
        pointBackgroundColor: '#FAF9F7',
        pointBorderWidth: 2,
      }
    ]
  }), [semesterPerformance]);

  const lineOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1C1C1C',
        titleFont: { family: 'Inter', size: 13 },
        bodyFont: { family: 'Inter', size: 13 },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
      }
    },
    scales: {
      y: {
        min: 0, max: 10,
        grid: { color: '#ECECEC', drawBorder: false },
        ticks: { color: '#6B7280', font: { family: 'Inter', size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#6B7280', font: { family: 'Inter', size: 11 } }
      }
    }
  }), []);

  const doughnutData = useMemo(() => ({
    labels: ['Pass', 'At Risk'],
    datasets: [{
      data: [stats.totalStudents - stats.riskCount, stats.riskCount],
      backgroundColor: ['#CBB89D', '#1C1C1C'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  }), [stats.totalStudents, stats.riskCount]);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans transition-colors duration-300">
      
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title="Overview" />

        <main className="flex-1 p-10 max-w-[1400px] mx-auto w-full space-y-10">
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-40 rounded-3xl bg-white border border-slate-100 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 animate-fade-in">
              <StatCard title="Total Students" value={stats.totalStudents} icon={<Users size={16} />} trend="↑ 12.5%" positive={true} />
              <StatCard title="Active Faculty" value={stats.totalFaculty} icon={<Briefcase size={16} />} trend="↑ 8.2%" positive={true} />
              <StatCard title="Avg Attendance" value={`${stats.avgAttendance}%`} icon={<Clock size={16} />} trend="↑ 1.3%" positive={true} />
              <StatCard title="Pass Rate" value={`${stats.passPercentage}%`} icon={<TrendingUp size={16} />} trend="↑ 4.6%" positive={true} />
              <StatCard title="Dropout Risk" value={stats.riskCount} icon={<AlertTriangle size={16} />} trend="↓ 2.1%" positive={true} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Chart */}
            <div className="glass-card lg:col-span-2 flex flex-col min-h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Performance Overview</h3>
                  <p className="text-sm text-slate-500 mt-1">Average CGPA progression across semesters</p>
                </div>
              </div>
              <div className="flex-1 relative w-full h-[300px]">
                {!loading && semesterPerformance.length > 0 && (
                   <Line data={lineData} options={lineOptions} />
                )}
              </div>
            </div>

            {/* Task Overview (Doughnut) */}
            <div className="glass-card flex flex-col justify-between min-h-[400px]">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-base font-semibold text-slate-900">Result Distribution</h3>
               </div>
               
               {!loading && (
                 <>
                   <div className="relative h-48 w-full flex items-center justify-center">
                     <Doughnut data={doughnutData} options={{ cutout: '75%', plugins: { legend: { display: false } } }} />
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-slate-900">{stats.passPercentage}%</span>
                        <span className="text-xs text-slate-500 font-medium">Pass Rate</span>
                     </div>
                   </div>

                   <div className="mt-8 space-y-4">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#CBB89D]"></span>
                          <span className="text-slate-500">Predicted Pass</span>
                        </div>
                        <span className="text-slate-900">{stats.totalStudents - stats.riskCount}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#1C1C1C]"></span>
                          <span className="text-slate-500">At Risk</span>
                        </div>
                        <span className="text-slate-900">{stats.riskCount}</span>
                      </div>
                   </div>
                 </>
               )}
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Recent Students Table */}
            <div className="glass-card lg:col-span-3 overflow-hidden">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-base font-semibold text-slate-900">Recent Registrations</h3>
               </div>
               
               <div className="overflow-x-auto">
                 <table>
                   <thead>
                     <tr>
                       <th>Student Name</th>
                       <th>Date Joined</th>
                       <th>Department</th>
                       <th>Status</th>
                     </tr>
                   </thead>
                   <tbody>
                     {!loading && recentStudents.map((student, i) => (
                       <tr key={student._id || i} className="group">
                         <td className="flex items-center space-x-3">
                           <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">
                             {student.name.charAt(0)}
                           </div>
                           <span className="font-semibold">{student.name}</span>
                         </td>
                         <td className="text-slate-500">{new Date(student.createdAt).toLocaleDateString() || '19 Apr, 2024'}</td>
                         <td className="text-slate-500">{student.department}</td>
                         <td>
                           <span className={`px-3 py-1 rounded-full text-xs font-semibold ${student.prediction?.result === 'Pass' ? 'bg-[#F3F0EB] text-[#B8A284]' : 'bg-slate-100 text-slate-500'}`}>
                             {student.prediction?.result || 'Completed'}
                           </span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>



          </div>

        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
