import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="p-2 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 bg-white/40 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-200"
      aria-label="Toggle Theme"
    >
      {darkMode ? (
        <Sun size={20} className="transition-transform duration-500 hover:rotate-90 text-amber-400" />
      ) : (
        <Moon size={20} className="transition-transform duration-500 hover:-rotate-12 text-blue-600" />
      )}
    </button>
  );
};

export default ThemeToggle;
