import React, { useCallback, useEffect, useState } from 'react';
import useDebounce from '../hooks/useDebounce';
import { api } from '../context/AuthContext';
import Header from '../components/Header';
import { Badge, EmptyState, IconButton, Modal, PageShell, PrimaryButton, SearchField, SecondaryButton, StatCard, TableCard, Toolbar } from '../components/AdminUI';
import { AlertTriangle, BrainCircuit, ChevronLeft, ChevronRight, Edit3, Flag, Plus, Save, Search, Trash2, Users } from 'lucide-react';

const initialForm = {
  rollNumber: '',
  name: '',
  email: '',
  department: '',
  course: '',
  academicYear: '',
  semester: '',
  division: 'A',
  attendancePercentage: 80,
  assignmentMarks: 70,
  internalMarks: 70,
  previousCGPA: 7.0,
  studyHours: 4,
  backlogs: 0
};

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  // Academic structure data for dropdowns
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [semesters, setSemesters] = useState([]);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/students', { params: { search: debouncedSearch, page, limit: 8 } });
      if (res.data?.success) {
        setStudents(res.data.data || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // Load academic structure data for dropdowns on mount
  useEffect(() => {
    const fetchAcademic = async () => {
      try {
        const [depRes, couRes, yrRes, semRes] = await Promise.all([
          api.get('/academic/departments'),
          api.get('/academic/courses'),
          api.get('/academic/years'),
          api.get('/academic/semesters')
        ]);
        setDepartments(depRes.data.data || []);
        setCourses(couRes.data.data || []);
        setAcademicYears(yrRes.data.data || []);
        setSemesters(semRes.data.data || []);
      } catch (err) {
        console.error('Failed to load academic structure:', err);
      }
    };
    fetchAcademic();
  }, []);

  const openAddModal = () => {
    setEditingStudent(null);
    // Pre-select first available options
    setFormData({
      ...initialForm,
      department: departments[0]?._id || '',
      course: courses[0]?._id || '',
      academicYear: academicYears.find(y => y.isCurrent)?._id || academicYears[0]?._id || '',
      semester: semesters[0]?._id || ''
    });
    setModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      ...initialForm,
      ...student,
      department: student.department?._id || student.department || '',
      course: student.course?._id || student.course || '',
      academicYear: student.academicYear?._id || student.academicYear || '',
      semester: student.semester?._id || student.semester || ''
    });
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ['attendancePercentage', 'assignmentMarks', 'internalMarks', 'previousCGPA', 'studyHours', 'backlogs'];
    setFormData((prev) => ({ ...prev, [name]: numericFields.includes(name) ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = editingStudent
        ? await api.put(`/students/${editingStudent._id}`, formData)
        : await api.post('/students', formData);
      if (res.data?.success) {
        await fetchStudents();
        setModalOpen(false);
      }
    } catch (err) {
      alert('Error saving student record: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Delete this student and their user credentials?')) return;
    try {
      await api.delete(`/students/${id}`);
      fetchStudents();
    } catch {
      alert('Delete failed.');
    }
  };

  const handleManualPredict = async (id) => {
    try {
      const res = await api.post(`/students/${id}/predict`);
      if (res.data?.success) fetchStudents();
    } catch {
      alert('Prediction recalculation failed.');
    }
  };

  const handleFlagStudent = async (id, currentFlagged) => {
    try {
      const reason = !currentFlagged ? (window.prompt('Optional reason for flagging this student:') || '') : '';
      await api.patch(`/students/${id}/flag`, { flagReason: reason });
      fetchStudents();
    } catch {
      alert('Flag action failed.');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'ST';
    const parts = name.split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  const atRisk = students.filter((s) => s.prediction?.result === 'Fail').length;
  const flagged = students.filter((s) => s.isFlagged).length;
  const pageCount = Math.ceil(total / 8) || 1;

  // Filter semesters by selected course
  const filteredSemesters = semesters.filter(sem =>
    !formData.course || sem.course?._id === formData.course || sem.course === formData.course
  );

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 text-slate-900">
      <Header title="Students" />
      <PageShell>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Registry Size" value={total} icon={<Users size={16} />} trend="Total student records" />
          <StatCard title="Visible At Risk" value={atRisk} icon={<AlertTriangle size={16} />} trend="On the current page" tone="danger" />
          <StatCard title="Flagged Reviews" value={flagged} icon={<Flag size={16} />} trend="Needs faculty attention" tone="warning" />
        </div>

        <Toolbar>
          <SearchField
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            icon={<Search size={18} />}
            placeholder="Search by name, roll number, or email"
          />
          <PrimaryButton onClick={openAddModal}><Plus size={17} /> Add Student</PrimaryButton>
        </Toolbar>

        <TableCard>
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-14 rounded-2xl bg-slate-100 animate-pulse" />)}</div>
          ) : students.length === 0 ? (
            <EmptyState icon={<Users size={22} />} title="No students found" description="Adjust the search or add the first student record." action={<PrimaryButton onClick={openAddModal}><Plus size={16} /> Add Student</PrimaryButton>} />
          ) : (
            <table>
              <thead>
                <tr>
                  <th className="px-6 pt-5">Student</th>
                  <th className="px-6 pt-5">Department / Sem</th>
                  <th className="px-6 pt-5">Attendance</th>
                  <th className="px-6 pt-5">Marks</th>
                  <th className="px-6 pt-5">CGPA</th>
                  <th className="px-6 pt-5">Prediction</th>
                  <th className="px-6 pt-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const passing = student.prediction?.result === 'Pass';
                  // department & semester are populated objects after our fix
                  const deptName = student.department?.name || student.department || '—';
                  const semName = student.semester?.name || `Sem ${student.semester}` || '—';
                  return (
                    <tr key={student._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">{getInitials(student.name)}</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-900">{student.name}</p>
                              {student.isFlagged && <Badge tone="danger"><Flag size={11} /> Flagged</Badge>}
                            </div>
                            <p className="text-xs font-medium text-slate-500">{student.rollNumber} | {student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6"><p className="font-medium">{deptName}</p><p className="text-xs text-slate-500">{semName}</p></td>
                      <td className="px-6"><Badge tone={student.attendancePercentage < 75 ? 'danger' : 'neutral'}>{student.attendancePercentage}%</Badge></td>
                      <td className="px-6 font-semibold">{student.internalMarks}/100</td>
                      <td className="px-6 font-semibold">{student.previousCGPA}</td>
                      <td className="px-6"><Badge tone={passing ? 'brand' : 'danger'}>{student.prediction?.result || 'Pending'} ({student.prediction?.confidence || 0}%)</Badge></td>
                      <td className="px-6">
                        <div className="flex justify-end gap-2">
                          <IconButton onClick={() => handleManualPredict(student._id)} title="Recalculate prediction"><BrainCircuit size={15} /></IconButton>
                          <IconButton onClick={() => handleFlagStudent(student._id, student.isFlagged)} title="Flag for review"><Flag size={15} /></IconButton>
                          <IconButton onClick={() => openEditModal(student)} title="Edit student"><Edit3 size={15} /></IconButton>
                          <IconButton onClick={() => handleDeleteStudent(student._id)} title="Delete student" className="hover:text-rose-600"><Trash2 size={15} /></IconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </TableCard>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1">
          <span className="text-xs font-semibold text-slate-500">Showing {students.length} of {total} students</span>
          <div className="flex items-center gap-2">
            <IconButton disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></IconButton>
            <span className="text-xs font-semibold text-slate-600">Page {page} of {pageCount}</span>
            <IconButton disabled={page >= pageCount} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></IconButton>
          </div>
        </div>
      </PageShell>

      {modalOpen && (
        <Modal title={editingStudent ? 'Edit Student Record' : 'Add Student Record'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                ['name', 'Student Full Name', 'text'],
                ['rollNumber', 'University Roll Number', 'text'],
                ['email', 'Official Email', 'email'],
                ['division', 'Division', 'text']
              ].map(([name, label, type]) => (
                <label key={name} className="space-y-2 text-xs font-semibold text-slate-500">
                  <span>{label}</span>
                  <input type={type} name={name} value={formData[name]} onChange={handleFormChange} className="glass-input w-full" disabled={!!editingStudent && (name === 'rollNumber' || name === 'email')} required={name !== 'division'} />
                </label>
              ))}
            </div>

            {/* Academic Structure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-t border-slate-100 pt-5">
              <label className="space-y-2 text-xs font-semibold text-slate-500">
                <span>Department</span>
                <select name="department" value={formData.department} onChange={handleFormChange} className="glass-input w-full bg-white" required>
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.name} ({d.code})</option>)}
                </select>
              </label>
              <label className="space-y-2 text-xs font-semibold text-slate-500">
                <span>Course / Program</span>
                <select name="course" value={formData.course} onChange={handleFormChange} className="glass-input w-full bg-white" required>
                  <option value="">Select Course</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
                </select>
              </label>
              <label className="space-y-2 text-xs font-semibold text-slate-500">
                <span>Academic Year</span>
                <select name="academicYear" value={formData.academicYear} onChange={handleFormChange} className="glass-input w-full bg-white" required>
                  <option value="">Select Year</option>
                  {academicYears.map(y => <option key={y._id} value={y._id}>{y.year}{y.isCurrent ? ' (Current)' : ''}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-xs font-semibold text-slate-500">
                <span>Semester</span>
                <select name="semester" value={formData.semester} onChange={handleFormChange} className="glass-input w-full bg-white" required>
                  <option value="">Select Semester</option>
                  {(formData.course ? filteredSemesters : semesters).map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </label>
            </div>

            {/* Academic Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100 pt-5">
              {[
                ['attendancePercentage', 'Attendance %', 0, 100, 1],
                ['assignmentMarks', 'Assignment', 0, 100, 1],
                ['internalMarks', 'Internal', 0, 100, 1],
                ['previousCGPA', 'CGPA', 0, 10, 0.01],
                ['studyHours', 'Study Hours', 0, 24, 0.1],
                ['backlogs', 'Backlogs', 0, 20, 1]
              ].map(([name, label, min, max, step]) => (
                <label key={name} className="space-y-2 text-xs font-semibold text-slate-500">
                  <span>{label}</span>
                  <input type="number" name={name} min={min} max={max} step={step} value={formData[name]} onChange={handleFormChange} className="glass-input w-full" required />
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <SecondaryButton type="button" onClick={() => setModalOpen(false)}>Cancel</SecondaryButton>
              <PrimaryButton type="submit" disabled={saving}><Save size={16} /> {saving ? 'Saving...' : 'Save Record'}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminStudents;
