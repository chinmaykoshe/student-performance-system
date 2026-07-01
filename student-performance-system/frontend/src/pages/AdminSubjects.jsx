import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { PageShell, Modal, PrimaryButton, SecondaryButton } from '../components/AdminUI';
import { api } from '../context/AuthContext';
import { Plus, Edit3, Trash2, BookOpen, Save, X } from 'lucide-react';

const AdminSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', credits: '', semesterNumber: '', type: 'Theory' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/academic/subjects');
      setSubjects(res.data.data || []);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubjects(); }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ name: '', code: '', credits: 4, semesterNumber: 1, type: 'Theory' });
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      code: item.code,
      credits: item.credits || '',
      semesterNumber: item.semesterNumber || '',
      type: item.type || 'Theory'
    });
    setError('');
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'credits' || name === 'semesterNumber' ? (parseInt(value) || 0) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = editingItem
        ? await api.put(`/academic/subjects/${editingItem._id}`, formData)
        : await api.post('/academic/subjects', formData);

      if (res.data?.success) {
        await fetchSubjects();
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
    if (!window.confirm('Delete this subject? This action cannot be undone.')) return;
    try {
      await api.delete(`/academic/subjects/${id}`);
      await fetchSubjects();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 text-slate-900">
      <Header title="Subjects & Curriculum" subtitle="Configure and list curriculum courses subjects" />
      <PageShell maxWidth="max-w-7xl">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="text-brand-500" size={20} />
                <span>Subjects List</span>
              </h2>
              <p className="text-sm text-slate-500 mt-1">{subjects.length} subject{subjects.length !== 1 ? 's' : ''} configured</p>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center space-x-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-brand-500/20"
            >
              <Plus size={16} /> <span>Add Subject</span>
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
                    <th className="px-6 py-4">Subject Code</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Semester</th>
                    <th className="px-6 py-4">Credits</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {subjects.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                        <p>No subjects found. Click 'Add Subject' to configure one.</p>
                      </td>
                    </tr>
                  ) : (
                    subjects.map((sub) => (
                      <tr key={sub._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">{sub.name}</td>
                        <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600 bg-slate-50">{sub.code}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1.5 rounded-full text-xs font-bold ${
                            sub.type === 'Theory' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                            sub.type === 'Practical' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            'bg-violet-50 text-violet-700 border border-violet-100'
                          }`}>
                            {sub.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs font-semibold">Semester {sub.semesterNumber}</td>
                        <td className="px-6 py-4 text-slate-900 text-xs font-bold">{sub.credits} Credits</td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(sub)}
                            className="p-2 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors"
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(sub._id)}
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
          title={editingItem ? 'Edit Subject' : 'Create New Subject'}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block space-y-2 text-xs font-semibold text-slate-500">
              <span>Subject Name<span className="text-rose-500 ml-1">*</span></span>
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
              <span>Subject Code (e.g. CA-101)<span className="text-rose-500 ml-1">*</span></span>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleFormChange}
                className="glass-input w-full uppercase"
                required
              />
            </label>

            <div className="grid grid-cols-3 gap-4">
              <label className="block space-y-2 text-xs font-semibold text-slate-500">
                <span>Semester Number<span className="text-rose-500 ml-1">*</span></span>
                <input
                  type="number"
                  name="semesterNumber"
                  value={formData.semesterNumber}
                  onChange={handleFormChange}
                  className="glass-input w-full"
                  required
                />
              </label>

              <label className="block space-y-2 text-xs font-semibold text-slate-500">
                <span>Credits<span className="text-rose-500 ml-1">*</span></span>
                <input
                  type="number"
                  name="credits"
                  value={formData.credits}
                  onChange={handleFormChange}
                  className="glass-input w-full"
                  required
                />
              </label>

              <label className="block space-y-2 text-xs font-semibold text-slate-500">
                <span>Subject Type<span className="text-rose-500 ml-1">*</span></span>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleFormChange}
                  className="glass-input w-full bg-white"
                  required
                >
                  <option value="Theory">Theory</option>
                  <option value="Practical">Practical</option>
                  <option value="Project">Project</option>
                </select>
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

export default AdminSubjects;
