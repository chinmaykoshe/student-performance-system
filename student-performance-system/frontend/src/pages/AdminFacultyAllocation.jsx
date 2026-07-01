import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { PageShell } from '../components/AdminUI';
import { api } from '../context/AuthContext';
import { Users, BookOpen, Save } from 'lucide-react';

const AdminFacultyAllocation = () => {
  const [faculty, setFaculty] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [facRes, subRes] = await Promise.all([
        api.get('/academic/faculty-allocation'),
        api.get('/academic/subjects')
      ]);
      setFaculty(facRes.data.data);
      setSubjects(subRes.data.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 text-slate-900">
      <Header title="Faculty Allocation" />
      <PageShell maxWidth="max-w-7xl">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="text-brand-500" size={20} /> Assign Subjects to Faculty
              </h2>
              <p className="text-sm text-slate-500 mt-1">Select subjects that each faculty member will teach.</p>
            </div>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {faculty.map((fac) => (
                  <div key={fac._id} className="border border-slate-200 rounded-2xl p-6 bg-slate-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">{fac.name}</h3>
                        <p className="text-sm text-slate-500">{fac.email} • {fac.department?.name || 'No Department'}</p>
                      </div>
                      <button className="flex items-center space-x-2 px-4 py-2 bg-brand-50 text-brand-600 hover:bg-brand-500 hover:text-white rounded-xl text-sm font-bold transition-colors">
                        <Save size={16} /> <span>Save Allocation</span>
                      </button>
                    </div>
                    
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400 mb-3 tracking-wider flex items-center gap-1">
                        <BookOpen size={14} /> Assigned Subjects
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {fac.assignedSubjects && fac.assignedSubjects.length > 0 ? (
                          fac.assignedSubjects.map(sub => (
                            <span key={sub._id} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700">
                              {sub.name} ({sub.code})
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-400 italic">No subjects assigned yet.</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PageShell>
    </div>
  );
};

export default AdminFacultyAllocation;
