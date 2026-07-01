import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { PageShell } from '../components/AdminUI';
import { api } from '../context/AuthContext';
import { Plus, Edit3, Trash2, Building, BookOpen, Calendar, GraduationCap } from 'lucide-react';

const AdminAcademicSetup = () => {
  const [activeTab, setActiveTab] = useState('departments');
  const [data, setData] = useState({
    departments: [],
    courses: [],
    subjects: [],
    years: [],
    semesters: []
  });
  const [loading, setLoading] = useState(false);

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
        departments: depRes.data.data,
        courses: couRes.data.data,
        subjects: subRes.data.data,
        years: yrRes.data.data,
        semesters: semRes.data.data
      });
    } catch (err) {
      console.error('Error fetching academic data:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const tabs = [
    { id: 'departments', label: 'Departments', icon: <Building size={16} /> },
    { id: 'courses', label: 'Courses', icon: <GraduationCap size={16} /> },
    { id: 'subjects', label: 'Subjects', icon: <BookOpen size={16} /> },
    { id: 'years', label: 'Academic Years', icon: <Calendar size={16} /> },
    { id: 'semesters', label: 'Semesters', icon: <Calendar size={16} /> }
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 text-slate-900">
      <Header title="Academic Setup & Structure" />
      <PageShell maxWidth="max-w-7xl">
        
        {/* Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit space-x-1 border border-slate-200 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Content Based on Tab */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 capitalize">{activeTab}</h2>
            <button className="flex items-center space-x-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-brand-500/20">
              <Plus size={16} /> <span>Add New</span>
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
                    <th className="px-6 py-4">Code / Details</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {data[activeTab].length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-400">
                        No records found. Click 'Add New' to create one.
                      </td>
                    </tr>
                  ) : (
                    data[activeTab].map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {item.name || item.year}
                        </td>
                        <td className="px-6 py-4">
                          {item.code || `Start: ${new Date(item.startDate).toLocaleDateString()}`}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            item.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {item.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button className="p-2 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors">
                            <Edit3 size={16} />
                          </button>
                          <button className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors">
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
    </div>
  );
};

export default AdminAcademicSetup;
