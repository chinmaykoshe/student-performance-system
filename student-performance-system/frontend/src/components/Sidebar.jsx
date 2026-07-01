import React, { memo, useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';
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
  Building,
  BookOpen,
  X
} from 'lucide-react';

const Sidebar = memo(({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await api.get('/messages/unread-count');
        if (res.data.success) {
          setUnreadCount(res.data.count);
        }
      } catch (err) {
        // fail silently for polling
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [user]);

  // Optionally clear unread count if we are currently on the messages page
  useEffect(() => {
    if (location.pathname === '/messages') {
      setUnreadCount(0); // Messages are marked as read when opening a chat
    }
  }, [location.pathname]);

  const MessageLabel = () => (
    <div className="flex items-center justify-between w-full">
      <span>Messages</span>
      {unreadCount > 0 && (
        <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {unreadCount}
        </span>
      )}
    </div>
  );

  const getAdminLinks = () => [
    { to: '/admin', label: 'Dashboard', icon: <Home size={18} strokeWidth={2} /> },
    { to: '/admin/academic-setup', label: 'Academic Setup', icon: <Building size={18} strokeWidth={2} /> },
    { to: '/admin/faculty-allocation', label: 'Faculty Allocation', icon: <Users size={18} strokeWidth={2} /> },
    { to: '/admin/analytics', label: 'Analytics', icon: <BarChart2 size={18} strokeWidth={2} /> },
    { to: '/admin/students', label: 'Students', icon: <GraduationCap size={18} strokeWidth={2} /> },
    { to: '/admin/faculty', label: 'Faculty', icon: <Users size={18} strokeWidth={2} /> },
    { to: '/messages', label: <MessageLabel />, icon: <MessageSquare size={18} strokeWidth={2} /> },
    { to: '/admin/logs', label: 'Logs', icon: <BarChart2 size={18} strokeWidth={2} /> },
    { to: '/admin/settings', label: 'Settings', icon: <Settings size={18} strokeWidth={2} /> }
  ];

  const getFacultyLinks = () => [
    { to: '/faculty', label: 'Overview', icon: <Home size={18} strokeWidth={2} /> },
    { to: '/faculty/attendance', label: 'Attendance Register', icon: <Calendar size={18} strokeWidth={2} /> },
    { to: '/faculty/marks', label: 'Marks Entry', icon: <CheckSquare size={18} strokeWidth={2} /> },
    { to: '/faculty/analytics', label: 'Assessment Analytics', icon: <BarChart2 size={18} strokeWidth={2} /> },
    { to: '/faculty/create-assessment', label: 'Create Assessment', icon: <CheckSquare size={18} strokeWidth={2} /> },
    { to: '/messages', label: <MessageLabel />, icon: <MessageSquare size={18} strokeWidth={2} /> }
  ];

  const getStudentLinks = () => [
    { to: '/student', label: 'Dashboard', icon: <Home size={18} strokeWidth={2} /> },
    { to: '/student/assessment', label: 'Tasks', icon: <CheckSquare size={18} strokeWidth={2} /> },
    { to: '/student/ai-coach', label: 'AI Coach', icon: <MessageSquare size={18} strokeWidth={2} /> },
    { to: '/messages', label: <MessageLabel />, icon: <MessageSquare size={18} strokeWidth={2} /> },
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
                key={link.to}
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
                <span className="flex-1">{link.label}</span>
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
