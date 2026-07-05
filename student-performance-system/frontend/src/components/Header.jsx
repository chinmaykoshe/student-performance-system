import React, { memo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronDown } from 'lucide-react';

const Header = memo(({ title }) => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between px-10 bg-white border-b border-slate-200">
      
      {/* Title & Greeting */}
      <div className="flex items-end gap-12 animate-fade-in group/title py-10">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-600 bg-clip-text text-transparent font-sans transition-all duration-300 group-hover/title:from-brand-600 group-hover/title:to-indigo-500 leading-none">
          {title || 'Overview'}
        </h1>
        <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 pb-1">
          <span className="text-base origin-bottom-right transition-transform duration-300 hover:rotate-12 cursor-default">👋</span> 
          Welcome back, <span className="font-bold text-slate-700">{user?.name ? user.name.split(' ')[0] : 'User'}</span>
        </p>
      </div>

      <div className="flex items-center space-x-6">
        
        {/* Profile Avatar */}
        {user && (
          <div className="relative">
            <div 
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <div className="h-11 w-11 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 border-2 border-white shadow-md shadow-brand-500/20 overflow-hidden flex items-center justify-center text-white ring-2 ring-transparent group-hover:ring-brand-100 group-hover:ring-offset-2 group-hover:ring-offset-slate-50 transition-all duration-300 group-hover:scale-105">
                <span className="font-bold text-base tracking-wider">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
              </div>
              <ChevronDown size={16} className={`text-slate-400 group-hover:text-brand-600 transition-all duration-300 ${menuOpen ? 'rotate-180 text-brand-600' : ''}`} />
            </div>

            {/* Dropdown Menu */}
            {menuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute top-full right-0 mt-8 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <p className="text-sm font-bold text-slate-800 leading-none mb-1">{user.name}</p>
                  <p className="text-[11px] text-slate-500 truncate leading-none mb-2">{user.email}</p>
                  <span className="inline-block mt-3 text-[9px] px-2 py-0.5 bg-slate-150 text-slate-700 rounded-full font-bold uppercase tracking-wider">
                    {user.role}
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
});

export default Header;
