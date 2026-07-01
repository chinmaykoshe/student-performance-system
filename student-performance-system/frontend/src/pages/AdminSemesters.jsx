import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { PageShell, Modal, PrimaryButton, SecondaryButton } from '../components/AdminUI';
import { api } from '../context/AuthContext';
import { Plus, Edit3, Trash2, Calendar, Save, X } from 'lucide-react';

const AdminSemesters = () => {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', number: '', startDate: '', endDate: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchSemesters = async () => {
    setLoading(true);
    try {
      const res = await api.get('/academic/semesters');
      setSemesters(res.data.data || []);
    } catch (err) {
      console.error('Error fetching semesters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSemesters(); }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ name: '', number: 1, startDate: '', endDate: '' });
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      number: item.number || '',
      startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '',
      endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : ''
    });
    setError('');
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'number' ? (parseInt(value) || 0) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = editingItem
        ? await api.put(`/academic/semesters/${editingItem._id}`, formData)
        : await api.post('/academic/semesters', formData);

      if (res.data?.success) {
        await fetchSemesters();
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
      await fetchSemesters();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 text-slate-900">
      <Header title="Semesters Configuration" subtitle="Configure individual academic terms" />
      <PageShell maxWidth="max-w-7xl">
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
              className="flex items-center space-x-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-brand-500/20"
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
                    <th className="px-6 py-4">Semester Number</th>
                    <th className="px-6 py-4">Start Date</th>
                    <th className="px-6 py-4">End Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {semesters.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                        <p>No semesters found. Click 'Add Semester' to configure one.</p>
                      </td>
                    </tr>
                  ) : (
                    semesters.map((sem) => (
                      <tr key={sem._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{sem.name}</td>
                        <td className="px-6 py-4 text-slate-605 text-xs font-semibold">Semester {sem.number}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs">{new Date(sem.startDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs">{new Date(sem.endDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(sem)}
                            className="p-2 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors"
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(sem._id)}
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
          title={editingItem ? 'Edit Semester' : 'Create Semester'}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block space-y-2 text-xs font-semibold text-slate-500">
              <span>Semester Name (e.g. Semester I)<span className="text-rose-500 ml-1">*</span></span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="Semester I"
                className="glass-input w-full"
                required
              />
            </label>

            <label className="block space-y-2 text-xs font-semibold text-slate-500">
              <span>Semester Number (e.g. 1)<span className="text-rose-500 ml-1">*</span></span>
              <input
                type="number"
                name="number"
                value={formData.number}
                onChange={handleFormChange}
                className="glass-input w-full"
                required
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block space-y-2 text-xs font-semibold text-slate-500">
                <span>Start Date<span className="text-rose-500 ml-1">*</span></span>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleFormChange}
                  className="glass-input w-full"
                  required
                />
              </label>

              <label className="block space-y-2 text-xs font-semibold text-slate-500">
                <span>End Date<span className="text-rose-500 ml-1">*</span></span>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
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

export default AdminSemesters;
