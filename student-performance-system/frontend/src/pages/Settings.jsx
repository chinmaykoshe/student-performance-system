import React, { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import Header from '../components/Header';
import { Badge, PageShell, PrimaryButton, SectionHeader, StatCard } from '../components/AdminUI';
import { AlertTriangle, Bell, Mail, RefreshCw, Save, Settings as SettingsIcon, ShieldCheck } from 'lucide-react';

const Settings = () => {
  const [config, setConfig] = useState({ attendanceThreshold: 75, marksThreshold: 40, emailAlertsEnabled: true });
  const [language, setLanguage] = useState(() => localStorage.getItem('preferredLanguage') || 'en');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'Hindi' },
    { code: 'mr', label: 'Marathi' },
    { code: 'ta', label: 'Tamil' },
    { code: 'te', label: 'Telugu' },
    { code: 'bn', label: 'Bengali' }
  ];

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/system/settings');
        if (res.data?.success) setConfig(res.data.data);
      } catch {
        showToast('error', 'Failed to retrieve system settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.put('/system/settings', config);
      if (res.data?.success) {
        setConfig(res.data.data);
        showToast('success', 'Configuration updated successfully.');
      }
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({ checked, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-7 w-12 items-center rounded-full p-1 transition-colors ${checked ? 'bg-slate-900' : 'bg-slate-200'}`}
      aria-pressed={checked}
    >
      <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 text-slate-900">
      <Header title="Settings" />
      <PageShell maxWidth="max-w-[1180px]">
        {toast && (
          <div className={`rounded-2xl border p-4 text-sm font-semibold shadow-sm ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
            {toast.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Attendance Limit" value={`${config.attendanceThreshold}%`} icon={<AlertTriangle size={16} />} trend="Current alert threshold" tone="warning" />
          <StatCard title="Marks Minimum" value={`${config.marksThreshold}/100`} icon={<ShieldCheck size={16} />} trend="Internal exam warning floor" />
          <StatCard title="Email Alerts" value={config.emailAlertsEnabled ? 'On' : 'Off'} icon={<Bell size={16} />} trend="Automated risk notification" tone={config.emailAlertsEnabled ? 'success' : 'neutral'} />
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="glass-card lg:col-span-2 space-y-8">
            <SectionHeader title="Predictive Thresholds" subtitle="Tune the signals used for risk flags, logs, and notification triggers." />
            {loading ? (
              <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />)}</div>
            ) : (
              <>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-900">Attendance Alert Limit</label>
                    <Badge tone="warning">{config.attendanceThreshold}%</Badge>
                  </div>
                  <input type="range" min="50" max="90" value={config.attendanceThreshold} onChange={(e) => setConfig({ ...config, attendanceThreshold: parseInt(e.target.value) })} className="mt-5 w-full accent-brand-500" />
                  <p className="mt-2 text-xs font-medium text-slate-500">Students below this attendance percentage are flagged for intervention.</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-900">Internal Exam Minimum</label>
                    <Badge>{config.marksThreshold}/100</Badge>
                  </div>
                  <input type="range" min="30" max="60" value={config.marksThreshold} onChange={(e) => setConfig({ ...config, marksThreshold: parseInt(e.target.value) })} className="mt-5 w-full accent-brand-500" />
                  <p className="mt-2 text-xs font-medium text-slate-500">Scores beneath this mark are routed into remedial alert workflows.</p>
                </div>

                <div className="flex items-center justify-between gap-6 rounded-2xl border border-slate-100 bg-white p-5">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-brand-100 p-3 text-brand-600"><Mail size={18} /></div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Automated Email Alerts</h3>
                      <p className="mt-1 text-xs font-medium text-slate-500">Send warnings when student metrics cross configured risk limits.</p>
                    </div>
                  </div>
                  <Toggle checked={config.emailAlertsEnabled} onClick={() => setConfig({ ...config, emailAlertsEnabled: !config.emailAlertsEnabled })} />
                </div>
              </>
            )}
          </div>

          <div className="space-y-8">
            <div className="glass-card">
              <SectionHeader title="Language" subtitle="Stored locally for future interface and AI report preferences." />
              <div className="mt-5 grid grid-cols-2 gap-3">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setLanguage(lang.code);
                      localStorage.setItem('preferredLanguage', lang.code);
                      showToast('success', `Language preference set to ${lang.label}.`);
                    }}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${language === lang.code ? 'border-brand-200 bg-brand-100 text-brand-600' : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-white'}`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card bg-brand-100 border-brand-200">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white p-3 text-brand-600"><SettingsIcon size={18} /></div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Configuration Audit</h3>
                  <p className="mt-1 text-xs font-medium text-slate-600">Saving changes records an admin audit event.</p>
                </div>
              </div>
              <PrimaryButton type="submit" disabled={saving || loading} className="mt-6 w-full">
                {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                {saving ? 'Saving...' : 'Apply Settings'}
              </PrimaryButton>
            </div>
          </div>
        </form>
      </PageShell>
    </div>
  );
};

export default Settings;
