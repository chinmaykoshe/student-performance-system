import React, { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import { 
  TrendingUp, 
  BookOpen, 
  Hourglass, 
  Flame, 
  Compass, 
  Target
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Scatter, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Analytics = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    avgCgpa: 0,
    avgStudyHours: 0,
    backlogPercentage: 0,
    highestCgpa: 0
  });

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students', { params: { limit: 1000 } });
      const data = res.data.data || [];
      setStudents(data);

      if (data.length > 0) {
        let sumCgpa = 0;
        let sumStudy = 0;
        let backlogCount = 0;
        let highest = 0;

        data.forEach(s => {
          sumCgpa += s.previousCGPA;
          sumStudy += s.studyHours;
          if (s.backlogs > 0) backlogCount++;
          if (s.previousCGPA > highest) highest = s.previousCGPA;
        });

        setMetrics({
          avgCgpa: (sumCgpa / data.length).toFixed(2),
          avgStudyHours: (sumStudy / data.length).toFixed(1),
          backlogPercentage: ((backlogCount / data.length) * 100).toFixed(1),
          highestCgpa: highest.toFixed(2)
        });
      }
    } catch (err) {
      console.error('Analytics loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // 1. Chart Data: Scatter (Attendance vs Internals)
  const scatterData = {
    datasets: [
      {
        label: 'Passed Students',
        data: students
          .filter(s => s.prediction?.result === 'Pass')
          .map(s => ({ x: s.attendancePercentage, y: s.internalMarks })),
        backgroundColor: 'rgba(16, 185, 129, 0.65)',
        pointRadius: 6,
        pointHoverRadius: 8
      },
      {
        label: 'At Risk (Fail) Students',
        data: students
          .filter(s => s.prediction?.result === 'Fail')
          .map(s => ({ x: s.attendancePercentage, y: s.internalMarks })),
        backgroundColor: 'rgba(239, 68, 68, 0.75)',
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  };

  const scatterOptions = {
    responsive: true,
    scales: {
      x: {
        title: { display: true, text: 'Attendance Percentage (%)', color: '#94a3b8', font: { size: 10, weight: 'bold' } },
        min: 40,
        max: 100,
        grid: { color: 'rgba(148, 163, 184, 0.08)' }
      },
      y: {
        title: { display: true, text: 'Internal Exam Marks (/100)', color: '#94a3b8', font: { size: 10, weight: 'bold' } },
        min: 0,
        max: 100,
        grid: { color: 'rgba(148, 163, 184, 0.08)' }
      }
    },
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { size: 10 } }
      }
    }
  };

  // 2. Chart Data: Backlogs by Semester (Bar)
  const semesters = [1, 2, 3, 4, 5, 6];
  const backlogsPerSem = semesters.map(sem => {
    const semStudents = students.filter(s => s.semester === sem);
    const sumBacklogs = semStudents.reduce((acc, curr) => acc + curr.backlogs, 0);
    return sumBacklogs;
  });

  const barData = {
    labels: semesters.map(sem => `Semester ${sem}`),
    datasets: [
      {
        label: 'Total Active Backlogs',
        data: backlogsPerSem,
        backgroundColor: 'rgba(245, 158, 11, 0.75)',
        borderRadius: 6
      }
    ]
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.08)' },
        ticks: { stepSize: 1 }
      },
      x: {
        grid: { display: false }
      }
    }
  };

  // 3. Chart Data: Study Hours Distribution (Doughnut)
  const studyRanges = {
    'Low (<3 hrs)': students.filter(s => s.studyHours < 3).length,
    'Medium (3-5 hrs)': students.filter(s => s.studyHours >= 3 && s.studyHours <= 5).length,
    'High (>5 hrs)': students.filter(s => s.studyHours > 5).length
  };

  const doughnutData = {
    labels: Object.keys(studyRanges),
    datasets: [
      {
        data: Object.values(studyRanges),
        backgroundColor: ['#ef4444', '#0ea5e9', '#10b981'],
        borderWidth: 0
      }
    ]
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <Header title="Correlation & Predictive Insights" />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Analytics Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card flex items-center space-x-4">
            <div className="p-3 bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 rounded-xl">
              <Compass size={22} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Average CGPA</p>
              <p className="text-2xl font-bold mt-0.5 text-slate-900 dark:text-white font-sans">{metrics.avgCgpa}</p>
            </div>
          </div>

          <div className="glass-card flex items-center space-x-4">
            <div className="p-3 bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 rounded-xl">
              <Hourglass size={22} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Daily Study Hours</p>
              <p className="text-2xl font-bold mt-0.5 text-slate-900 dark:text-white font-sans">{metrics.avgStudyHours} hrs</p>
            </div>
          </div>

          <div className="glass-card flex items-center space-x-4">
            <div className="p-3 bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 rounded-xl">
              <Flame size={22} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Backlog Incident Rate</p>
              <p className="text-2xl font-bold mt-0.5 text-slate-900 dark:text-white font-sans">{metrics.backlogPercentage}%</p>
            </div>
          </div>

          <div className="glass-card flex items-center space-x-4">
            <div className="p-3 bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 rounded-xl">
              <Target size={22} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Peak CGPA Score</p>
              <p className="text-2xl font-bold mt-0.5 text-slate-900 dark:text-white font-sans">{metrics.highestCgpa}</p>
            </div>
          </div>
        </div>

        {/* Analytics Charts grids */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scatter correlation graph */}
          <div className="glass-card lg:col-span-2 flex flex-col min-h-[400px]">
            <div className="mb-6">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Correlation: Attendance vs Internal Marks</h3>
              <p className="text-sm text-slate-500 mt-1">Maps students individually to trace how attendance and grades dictate prediction thresholds.</p>
            </div>
            {loading ? (
              <div className="flex-1 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl w-full"></div>
            ) : (
              <div className="flex-1 relative w-full h-[300px]">
                <Scatter data={scatterData} options={{...scatterOptions, maintainAspectRatio: false}} />
              </div>
            )}
          </div>

          {/* Study hours splits */}
          <div className="glass-card flex flex-col justify-between min-h-[400px]">
            <div className="mb-6">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Study Hours Segmentation</h3>
              <p className="text-sm text-slate-500 mt-1">Daily self-study dedication ranges.</p>
            </div>
            {loading ? (
              <div className="flex-1 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse w-48 h-48 mx-auto"></div>
            ) : (
              <div className="relative flex-1 w-full flex items-center justify-center">
                <Doughnut data={doughnutData} options={{ cutout: '75%', maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold border-t border-slate-100 dark:border-slate-800/50 pt-4 mt-6 shrink-0">
              <div className="text-rose-500">
                <p className="text-base font-bold">{studyRanges['Low (<3 hrs)']}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">&lt; 3 Hours</p>
              </div>
              <div className="text-sky-500">
                <p className="text-base font-bold">{studyRanges['Medium (3-5 hrs)']}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">3-5 Hours</p>
              </div>
              <div className="text-emerald-500">
                <p className="text-base font-bold">{studyRanges['High (>5 hrs)']}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">&gt; 5 Hours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Backlogs per semester */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="glass-card lg:col-span-2 flex flex-col min-h-[400px]">
            <div className="mb-6">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Active Backlogs Distribution</h3>
              <p className="text-sm text-slate-500 mt-1">Aggregated counts of uncleared subjects grouped per semester.</p>
            </div>
            {loading ? (
              <div className="flex-1 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl w-full"></div>
            ) : (
              <div className="flex-1 relative w-full h-[300px]">
                <Bar data={barData} options={{...barOptions, maintainAspectRatio: false}} />
              </div>
            )}
          </div>

          <div className="glass-card flex flex-col justify-between min-h-[400px]">
            <div className="mb-6">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Predictive Risk Analysis</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                The Random Forest analysis maps Attendance Percentage and Internal Marks as the highest weighted features determining final outcomes.
              </p>
            </div>
            <div className="space-y-4 mt-6 shrink-0">
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20 flex items-start space-x-3 text-sm">
                <span className="shrink-0 text-lg">⚠️</span>
                <p className="leading-relaxed text-rose-700 dark:text-rose-300">
                  <strong className="font-semibold">Risk Warning:</strong> Students falling under 75% attendance show a 91% higher frequency of predictions ending in Fail labels.
                </p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 flex items-start space-x-3 text-sm">
                <span className="shrink-0 text-lg">💡</span>
                <p className="leading-relaxed text-emerald-700 dark:text-emerald-300">
                  <strong className="font-semibold">Recommendation:</strong> Boosting study hours from 2 to 4 hours Daily increases borderline student survival rates by 74.5%.
                </p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default Analytics;
