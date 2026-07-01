import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { PageShell, Modal, PrimaryButton, SecondaryButton } from '../components/AdminUI';
import { api } from '../context/AuthContext';
import { Plus, Edit3, Trash2, Building, Save, X } from 'lucide-react';

const AdminDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/academic/departments');
      setDepartments(res.data.data || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ name: '', code: '', description: '' });
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({ name: item.name, code: item.code, description: item.description || '' });
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
        ? await api.put(`/academic/departments/${editingItem._id}`, formData)
        : await api.post('/academic/departments', formData);

      if (res.data?.success) {
        await fetchDepartments();
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
    if (!window.confirm('Delete this department? This action cannot be undone.')) return;
    try {
      await api.delete(`/academic/departments/${id}`);
      await fetchDepartments();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 text-slate-900">
      <Header title="Departments Configuration" subtitle="Manage university branches and administrative departments" />
      <PageShell maxWidth="max-w-7xl">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Building className="text-brand-500" size={20} />
                <span>Departments</span>
              </h2>
              <p className="text-sm text-slate-500 mt-1">{departments.length} branch{departments.length !== 1 ? 'es' : ''} configured</p>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center space-x-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-brand-500/20"
            >
              <Plus size={16} /> <span>Add Department</span>
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
                    <th className="px-6 py-4">Short Code</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {departments.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                        <p>No departments found. Click 'Add Department' to create one.</p>
                      </td>
                    </tr>
                  ) : (
                    departments.map((dept) => (
                      <tr key={dept._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">{dept.name}</td>
                        <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600 bg-slate-50/50">{dept.code}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs">{dept.description || '—'}</td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(dept)}
                            className="p-2 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors"
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(dept._id)}
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
          title={editingItem ? 'Edit Department' : 'Create New Department'}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block space-y-2 text-xs font-semibold text-slate-500">
              <span>Department Name<span className="text-rose-500 ml-1">*</span></span>
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
              <span>Short Code (e.g. MCA, CSE)<span className="text-rose-500 ml-1">*</span></span>
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
              <span>Description</span>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                className="glass-input w-full"
              />
            </label>

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

export default AdminDepartments;
