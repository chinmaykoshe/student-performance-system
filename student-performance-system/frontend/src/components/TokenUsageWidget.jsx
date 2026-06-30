import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../context/AuthContext';
import { Zap, AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * TokenUsageWidget
 * ─────────────────────────────────────────────────────────────
 * Polls /api/ai/usage every 20 s and shows:
 *  • Session bar  – tokens used THIS browser session
 *  • Daily bar    – tokens used TODAY by this user
 *
 * If a parent AI call returned fresh usage, pass it via the
 * `liveUsage` prop to skip the next poll and update instantly.
 *
 * Props:
 *   liveUsage  – usage object returned directly from an AI endpoint
 *                (optional, used to refresh immediately after a call)
 * ─────────────────────────────────────────────────────────────
 */
const TokenUsageWidget = ({ liveUsage }) => {
  const [usage, setUsage]       = useState(null);
  const [loading, setLoading]   = useState(true);

  const fetchUsage = useCallback(async () => {
    try {
      const res = await api.get('/ai/usage');
      if (res.data?.success) setUsage(res.data.usage);
    } catch (_) {
      // silently ignore — widget is non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  // Honour live usage pushed from parent immediately
  useEffect(() => {
    if (liveUsage) {
      setUsage(liveUsage);
      setLoading(false);
    }
  }, [liveUsage]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  if (loading) {
    return (
      <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 animate-pulse">
        <RefreshCw size={11} className="animate-spin" />
        <span>Loading AI usage…</span>
      </div>
    );
  }

  if (!usage) return null;

  const { session, daily } = usage;

  // Colour coding
  const barColour = (pct) => {
    if (pct >= 90) return 'bg-rose-500';
    if (pct >= 65) return 'bg-amber-500';
    return 'bg-brand-500';
  };
  const textColour = (pct) => {
    if (pct >= 90) return 'text-rose-500';
    if (pct >= 65) return 'text-amber-500';
    return 'text-brand-500';
  };

  const warn = session.pct >= 80 || daily.pct >= 80;

  return (
    <div className="w-full rounded-2xl border border-white/5 bg-slate-900/40 dark:bg-slate-800/30 backdrop-blur-sm p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <Zap size={13} className={warn ? 'text-amber-400' : 'text-brand-400'} />
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
            Gemini Token Usage
          </span>
        </div>
        {warn && (
          <div className="flex items-center space-x-1 text-amber-400">
            <AlertTriangle size={11} />
            <span className="text-[10px] font-bold">Limit approaching</span>
          </div>
        )}
      </div>

      {/* Session bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-semibold text-slate-400">This Session</span>
          <span className={`text-[10px] font-bold ${textColour(session.pct)}`}>
            {session.used.toLocaleString()} / {session.limit.toLocaleString()}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-700/60 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColour(session.pct)}`}
            style={{ width: `${session.pct}%` }}
          />
        </div>
        <div className="text-right text-[9px] text-slate-500">{session.pct}% used</div>
      </div>

      {/* Daily bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-semibold text-slate-400">Today (Daily)</span>
          <span className={`text-[10px] font-bold ${textColour(daily.pct)}`}>
            {daily.used.toLocaleString()} / {daily.limit.toLocaleString()}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-700/60 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColour(daily.pct)}`}
            style={{ width: `${daily.pct}%` }}
          />
        </div>
        <div className="text-right text-[9px] text-slate-500">{daily.pct}% used · resets midnight UTC</div>
      </div>

      {/* Limit-hit message */}
      {(session.pct >= 100 || daily.pct >= 100) && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-[10px] text-rose-400 font-semibold leading-relaxed">
          {session.pct >= 100
            ? 'Session limit reached. Reload the page to start a fresh session.'
            : 'Daily limit reached. AI features resume at midnight UTC.'}
        </div>
      )}
    </div>
  );
};

export default TokenUsageWidget;
