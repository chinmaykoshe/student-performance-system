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
  GraduationCap,
  User,
  X
} from 'lucide-react';

const Sidebar = memo(({ isOpen, setIsOpen }) => {
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

  const getFacultyLinks = () => [
    { to: '/faculty', label: 'Dashboard', icon: <Home size={18} strokeWidth={2} /> },
    { to: '/messages', label: 'Messages', icon: <MessageSquare size={18} strokeWidth={2} /> }
  ];

  const getStudentLinks = () => [
    { to: '/student', label: 'Dashboard', icon: <Home size={18} strokeWidth={2} /> },
    { to: '/student/assessment', label: 'Tasks', icon: <CheckSquare size={18} strokeWidth={2} /> },
    { to: '/student/ai-coach', label: 'AI Coach', icon: <MessageSquare size={18} strokeWidth={2} /> },
    { to: '/messages', label: 'Messages', icon: <MessageSquare size={18} strokeWidth={2} /> },
    { to: '/student/resume-builder', label: 'Resume', icon: <Briefcase size={18} strokeWidth={2} /> }
  ];

  const roleLinks = user?.role === 'admin' ? getAdminLinks() : user?.role === 'faculty' ? getFacultyLinks() : getStudentLinks();
  const links = [...roleLinks, { to: '/profile', label: 'My Profile', icon: <User size={18} strokeWidth={2} /> }];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside className={`
        w-64 h-screen bg-slate-50 flex flex-col justify-between border-r border-slate-100 shrink-0
        fixed md:static top-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          {/* Brand Logo Header */}
          <div className="flex h-20 items-center justify-between px-6 shrink-0 md:justify-start space-x-3">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                <span className="font-bold text-lg font-sans">A.</span>
              </div>
              <span className="text-sm font-semibold text-slate-900 leading-none">PredictEdu</span>
            </div>
            <button className="md:hidden text-slate-500 hover:text-slate-900" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <div className="mt-4 px-4 space-y-1 pb-4">
            {links.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                end
                onClick={() => setIsOpen && setIsOpen(false)}
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
        <div className="p-4 shrink-0 mb-4 bg-slate-50">
          <button
            onClick={logout}
            className="flex w-full items-center space-x-3 px-4 py-2.5 rounded-full text-sm font-medium text-slate-500 hover:bg-white hover:text-slate-900 transition-all duration-200"
          >
            <div className="opacity-80"><LogOut size={18} strokeWidth={2} /></div>
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
});

export default Sidebar;
