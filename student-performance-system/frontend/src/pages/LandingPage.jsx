import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import {
  GraduationCap,
  BrainCircuit,
  BarChart3,
  Mail,
  Shield,
  FileText,
  ChevronRight,
  CheckCircle,
  Users,
  Cpu
} from 'lucide-react';

const features = [
  {
    icon: BrainCircuit,
    title: 'AI-Powered Predictions',
    description: 'Machine learning forecasts each student\'s academic outcome with explainable confidence scores.',
    color: 'from-brand-500/20 to-brand-600/10',
    iconColor: 'text-brand-500'
  },
  {
    icon: BarChart3,
    title: 'Live Analytics Dashboard',
    description: 'Real-time charts and performance breakdowns across departments, semesters, and cohorts.',
    color: 'from-violet-500/20 to-violet-600/10',
    iconColor: 'text-violet-500'
  },
  {
    icon: Mail,
    title: 'Automated Alert Emails',
    description: 'Instant Nodemailer alerts to students when attendance or marks fall below thresholds.',
    color: 'from-amber-500/20 to-amber-600/10',
    iconColor: 'text-amber-500'
  },
  {
    icon: FileText,
    title: 'PDF Report Cards',
    description: 'One-click generation of styled A4 academic performance reports with AI prediction results.',
    color: 'from-emerald-500/20 to-emerald-600/10',
    iconColor: 'text-emerald-500'
  },
  {
    icon: Shield,
    title: 'Role-Based Access Control',
    description: 'Granular admin, faculty, and student roles with immutable audit logs for all actions.',
    color: 'from-rose-500/20 to-rose-600/10',
    iconColor: 'text-rose-500'
  },
  {
    icon: Cpu,
    title: 'Bulk CSV / Excel Import',
    description: 'Import entire student cohorts from spreadsheets. Predictions run automatically for each record.',
    color: 'from-cyan-500/20 to-cyan-600/10',
    iconColor: 'text-cyan-500'
  }
];

const stats = [
  { label: 'REST API Endpoints', value: '16+' },
  { label: 'Functional Requirements Satisfied', value: '14/14' },
  { label: 'ML Model Accuracy', value: '~87%' },
  { label: 'Unit Test Pass Rate', value: '100%' }
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const heroRef = useRef(null);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (token && user) {
      navigate(`/${user.role}`, { replace: true });
    }
  }, [token, user, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">

      {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-slate-950/80 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <GraduationCap size={20} className="text-white" />
          </div>
          <span className="font-bold text-white text-sm tracking-tight">
            Student<span className="text-brand-400">Predict</span>
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-brand-500/30 hover:scale-[1.03] active:scale-[0.97]"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-24 text-center overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-brand-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-cyan-600/5 blur-[150px]" />

        {/* Badge */}
        <div className="relative inline-flex items-center space-x-2 bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
          <BrainCircuit size={14} />
          <span>AI-Powered · MERN Stack · Random Forest ML</span>
        </div>

        {/* Headline */}
        <h1 className="relative text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight max-w-4xl mb-6">
          Predict Student{' '}
          <span className="bg-gradient-to-r from-brand-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
            Performance
          </span>{' '}
          with AI
        </h1>

        <p className="relative text-slate-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          A cloud-based academic intelligence platform that gives educators real-time,
          AI-driven insights to support every student — before it's too late.
        </p>

        {/* CTAs */}
        <div className="relative flex flex-col sm:flex-row items-center gap-4 mb-20">
          <button
            onClick={() => navigate('/login')}
            className="group flex items-center space-x-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-bold text-sm shadow-2xl shadow-brand-500/30 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
          >
            <span>Get Started</span>
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center space-x-2 px-8 py-4 rounded-2xl border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-semibold text-sm backdrop-blur-sm transition-all duration-300 hover:bg-white/5"
          >
            <span>Explore Features</span>
          </button>
        </div>

        {/* Stats bar */}
        <div className="relative w-full max-w-3xl grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-3xl overflow-hidden border border-white/5">
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center justify-center py-6 px-4 bg-slate-900/60 backdrop-blur-sm hover:bg-slate-900/80 transition-colors">
              <span className="text-2xl font-black text-white mb-1">{stat.value}</span>
              <span className="text-[11px] text-slate-400 font-medium text-center">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────── */}
      <section id="features" className="relative py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-4 block">Platform Capabilities</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
              Everything educators need
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              A fully integrated suite of tools — predictions, alerts, analytics, and reports — in one platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group relative p-6 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`inline-flex p-3.5 rounded-2xl bg-gradient-to-br ${feature.color} mb-5`}>
                  <feature.icon size={22} className={feature.iconColor} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IS IT FOR ──────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-gradient-to-b from-transparent to-slate-900/50">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-4 block">Roles & Access</span>
          <h2 className="text-4xl font-extrabold text-white mb-4">Designed for everyone</h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-16">
            Three dedicated portals, each tailored to the exact needs of its user.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { role: 'Admin', icon: Shield, color: 'brand', perks: ['Full student management', 'Bulk CSV import', 'Analytics dashboard', 'Content moderation', 'Audit logs'] },
              { role: 'Faculty', icon: Users, color: 'violet', perks: ['Department student view', 'Update academic stats', 'Trigger predictions', 'Export Excel reports'] },
              { role: 'Student', icon: GraduationCap, color: 'emerald', perks: ['Personal performance portal', 'AI prediction + suggestions', 'Roadmap milestones', 'Download report card PDF'] }
            ].map(({ role, icon: Icon, color, perks }) => (
              <div key={role} className={`p-8 rounded-3xl bg-${color}-500/5 border border-${color}-500/10 text-left`}>
                <div className={`inline-flex p-3 rounded-2xl bg-${color}-500/10 text-${color}-400 mb-6`}>
                  <Icon size={22} />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{role}</h3>
                <ul className="space-y-3">
                  {perks.map((p, i) => (
                    <li key={i} className="flex items-center space-x-2.5 text-sm text-slate-400">
                      <CheckCircle size={14} className={`text-${color}-400 shrink-0`} />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BOTTOM ─────────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative p-12 rounded-3xl bg-gradient-to-br from-brand-600/20 to-violet-600/10 border border-brand-500/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent" />
            <GraduationCap size={56} className="text-brand-400 mx-auto mb-6 relative z-10" />
            <h2 className="text-4xl font-extrabold text-white mb-4 relative z-10">Ready to get started?</h2>
            <p className="text-slate-400 mb-8 relative z-10">Sign in with your institutional credentials to access your dashboard.</p>
            <button
              onClick={() => navigate('/login')}
              className="relative z-10 inline-flex items-center space-x-2 px-10 py-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-2xl shadow-brand-500/30 transition-all hover:scale-[1.04] active:scale-[0.97]"
            >
              <span>Sign In Now</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="py-8 px-6 border-t border-white/5 text-center text-xs text-slate-600">
        <p>Student Performance Prediction System · MCA Project 2024–2026 · Bharati Vidyapeeth (Deemed to be University)</p>
      </footer>
    </div>
  );
};

export default LandingPage;
