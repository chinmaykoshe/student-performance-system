import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import { FileClock, User, Clock, Search, Filter } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/system/logs');
      if (res.data && res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error('Logs fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (action) => {
    const base = "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ";
    switch (action) {
      case 'STUDENT_CREATE':
        return base + "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
      case 'STUDENT_UPDATE':
        return base + "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
      case 'STUDENT_DELETE':
        return base + "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20";
      case 'SETTINGS_UPDATE':
        return base + "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20";
      case 'EMAIL_ALERT':
        return base + "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20";
      default:
        return base + "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20";
    }
  };

  // Filter and search
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.performedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  const uniqueActions = ['ALL', ...new Set(logs.map(l => l.action))];

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <Header title="Administrative Audit Activity Logs" />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Filter Widget */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full pl-10 pr-4 py-3 rounded-2xl text-xs focus:ring-1"
              placeholder="Search logs by keyword or administrator email..."
            />
          </div>

          {/* Action Filter */}
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-slate-400 shrink-0" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="glass-input py-3 pl-4 pr-10 rounded-2xl text-xs focus:ring-1 cursor-pointer bg-transparent"
            >
              {uniqueActions.map(action => (
                <option key={action} value={action} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">
                  {action}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Audit Logs Table */}
        <GlassCard className="overflow-hidden p-0 rounded-3xl border border-slate-200/50 dark:border-slate-800/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/55 dark:bg-slate-800/30 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-150 dark:border-slate-800/40">
                  <th className="px-6 py-4.5">Event Action</th>
                  <th className="px-6 py-4.5">Details</th>
                  <th className="px-6 py-4.5">Performed By</th>
                  <th className="px-6 py-4.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4.5"><div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg"></div></td>
                      <td className="px-6 py-4.5"><div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg"></div></td>
                      <td className="px-6 py-4.5"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg"></div></td>
                      <td className="px-6 py-4.5"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg"></div></td>
                    </tr>
                  ))
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-slate-450 italic">
                      No system audit records found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-100/30 dark:hover:bg-slate-800/10 transition duration-150">
                      <td className="px-6 py-4.5 shrink-0 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="px-6 py-4.5 text-slate-700 dark:text-slate-350 font-medium">
                        {log.details}
                      </td>
                      <td className="px-6 py-4.5 text-slate-500 dark:text-slate-400 whitespace-nowrap font-semibold flex items-center space-x-1.5 mt-0.5">
                        <User size={12} className="text-slate-400" />
                        <span>{log.performedBy}</span>
                      </td>
                      <td className="px-6 py-4.5 text-slate-450 whitespace-nowrap font-medium">
                        <span className="flex items-center space-x-1.5">
                          <Clock size={12} />
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

      </main>
    </div>
  );
};

export default AuditLogs;
