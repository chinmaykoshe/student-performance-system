import React, { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  BarChart2, 
  Briefcase, 
  CheckSquare, 
  Calendar, 
  MessageSquare, 
  Users, 
  Settings,
  LogOut,
  GraduationCap
} from 'lucide-react';

const Sidebar = memo(() => {
  const { user, logout } = useAuth();

  const getAdminLinks = () => [
    { to: '/admin', label: 'Dashboard', icon: <Home size={18} strokeWidth={2} /> },
    { to: '/admin/analytics', label: 'Analytics', icon: <BarChart2 size={18} strokeWidth={2} /> },
    { to: '/admin/students', label: 'Students', icon: <GraduationCap size={18} strokeWidth={2} /> },
    { to: '/admin/faculty', label: 'Faculty', icon: <Users size={18} strokeWidth={2} /> },
    { to: '/admin/projects', label: 'Projects', icon: <Briefcase size={18} strokeWidth={2} /> },
    { to: '/admin/tasks', label: 'Tasks', icon: <CheckSquare size={18} strokeWidth={2} /> },
    { to: '/admin/calendar', label: 'Calendar', icon: <Calendar size={18} strokeWidth={2} /> },
    { to: '/admin/messages', label: 'Messages', icon: <MessageSquare size={18} strokeWidth={2} /> },
    { to: '/admin/team', label: 'Team', icon: <Users size={18} strokeWidth={2} /> },
    { to: '/admin/logs', label: 'Logs', icon: <BarChart2 size={18} strokeWidth={2} /> },
    { to: '/admin/settings', label: 'Settings', icon: <Settings size={18} strokeWidth={2} /> }
  ];

  // Faculty and Student fallbacks to keep logic intact but UI updated
  const getFacultyLinks = () => [
    { to: '/faculty', label: 'Dashboard', icon: <Home size={18} strokeWidth={2} /> }
  ];

  const getStudentLinks = () => [
    { to: '/student', label: 'Dashboard', icon: <Home size={18} strokeWidth={2} /> },
    { to: '/student/assessment', label: 'Tasks', icon: <CheckSquare size={18} strokeWidth={2} /> },
    { to: '/student/ai-coach', label: 'Messages', icon: <MessageSquare size={18} strokeWidth={2} /> }
  ];

  const links = user?.role === 'admin' ? getAdminLinks() : user?.role === 'faculty' ? getFacultyLinks() : getStudentLinks();

  return (
    <aside className="w-64 h-screen bg-slate-50 flex flex-col justify-between border-r border-slate-100 shrink-0">
      <div className="flex flex-col">
        {/* Brand Logo Header */}
        <div className="flex h-20 items-center justify-start px-6 space-x-3 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
            <span className="font-bold text-lg font-sans">A.</span>
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-900 leading-none block">PredictEdu</span>
          </div>
        </div>

        {/* Minimal Navigation */}
        <div className="mt-4 px-4 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              end
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-100 text-slate-900 font-semibold'
                    : 'text-slate-500 hover:bg-white hover:text-slate-900'
                }`
              }
            >
              <div className="opacity-80">{link.icon}</div>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Footer Minimal Logout */}
      <div className="p-4 shrink-0 mb-4">
        <button
          onClick={logout}
          className="flex w-full items-center space-x-3 px-4 py-2.5 rounded-full text-sm font-medium text-slate-500 hover:bg-white hover:text-slate-900 transition-all duration-200"
        >
          <div className="opacity-80"><LogOut size={18} strokeWidth={2} /></div>
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
});

export default Sidebar;
