import React, { useEffect, useState, useCallback, useMemo } from 'react';
import useDebounce from '../hooks/useDebounce';
import { api } from '../context/AuthContext';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Save, 
  ChevronLeft, 
  ChevronRight, 
  FileText,
  AlertTriangle,
  BrainCircuit,
  Flag
} from 'lucide-react';

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  
  const [formData, setFormData] = useState({
    rollNumber: '',
    name: '',
    email: '',
    department: 'Computer Applications (MCA)',
    semester: 1,
    attendancePercentage: 80,
    assignmentMarks: 70,
    internalMarks: 70,
    previousCGPA: 7.0,
    studyHours: 4,
    backlogs: 0
  });

  const [saving, setSaving] = useState(false);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/students', {
        params: {
          search: debouncedSearch,
          page,
          limit: 8
        }
      });
      if (res.data && res.data.success) {
        setStudents(res.data.data);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleOpenAddModal = useCallback(() => {
    setEditingStudent(null);
    setFormData({
      rollNumber: '',
      name: '',
      email: '',
      department: 'Computer Applications (MCA)',
      semester: 1,
      attendancePercentage: 80,
      assignmentMarks: 70,
      internalMarks: 70,
      previousCGPA: 7.0,
      studyHours: 4,
      backlogs: 0
    });
    setModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((student) => {
    setEditingStudent(student);
    setFormData({
      rollNumber: student.rollNumber,
      name: student.name,
      email: student.email,
      department: student.department,
      semester: student.semester,
      attendancePercentage: student.attendancePercentage,
      assignmentMarks: student.assignmentMarks,
      internalMarks: student.internalMarks,
      previousCGPA: student.previousCGPA,
      studyHours: student.studyHours,
      backlogs: student.backlogs
    });
    setModalOpen(true);
  }, []);

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    const numericFields = [
      'semester', 
      'attendancePercentage', 
      'assignmentMarks', 
      'internalMarks', 
      'previousCGPA', 
      'studyHours', 
      'backlogs'
    ];

    setFormData(prev => ({
      ...prev,
      [name]: numericFields.includes(name) ? parseFloat(value) || 0 : value
    }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingStudent) {
        // Update Student
        const res = await api.put(`/students/${editingStudent._id}`, formData);
        if (res.data && res.data.success) {
          fetchStudents();
          setModalOpen(false);
        }
      } else {
        // Create Student
        const res = await api.post('/students', formData);
        if (res.data && res.data.success) {
          fetchStudents();
          setModalOpen(false);
        }
      }
    } catch (err) {
      alert('Error saving student record: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  }, [editingStudent, formData, fetchStudents]);

  const handleDeleteStudent = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this student and their user credentials?')) return;
    try {
      await api.delete(`/students/${id}`);
      fetchStudents();
    } catch (err) {
      alert('Delete failed.');
    }
  }, [fetchStudents]);

  const handleManualPredict = useCallback(async (id) => {
    try {
      const res = await api.post(`/students/${id}/predict`);
      if (res.data && res.data.success) {
        alert('Prediction re-calculated successfully!');
        fetchStudents();
      }
    } catch (error) {
      alert('Prediction recalculation failed.');
    }
  }, [fetchStudents]);

  const handleFlagStudent = useCallback(async (id, currentFlagged) => {
    try {
      const reason = !currentFlagged ? (window.prompt('Optional: Enter a reason for flagging this student:') || '') : '';
      await api.patch(`/students/${id}/flag`, { flagReason: reason });
      fetchStudents();
    } catch (err) {
      alert('Flag action failed.');
    }
  }, [fetchStudents]);

  // Generate dynamic initials for the profile circle
  const getInitials = useCallback((n) => {
    if (!n) return 'ST';
    const parts = n.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return n.slice(0, 2).toUpperCase();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title="Manage Student Registry" />

        <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
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
                placeholder="Search by name, roll number, email..."
              />
            </div>

            {/* Add Student Button */}
            <button
              onClick={handleOpenAddModal}
              className="px-5 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-brand-500/20 transform active:scale-95 transition"
            >
              <Plus size={18} />
              <span>Add Student</span>
            </button>
          </div>

          {/* Listing */}
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
            </div>
          ) : students.length === 0 ? (
            <GlassCard className="flex flex-col items-center justify-center py-20">
              <AlertTriangle size={48} className="text-slate-400 mb-4" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">No students registered yet.</p>
              <p className="text-xs text-slate-400 mt-1">Use the Add Student button above or upload a CSV.</p>
            </GlassCard>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-md">
                <table className="w-full text-left border-collapse bg-white/40 dark:bg-slate-900/30 backdrop-blur-md">
                  <thead>
                    <tr className="border-b border-slate-200/50 dark:border-slate-850/50 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-850/20">
                      <th className="px-6 py-4">Roll & Student Details</th>
                      <th className="px-6 py-4">Department & Sem</th>
                      <th className="px-6 py-4">Attendance</th>
                      <th className="px-6 py-4">Internal Marks</th>
                      <th className="px-6 py-4">CGPA</th>
                      <th className="px-6 py-4">Prediction</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300 text-sm">
                    {students.map((student) => {
                      const isPassing = student.prediction?.result === 'Pass';

                      return (
                        <tr key={student._id} className="hover:bg-slate-100/30 dark:hover:bg-slate-800/15 transition-all duration-150">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3.5">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-brand-600/15 to-brand-500/5 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs shrink-0 border border-brand-500/10">
                                {getInitials(student.name)}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight">{student.name}</p>
                                  {student.isFlagged && (
                                    <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-500 text-[9px] font-bold border border-rose-500/20">
                                      <Flag size={8} />
                                      <span>Flagged</span>
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-450 font-semibold mt-0.5">{student.rollNumber} • {student.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">{student.department.split(' (')[0]}</p>
                            <p className="text-[10px] text-slate-450 font-semibold mt-0.5">Semester {student.semester}</p>
                          </td>
                          <td className="px-6 py-4 font-semibold text-xs">
                            <span className={student.attendancePercentage < 75 ? 'text-rose-500 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                              {student.attendancePercentage}%
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 text-xs">{student.internalMarks}/100</td>
                          <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 text-xs">{student.previousCGPA}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                              isPassing 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25'
                            }`}>
                              <span>{student.prediction?.result || 'Pending'} ({student.prediction?.confidence || 0}%)</span>
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => handleManualPredict(student._id)}
                                className="p-2 rounded-xl text-amber-600 bg-amber-500/10 hover:bg-amber-500 hover:text-white transition-all duration-200"
                                title="Trigger AI Prediction"
                              >
                                <BrainCircuit size={14} />
                              </button>
                              <button
                                onClick={() => handleFlagStudent(student._id, student.isFlagged)}
                                className={`p-2 rounded-xl transition-all duration-200 ${
                                  student.isFlagged
                                    ? 'text-white bg-rose-500 hover:bg-rose-600'
                                    : 'text-rose-400 bg-rose-500/10 hover:bg-rose-500 hover:text-white'
                                }`}
                                title={student.isFlagged ? 'Unflag student' : 'Flag for review'}
                              >
                                <Flag size={14} />
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(student)}
                                className="p-2 rounded-xl text-brand-600 bg-brand-500/10 hover:bg-brand-500 hover:text-white transition-all duration-200"
                                title="Edit Student details"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(student._id)}
                                className="p-2 rounded-xl text-rose-600 bg-rose-500/10 hover:bg-rose-500 hover:text-white transition-all duration-200"
                                title="Delete Student"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
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
                    Page {page} of {Math.ceil(total / 8) || 1}
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

        </main>
      </div>

      {/* Slide-over / Modal for Adding/Editing */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="glass-card w-full max-w-2xl rounded-3xl p-8 border border-white/20 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-850/50"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
              {editingStudent ? 'Edit Student Details' : 'Add New Student Record'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Primary Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">
                    Student Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    className="glass-input w-full px-4 py-3 rounded-2xl text-sm"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">
                    University Roll Number
                  </label>
                  <input
                    type="text"
                    name="rollNumber"
                    value={formData.rollNumber}
                    onChange={handleFormChange}
                    className="glass-input w-full px-4 py-3 rounded-2xl text-sm"
                    placeholder="MCA20260001"
                    disabled={!!editingStudent}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    className="glass-input w-full px-4 py-3 rounded-2xl text-sm"
                    placeholder="name@university.edu"
                    disabled={!!editingStudent}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">
                    Department
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleFormChange}
                    className="glass-input w-full px-4 py-3 rounded-2xl text-sm bg-white dark:bg-slate-800"
                  >
                    <option value="Computer Applications (MCA)">Computer Applications (MCA)</option>
                    <option value="Computer Science (MSc)">Computer Science (MSc)</option>
                    <option value="Information Technology (MSc)">Information Technology (MSc)</option>
                  </select>
                </div>
              </div>

              {/* Performance Info */}
              <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-5">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase block mb-4">Academic variables (Used for prediction)</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
                      Semester
                    </label>
                    <input
                      type="number"
                      name="semester"
                      min="1"
                      max="6"
                      value={formData.semester}
                      onChange={handleFormChange}
                      className="glass-input w-full px-3 py-2.5 rounded-xl text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
                      Attendance %
                    </label>
                    <input
                      type="number"
                      name="attendancePercentage"
                      min="0"
                      max="100"
                      value={formData.attendancePercentage}
                      onChange={handleFormChange}
                      className="glass-input w-full px-3 py-2.5 rounded-xl text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
                      Assignment (100)
                    </label>
                    <input
                      type="number"
                      name="assignmentMarks"
                      min="0"
                      max="100"
                      value={formData.assignmentMarks}
                      onChange={handleFormChange}
                      className="glass-input w-full px-3 py-2.5 rounded-xl text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
                      Internal (100)
                    </label>
                    <input
                      type="number"
                      name="internalMarks"
                      min="0"
                      max="100"
                      value={formData.internalMarks}
                      onChange={handleFormChange}
                      className="glass-input w-full px-3 py-2.5 rounded-xl text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
                      CGPA
                    </label>
                    <input
                      type="number"
                      name="previousCGPA"
                      step="0.01"
                      min="0"
                      max="10"
                      value={formData.previousCGPA}
                      onChange={handleFormChange}
                      className="glass-input w-full px-3 py-2.5 rounded-xl text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
                      Study Hours
                    </label>
                    <input
                      type="number"
                      name="studyHours"
                      step="0.1"
                      min="0"
                      max="24"
                      value={formData.studyHours}
                      onChange={handleFormChange}
                      className="glass-input w-full px-3 py-2.5 rounded-xl text-sm"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
                      Active Backlogs
                    </label>
                    <input
                      type="number"
                      name="backlogs"
                      min="0"
                      value={formData.backlogs}
                      onChange={handleFormChange}
                      className="glass-input w-full px-3 py-2.5 rounded-xl text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-3 rounded-2xl font-semibold text-sm border border-slate-200/50 dark:border-slate-700/50 text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm flex items-center space-x-2 shadow-lg shadow-brand-500/20 disabled:opacity-50"
                >
                  <Save size={16} />
                  <span>{saving ? 'Saving...' : 'Save Record'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminStudents;
