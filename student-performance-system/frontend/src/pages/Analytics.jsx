import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../context/AuthContext';
import Header from '../components/Header';
import { Badge, PageShell, SectionHeader, SelectField, StatCard } from '../components/AdminUI';
import { BarChart3, BrainCircuit, Clock3, GraduationCap, Target, TrendingUp } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut, Scatter } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, ArcElement);

const chartBase = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#6B7280', boxWidth: 10, boxHeight: 10, font: { family: 'Inter', size: 11 } } },
    tooltip: {
      backgroundColor: '#1C1C1C',
      titleFont: { family: 'Inter', size: 13 },
      bodyFont: { family: 'Inter', size: 13 },
      padding: 12,
      cornerRadius: 8
    }
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#6B7280', font: { family: 'Inter', size: 11 } } },
    y: { grid: { color: '#ECECEC' }, ticks: { color: '#6B7280', font: { family: 'Inter', size: 11 } } }
  }
};

const Analytics = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [semester, setSemester] = useState('all');

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/students', { params: { limit: 1000 } });
        setStudents(res.data.data || []);
      } catch (err) {
        console.error('Analytics loading error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalyticsData();
  }, []);

  const scopedStudents = useMemo(() => {
    if (semester === 'all') return students;
    // semester field is now a populated object with .number
    return students.filter((s) => {
      const semNum = s.semester?.number ?? s.semester;
      return String(semNum) === semester;
    });
  }, [semester, students]);

  const metrics = useMemo(() => {
    if (!scopedStudents.length) {
      return { avgCgpa: '0.00', avgStudyHours: '0.0', backlogPercentage: '0.0', passRate: '0.0' };
    }
    const totals = scopedStudents.reduce((acc, s) => {
      acc.cgpa += Number(s.previousCGPA || 0);
      acc.study += Number(s.studyHours || 0);
      acc.backlogs += Number(s.backlogs || 0) > 0 ? 1 : 0;
      acc.pass += s.prediction?.result === 'Pass' ? 1 : 0;
      return acc;
    }, { cgpa: 0, study: 0, backlogs: 0, pass: 0 });

    return {
      avgCgpa: (totals.cgpa / scopedStudents.length).toFixed(2),
      avgStudyHours: (totals.study / scopedStudents.length).toFixed(1),
      backlogPercentage: ((totals.backlogs / scopedStudents.length) * 100).toFixed(1),
      passRate: ((totals.pass / scopedStudents.length) * 100).toFixed(1)
    };
  }, [scopedStudents]);

  const semesters = [1, 2, 3, 4, 5, 6];
  const studyRanges = {
    '<3 hrs': scopedStudents.filter((s) => s.studyHours < 3).length,
    '3-5 hrs': scopedStudents.filter((s) => s.studyHours >= 3 && s.studyHours <= 5).length,
    '>5 hrs': scopedStudents.filter((s) => s.studyHours > 5).length
  };

  const scatterData = {
    datasets: [
      {
        label: 'Predicted pass',
        data: scopedStudents.filter((s) => s.prediction?.result === 'Pass').map((s) => ({ x: s.attendancePercentage, y: s.internalMarks })),
        backgroundColor: '#CBB89D',
        pointRadius: 5
      },
      {
        label: 'At risk',
        data: scopedStudents.filter((s) => s.prediction?.result === 'Fail').map((s) => ({ x: s.attendancePercentage, y: s.internalMarks })),
        backgroundColor: '#1C1C1C',
        pointRadius: 5
      }
    ]
  };

  const backlogData = {
    labels: semesters.map((sem) => `Sem ${sem}`),
    datasets: [{
      label: 'Active backlogs',
      data: semesters.map((sem) => students.filter((s) => {
        const semNum = s.semester?.number ?? s.semester;
        return semNum === sem;
      }).reduce((sum, s) => sum + Number(s.backlogs || 0), 0)),
      backgroundColor: '#CBB89D',
      borderRadius: 10,
      maxBarThickness: 42
    }]
  };

  const doughnutData = {
    labels: Object.keys(studyRanges),
    datasets: [{ data: Object.values(studyRanges), backgroundColor: ['#1C1C1C', '#CBB89D', '#8C7355'], borderWidth: 0 }]
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 text-slate-900">
      <Header title="Analytics" />
      <PageShell>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SectionHeader title="Predictive Insights" subtitle="Student outcomes, risk factors, and academic signals in one structured view." />
          <SelectField value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full sm:w-48">
            <option value="all">All semesters</option>
            {semesters.map((sem) => <option key={sem} value={String(sem)}>Semester {sem}</option>)}
          </SelectField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard title="Average CGPA" value={metrics.avgCgpa} icon={<GraduationCap size={16} />} trend="Across selected students" />
          <StatCard title="Daily Study Hours" value={`${metrics.avgStudyHours} hrs`} icon={<Clock3 size={16} />} trend="Mean self-study time" />
          <StatCard title="Backlog Incident Rate" value={`${metrics.backlogPercentage}%`} icon={<Target size={16} />} trend="Students with active backlogs" tone="warning" />
          <StatCard title="Predicted Pass Rate" value={`${metrics.passRate}%`} icon={<TrendingUp size={16} />} trend="Based on latest prediction labels" tone="brand" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="glass-card lg:col-span-2 min-h-[420px] flex flex-col">
            <SectionHeader title="Attendance vs Internal Marks" subtitle="Each point represents a student prediction outcome." />
            <div className="mt-6 h-[320px]">
              {loading ? <div className="h-full rounded-2xl bg-slate-100 animate-pulse" /> : <Scatter data={scatterData} options={chartBase} />}
            </div>
          </div>

          <div className="glass-card min-h-[420px] flex flex-col">
            <SectionHeader title="Study Segmentation" subtitle="Distribution of daily preparation time." />
            <div className="relative mt-6 flex-1 min-h-56">
              {loading ? <div className="h-full rounded-2xl bg-slate-100 animate-pulse" /> : <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, cutout: '74%', plugins: { legend: { display: false } } }} />}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {Object.entries(studyRanges).map(([label, count]) => (
                <div key={label} className="rounded-2xl bg-slate-50 p-3 text-center border border-slate-100">
                  <p className="text-lg font-bold text-slate-900">{count}</p>
                  <p className="text-xs font-medium text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="glass-card lg:col-span-2 min-h-[390px]">
            <SectionHeader title="Backlogs By Semester" subtitle="Aggregated backlog volume for academic planning." />
            <div className="mt-6 h-[285px]">
              {loading ? <div className="h-full rounded-2xl bg-slate-100 animate-pulse" /> : <Bar data={backlogData} options={{ ...chartBase, plugins: { ...chartBase.plugins, legend: { display: false } } }} />}
            </div>
          </div>

          <div className="glass-card min-h-[390px] flex flex-col justify-between">
            <div>
              <SectionHeader title="Risk Signals" subtitle="Operational guidance from the prediction model." />
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <Badge tone="dark"><BrainCircuit size={12} /> Model signal</Badge>
                  <p className="mt-3 text-sm leading-6 text-slate-600">Attendance and internal marks remain the strongest visible indicators for intervention priority.</p>
                </div>
                <div className="rounded-2xl border border-brand-200 bg-brand-100 p-4">
                  <Badge tone="brand"><BarChart3 size={12} /> Action</Badge>
                  <p className="mt-3 text-sm leading-6 text-slate-700">Review low-attendance students before exam windows and pair them with remedial support.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageShell>
    </div>
  );
};

export default Analytics;
