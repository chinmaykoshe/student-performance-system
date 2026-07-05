import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import { PageShell } from '../components/AdminUI';
import { FileText, Download, Briefcase, Rocket, RefreshCw, Plus, Trash2 } from 'lucide-react';

const ResumeBuilder = () => {
  const { profile } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  // Editable lists
  const [customProjects, setCustomProjects] = useState([
    { title: 'AI-Powered student dashboard portal', description: 'Built an intelligent student portal that provides academic prediction alerts and generates learning roadmaps using Express and MERN.' }
  ]);
  const [customExperience, setCustomExperience] = useState([
    { role: 'Web Development Intern', company: 'TechSolutions Inc', description: 'Developed fully responsive web layouts and created REST API endpoints for user accounts database management.' }
  ]);

  useEffect(() => {
    const fetchStudentProfile = async () => {
      try {
        if (profile?._id) {
          const res = await api.get(`/students/${profile._id}`);
          if (res.data?.success) {
            setStudentData(res.data.data);
          }
        }
      } catch (err) {
        setError('Failed to fetch performance profile data.');
      } finally {
        setLoading(false);
      }
    };
    fetchStudentProfile();
  }, [profile]);

  const handleAddProject = () => {
    setCustomProjects([...customProjects, { title: 'New project title', description: 'Brief details about project and tech stack used.' }]);
  };

  const handleRemoveProject = (index) => {
    setCustomProjects(customProjects.filter((_, i) => i !== index));
  };

  const handleProjectChange = (index, field, value) => {
    const updated = [...customProjects];
    updated[index][field] = value;
    setCustomProjects(updated);
  };

  const handleAddExperience = () => {
    setCustomExperience([...customExperience, { role: 'Job role / Title', company: 'Company Name', description: 'Details about key achievements and tasks.' }]);
  };

  const handleRemoveExperience = (index) => {
    setCustomExperience(customExperience.filter((_, i) => i !== index));
  };

  const handleExperienceChange = (index, field, value) => {
    const updated = [...customExperience];
    updated[index][field] = value;
    setCustomExperience(updated);
  };

  const handleGeneratePDF = async () => {
    if (!studentData) return;
    setDownloading(true);
    try {
      const response = await api.post('/resume/generate', {
        customProjects,
        customExperience
      }, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Resume_${studentData.name.replace(/\s+/g, '_')}.pdf`;
      link.click();
    } catch (err) {
      alert('Error downloading resume PDF: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !studentData) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
        <FileText size={48} className="text-rose-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Profile Loading Error</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center max-w-md">
          {error || 'No academic profile matches your login. Contact administration.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 text-slate-900">
      <Header title="ATS Resume Builder" />
      <PageShell maxWidth="max-w-4xl">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/40 dark:bg-slate-850 p-6 rounded-3xl border border-white/20 dark:border-slate-800/20">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">ATS-Compliant Template</h3>
              <p className="text-xs text-slate-400 mt-1">This builder auto-compiles your CGPA, key skills, and completed roadmap achievements into a single-column layout.</p>
            </div>
            <button
              onClick={handleGeneratePDF}
              disabled={downloading}
              className="flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/15 disabled:opacity-50 transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98]"
            >
              {downloading ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
              <span>{downloading ? 'Compiling PDF...' : 'Download Resume PDF'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Custom Projects Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pl-1">
                <h4 className="font-bold text-sm uppercase text-brand-500 tracking-wider flex items-center space-x-2">
                  <Rocket size={16} />
                  <span>Projects</span>
                </h4>
                <button
                  onClick={handleAddProject}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-brand-500 hover:bg-brand-500/5 transition-all text-xs font-bold flex items-center space-x-1"
                >
                  <Plus size={12} />
                  <span>Add Project</span>
                </button>
              </div>

              {customProjects.map((proj, idx) => (
                <GlassCard key={idx} className="p-5 border border-white/10 relative space-y-3">
                  <button
                    onClick={() => handleRemoveProject(idx)}
                    className="absolute right-4 top-4 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Project Title</label>
                    <input
                      type="text"
                      value={proj.title}
                      onChange={(e) => handleProjectChange(idx, 'title', e.target.value)}
                      className="glass-input w-full px-3.5 py-2.5 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Description</label>
                    <textarea
                      value={proj.description}
                      onChange={(e) => handleProjectChange(idx, 'description', e.target.value)}
                      className="glass-input w-full h-20 p-3 rounded-xl text-xs leading-relaxed resize-none"
                    />
                  </div>
                </GlassCard>
              ))}
            </div>

            {/* Custom Experience Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pl-1">
                <h4 className="font-bold text-sm uppercase text-violet-500 tracking-wider flex items-center space-x-2">
                  <Briefcase size={16} />
                  <span>Experience</span>
                </h4>
                <button
                  onClick={handleAddExperience}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-violet-500 hover:bg-violet-500/5 transition-all text-xs font-bold flex items-center space-x-1"
                >
                  <Plus size={12} />
                  <span>Add Work</span>
                </button>
              </div>

              {customExperience.map((exp, idx) => (
                <GlassCard key={idx} className="p-5 border border-white/10 relative space-y-3">
                  <button
                    onClick={() => handleRemoveExperience(idx)}
                    className="absolute right-4 top-4 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Role / Title</label>
                      <input
                        type="text"
                        value={exp.role}
                        onChange={(e) => handleExperienceChange(idx, 'role', e.target.value)}
                        className="glass-input w-full px-3.5 py-2.5 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Company</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => handleExperienceChange(idx, 'company', e.target.value)}
                        className="glass-input w-full px-3.5 py-2.5 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Details & Tasks</label>
                    <textarea
                      value={exp.description}
                      onChange={(e) => handleExperienceChange(idx, 'description', e.target.value)}
                      className="glass-input w-full h-20 p-3 rounded-xl text-xs leading-relaxed resize-none"
                    />
                  </div>
                </GlassCard>
              ))}
            </div>

          </div>

        </PageShell>
    </div>
  );
};

export default ResumeBuilder;
