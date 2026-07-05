import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';
import { PageShell, PrimaryButton } from '../components/AdminUI';
import { User, BookOpen, Layers, Target, GraduationCap } from 'lucide-react';

const StudentOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Academic dropsdowns
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [semesters, setSemesters] = useState([]);

  const [formData, setFormData] = useState({
    rollNumber: '',
    department: '',
    course: '',
    academicYear: '',
    semester: '',
    attendancePercentage: 80,
    assignmentMarks: 70,
    internalMarks: 70,
    previousCGPA: 7.0,
    studyHours: 4,
    backlogs: 0
  });

  useEffect(() => {
    const fetchAcademicData = async () => {
      try {
        const [depRes, couRes, yrRes, semRes] = await Promise.all([
          api.get('/academic/departments'),
          api.get('/academic/courses'),
          api.get('/academic/years'),
          api.get('/academic/semesters')
        ]);
        
        setDepartments(depRes.data.data || []);
        setCourses(couRes.data.data || []);
        
        const years = yrRes.data.data || [];
        setAcademicYears(years);
        
        const sems = semRes.data.data || [];
        setSemesters(sems);

        setFormData(prev => ({
          ...prev,
          department: depRes.data.data?.[0]?._id || '',
          course: couRes.data.data?.[0]?._id || '',
          academicYear: years.find(y => y.isCurrent)?._id || years[0]?._id || '',
          semester: sems[0]?._id || ''
        }));
      } catch (err) {
        setError('Failed to load academic structure data. Please try refreshing.');
      } finally {
        setLoading(false);
      }
    };
    fetchAcademicData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        ...formData,
        attendancePercentage: parseFloat(formData.attendancePercentage) || 0,
        assignmentMarks: parseFloat(formData.assignmentMarks) || 0,
        internalMarks: parseFloat(formData.internalMarks) || 0,
        previousCGPA: parseFloat(formData.previousCGPA) || 0,
        studyHours: parseFloat(formData.studyHours) || 0,
        backlogs: parseInt(formData.backlogs, 10) || 0
      };

      const res = await api.post('/students/setup', payload);
      if (res.data.success) {
        // Redirect to dashboard now that profile is setup
        window.location.href = '/student'; // Full reload to re-fetch context
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to setup profile');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 px-8 py-6 text-white text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 mb-4 shadow-lg shadow-brand-500/20">
            <GraduationCap className="text-white h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold font-sans">Complete Your Profile</h2>
          <p className="text-slate-400 mt-2 text-sm max-w-sm mx-auto">
            Welcome, {user?.name || 'Student'}! We need a few more academic details to set up your PredictEdu dashboard.
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Roll Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  required
                  placeholder="e.g. MCA20261000"
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Department</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Layers className="h-5 w-5 text-slate-400" />
                  </div>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none bg-white"
                  >
                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Course</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BookOpen className="h-5 w-5 text-slate-400" />
                  </div>
                  <select
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none bg-white"
                  >
                    {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Academic Year</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Target className="h-5 w-5 text-slate-400" />
                  </div>
                  <select
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none bg-white"
                  >
                    {academicYears.map(y => <option key={y._id} value={y._id}>{y.year}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Semester</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Target className="h-5 w-5 text-slate-400" />
                  </div>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none bg-white"
                  >
                    {semesters.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end">
              <PrimaryButton type="submit" disabled={submitting || !formData.department} className="w-full md:w-auto px-8">
                {submitting ? 'Setting up Profile...' : 'Complete Setup & Go to Dashboard'}
              </PrimaryButton>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default StudentOnboarding;
