import React, { useState } from 'react';
import { useAuth, api } from '../context/AuthContext';
import Header from '../components/Header';
import { PageShell, PrimaryButton } from '../components/AdminUI';
import { User, Mail, Shield, Save, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

const Profile = () => {
  const { user, profile } = useAuth();
  
  // Profile Form State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || ''
  });

  // Password Reset State
  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passStatus, setPassStatus] = useState({ type: '', message: '' });
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  // Academic Metrics State (Students Only)
  const [metricsForm, setMetricsForm] = useState({
    attendancePercentage: profile?.attendancePercentage || 0,
    assignmentMarks: profile?.assignmentMarks || 0,
    internalMarks: profile?.internalMarks || 0,
    studyHours: profile?.studyHours || 0,
    previousCGPA: profile?.previousCGPA || 0
  });
  const [metricsStatus, setMetricsStatus] = useState({ type: '', message: '' });
  const [isUpdatingMetrics, setIsUpdatingMetrics] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePassChange = (e) => {
    const { name, value } = e.target;
    setPassForm(prev => ({ ...prev, [name]: value }));
    setPassStatus({ type: '', message: '' }); // Clear message on type
  };

  const [profileStatus, setProfileStatus] = useState({ type: '', message: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileStatus({ type: '', message: '' });
    try {
      const res = await api.put('/auth/update-profile', { name: formData.name });
      if (res.data?.success) {
        setProfileStatus({ type: 'success', message: 'Profile name updated successfully!' });
      }
    } catch (err) {
      setProfileStatus({ type: 'error', message: err.response?.data?.error || 'Failed to update profile.' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleMetricsChange = (e) => {
    const { name, value } = e.target;
    setMetricsForm(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    setMetricsStatus({ type: '', message: '' });
  };

  const handleMetricsUpdate = async (e) => {
    e.preventDefault();
    try {
      setIsUpdatingMetrics(true);
      const res = await api.put('/students/my-metrics', metricsForm);
      if (res.data.success) {
        setMetricsStatus({ type: 'success', message: 'Academic metrics updated successfully!' });
        // Optionally refresh profile context here if needed
      }
    } catch (err) {
      setMetricsStatus({ 
        type: 'error', 
        message: err.response?.data?.error || 'Failed to update metrics.' 
      });
    } finally {
      setIsUpdatingMetrics(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }
    
    if (passForm.newPassword.length < 5) {
      setPassStatus({ type: 'error', message: 'Password must be at least 5 characters.' });
      return;
    }

    try {
      setIsUpdatingPass(true);
      const res = await api.put('/auth/update-password', {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword
      });
      
      if (res.data.success) {
        setPassStatus({ type: 'success', message: 'Password updated successfully!' });
        setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setPassStatus({ 
        type: 'error', 
        message: err.response?.data?.error || 'Failed to update password. Please check your current password.' 
      });
    } finally {
      setIsUpdatingPass(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 text-slate-900">
      <Header title="My Profile" />
      <PageShell>
        <div className="max-w-3xl mx-auto w-full space-y-6">
          
          {/* Profile Card */}
          <div className="glass-card p-8 rounded-3xl border border-slate-200 shadow-sm bg-white">
            <div className="flex items-center space-x-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white shadow-lg shadow-brand-500/35 text-3xl font-bold">
                {getInitials(user?.name)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{user?.name}</h2>
                <p className="text-slate-500 capitalize flex items-center gap-2 mt-1">
                  <Shield size={16} /> {user?.role} Account
                </p>
                {profile?.department && (
                  <p className="text-slate-500 flex items-center gap-2 mt-1">
                    <User size={16} /> {profile.department}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="glass-card p-8 rounded-3xl border border-slate-200 shadow-sm bg-white">
            <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Personal Information</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="space-y-2 text-sm font-semibold text-slate-600">
                  <span>Full Name</span>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 pointer-events-none">
                      <User size={18} />
                    </div>
                    <input 
                      type="text" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange} 
                      className="glass-input w-full py-3 bg-slate-50 border-slate-200" 
                      style={{ paddingLeft: '2.75rem' }}
                      required 
                    />
                  </div>
                </label>

                <label className="space-y-2 text-sm font-semibold text-slate-600">
                  <span>Email Address</span>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 pointer-events-none">
                      <Mail size={18} />
                    </div>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      className="glass-input w-full py-3 bg-slate-50 border-slate-200" 
                      style={{ paddingLeft: '2.75rem' }}
                      required 
                      disabled // Email changes usually require verification
                    />
                  </div>
                </label>
              </div>

              {profileStatus.message && (
                <div className={`mb-4 flex items-center space-x-3 p-4 rounded-xl text-sm border ${
                  profileStatus.type === 'error'
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {profileStatus.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                  <span>{profileStatus.message}</span>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <PrimaryButton type="submit" disabled={isUpdatingProfile}>
                  <Save size={18} />
                  <span>{isUpdatingProfile ? 'Saving...' : 'Save Changes'}</span>
                </PrimaryButton>
              </div>
            </form>
          </div>

          {/* Academic Metrics Section (Student Only) */}
          {user?.role === 'student' && (
            <div className="glass-card p-8 rounded-3xl border border-slate-200 shadow-sm bg-white">
              <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Self-Reported Academic Metrics</h3>
              
              {metricsStatus.message && (
                <div className={`mb-6 flex items-center space-x-3 p-4 rounded-xl text-sm border ${
                  metricsStatus.type === 'error' 
                    ? 'bg-rose-50 text-rose-600 border-rose-200' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {metricsStatus.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                  <span>{metricsStatus.message}</span>
                </div>
              )}

              <form onSubmit={handleMetricsUpdate} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  <label className="space-y-2 text-sm font-semibold text-slate-600">
                    <span>Attendance (%)</span>
                    <input 
                      type="number" 
                      name="attendancePercentage" 
                      value={metricsForm.attendancePercentage} 
                      onChange={handleMetricsChange} 
                      className="glass-input w-full py-3 bg-slate-50 border-slate-200 px-4" 
                      required 
                      min="0" max="100"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-slate-600">
                    <span>Assignment Marks</span>
                    <input 
                      type="number" 
                      name="assignmentMarks" 
                      value={metricsForm.assignmentMarks} 
                      onChange={handleMetricsChange} 
                      className="glass-input w-full py-3 bg-slate-50 border-slate-200 px-4" 
                      required 
                      min="0" max="100"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-slate-600">
                    <span>Internal Marks</span>
                    <input 
                      type="number" 
                      name="internalMarks" 
                      value={metricsForm.internalMarks} 
                      onChange={handleMetricsChange} 
                      className="glass-input w-full py-3 bg-slate-50 border-slate-200 px-4" 
                      required 
                      min="0" max="100"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-slate-600">
                    <span>Study Hours/Day</span>
                    <input 
                      type="number" 
                      name="studyHours" 
                      value={metricsForm.studyHours} 
                      onChange={handleMetricsChange} 
                      className="glass-input w-full py-3 bg-slate-50 border-slate-200 px-4" 
                      required 
                      min="0" max="24"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-slate-600">
                    <span>Previous CGPA</span>
                    <input 
                      type="number" 
                      step="0.01"
                      name="previousCGPA" 
                      value={metricsForm.previousCGPA} 
                      onChange={handleMetricsChange} 
                      className="glass-input w-full py-3 bg-slate-50 border-slate-200 px-4" 
                      required 
                      min="0" max="10"
                    />
                  </label>
                </div>
                <div className="flex justify-end pt-4">
                  <PrimaryButton type="submit" disabled={isUpdatingMetrics}>
                    <Save size={18} />
                    <span>{isUpdatingMetrics ? 'Saving...' : 'Save Metrics'}</span>
                  </PrimaryButton>
                </div>
              </form>
            </div>
          )}

          {/* Change Password Section */}
          <div className="glass-card p-8 rounded-3xl border border-slate-200 shadow-sm bg-white">
            <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Security & Password</h3>
            
            {passStatus.message && (
              <div className={`mb-6 flex items-center space-x-3 p-4 rounded-xl text-sm border ${
                passStatus.type === 'error' 
                  ? 'bg-rose-50 text-rose-600 border-rose-200' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {passStatus.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                <span>{passStatus.message}</span>
              </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="space-y-6 max-w-md">
              <label className="space-y-2 text-sm font-semibold text-slate-600 block">
                <span>Current Password</span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 pointer-events-none">
                    <Lock size={18} />
                  </div>
                  <input 
                    type="password" 
                    name="currentPassword" 
                    value={passForm.currentPassword} 
                    onChange={handlePassChange} 
                    className="glass-input w-full py-3 bg-slate-50 border-slate-200" 
                    style={{ paddingLeft: '2.75rem' }}
                    placeholder="Enter your current password"
                    required 
                  />
                </div>
              </label>

              <label className="space-y-2 text-sm font-semibold text-slate-600 block">
                <span>New Password</span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 pointer-events-none">
                    <Lock size={18} />
                  </div>
                  <input 
                    type="password" 
                    name="newPassword" 
                    value={passForm.newPassword} 
                    onChange={handlePassChange} 
                    className="glass-input w-full py-3 bg-slate-50 border-slate-200" 
                    style={{ paddingLeft: '2.75rem' }}
                    placeholder="Create a new password"
                    required 
                  />
                </div>
              </label>

              <label className="space-y-2 text-sm font-semibold text-slate-600 block">
                <span>Confirm New Password</span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 pointer-events-none">
                    <Lock size={18} />
                  </div>
                  <input 
                    type="password" 
                    name="confirmPassword" 
                    value={passForm.confirmPassword} 
                    onChange={handlePassChange} 
                    className="glass-input w-full py-3 bg-slate-50 border-slate-200" 
                    style={{ paddingLeft: '2.75rem' }}
                    placeholder="Confirm your new password"
                    required 
                  />
                </div>
              </label>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isUpdatingPass}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md shadow-slate-200 transition-all disabled:opacity-50 w-full md:w-auto"
                >
                  {isUpdatingPass ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </PageShell>
    </div>
  );
};

export default Profile;
