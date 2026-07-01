import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Mail, Lock, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  
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
      navigate(`/${result.role}`, { replace: true });
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-900 overflow-hidden font-sans">
      {/* Dynamic Animated Background */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute -top-[20%] -left-[10%] h-[700px] w-[700px] rounded-full bg-gradient-to-br from-indigo-500/40 to-purple-600/20 blur-[120px] animate-[spin_30s_linear_infinite]" />
        <div className="absolute bottom-[0%] -right-[10%] h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-cyan-400/30 to-blue-600/30 blur-[100px] animate-[spin_40s_linear_infinite_reverse]" />
        <div className="absolute top-[20%] left-[40%] h-[400px] w-[400px] rounded-full bg-gradient-to-bl from-fuchsia-500/20 to-pink-500/20 blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
      </div>

      {/* Grid Pattern overlay for tech aesthetic */}
      <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

      <div className="absolute top-8 right-8 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-5xl z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-6">
        
        {/* Left Side: Branding / Hero */}
        <div className="hidden md:flex flex-col justify-center space-y-8 pr-10">
          <div className="inline-flex items-center space-x-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md w-fit">
            <Sparkles size={16} className="text-cyan-400" />
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-widest">PredictEdu OS v2.0</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 leading-tight">
            Academic <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">Intelligence.</span>
          </h1>
          
          <p className="text-lg text-slate-400 leading-relaxed max-w-md">
            Unlock the power of predictive analytics. Monitor performance, automate tasks, and drive student success with our unified academic platform.
          </p>

          <div className="flex gap-4 pt-4">
            <div className="flex -space-x-4">
              <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-gradient-to-tr from-pink-500 to-orange-400"></div>
              <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-gradient-to-tr from-blue-500 to-cyan-400"></div>
              <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-gradient-to-tr from-green-400 to-emerald-600"></div>
              <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] text-white font-bold">+2k</div>
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-sm font-bold text-white">Trusted by Top Universities</span>
              <span className="text-xs text-slate-500">Join 2,000+ faculties today</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="w-full max-w-md mx-auto">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
            
            <div className="relative bg-slate-900/60 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-2xl">
              
              <div className="flex flex-col items-center mb-8">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 text-white shadow-xl shadow-cyan-500/20 mb-4 transform transition hover:scale-105 duration-300">
                  <GraduationCap size={36} />
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20"></div>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Welcome Back
                </h2>
                <p className="mt-2 text-sm text-slate-400 text-center">
                  Enter your credentials to access your portal
                </p>
              </div>

              {error && (
                <div className="mb-6 flex items-center space-x-3 rounded-xl bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 pl-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 flex items-center pl-4 transition-colors duration-300 ${focusedInput === 'email' ? 'text-cyan-400' : 'text-slate-500'}`}>
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedInput('email')}
                      onBlur={() => setFocusedInput(null)}
                      className="w-full bg-slate-950/50 border border-white/5 rounded-xl pl-12 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 shadow-inner"
                      placeholder="name@university.edu"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2 pl-1 pr-1">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Password
                    </label>
                    <Link to="/forgot-password" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 flex items-center pl-4 transition-colors duration-300 ${focusedInput === 'password' ? 'text-cyan-400' : 'text-slate-500'}`}>
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedInput('password')}
                      onBlur={() => setFocusedInput(null)}
                      className="w-full bg-slate-950/50 border border-white/5 rounded-xl pl-12 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 shadow-inner"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="group w-full py-4 mt-4 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-sm flex items-center justify-center space-x-2 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                >
                  <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
                  {!submitting && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                </button>
              </form>

              <div className="relative flex items-center my-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <a
                href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/api/auth/google`}
                className="w-full flex items-center justify-center space-x-3 py-3.5 rounded-xl border border-white/10 bg-slate-800/50 hover:bg-slate-800 text-white font-medium text-sm transition-all duration-300"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Continue with Google</span>
              </a>

              {/* Helpful footer */}
              <div className="mt-8 flex justify-center space-x-6 text-xs text-slate-500 font-medium">
                <div className="flex flex-col items-center">
                  <span className="text-white">admin@system.com</span>
                  <span>Pass: admin</span>
                </div>
                <div className="w-px h-8 bg-white/10"></div>
                <div className="flex flex-col items-center">
                  <span className="text-white">faculty@system.com</span>
                  <span>Pass: faculty</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
