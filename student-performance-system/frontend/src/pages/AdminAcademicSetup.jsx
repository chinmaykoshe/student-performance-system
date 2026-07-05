import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { PageShell, Modal, PrimaryButton, SecondaryButton } from '../components/AdminUI';
import { api } from '../context/AuthContext';
import { Plus, Edit3, Trash2, Building, BookOpen, Calendar, GraduationCap, Save, X } from 'lucide-react';

// ── Field configs for each entity type ───────────────────────────────────────
const fieldConfigs = {
  departments: [
    { name: 'name', label: 'Department Name', type: 'text', required: true },
    { name: 'code', label: 'Short Code (e.g. MCA)', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'text' }
  ],
  courses: [
    { name: 'name', label: 'Course Name', type: 'text', required: true },
    { name: 'code', label: 'Course Code', type: 'text', required: true },
    { name: 'duration', label: 'Duration (years)', type: 'number', required: true },
    { name: 'totalSemesters', label: 'Total Semesters', type: 'number', required: true }
  ],
  subjects: [
    { name: 'name', label: 'Subject Name', type: 'text', required: true },
    { name: 'code', label: 'Subject Code', type: 'text', required: true },
    { name: 'credits', label: 'Credits', type: 'number', required: true },
    { name: 'semesterNumber', label: 'Semester Number', type: 'number', required: true },
    { name: 'type', label: 'Type', type: 'select', options: ['Theory', 'Practical', 'Project'], required: true }
  ],
  years: [
    { name: 'year', label: 'Academic Year (e.g. 2024-25)', type: 'text', required: true },
    { name: 'startDate', label: 'Start Date', type: 'date', required: true },
    { name: 'endDate', label: 'End Date', type: 'date', required: true },
    { name: 'isCurrent', label: 'Is Current Year?', type: 'checkbox' }
  ],
  semesters: [
    { name: 'name', label: 'Semester Name (e.g. Semester I)', type: 'text', required: true },
    { name: 'number', label: 'Semester Number', type: 'number', required: true },
    { name: 'startDate', label: 'Start Date', type: 'date', required: true },
    { name: 'endDate', label: 'End Date', type: 'date', required: true }
  ]
};

const endpointMap = {
  departments: 'departments',
  courses: 'courses',
  subjects: 'subjects',
  years: 'years',
  semesters: 'semesters'
};

const AdminAcademicSetup = () => {
  const [activeTab, setActiveTab] = useState('departments');
  const [data, setData] = useState({
    departments: [], courses: [], subjects: [], years: [], semesters: []
  });
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [depRes, couRes, subRes, yrRes, semRes] = await Promise.all([
        api.get('/academic/departments'),
        api.get('/academic/courses'),
        api.get('/academic/subjects'),
        api.get('/academic/years'),
        api.get('/academic/semesters')
      ]);
      setData({
        departments: depRes.data.data || [],
        courses: couRes.data.data || [],
        subjects: subRes.data.data || [],
        years: yrRes.data.data || [],
        semesters: semRes.data.data || []
      });
    } catch (err) {
      console.error('Error fetching academic data:', err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openAddModal = () => {
    setEditingItem(null);
    // Build default form based on field configs
    const defaults = {};
    (fieldConfigs[activeTab] || []).forEach(f => {
      defaults[f.name] = f.type === 'checkbox' ? false : f.type === 'number' ? 0 : '';
    });
    setFormData(defaults);
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setError('');
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? (parseFloat(value) || 0) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const endpoint = `/academic/${endpointMap[activeTab]}`;
      const res = editingItem
        ? await api.put(`${endpoint}/${editingItem._id}`, formData)
        : await api.post(endpoint, formData);

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
    if (!window.confirm(`Delete this ${activeTab.slice(0, -1)}? This action cannot be undone.`)) return;
    try {
      const endpoint = `/academic/${endpointMap[activeTab]}`;
      await api.delete(`${endpoint}/${id}`);
      await fetchData();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const tabs = [
    { id: 'departments', label: 'Departments', icon: <Building size={16} /> },
    { id: 'courses', label: 'Courses', icon: <GraduationCap size={16} /> },
    { id: 'subjects', label: 'Subjects', icon: <BookOpen size={16} /> },
    { id: 'years', label: 'Academic Years', icon: <Calendar size={16} /> },
    { id: 'semesters', label: 'Semesters', icon: <Calendar size={16} /> }
  ];

  const getItemDisplay = (item) => {
    switch (activeTab) {
      case 'departments': return { name: item.name, detail: item.code };
      case 'courses': return { name: item.name, detail: `${item.code} • ${item.duration} yrs • ${item.totalSemesters} sems` };
      case 'subjects': return { name: item.name, detail: `${item.code} • ${item.credits} credits • ${item.type}` };
      case 'years': return { name: item.year, detail: `${new Date(item.startDate).toLocaleDateString()} – ${new Date(item.endDate).toLocaleDateString()}${item.isCurrent ? ' 🟢' : ''}` };
      case 'semesters': return { name: item.name, detail: `Sem ${item.number} • ${new Date(item.startDate).toLocaleDateString()} – ${new Date(item.endDate).toLocaleDateString()}` };
      default: return { name: item.name, detail: item.code || '' };
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 text-slate-900">
      <Header title="Academic Setup & Structure" />
      <PageShell maxWidth="max-w-7xl">
        {/* Tabs */}
        <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-2xl w-fit gap-1 border border-slate-200 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeTab === tab.id ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 capitalize">{activeTab}</h2>
              <p className="text-sm text-slate-500 mt-1">{data[activeTab].length} record{data[activeTab].length !== 1 ? 's' : ''} configured</p>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center space-x-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-brand-500/20"
            >
              <Plus size={16} /> <span>Add {activeTab.slice(0, -1)}</span>
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
                    <th className="px-6 py-4">Details</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {data[activeTab].length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <Plus size={24} className="text-slate-300" />
                          <p>No records found. Click 'Add {activeTab.slice(0, -1)}' to create one.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data[activeTab].map((item) => {
                      const display = getItemDisplay(item);
                      return (
                        <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-900">{display.name}</td>
                          <td className="px-6 py-4 text-slate-500 text-xs font-mono">{display.detail}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              item.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {item.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-2 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors"
                              title="Edit"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageShell>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <Modal
          title={editingItem ? `Edit ${activeTab.slice(0, -1)}` : `Create New ${activeTab.slice(0, -1)}`}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {(fieldConfigs[activeTab] || []).map(field => (
              <label key={field.name} className="block space-y-2 text-xs font-semibold text-slate-500">
                <span>{field.label}{field.required && <span className="text-rose-500 ml-1">*</span>}</span>
                {field.type === 'select' ? (
                  <select
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleFormChange}
                    className="glass-input w-full bg-white"
                    required={field.required}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <div className="flex items-center gap-3 mt-1">
                    <input
                      type="checkbox"
                      name={field.name}
                      id={field.name}
                      checked={!!formData[field.name]}
                      onChange={handleFormChange}
                      className="w-5 h-5 rounded accent-brand-500 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-slate-700">Yes, this is the current academic year</span>
                  </div>
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleFormChange}
                    className="glass-input w-full"
                    required={field.required}
                  />
                )}
              </label>
            ))}

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

export default AdminAcademicSetup;
