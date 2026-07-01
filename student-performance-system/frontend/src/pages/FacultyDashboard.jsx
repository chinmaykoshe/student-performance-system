import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';
import Header from '../components/Header';
import { PageShell, StatCard } from '../components/AdminUI';
import { BookOpen, Users, Calendar, Edit3, Clipboard, Award } from 'lucide-react';

const FacultyDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    const fetchDashboardDetails = async () => {
      try {
        const res = await api.get('/faculty/my-subjects');
        const assignedSubjects = res.data.data || [];
        setSubjects(assignedSubjects);

        // Fetch students counts across all subjects
        let uniqueStudentsCount = 0;
        const countedIds = new Set();

        await Promise.all(assignedSubjects.map(async sub => {
          try {
            const studentRes = await api.get(`/faculty/subjects/${sub._id}/students`);
            const studentsList = studentRes.data.data || [];
            studentsList.forEach(s => countedIds.add(s._id));
          } catch (_) {
            // ignore subject fetch errors
          }
        }));

        setTotalStudents(countedIds.size);
      } catch (err) {
        console.error('Failed to load faculty overview details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardDetails();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 text-slate-900 pb-12">
      <Header title="Faculty Workspace" subtitle={`Welcome back, ${profile?.name || 'Professor'}`} />
      
      <PageShell maxWidth="max-w-7xl">
        {/* Quick Summary Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Assigned Subjects" 
            value={subjects.length} 
            icon={<BookOpen size={16} />} 
            trend="Configured in academic setup" 
            tone="brand" 
          />
          <StatCard 
            title="Total Students Taught" 
            value={totalStudents} 
            icon={<Users size={16} />} 
            trend="Enrolled across subjects" 
            tone="neutral" 
          />
          <StatCard 
            title="Department Coverage" 
            value={profile?.department || 'Computer Applications (MCA)'} 
            icon={<Award size={16} />} 
            trend="Primary faculty department" 
            tone="success" 
          />
        </div>

        {/* Subjects List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800">My Assigned Courses & Subjects</h2>
          
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
          ) : subjects.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-205 shadow-sm text-slate-400">
              <Clipboard className="mx-auto mb-3" size={36} />
              <p className="font-semibold text-slate-500">No subjects assigned yet.</p>
              <p className="text-sm text-slate-450 mt-1">Please contact your administrator to configure your course subject allocations.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map(sub => (
                <div key={sub._id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 mb-4">
                    <BookOpen size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-850 truncate">{sub.name}</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">{sub.code} • Semester {sub.semesterNumber || '—'}</p>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-500 capitalize flex items-center gap-1.5 mb-2">
                      <Users size={13} /> {sub.course?.name || 'Academic Program'}
                    </span>
                    
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button 
                        onClick={() => navigate(`/faculty/attendance?subjectId=${sub._id}`)}
                        className="flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-brand-500 hover:text-white text-slate-700 text-xs font-bold rounded-xl border border-slate-200 hover:border-brand-500 transition-all"
                      >
                        <Calendar size={13} />
                        <span>Attendance</span>
                      </button>
                      
                      <button 
                        onClick={() => navigate(`/faculty/marks?subjectId=${sub._id}`)}
                        className="flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-brand-500 hover:text-white text-slate-700 text-xs font-bold rounded-xl border border-slate-200 hover:border-brand-500 transition-all"
                      >
                        <Edit3 size={13} />
                        <span>Enter Marks</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageShell>
    </div>
  );
};

export default FacultyDashboard;
