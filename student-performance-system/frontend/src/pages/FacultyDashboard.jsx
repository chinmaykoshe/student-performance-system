import React, { useEffect, useState, useCallback } from 'react';
import useDebounce from '../hooks/useDebounce';
import { useAuth, api } from '../context/AuthContext';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Edit3, 
  X, 
  Save, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  Mail,
  Award,
  BookOpen,
  TrendingUp,
  Users
} from 'lucide-react';

const FacultyDashboard = () => {
  const { profile } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dashboard view toggle
  const [dashboardView, setDashboardView] = useState('records'); // 'records' | 'assessments'
  const [assessments, setAssessments] = useState([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [semesterFilter, setSemesterFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Edit Modal State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editForm, setEditForm] = useState({
    attendancePercentage: 0,
    assignmentMarks: 0,
    internalMarks: 0,
    previousCGPA: 0,
    studyHours: 0,
    backlogs: 0
  });
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/students', {
        params: {
          search: debouncedSearch,
          semester: semesterFilter || undefined,
          'prediction.result': resultFilter || undefined,
          page,
          limit: 8
        }
      });
      if (res.data && res.data.success) {
        setStudents(res.data.data);
        setTotal(res.data.total);
      }
    } catch (err) {
      setError('Failed to fetch assigned students list.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, semesterFilter, resultFilter, page]);

  const fetchAssessments = useCallback(async () => {
    try {
      setAssessmentsLoading(true);
      const res = await api.get('/assessments/all');
      if (res.data && res.data.success) {
        setAssessments(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load assessments:', err.message);
    } finally {
      setAssessmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (dashboardView === 'records') {
      fetchStudents();
    } else {
      fetchAssessments();
    }
  }, [fetchStudents, fetchAssessments, dashboardView]);

  const handleEditClick = useCallback((student) => {
    setSelectedStudent(student);
    setEditForm({
      attendancePercentage: student.attendancePercentage,
      assignmentMarks: student.assignmentMarks,
      internalMarks: student.internalMarks,
      previousCGPA: student.previousCGPA,
      studyHours: student.studyHours,
      backlogs: student.backlogs
    });
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedStudent(null);
  }, []);

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  }, []);

  const handleSaveForm = useCallback(async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    
    try {
      setSaveLoading(true);
      const res = await api.put(`/students/${selectedStudent._id}`, editForm);
      if (res.data && res.data.success) {
        // Update list locally
        setStudents(prev => prev.map(s => s._id === selectedStudent._id ? res.data.data : s));
        handleCloseModal();
      }
    } catch (err) {
      alert('Error updating student: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaveLoading(false);
    }
  }, [selectedStudent, editForm, handleCloseModal]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title={`Faculty Portal - Dept: ${profile?.department || 'Computer Applications'}`} />

        <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
          
          {/* Dashboard Tabs Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-850 p-1.5 rounded-2xl w-fit space-x-1 border border-slate-200/50 dark:border-slate-800/50">
            <button
              onClick={() => setDashboardView('records')}
              className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                dashboardView === 'records'
                  ? 'bg-white dark:bg-slate-800 text-brand-500 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
              }`}
            >
              <Users size={14} />
              <span>Student Records</span>
            </button>
            <button
              onClick={() => setDashboardView('assessments')}
              className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                dashboardView === 'assessments'
                  ? 'bg-white dark:bg-slate-800 text-brand-500 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
              }`}
            >
              <Award size={14} />
              <span>Assessment Analytics</span>
            </button>
          </div>

          {dashboardView === 'records' ? (
            <div className="space-y-6">
              {/* Top filtering controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search Input */}
                <div className="relative max-w-md w-full">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 pointer-events-none">
                    <Search size={18} />
                  </div>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="glass-input w-full pl-11 pr-4 py-3 rounded-2xl text-sm"
                    placeholder="Search students by name, roll, email..."
                  />
                </div>

                {/* Filter selectors */}
                <div className="flex flex-wrap items-center gap-4">
                  <select
                    value={semesterFilter}
                    onChange={(e) => { setSemesterFilter(e.target.value); setPage(1); }}
                    className="glass-input text-xs font-semibold px-4 py-2.5 rounded-2xl border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-800"
                  >
                    <option value="">All Semesters</option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="3">Semester 3</option>
                    <option value="4">Semester 4</option>
                    <option value="5">Semester 5</option>
                    <option value="6">Semester 6</option>
                  </select>

                  {/* Prediction Result */}
                  <select
                    value={resultFilter}
                    onChange={(e) => { setResultFilter(e.target.value); setPage(1); }}
                    className="glass-input text-xs font-semibold px-4 py-2.5 rounded-2xl border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-800"
                  >
                    <option value="">All Predictions</option>
                    <option value="Pass">Predicted Pass</option>
                    <option value="Fail">Predicted Fail</option>
                  </select>
                </div>
              </div>

              {/* Table Container */}
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
                </div>
              ) : students.length === 0 ? (
                <GlassCard className="flex flex-col items-center justify-center py-20">
                  <HelpCircle size={48} className="text-slate-400 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No students found.</p>
                  <p className="text-xs text-slate-400 mt-1">Try refining your search terms or filters.</p>
                </GlassCard>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-md">
                    <table className="w-full text-left border-collapse bg-white/40 dark:bg-slate-900/30 backdrop-blur-md">
                      <thead>
                        <tr className="border-b border-slate-200/50 dark:border-slate-850/50 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-850/20">
                          <th className="px-6 py-4">Student Details</th>
                          <th className="px-6 py-4">Sem</th>
                          <th className="px-6 py-4">Attendance</th>
                          <th className="px-6 py-4">Assignment</th>
                          <th className="px-6 py-4">Internal</th>
                          <th className="px-6 py-4">CGPA</th>
                          <th className="px-6 py-4">Study Hrs</th>
                          <th className="px-6 py-4">Prediction</th>
                          <th className="px-6 py-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300 text-sm">
                        {students.map((student) => {
                          const isPassing = student.prediction?.result === 'Pass';
                          return (
                            <tr key={student._id} className="hover:bg-slate-100/40 dark:hover:bg-slate-800/20 transition-all">
                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-bold text-slate-800 dark:text-slate-200">{student.name}</p>
                                  <div className="flex items-center space-x-2 mt-0.5 text-xs text-slate-400">
                                    <span className="font-mono">{student.rollNumber}</span>
                                    <span>•</span>
                                    <span className="flex items-center"><Mail size={10} className="mr-1" /> {student.email}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 font-semibold">{student.semester}</td>
                              <td className="px-6 py-4 font-semibold">
                                <span className={student.attendancePercentage < 75 ? 'text-rose-500 font-bold' : ''}>
                                  {student.attendancePercentage}%
                                </span>
                              </td>
                              <td className="px-6 py-4 font-semibold">{student.assignmentMarks}</td>
                              <td className="px-6 py-4 font-semibold">
                                <span className={student.internalMarks < 40 ? 'text-rose-500 font-bold' : ''}>
                                  {student.internalMarks}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-semibold">{student.previousCGPA}</td>
                              <td className="px-6 py-4 text-slate-400">{student.studyHours}h/day</td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                  isPassing 
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25'
                                }`}>
                                  {isPassing ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                  <span>{student.prediction?.result || 'Pending'} ({student.prediction?.confidence || 0}%)</span>
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => handleEditClick(student)}
                                  className="p-2 rounded-xl transition-all bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500 hover:text-white"
                                  title="Edit Academic Performance"
                                >
                                  <Edit3 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination controls */}
                  <div className="flex items-center justify-between mt-6 px-4">
                    <span className="text-xs text-slate-400 font-semibold">
                      Showing {students.length} of {total} students
                    </span>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/40 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-xs font-bold px-3 py-1 text-slate-700 dark:text-slate-300">
                        Page {page} of {Math.ceil(total / 8)}
                      </span>
                      <button
                        disabled={page >= Math.ceil(total / 8)}
                        onClick={() => setPage(page + 1)}
                        className="p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/40 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Assessments Analytics View */
            <div className="space-y-6">
              {assessmentsLoading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
                </div>
              ) : assessments.length === 0 ? (
                <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
                  <BookOpen size={48} className="text-slate-450 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No assessment history available yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Students will appear here once they complete MCQ skills assessments.</p>
                </GlassCard>
              ) : (
                <div className="overflow-x-auto rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-md">
                  <table className="w-full text-left border-collapse bg-white/40 dark:bg-slate-900/30 backdrop-blur-md">
                    <thead>
                      <tr className="border-b border-slate-200/50 dark:border-slate-850/50 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-850/20">
                        <th className="px-6 py-4">Student Details</th>
                        <th className="px-6 py-4">Assessment Category</th>
                        <th className="px-6 py-4">Score</th>
                        <th className="px-6 py-4">Evaluation Status</th>
                        <th className="px-6 py-4">Submitted Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300 text-sm">
                      {assessments.map((a) => (
                        <tr key={a._id} className="hover:bg-slate-100/40 dark:hover:bg-slate-800/20 transition-all">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-200">{a.user?.name || 'Unknown Student'}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{a.user?.email || 'N/A'}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold">{a.category}</td>
                          <td className="px-6 py-4">
                            <span className={`text-base font-black ${a.score >= 70 ? 'text-emerald-500' : 'text-slate-500'}`}>
                              {a.score}%
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1.5 rounded-full text-xs font-bold ${
                              a.score >= 70
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-slate-500/10 text-slate-500'
                            }`}>
                              {a.score >= 70 ? 'Proficient' : 'Needs Review'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400">
                            {new Date(a.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Slide-over / Modal for editing metrics */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-xl rounded-3xl p-8 border border-white/20 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={handleCloseModal}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-850/50"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Update Academic Statistics</h3>
            <p className="text-xs text-slate-400 font-semibold mb-6 uppercase tracking-wider">
              {selectedStudent.name} ({selectedStudent.rollNumber})
            </p>

            <form onSubmit={handleSaveForm} className="space-y-6">
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">
                    Attendance (%)
                  </label>
                  <input
                    type="number"
                    name="attendancePercentage"
                    step="0.01"
                    min="0"
                    max="100"
                    value={editForm.attendancePercentage}
                    onChange={handleFormChange}
                    className="glass-input w-full px-4 py-3 rounded-2xl text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">
                    Assignment Marks
                  </label>
                  <input
                    type="number"
                    name="assignmentMarks"
                    step="0.01"
                    min="0"
                    max="100"
                    value={editForm.assignmentMarks}
                    onChange={handleFormChange}
                    className="glass-input w-full px-4 py-3 rounded-2xl text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">
                    Internal Marks
                  </label>
                  <input
                    type="number"
                    name="internalMarks"
                    step="0.01"
                    min="0"
                    max="100"
                    value={editForm.internalMarks}
                    onChange={handleFormChange}
                    className="glass-input w-full px-4 py-3 rounded-2xl text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">
                    Previous Semester CGPA
                  </label>
                  <input
                    type="number"
                    name="previousCGPA"
                    step="0.01"
                    min="0"
                    max="10"
                    value={editForm.previousCGPA}
                    onChange={handleFormChange}
                    className="glass-input w-full px-4 py-3 rounded-2xl text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">
                    Daily Study Hours
                  </label>
                  <input
                    type="number"
                    name="studyHours"
                    step="0.1"
                    min="0"
                    max="24"
                    value={editForm.studyHours}
                    onChange={handleFormChange}
                    className="glass-input w-full px-4 py-3 rounded-2xl text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">
                    Active Backlogs
                  </label>
                  <input
                    type="number"
                    name="backlogs"
                    min="0"
                    value={editForm.backlogs}
                    onChange={handleFormChange}
                    className="glass-input w-full px-4 py-3 rounded-2xl text-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-3 rounded-2xl font-semibold text-sm border border-slate-200/50 dark:border-slate-700/50 text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-6 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm flex items-center space-x-2 shadow-lg shadow-brand-500/20 disabled:opacity-50"
                >
                  <Save size={16} />
                  <span>{saveLoading ? 'Saving...' : 'Save & Predict'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default FacultyDashboard;
