import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { GraduationCap, Mail, Lock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

// ─── Forgot Password View ────────────────────────────────────────────────────
const ForgotPasswordView = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data?.success) {
        setMessage(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center mb-2">
        <Mail size={32} className="text-brand-500 mb-3" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Forgot Password?</h2>
        <p className="text-sm text-slate-400 text-center mt-1.5">
          Enter your registered email. We'll send a secure reset link valid for 15 minutes.
        </p>
      </div>

      {message ? (
        <div className="flex items-center space-x-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm">
          <CheckCircle size={18} className="shrink-0" />
          <span>{message}</span>
        </div>
      ) : (
        <>
          {error && (
            <div className="flex items-center space-x-2 rounded-2xl bg-rose-500/10 p-4 text-sm text-rose-500 border border-rose-500/20">
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
                  className="glass-input w-full pl-11 pr-4 py-3 rounded-2xl text-sm"
                  placeholder="name@university.edu"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 mt-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-semibold text-sm shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        </>
      )}

      <button
        onClick={onBack}
        className="w-full flex items-center justify-center space-x-2 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors pt-2"
      >
        <ArrowLeft size={14} />
        <span>Back to Sign In</span>
      </button>
    </div>
  );
};

// ─── Reset Password View ─────────────────────────────────────────────────────
const ResetPasswordView = ({ token }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirm) {
      return setError('Passwords do not match.');
    }
    setSubmitting(true);
    try {
      const res = await api.put('/auth/reset-password', { token, newPassword });
      if (res.data?.success) {
        setMessage(res.data.message);
        setTimeout(() => navigate('/login'), 2500);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. The link may have expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center mb-2">
        <Lock size={32} className="text-brand-500 mb-3" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Set New Password</h2>
        <p className="text-sm text-slate-400 text-center mt-1.5">Choose a strong password (min. 6 characters).</p>
      </div>

      {message ? (
        <div className="flex items-center space-x-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm">
          <CheckCircle size={18} className="shrink-0" />
          <span>{message} Redirecting to login…</span>
        </div>
      ) : (
        <>
          {error && (
            <div className="flex items-center space-x-2 rounded-2xl bg-rose-500/10 p-4 text-sm text-rose-500 border border-rose-500/20">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 pl-1">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 pointer-events-none"><Lock size={18} /></div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="glass-input w-full pl-11 pr-4 py-3 rounded-2xl text-sm"
                  placeholder="Min. 6 characters"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 pl-1">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 pointer-events-none"><Lock size={18} /></div>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="glass-input w-full pl-11 pr-4 py-3 rounded-2xl text-sm"
                  placeholder="Repeat new password"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 mt-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-semibold text-sm shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50"
            >
              {submitting ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const [showForgot, setShowForgot] = useState(true);
  const token = searchParams.get('token');

  // If a reset token is in the URL, show the reset form directly
  const view = token ? 'reset' : (showForgot ? 'forgot' : 'login');

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 transition-colors duration-300 overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-brand-400/20 blur-[100px] dark:bg-brand-500/10" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-400/20 blur-[100px] dark:bg-cyan-500/10" />

      <div className="absolute top-6 right-6"><ThemeToggle /></div>

      <div className="w-full max-w-md z-10">
        <div className="glass-card rounded-3xl p-8 border border-white/30 dark:border-slate-700/30">
          <div className="flex justify-center mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white shadow-lg">
              <GraduationCap size={26} />
            </div>
          </div>

          {view === 'reset' ? (
            <ResetPasswordView token={token} />
          ) : (
            <ForgotPasswordView onBack={() => window.history.back()} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
