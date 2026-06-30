import React, { memo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Bell, ChevronDown } from 'lucide-react';

const Header = memo(({ title }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-24 w-full items-center justify-between px-10 bg-slate-50 border-b border-transparent">
      
      {/* Title & Greeting */}
      <div className="flex flex-col animate-fade-in">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 font-sans">
          {title || 'Overview'}
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Welcome back, {user?.name ? user.name.split(' ')[0] : 'User'} 👋
        </p>
      </div>

      <div className="flex items-center space-x-6">
        
        {/* Search Bar */}
        <div className="relative hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none opacity-50">
            <Search size={16} />
          </div>
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="w-64 bg-white border border-slate-100 text-slate-900 rounded-full pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)]"
          />
        </div>

        {/* Notifications */}
        <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors relative">
          <Bell size={20} strokeWidth={2} />
          <span className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-slate-900 border-2 border-slate-50"></span>
        </button>
        
        {/* Profile Avatar */}
        {user && (
          <div className="flex items-center space-x-3 pl-2 cursor-pointer group">
            <div className="h-10 w-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-slate-500">
               {/* Replace with real image if available, otherwise initial */}
               <span className="font-semibold text-sm">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
            </div>
            <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
          </div>
        )}
      </div>
    </header>
  );
};

});

export default Header;
