import React, { memo } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronDown } from 'lucide-react';

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
          Welcome back, {user?.name ? user.name.split(' ')[0] : 'User'}
        </p>
      </div>

      <div className="flex items-center space-x-6">
        
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
});

export default Header;
