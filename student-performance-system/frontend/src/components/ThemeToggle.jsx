import React, { useEffect } from 'react';

const ThemeToggle = () => {
  useEffect(() => {
    // Force light mode globally to maintain brand consistency
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  // Removed the toggle UI as we are forcing the SaaS light theme
  return null;
};

export default ThemeToggle;
