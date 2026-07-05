import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import { PageShell } from '../components/AdminUI';
import { BookOpen, CheckCircle2, XCircle } from 'lucide-react';

const FacultyAnalytics = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssessments = async () => {
      setLoading(true);
      try {
        const res = await api.get('/assessments/all');
        if (res.data.success) {
          setAssessments(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load assessment history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssessments();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 text-slate-900">
      <Header title="Assessment Analytics" />
      
      <PageShell maxWidth="max-w-7xl">
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
            </div>
          ) : assessments.length === 0 ? (
            <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
              <BookOpen size={48} className="text-slate-400 mb-4" />
              <p className="text-slate-500 font-medium">No assessment history available yet.</p>
              <p className="text-xs text-slate-400 mt-1">Students will appear here once they complete MCQ skills assessments.</p>
              <button
                onClick={() => navigate('/faculty/create-assessment')}
                className="mt-6 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-bold flex items-center space-x-2 transition-all shadow-md shadow-brand-500/20"
              >
                <span>Create Assessment</span>
              </button>
            </GlassCard>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => navigate('/faculty/create-assessment')}
                  className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-bold flex items-center space-x-2 transition-all shadow-md shadow-brand-500/20"
                >
                  <span>Add Assessment</span>
                </button>
              </div>
              <div className="overflow-x-auto rounded-3xl border border-slate-200 shadow-sm bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50">
                      <th className="px-6 py-4">Student Details</th>
                      <th className="px-6 py-4">Assessment Category</th>
                      <th className="px-6 py-4">Score</th>
                      <th className="px-6 py-4">Evaluation Status</th>
                      <th className="px-6 py-4">Submitted Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                    {assessments.map((a) => (
                      <tr key={a._id} className="hover:bg-slate-50 transition-all">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-slate-800">{a.user?.name || 'Unknown Student'}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{a.user?.email || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold">{a.category}</td>
                        <td className="px-6 py-4">
                          <span className={`text-base font-black ${a.score >= 70 ? 'text-emerald-500' : 'text-slate-500'}`}>
                            {a.score}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1.5 rounded-full text-xs font-bold ${
                            a.score >= 70 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-rose-100 text-rose-700'
                          } inline-flex items-center space-x-1`}>
                            {a.score >= 70 ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            <span>{a.score >= 70 ? 'Passed' : 'Failed'}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </PageShell>
    </div>
  );
};

export default FacultyAnalytics;
