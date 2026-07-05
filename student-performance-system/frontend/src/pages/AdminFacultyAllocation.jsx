import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { PageShell } from '../components/AdminUI';
import { api } from '../context/AuthContext';
import { Users, BookOpen, Save, CheckCircle, AlertCircle } from 'lucide-react';

const AdminFacultyAllocation = () => {
  const [faculty, setFaculty] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // faculty._id being saved
  const [notification, setNotification] = useState('');

  // Track per-faculty selected subjects
  const [allocations, setAllocations] = useState({}); // { facultyId: Set<subjectId> }

  const fetchData = async () => {
    try {
      const [facRes, subRes] = await Promise.all([
        api.get('/academic/faculty-allocation'),
        api.get('/academic/subjects')
      ]);
      const facData = facRes.data.data || [];
      setFaculty(facData);
      setSubjects(subRes.data.data || []);

      // Initialize allocations from currently assigned subjects
      const initAlloc = {};
      facData.forEach(fac => {
        initAlloc[fac._id] = new Set(
          (fac.assignedSubjects || []).map(s => s._id || s.toString())
        );
      });
      setAllocations(initAlloc);
    } catch (err) {
      console.error('Error fetching allocation data:', err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleSubject = (facultyId, subjectId) => {
    setAllocations(prev => {
      const updated = { ...prev };
      const current = new Set(updated[facultyId] || []);
      if (current.has(subjectId)) {
        current.delete(subjectId);
      } else {
        current.add(subjectId);
      }
      updated[facultyId] = current;
      return updated;
    });
  };

  const handleSave = async (facultyId) => {
    const selectedSubjects = Array.from(allocations[facultyId] || []);
    setSaving(facultyId);
    try {
      const res = await api.post('/academic/faculty-allocation', {
        facultyId,
        subjectIds: selectedSubjects
      });
      if (res.data?.success) {
        setNotification('Subjects assigned successfully!');
        setTimeout(() => setNotification(''), 3000);
        await fetchData(); // Refresh
      }
    } catch (err) {
      alert('Failed to save allocation: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 text-slate-900">
      <Header title="Faculty Allocation" subtitle="Assign subjects to faculty members" />

      {notification && (
        <div className="fixed top-20 right-6 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg font-bold z-50 flex items-center gap-2">
          <CheckCircle size={18} /> {notification}
        </div>
      )}

      <PageShell maxWidth="max-w-7xl">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          </div>
        ) : faculty.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl border border-slate-200 p-12 text-center">
            <AlertCircle size={40} className="text-slate-300 mb-4" />
            <p className="text-slate-500 font-semibold">No faculty members found.</p>
            <p className="text-slate-400 text-sm mt-1">Register faculty from the Faculty page first.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {faculty.map((fac) => {
              const selectedSet = allocations[fac._id] || new Set();
              return (
                <div key={fac._id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap justify-between items-center gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-black text-sm">
                          {fac.name?.charAt(0).toUpperCase()}
                        </div>
                        {fac.name}
                      </h3>
                      <p className="text-sm text-slate-500 mt-0.5 ml-11">{fac.email} • {fac.department?.name || fac.department || 'No Department'}</p>
                    </div>
                    <button
                      onClick={() => handleSave(fac._id)}
                      disabled={saving === fac._id}
                      className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-md shadow-brand-500/20 transition-all disabled:opacity-60"
                    >
                      <Save size={16} />
                      {saving === fac._id ? 'Saving...' : 'Save Allocation'}
                    </button>
                  </div>

                  <div className="p-6">
                    <p className="text-xs font-bold uppercase text-slate-400 mb-3 tracking-wider flex items-center gap-2">
                      <BookOpen size={14} />
                      Click subjects to assign / unassign
                      <span className="ml-2 px-2 py-0.5 bg-brand-100 text-brand-700 rounded-full font-bold">
                        {selectedSet.size} assigned
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {subjects.map(sub => {
                        const isSelected = selectedSet.has(sub._id);
                        return (
                          <button
                            key={sub._id}
                            onClick={() => toggleSubject(fac._id, sub._id)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                              isSelected
                                ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-600'
                            }`}
                          >
                            {isSelected && <CheckCircle className="inline mr-1.5" size={13} />}
                            {sub.name} <span className="opacity-60 ml-1 font-mono text-xs">({sub.code})</span>
                          </button>
                        );
                      })}
                      {subjects.length === 0 && (
                        <span className="text-sm text-slate-400 italic">No subjects available. Add subjects in Academic Setup first.</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PageShell>
    </div>
  );
};

export default AdminFacultyAllocation;
