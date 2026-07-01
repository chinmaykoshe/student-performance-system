import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { Badge, IconButton, PageShell, PrimaryButton, SectionHeader, StatCard, TableCard, Toolbar, Modal, SecondaryButton } from '../components/AdminUI';
import { CalendarDays, CheckSquare, ChevronRight, Clock3, MessageSquare, Plus, Search, Users, Briefcase, Target, Send, Save, Trash2 } from 'lucide-react';
import { workspaceApi } from '../services/workspaceApi';

const toneFor = (value) => {
  if (['High', 'Review', 'Fail'].includes(value)) return 'danger';
  if (['Medium', 'In progress', 'Planned'].includes(value)) return 'warning';
  if (['Low'].includes(value)) return 'neutral';
  return 'brand';
};

const WorkspaceTable = ({ columns, rows, onDelete }) => (
  <TableCard>
    <table>
      <thead>
        <tr>{columns.map((column) => <th key={column} className="px-6 pt-5">{column}</th>)}<th className="px-6 pt-5 text-right">Actions</th></tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="hover:bg-slate-50 transition-colors">
            {row.data.map((cell, index) => (
              <td key={`${row.id}-${index}`} className="px-6 py-4">
                {index === 0 ? <span className="font-semibold">{cell}</span> : (typeof cell === 'string' && toneFor(cell) !== 'brand' && ['High', 'Medium', 'Low', 'In progress', 'Planned', 'Review'].includes(cell)) ? <Badge tone={toneFor(cell)}>{cell}</Badge> : cell}
              </td>
            ))}
            <td className="px-6 py-4 text-right flex justify-end gap-2">
              <IconButton onClick={() => alert('Item details opened (Functionality to edit coming soon)')}><ChevronRight size={16} /></IconButton>
              {onDelete && <IconButton onClick={() => onDelete(row.id)} className="text-rose-500 hover:text-rose-600"><Trash2 size={16} /></IconButton>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </TableCard>
);

const WorkspacePage = ({ title, subtitle, stats, children, actionLabel, onAction }) => (
  <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 text-slate-900">
    <Header title={title} />
    <PageShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader title={title} subtitle={subtitle} />
        <PrimaryButton onClick={onAction}><Plus size={16} /> {actionLabel}</PrimaryButton>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{stats}</div>
      <Toolbar>
        <div className="relative w-full lg:max-w-md">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="glass-input w-full rounded-full pl-11 py-3" placeholder={`Search ${title.toLowerCase()}`} />
        </div>
      </Toolbar>
      {children}
    </PageShell>
  </div>
);

// Generic Modal Form Builder
const FormModal = ({ title, fields, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      alert('Error saving record: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={title} onClose={onCancel}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(f => (
          <label key={f.name} className="block text-sm font-medium text-slate-700">
            {f.label}
            {f.type === 'select' ? (
              <select className="mt-1 glass-input w-full bg-white" required onChange={(e) => setFormData({...formData, [f.name]: e.target.value})}>
                <option value="">Select...</option>
                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input type={f.type || 'text'} className="mt-1 glass-input w-full" required onChange={(e) => setFormData({...formData, [f.name]: e.target.value})} />
            )}
          </label>
        ))}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <SecondaryButton type="button" onClick={onCancel}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" disabled={saving}><Save size={16} /> Save</PrimaryButton>
        </div>
      </form>
    </Modal>
  );
};

export const AdminProjects = () => {
  const [data, setData] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const fetch = async () => { try { const res = await workspaceApi.projects.getAll(); setData(res.data?.data || []); } catch (e) { console.error(e); } };
  useEffect(() => { fetch(); }, []);

  const handleCreate = async (formData) => { await workspaceApi.projects.create(formData); setModalOpen(false); fetch(); };
  const handleDelete = async (id) => { if (window.confirm('Delete this project?')) { try { await workspaceApi.projects.delete(id); fetch(); } catch (e) { alert(e.message); } } };

  return (
    <WorkspacePage title="Projects" subtitle="Operational initiatives" actionLabel="New Project" onAction={() => setModalOpen(true)}
      stats={[ <StatCard key="1" title="Active Projects" value={data.length} icon={<Briefcase size={16} />} trend="Across academic operations" /> ]}>
      <WorkspaceTable columns={['Project', 'Owner', 'Status', 'Due']} rows={data.map(d => ({ id: d._id, data: [d.title, d.owner, d.status, d.dueDate] }))} onDelete={handleDelete} />
      {modalOpen && <FormModal title="New Project" fields={[
        { name: 'title', label: 'Project Title' },
        { name: 'owner', label: 'Owner' },
        { name: 'status', label: 'Status', type: 'select', options: ['Planned', 'In progress', 'Review'] },
        { name: 'dueDate', label: 'Due Date', type: 'date' }
      ]} onSubmit={handleCreate} onCancel={() => setModalOpen(false)} />}
    </WorkspacePage>
  );
};

export const AdminTasks = () => {
  const [data, setData] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const fetch = async () => { try { const res = await workspaceApi.tasks.getAll(); setData(res.data?.data || []); } catch(e){ console.error(e); } };
  useEffect(() => { fetch(); }, []);

  const handleCreate = async (formData) => { await workspaceApi.tasks.create(formData); setModalOpen(false); fetch(); };
  const handleDelete = async (id) => { if (window.confirm('Delete this task?')) { try { await workspaceApi.tasks.delete(id); fetch(); } catch (e) { alert(e.message); } } };

  return (
    <WorkspacePage title="Tasks" subtitle="A focused work queue" actionLabel="Add Task" onAction={() => setModalOpen(true)}
      stats={[ <StatCard key="1" title="Open Tasks" value={data.length} icon={<CheckSquare size={16} />} trend="Visible queue" /> ]}>
      <WorkspaceTable columns={['Task', 'Priority', 'Due']} rows={data.map(d => ({ id: d._id, data: [d.title, d.priority, d.due] }))} onDelete={handleDelete} />
      {modalOpen && <FormModal title="Add Task" fields={[
        { name: 'title', label: 'Task Title' },
        { name: 'priority', label: 'Priority', type: 'select', options: ['High', 'Medium', 'Low'] },
        { name: 'due', label: 'Due Date', type: 'date' }
      ]} onSubmit={handleCreate} onCancel={() => setModalOpen(false)} />}
    </WorkspacePage>
  );
};

export const AdminMessages = () => {
  const [data, setData] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const fetch = async () => { try { const res = await workspaceApi.messages.getAll(); setData(res.data?.data || []); } catch(e){ console.error(e); } };
  useEffect(() => { fetch(); }, []);

  const handleCreate = async (formData) => { 
    await workspaceApi.messages.create({ ...formData, timeString: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }); 
    setModalOpen(false); fetch(); 
  };
  const handleDelete = async (id) => { if (window.confirm('Delete this message?')) { try { await workspaceApi.messages.delete(id); fetch(); } catch(e) { alert(e.message); } } };

  return (
    <WorkspacePage title="Messages" subtitle="Administrative updates" actionLabel="Compose" onAction={() => setModalOpen(true)}
      stats={[ <StatCard key="1" title="Inbox" value={data.length} icon={<MessageSquare size={16} />} trend="Across admin channels" /> ]}>
      <div className="glass-card p-0 overflow-hidden">
        {data.length === 0 ? <div className="p-6 text-slate-500">No messages found.</div> : data.map((d) => (
          <div key={d._id} className="flex flex-col gap-2 border-b border-slate-100 p-6 last:border-b-0 sm:flex-row sm:items-center sm:justify-between group">
            <div>
              <p className="font-semibold text-slate-900">{d.sender}</p>
              <p className="mt-1 text-sm text-slate-500">{d.content}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge>{d.timeString}</Badge>
              <IconButton onClick={() => handleDelete(d._id)} className="text-rose-500 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></IconButton>
            </div>
          </div>
        ))}
      </div>
      {modalOpen && <FormModal title="Compose Message" fields={[
        { name: 'sender', label: 'Sender Name' },
        { name: 'content', label: 'Message Content' }
      ]} onSubmit={handleCreate} onCancel={() => setModalOpen(false)} />}
    </WorkspacePage>
  );
};

export const AdminCalendar = () => {
  const [data, setData] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const fetch = async () => { try { const res = await workspaceApi.events.getAll(); setData(res.data?.data || []); } catch(e){ console.error(e); } };
  useEffect(() => { fetch(); }, []);

  const handleCreate = async (formData) => { await workspaceApi.events.create(formData); setModalOpen(false); fetch(); };
  const handleDelete = async (id) => { if (window.confirm('Delete this event?')) { try { await workspaceApi.events.delete(id); fetch(); } catch(e){ alert(e.message); } } };

  return (
    <WorkspacePage title="Calendar" subtitle="Key academic operations" actionLabel="Add Event" onAction={() => setModalOpen(true)}
      stats={[ <StatCard key="1" title="Events" value={data.length} icon={<CalendarDays size={16} />} trend="Upcoming schedule" /> ]}>
      <WorkspaceTable columns={['Event', 'Time', 'Date']} rows={data.map(d => ({ id: d._id, data: [d.title, d.time, d.date] }))} onDelete={handleDelete} />
      {modalOpen && <FormModal title="Add Event" fields={[
        { name: 'title', label: 'Event Title' },
        { name: 'time', label: 'Time (e.g. 10:30 AM)' },
        { name: 'date', label: 'Date', type: 'date' }
      ]} onSubmit={handleCreate} onCancel={() => setModalOpen(false)} />}
    </WorkspacePage>
  );
};

export const AdminTeam = () => {
  const [data, setData] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const fetch = async () => { try { const res = await workspaceApi.teams.getAll(); setData(res.data?.data || []); } catch(e){ console.error(e); } };
  useEffect(() => { fetch(); }, []);

  const handleCreate = async (formData) => { await workspaceApi.teams.create(formData); setModalOpen(false); fetch(); };
  const handleDelete = async (id) => { if (window.confirm('Delete this team?')) { try { await workspaceApi.teams.delete(id); fetch(); } catch(e){ alert(e.message); } } };

  return (
    <WorkspacePage title="Team" subtitle="A compact view of operational groups" actionLabel="Add Group" onAction={() => setModalOpen(true)}
      stats={[ <StatCard key="1" title="Groups" value={data.length} icon={<Users size={16} />} trend="Active ownership areas" /> ]}>
      <WorkspaceTable columns={['Group', 'Ownership', 'Members']} rows={data.map(d => ({ id: d._id, data: [d.name, d.ownership, d.membersCount] }))} onDelete={handleDelete} />
      {modalOpen && <FormModal title="Add Group" fields={[
        { name: 'name', label: 'Group Name' },
        { name: 'ownership', label: 'Ownership Area' },
        { name: 'membersCount', label: 'Number of Members', type: 'number' }
      ]} onSubmit={handleCreate} onCancel={() => setModalOpen(false)} />}
    </WorkspacePage>
  );
};
