import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { PageShell, Modal, PrimaryButton, SecondaryButton } from '../components/AdminUI';
import { api } from '../context/AuthContext';
import { Plus, Edit3, Trash2, Calendar, Save, X } from 'lucide-react';

const AdminAcademicYears = () => {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ year: '', startDate: '', endDate: '', isCurrent: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchYears = async () => {
    setLoading(true);
    try {
      const res = await api.get('/academic/years');
      setYears(res.data.data || []);
    } catch (err) {
      console.error('Error fetching academic years:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchYears(); }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ year: '', startDate: '', endDate: '', isCurrent: false });
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      year: item.year,
      startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '',
      endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '',
      isCurrent: !!item.isCurrent
    });
    setError('');
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = editingItem
        ? await api.put(`/academic/years/${editingItem._id}`, formData)
        : await api.post('/academic/years', formData);

      if (res.data?.success) {
        await fetchYears();
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
    if (!window.confirm('Delete this academic year? This action cannot be undone.')) return;
    try {
      await api.delete(`/academic/years/${id}`);
      await fetchYears();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 text-slate-900">
      <Header title="Academic Years" subtitle="Configure active and historical term periods" />
      <PageShell maxWidth="max-w-7xl">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="text-brand-500" size={20} />
                <span>Academic Years list</span>
              </h2>
              <p className="text-sm text-slate-500 mt-1">{years.length} term{years.length !== 1 ? 's' : ''} configured</p>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center space-x-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-brand-500/20"
            >
              <Plus size={16} /> <span>Add Term Year</span>
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
                    <th className="px-6 py-4">Academic Year</th>
                    <th className="px-6 py-4">Start Date</th>
                    <th className="px-6 py-4">End Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {years.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                        <p>No academic years found. Click 'Add Term Year' to configure one.</p>
                      </td>
                    </tr>
                  ) : (
                    years.map((y) => (
                      <tr key={y._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{y.year}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs">{new Date(y.startDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs">{new Date(y.endDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            y.isCurrent 
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            {y.isCurrent ? 'Current Year' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(y)}
                            className="p-2 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors"
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(y._id)}
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
          title={editingItem ? 'Edit Academic Year' : 'Create Academic Year'}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block space-y-2 text-xs font-semibold text-slate-500">
              <span>Academic Year Title (e.g. 2024-25)<span className="text-rose-500 ml-1">*</span></span>
              <input
                type="text"
                name="year"
                value={formData.year}
                onChange={handleFormChange}
                placeholder="2025-26"
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

            <div className="flex items-center gap-3 mt-1 py-2">
              <input
                type="checkbox"
                name="isCurrent"
                id="isCurrent"
                checked={formData.isCurrent}
                onChange={handleFormChange}
                className="w-5 h-5 rounded accent-brand-500 cursor-pointer"
              />
              <label htmlFor="isCurrent" className="text-sm font-semibold text-slate-700 cursor-pointer">
                Yes, set as the current active academic year
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

export default AdminAcademicYears;
