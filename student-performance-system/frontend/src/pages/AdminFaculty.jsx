import React, { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import { 
  Plus, 
  X, 
  Save, 
  UserCheck, 
  AlertTriangle,
  Mail,
  GraduationCap
} from 'lucide-react';

const AdminFaculty = () => {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'faculty',
    department: 'Computer Applications (MCA)'
  });

  const fetchFaculties = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/faculty');
      if (res.data && res.data.success) {
        setFaculties(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching faculty profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculties();
  }, []);

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'faculty',
      department: 'Computer Applications (MCA)'
    });
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.post('/auth/register', formData);
      if (res.data && res.data.success) {
        alert('Faculty account created successfully!');
        fetchFaculties();
        setModalOpen(false);
      }
    } catch (err) {
      alert('Error creating faculty user: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title="Manage Faculty Registry" />

        <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
          
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-400 uppercase tracking-wider">Faculty List</h3>
            
            {/* Add Faculty Button */}
            <button
              onClick={handleOpenAddModal}
              className="px-5 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm flex items-center space-x-2 shadow-lg shadow-brand-500/20 transform active:scale-95 transition"
            >
              <Plus size={18} />
              <span>Add Faculty Member</span>
            </button>
          </div>

          {/* Listing */}
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
            </div>
          ) : faculties.length === 0 ? (
            <GlassCard className="flex flex-col items-center justify-center py-20">
              <AlertTriangle size={48} className="text-slate-400 mb-4" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">No faculty members registered.</p>
              <p className="text-xs text-slate-400 mt-1">Use the Add Faculty button to register members.</p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
              {faculties.map((fac) => (
                <GlassCard key={fac._id} className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                        <UserCheck size={22} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">{fac.name}</h4>
                        <p className="text-[11px] text-slate-400 font-medium tracking-wider uppercase">{fac.department}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mt-6">
                      <div className="flex items-center space-x-2.5 text-sm text-slate-500 dark:text-slate-400">
                        <Mail size={16} className="text-slate-400" />
                        <span>{fac.email}</span>
                      </div>
                      <div className="flex items-center space-x-2.5 text-xs text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800/50 mt-4">
                        <GraduationCap size={14} />
                        <span>Registered Portal Access: YES</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}

        </main>
      </div>

      {/* Add Faculty Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg rounded-3xl p-8 border border-white/25 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-850/50"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
              Register Faculty Account
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="glass-input w-full px-4 py-3 rounded-2xl text-sm"
                  placeholder="Dr. Sarah Connor"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="glass-input w-full px-4 py-3 rounded-2xl text-sm"
                  placeholder="sconnor@university.edu"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">
                  Portal Login Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  className="glass-input w-full px-4 py-3 rounded-2xl text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">
                  Assigned Department
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
                  <span>{saving ? 'Creating...' : 'Create Account'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminFaculty;
