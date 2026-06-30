import React from 'react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { LogOut, User as UserIcon } from 'lucide-react';

const Header = ({ title }) => {
  const { user, logout } = useAuth();

  return (
    <header className="glass-panel sticky top-0 z-30 flex h-20 w-full items-center justify-between px-8 border-t-0 border-x-0">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white font-sans">
          {title}
        </h1>
      </div>

      <div className="flex items-center space-x-6">
        <ThemeToggle />
        
        {user && (
          <div className="flex items-center space-x-4 border-l border-slate-200/50 dark:border-slate-700/50 pl-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{user.name}</p>
              <p className="text-xs font-medium text-slate-400 capitalize">{user.role}</p>
            </div>
            
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <UserIcon size={20} />
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-xl transition-all duration-200 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
