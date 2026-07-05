import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { PageShell, Modal, PrimaryButton, SecondaryButton } from '../components/AdminUI';
import { api } from '../context/AuthContext';
import { Plus, Edit3, Trash2, Calendar, Save, X, AlertCircle } from 'lucide-react';

const AdminSemesters = () => {
  const [semesters, setSemesters] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '', number: 1, academicYear: '', course: '', startDate: '', endDate: '', isActive: true
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [semRes, yearRes, courseRes] = await Promise.all([
        api.get('/academic/semesters'),
        api.get('/academic/years'),
        api.get('/academic/courses')
      ]);
      setSemesters(semRes.data.data || []);
      setAcademicYears(yearRes.data.data || []);
      setCourses(courseRes.data.data || []);
    } catch (err) {
      console.error('Error fetching semesters data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openAddModal = () => {
    setEditingItem(null);
    const defaultYear = academicYears.find(y => y.isCurrent)?._id || academicYears[0]?._id || '';
    const defaultCourse = courses[0]?._id || '';
    setFormData({ name: '', number: 1, academicYear: defaultYear, course: defaultCourse, startDate: '', endDate: '', isActive: true });
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      number: item.number || 1,
      academicYear: item.academicYear?._id || item.academicYear || '',
      course: item.course?._id || item.course || '',
      startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '',
      endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '',
      isActive: item.isActive !== undefined ? item.isActive : true
    });
    setError('');
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'number' ? (parseInt(value) || 0) : value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.academicYear) return setError('Please select an Academic Year.');
    if (!formData.course) return setError('Please select a Course.');
    setSaving(true);
    setError('');
    try {
      const res = editingItem
        ? await api.put(`/academic/semesters/${editingItem._id}`, formData)
        : await api.post('/academic/semesters', formData);

      if (res.data?.success) {
        await fetchAll();
        setModalOpen(false);
      } else {
        setError(res.data?.error || 'Operation failed.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Server error.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this semester? This action cannot be undone.')) return;
    try {
      await api.delete(`/academic/semesters/${id}`);
      await fetchAll();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const noPrerequisites = academicYears.length === 0 || courses.length === 0;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 text-slate-900">
      <Header title="Semesters Configuration" subtitle="Configure individual academic terms linked to courses and years" />
      <PageShell maxWidth="max-w-7xl">

        {noPrerequisites && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
            <AlertCircle className="text-amber-600 mt-0.5 shrink-0" size={18} />
            <div>
              <p className="text-sm font-semibold text-amber-800">Prerequisites missing</p>
              <p className="text-xs text-amber-700 mt-1">
                You must create at least one <strong>Academic Year</strong> and one <strong>Course</strong> before adding semesters.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="text-brand-500" size={20} />
                <span>Semesters</span>
              </h2>
              <p className="text-sm text-slate-500 mt-1">{semesters.length} semester{semesters.length !== 1 ? 's' : ''} configured</p>
            </div>
            <button
              onClick={openAddModal}
              disabled={noPrerequisites}
              title={noPrerequisites ? 'Create Academic Year and Course first' : 'Add Semester'}
              className="flex items-center space-x-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} /> <span>Add Semester</span>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="px-6 py-4">Semester Name</th>
                    <th className="px-6 py-4">Number</th>
                    <th className="px-6 py-4">Course</th>
                    <th className="px-6 py-4">Academic Year</th>
                    <th className="px-6 py-4">Dates</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {semesters.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                        <p>No semesters found. Click 'Add Semester' to configure one.</p>
                      </td>
                    </tr>
                  ) : (
                    semesters.map((sem) => (
                      <tr key={sem._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{sem.name}</td>
                        <td className="px-6 py-4 text-slate-600 text-xs font-semibold">Sem {sem.number}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs font-medium">{sem.course?.name || '—'}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs font-medium">{sem.academicYear?.year || '—'}</td>
                        <td className="px-6 py-4 text-slate-400 text-xs">
                          {sem.startDate ? new Date(sem.startDate).toLocaleDateString() : '—'}
                          {' → '}
                          {sem.endDate ? new Date(sem.endDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${sem.isActive ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                            {sem.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button onClick={() => openEditModal(sem)} className="p-2 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors" title="Edit">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => handleDelete(sem._id)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageShell>

      {modalOpen && (
        <Modal
          title={editingItem ? 'Edit Semester' : 'Create Semester'}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block space-y-2 text-xs font-semibold text-slate-500">
              <span>Semester Name (e.g. Semester I)<span className="text-rose-500 ml-1">*</span></span>
              <input type="text" name="name" value={formData.name} onChange={handleFormChange} placeholder="Semester I" className="glass-input w-full" required />
            </label>

            <label className="block space-y-2 text-xs font-semibold text-slate-500">
              <span>Semester Number<span className="text-rose-500 ml-1">*</span></span>
              <input type="number" name="number" value={formData.number} onChange={handleFormChange} className="glass-input w-full" min="1" required />
            </label>

            <label className="block space-y-2 text-xs font-semibold text-slate-500">
              <span>Academic Year<span className="text-rose-500 ml-1">*</span></span>
              <select name="academicYear" value={formData.academicYear} onChange={handleFormChange} className="glass-input w-full bg-white" required>
                <option value="">Select Academic Year</option>
                {academicYears.map(y => (
                  <option key={y._id} value={y._id}>{y.year}{y.isCurrent ? ' (Current)' : ''}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-2 text-xs font-semibold text-slate-500">
              <span>Course<span className="text-rose-500 ml-1">*</span></span>
              <select name="course" value={formData.course} onChange={handleFormChange} className="glass-input w-full bg-white" required>
                <option value="">Select Course</option>
                {courses.map(c => (
                  <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block space-y-2 text-xs font-semibold text-slate-500">
                <span>Start Date</span>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleFormChange} className="glass-input w-full" />
              </label>
              <label className="block space-y-2 text-xs font-semibold text-slate-500">
                <span>End Date</span>
                <input type="date" name="endDate" value={formData.endDate} onChange={handleFormChange} className="glass-input w-full" />
              </label>
            </div>

            <div className="flex items-center gap-3 py-2">
              <input type="checkbox" name="isActive" id="isActive" checked={formData.isActive} onChange={handleFormChange} className="w-5 h-5 rounded accent-brand-500 cursor-pointer" />
              <label htmlFor="isActive" className="text-sm font-semibold text-slate-700 cursor-pointer">Mark as Active Semester</label>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700 font-medium">{error}</div>
            )}

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <SecondaryButton type="button" onClick={() => setModalOpen(false)}>
                <X size={16} /> Cancel
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={saving}>
                <Save size={16} /> {saving ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminSemesters;
