import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { PageShell, Modal, PrimaryButton, SecondaryButton } from '../components/AdminUI';
import { api } from '../context/AuthContext';
import { Plus, Edit3, Trash2, GraduationCap, Save, X } from 'lucide-react';

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', duration: '', totalSemesters: '', department: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [couRes, depRes] = await Promise.all([
        api.get('/academic/courses'),
        api.get('/academic/departments')
      ]);
      setCourses(couRes.data.data || []);
      setDepartments(depRes.data.data || []);
    } catch (err) {
      console.error('Error fetching courses/departments data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ name: '', code: '', duration: '', totalSemesters: '', department: departments[0]?._id || '' });
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      code: item.code,
      duration: item.duration || '',
      totalSemesters: item.totalSemesters || '',
      department: item.department?._id || item.department || ''
    });
    setError('');
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = editingItem
        ? await api.put(`/academic/courses/${editingItem._id}`, formData)
        : await api.post('/academic/courses', formData);

      if (res.data?.success) {
        await fetchData();
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
    if (!window.confirm('Delete this course? This action cannot be undone.')) return;
    try {
      await api.delete(`/academic/courses/${id}`);
      await fetchData();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 text-slate-900">
      <Header title="Courses Configuration" subtitle="Manage degree and diploma academic programs" />
      <PageShell maxWidth="max-w-7xl">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <GraduationCap className="text-brand-500" size={20} />
                <span>Academic Courses</span>
              </h2>
              <p className="text-sm text-slate-500 mt-1">{courses.length} program{courses.length !== 1 ? 's' : ''} configured</p>
            </div>
            <button
              onClick={openAddModal}
              disabled={departments.length === 0}
              className="flex items-center space-x-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-brand-500/20 disabled:opacity-50"
            >
              <Plus size={16} /> <span>Add Course</span>
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
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Course Code</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {courses.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                        <p>No courses found. Add a department first, then click 'Add Course'.</p>
                      </td>
                    </tr>
                  ) : (
                    courses.map((course) => (
                      <tr key={course._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">{course.name}</td>
                        <td className="px-6 py-4 font-mono text-xs font-bold text-slate-650">{course.code}</td>
                        <td className="px-6 py-4 text-slate-500 font-medium text-xs">
                          {course.department?.name || 'No Department'}
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs font-semibold">
                          {course.duration} years ({course.totalSemesters} semesters)
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(course)}
                            className="p-2 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors"
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(course._id)}
                            className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                            title="Delete"
                          >
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
          title={editingItem ? 'Edit Course' : 'Create New Course'}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block space-y-2 text-xs font-semibold text-slate-500">
              <span>Course Name<span className="text-rose-500 ml-1">*</span></span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                className="glass-input w-full"
                required
              />
            </label>

            <label className="block space-y-2 text-xs font-semibold text-slate-500">
              <span>Course Code (e.g. BTECH-CS)<span className="text-rose-500 ml-1">*</span></span>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleFormChange}
                className="glass-input w-full uppercase"
                required
              />
            </label>

            <label className="block space-y-2 text-xs font-semibold text-slate-500">
              <span>Department Link<span className="text-rose-500 ml-1">*</span></span>
              <select
                name="department"
                value={formData.department}
                onChange={handleFormChange}
                className="glass-input w-full bg-white"
                required
              >
                <option value="">Select Department</option>
                {departments.map(d => (
                  <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block space-y-2 text-xs font-semibold text-slate-500">
                <span>Duration (Years)<span className="text-rose-500 ml-1">*</span></span>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleFormChange}
                  className="glass-input w-full"
                  required
                />
              </label>

              <label className="block space-y-2 text-xs font-semibold text-slate-500">
                <span>Total Semesters<span className="text-rose-500 ml-1">*</span></span>
                <input
                  type="number"
                  name="totalSemesters"
                  value={formData.totalSemesters}
                  onChange={handleFormChange}
                  className="glass-input w-full"
                  required
                />
              </label>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700 font-medium">
                {error}
              </div>
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

export default AdminCourses;
