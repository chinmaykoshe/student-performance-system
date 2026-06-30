import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  ClipboardList, 
  LogOut,
  TrendingUp,
  Settings,
  FileClock,
  BarChart3,
  Award,
  BrainCircuit,
  FileText
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const getSections = () => {
    if (!user) return [];

    switch (user.role) {
      case 'admin':
        return [
          {
            title: 'MAIN MENU',
            links: [
              { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
              { to: '/admin/analytics', label: 'Analytics Insights', icon: <BarChart3 size={18} /> },
              { to: '/admin/students', label: 'Manage Students', icon: <Users size={18} /> },
              { to: '/admin/faculty', label: 'Manage Faculty', icon: <UserCheck size={18} /> }
            ]
          },
          {
            title: 'SYSTEM CONTROLS',
            links: [
              { to: '/admin/logs', label: 'Audit Activity Logs', icon: <FileClock size={18} /> },
              { to: '/admin/settings', label: 'System Settings', icon: <Settings size={18} /> }
            ]
          }
        ];
      case 'faculty':
        return [
          {
            title: 'FACULTY MENU',
            links: [
              { to: '/faculty', label: 'My Students', icon: <ClipboardList size={18} /> }
            ]
          }
        ];
      case 'student':
        return [
          {
            title: 'STUDENT MENU',
            links: [
              { to: '/student', label: 'My Performance', icon: <TrendingUp size={18} /> },
              { to: '/student/assessment', label: 'Skill Assessments', icon: <Award size={18} /> },
              { to: '/student/ai-coach', label: 'AI Career Coach', icon: <BrainCircuit size={18} /> },
              { to: '/student/resume-builder', label: 'ATS Resume Builder', icon: <FileText size={18} /> }
            ]
          }
        ];
      default:
        return [];
    }
  };

  const sections = getSections();

  return (
    <aside className="glass-panel w-64 h-screen flex flex-col justify-between border-y-0 border-l-0 shrink-0">
      <div className="flex flex-col overflow-y-auto">
        {/* Brand Logo Header */}
        <div className="flex h-20 items-center justify-start px-6 space-x-3 border-b border-slate-200/50 dark:border-slate-800/50 shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white shadow-md shadow-brand-500/20">
            <GraduationCap size={22} />
          </div>
          <div>
            <span className="text-lg font-bold text-slate-800 dark:text-white leading-none block">PredictEdu</span>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Analytics Portal</span>
          </div>
        </div>

        {/* Sectional Menu Navigation */}
        <div className="mt-6 px-4 space-y-6">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4 block">
                {section.title}
              </span>
              <nav className="space-y-1">
                {section.links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-2.5 rounded-xl font-medium text-xs transition-all duration-250 ${
                        isActive
                          ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20 scale-[1.02]'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/40 dark:hover:bg-slate-800/40 hover:text-slate-850 dark:hover:text-slate-100'
                      }`
                    }
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* Footer / User quick action */}
      <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 shrink-0">
        <button
          onClick={logout}
          className="flex w-full items-center space-x-3 px-4 py-2.5 rounded-xl font-medium text-xs text-rose-500 hover:bg-rose-500/10 transition-all duration-200"
        >
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
