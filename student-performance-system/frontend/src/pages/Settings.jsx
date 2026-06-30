import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import { Settings as SettingsIcon, AlertTriangle, ShieldCheck, Mail, Save, RefreshCw, Globe } from 'lucide-react';

const Settings = () => {
  const [config, setConfig] = useState({
    attendanceThreshold: 75,
    marksThreshold: 40,
    emailAlertsEnabled: true
  });
  const [language, setLanguage] = useState(() => localStorage.getItem('preferredLanguage') || 'en');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'hi', label: 'हिंदी (Hindi)', flag: '🇮🇳' },
    { code: 'mr', label: 'मराठी (Marathi)', flag: '🇮🇳' },
    { code: 'ta', label: 'தமிழ் (Tamil)', flag: '🇮🇳' },
    { code: 'te', label: 'తెలుగు (Telugu)', flag: '🇮🇳' },
    { code: 'bn', label: 'বাংলা (Bengali)', flag: '🇮🇳' },
  ];

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/system/settings');
      if (res.data && res.data.success) {
        setConfig(res.data.data);
      }
    } catch (err) {
      showToast('error', 'Failed to retrieve system settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.put('/system/settings', config);
      if (res.data && res.data.success) {
        setConfig(res.data.data);
        showToast('success', 'Configuration settings updated and audited successfully.');
      }
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <Header title="Portal Configuration & Security Settings" />

      <main className="flex-1 p-8 max-w-4xl mx-auto w-full space-y-8">
        {toast && (
          <div className={`p-4 rounded-2xl border text-xs font-semibold animate-in slide-in-from-top-4 duration-300 shadow-lg ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/5'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400 shadow-rose-500/5'
          }`}>
            {toast.message}
          </div>
        )}

        <GlassCard>
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-2xl">
              <SettingsIcon size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Predictive Threshold Configurations</h2>
              <p className="text-xs text-slate-400">Configure parameters used to categorize student failure risks and fire email warning reports.</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
              <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
              <div className="h-14 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-8">
              {/* Range 1: Attendance Threshold */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                    <AlertTriangle size={14} className="text-amber-500" />
                    <span>Attendance Alert Limit</span>
                  </label>
                  <span className="text-sm font-bold text-slate-800 dark:text-white">{config.attendanceThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="90"
                  value={config.attendanceThreshold}
                  onChange={(e) => setConfig({ ...config, attendanceThreshold: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
                <p className="text-[11px] text-slate-400">Students with attendance percentages falling below this target are flagged in red logs and sent alert notices.</p>
              </div>

              {/* Range 2: Internal Marks Threshold */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                    <ShieldCheck size={14} className="text-brand-500" />
                    <span>Internal Exam Minimum Threshold</span>
                  </label>
                  <span className="text-sm font-bold text-slate-800 dark:text-white">{config.marksThreshold} / 100</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="60"
                  value={config.marksThreshold}
                  onChange={(e) => setConfig({ ...config, marksThreshold: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
                <p className="text-[11px] text-slate-400">Scores beneath this minimum on internal exams trigger notifications recommending remedial help.</p>
              </div>

              {/* Switch 3: Email alerts */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800/40">
                <div className="flex items-center space-x-3.5">
                  <div className="p-2.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Automated Nodemailer Alerts</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Toggle student warnings upon registration and metric updates.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, emailAlertsEnabled: !config.emailAlertsEnabled })}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                    config.emailAlertsEnabled ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${
                    config.emailAlertsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Submit */}
              <div className="flex justify-end pt-4 border-t border-slate-150 dark:border-slate-800/20">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs flex items-center space-x-2 shadow-lg shadow-brand-500/15 disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                  <span>{saving ? 'Saving Config...' : 'Apply Configurations'}</span>
                </button>
              </div>
            </form>
          )}
        </GlassCard>

        {/* Language Preference Card (Quick Win #10) */}
        <GlassCard>
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-2xl">
              <Globe size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Platform Language Preference</h2>
              <p className="text-xs text-slate-400">Select your preferred display language. AI-generated content and UI labels will adapt accordingly.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  localStorage.setItem('preferredLanguage', lang.code);
                  showToast('success', `Language preference set to ${lang.label}.`);
                }}
                className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl border text-left transition-all duration-200 ${
                  language === lang.code
                    ? 'bg-brand-500/10 border-brand-500/30 text-brand-600 dark:text-brand-400'
                    : 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-200/30 dark:border-slate-800/30 text-slate-600 dark:text-slate-400 hover:border-slate-300/50'
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="text-xs font-semibold truncate">{lang.label}</span>
                {language === lang.code && (
                  <span className="ml-auto text-brand-500">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>

          <p className="mt-5 text-[11px] text-slate-400 bg-slate-100/50 dark:bg-slate-800/30 rounded-xl p-3 border border-slate-200/20 dark:border-slate-700/20">
            <strong>Note:</strong> Full multilingual support is an upcoming feature. Currently, preference is stored locally and
            will be used by the AI system when generating reports and recommendations in future releases.
          </p>
        </GlassCard>
      </main>
    </div>
  );
};

export default Settings;
