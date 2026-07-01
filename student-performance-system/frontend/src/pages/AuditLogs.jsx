import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../context/AuthContext';
import Header from '../components/Header';
import { Badge, EmptyState, PageShell, SearchField, SelectField, StatCard, TableCard, Toolbar } from '../components/AdminUI';
import { Clock, FileClock, Filter, Search, ShieldCheck, UserRound } from 'lucide-react';

const actionTone = (action) => {
  if (action?.includes('DELETE')) return 'danger';
  if (action?.includes('UPDATE') || action?.includes('SETTINGS')) return 'warning';
  if (action?.includes('CREATE') || action?.includes('EMAIL')) return 'success';
  return 'neutral';
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await api.get('/system/logs');
        if (res.data?.success) setLogs(res.data.data || []);
      } catch (err) {
        console.error('Logs fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return logs.filter((log) => {
      const details = log.details || '';
      const by = log.performedBy || '';
      const matchesSearch = details.toLowerCase().includes(q) || by.toLowerCase().includes(q) || log.action?.toLowerCase().includes(q);
      const matchesAction = filterAction === 'ALL' || log.action === filterAction;
      return matchesSearch && matchesAction;
    });
  }, [filterAction, logs, searchTerm]);

  const uniqueActions = ['ALL', ...new Set(logs.map((l) => l.action).filter(Boolean))];
  const admins = new Set(logs.map((l) => l.performedBy).filter(Boolean)).size;
  const destructive = logs.filter((l) => l.action?.includes('DELETE')).length;

  const getInitials = (name) => {
    if (!name) return 'SY';
    const parts = name.split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 text-slate-900">
      <Header title="Logs" />
      <PageShell>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Audit Events" value={logs.length} icon={<FileClock size={16} />} trend="Complete system activity trail" />
          <StatCard title="Administrators" value={admins} icon={<UserRound size={16} />} trend="Users represented in logs" tone="brand" />
          <StatCard title="Destructive Actions" value={destructive} icon={<ShieldCheck size={16} />} trend="Delete events requiring review" tone={destructive ? 'danger' : 'success'} />
        </div>

        <Toolbar>
          <SearchField value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} icon={<Search size={18} />} placeholder="Search logs by details, action, or administrator" />
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <SelectField value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
              {uniqueActions.map((action) => <option key={action} value={action}>{action.replaceAll('_', ' ')}</option>)}
            </SelectField>
          </div>
        </Toolbar>

        <TableCard>
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(7)].map((_, i) => <div key={i} className="h-14 rounded-2xl bg-slate-100 animate-pulse" />)}</div>
          ) : filteredLogs.length === 0 ? (
            <EmptyState icon={<FileClock size={22} />} title="No audit records found" description="Try a different search term or action filter." />
          ) : (
            <table>
              <thead>
                <tr>
                  <th className="px-6 pt-5">Action</th>
                  <th className="px-6 pt-5">Details</th>
                  <th className="px-6 pt-5">Performed By</th>
                  <th className="px-6 pt-5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 whitespace-nowrap"><Badge tone={actionTone(log.action)}>{log.action?.replaceAll('_', ' ') || 'SYSTEM'}</Badge></td>
                    <td className="px-6 max-w-xl"><p className="text-sm font-medium leading-6 text-slate-700">{log.details}</p></td>
                    <td className="px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">{getInitials(log.performedBy)}</div>
                        <span className="text-sm font-semibold text-slate-700">{log.performedBy}</span>
                      </div>
                    </td>
                    <td className="px-6 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500"><Clock size={13} />{new Date(log.timestamp).toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TableCard>
      </PageShell>
    </div>
  );
};

export default AuditLogs;
