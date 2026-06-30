import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Mail, Lock, AlertCircle } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { login, token, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (token && user) {
      const from = location.state?.from?.pathname || `/${user.role}`;
      navigate(from, { replace: true });
    }
  }, [token, user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      // Redirect based on user role
      navigate(`/${result.role}`, { replace: true });
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 transition-colors duration-300 overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-brand-400/20 blur-[100px] dark:bg-brand-500/10 animate-glow-1"></div>
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-400/20 blur-[100px] dark:bg-cyan-500/10 animate-glow-2"></div>

      {/* Floating Theme Toggle */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md z-10">
        <div className="glass-card rounded-3xl p-8 border border-white/30 dark:border-slate-700/30">
          {/* Logo Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white shadow-lg shadow-brand-500/35">
              <GraduationCap size={32} />
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
              Welcome back
            </h2>
            <p className="mt-1.5 text-sm text-slate-400 dark:text-slate-400 text-center">
              Predictive analytics portal for academic success
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center space-x-2 rounded-2xl bg-rose-500/10 p-4 text-sm text-rose-500 border border-rose-500/20">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 pl-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 pointer-events-none">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full pl-11 py-3"
                  placeholder="name@university.edu"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 pl-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 pointer-events-none">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full pl-11 py-3"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-semibold text-sm shadow-lg shadow-brand-500/25 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Google OAuth Button (Quick Win #3) */}
          <div className="relative flex items-center my-5">
            <div className="flex-1 h-px bg-slate-200/50 dark:bg-slate-800/50" />
            <span className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-slate-200/50 dark:bg-slate-800/50" />
          </div>

          <a
            href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/api/auth/google`}
            className="w-full flex items-center justify-center space-x-3 py-3.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-750 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Continue with Google</span>
          </a>

          {/* Forgot Password Link (Quick Win #4) */}
          <div className="text-center mt-4">
            <Link
              to="/forgot-password"
              className="text-xs text-brand-500 hover:text-brand-600 font-semibold transition-colors"
            >
              Forgot your password?
            </Link>
          </div>

          {/* Quick instructions / Help */}
          <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-800/50 text-center">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Test Accounts</span>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-2.5 rounded-2xl bg-slate-100/50 dark:bg-slate-800/30 text-left border border-slate-200/20">
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Admin</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">admin@system.com</p>
                <p className="text-[9px] text-slate-400 font-mono mt-0.5">Admin@123</p>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-100/50 dark:bg-slate-800/30 text-left border border-slate-200/20">
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Faculty</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">faculty@system.com</p>
                <p className="text-[9px] text-slate-400 font-mono mt-0.5">faculty@system.com@123</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
