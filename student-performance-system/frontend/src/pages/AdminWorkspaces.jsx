import React from 'react';
import Header from '../components/Header';
import { Badge, IconButton, PageShell, PrimaryButton, SectionHeader, StatCard, TableCard, Toolbar } from '../components/AdminUI';
import { CalendarDays, CheckSquare, ChevronRight, Clock3, MessageSquare, Plus, Search, Users, Briefcase, Target, Send } from 'lucide-react';

const projectRows = [
  ['Prediction Model Review', 'Analytics', 'In progress', 'Jul 8'],
  ['Faculty Data Cleanup', 'Operations', 'Planned', 'Jul 12'],
  ['Risk Alert Workflow', 'Student Success', 'Review', 'Jul 15']
];

const taskRows = [
  ['Review flagged students', 'High', 'Today'],
  ['Verify semester backlog data', 'Medium', 'Tomorrow'],
  ['Prepare intervention notes', 'Medium', 'Friday'],
  ['Audit new faculty accounts', 'Low', 'Next week']
];

const messages = [
  ['Academic Office', 'Monthly performance review deck is ready for validation.', '12 min ago'],
  ['Faculty Coordinator', 'Three students were marked for intervention follow-up.', '1 hr ago'],
  ['System Alerts', 'Settings were updated and recorded in the audit log.', 'Yesterday']
];

const events = [
  ['Risk review meeting', '10:30 AM', 'Today'],
  ['Faculty onboarding', '2:00 PM', 'Tomorrow'],
  ['Semester analytics check-in', '11:00 AM', 'Jul 5'],
  ['Remedial planning window', 'All day', 'Jul 8']
];

const teamRows = [
  ['Admin Operations', 'System governance', 4],
  ['Faculty Mentors', 'Student intervention', 12],
  ['Academic Analytics', 'Insights and reporting', 3]
];

const toneFor = (value) => {
  if (['High', 'Review'].includes(value)) return 'danger';
  if (['Medium', 'In progress', 'Planned'].includes(value)) return 'warning';
  if (['Low'].includes(value)) return 'neutral';
  return 'brand';
};

const WorkspaceTable = ({ columns, rows }) => (
  <TableCard>
    <table>
      <thead>
        <tr>{columns.map((column) => <th key={column} className="px-6 pt-5">{column}</th>)}<th className="px-6 pt-5 text-right">Open</th></tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row[0]} className="hover:bg-slate-50 transition-colors">
            {row.map((cell, index) => (
              <td key={`${row[0]}-${index}`} className="px-6">
                {index === 0 ? <span className="font-semibold">{cell}</span> : index === row.length - 2 ? <Badge tone={toneFor(cell)}>{cell}</Badge> : cell}
              </td>
            ))}
            <td className="px-6 text-right"><IconButton><ChevronRight size={16} /></IconButton></td>
          </tr>
        ))}
      </tbody>
    </table>
  </TableCard>
);

const WorkspacePage = ({ title, subtitle, stats, children, actionLabel }) => (
  <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 text-slate-900">
    <Header title={title} />
    <PageShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader title={title} subtitle={subtitle} />
        <PrimaryButton><Plus size={16} /> {actionLabel}</PrimaryButton>
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

export const AdminProjects = () => (
  <WorkspacePage
    title="Projects"
    subtitle="Operational initiatives that connect analytics, faculty workflows, and student success actions."
    actionLabel="New Project"
    stats={[
      <StatCard key="1" title="Active Projects" value="3" icon={<Briefcase size={16} />} trend="Across academic operations" />,
      <StatCard key="2" title="Milestones" value="9" icon={<Target size={16} />} trend="Planned for this cycle" tone="brand" />,
      <StatCard key="3" title="Due Soon" value="2" icon={<Clock3 size={16} />} trend="Needs review this week" tone="warning" />
    ]}
  >
    <WorkspaceTable columns={['Project', 'Owner', 'Status', 'Due']} rows={projectRows} />
  </WorkspacePage>
);

export const AdminTasks = () => (
  <WorkspacePage
    title="Tasks"
    subtitle="A focused work queue for intervention, data quality, and administrative follow-up."
    actionLabel="Add Task"
    stats={[
      <StatCard key="1" title="Open Tasks" value="4" icon={<CheckSquare size={16} />} trend="Visible queue" />,
      <StatCard key="2" title="High Priority" value="1" icon={<Target size={16} />} trend="Review today" tone="danger" />,
      <StatCard key="3" title="Completed" value="18" icon={<CheckSquare size={16} />} trend="This month" tone="success" />
    ]}
  >
    <WorkspaceTable columns={['Task', 'Priority', 'Due']} rows={taskRows} />
  </WorkspacePage>
);

export const AdminMessages = () => (
  <WorkspacePage
    title="Messages"
    subtitle="Administrative updates, faculty coordination, and automated system notices."
    actionLabel="Compose"
    stats={[
      <StatCard key="1" title="Inbox" value="24" icon={<MessageSquare size={16} />} trend="Across admin channels" />,
      <StatCard key="2" title="Unread" value="3" icon={<Send size={16} />} trend="Needs attention" tone="warning" />,
      <StatCard key="3" title="System Notices" value="8" icon={<Target size={16} />} trend="Last seven days" tone="brand" />
    ]}
  >
    <div className="glass-card p-0 overflow-hidden">
      {messages.map(([sender, message, time]) => (
        <div key={sender} className="flex flex-col gap-2 border-b border-slate-100 p-6 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-slate-900">{sender}</p>
            <p className="mt-1 text-sm text-slate-500">{message}</p>
          </div>
          <Badge>{time}</Badge>
        </div>
      ))}
    </div>
  </WorkspacePage>
);

export const AdminCalendar = () => (
  <WorkspacePage
    title="Calendar"
    subtitle="Key academic operations, review sessions, and intervention milestones."
    actionLabel="Add Event"
    stats={[
      <StatCard key="1" title="Events" value="4" icon={<CalendarDays size={16} />} trend="Upcoming schedule" />,
      <StatCard key="2" title="Today" value="1" icon={<Clock3 size={16} />} trend="Requires attendance" tone="brand" />,
      <StatCard key="3" title="Planning Windows" value="2" icon={<Target size={16} />} trend="This month" tone="warning" />
    ]}
  >
    <WorkspaceTable columns={['Event', 'Time', 'Date']} rows={events} />
  </WorkspacePage>
);

export const AdminTeam = () => (
  <WorkspacePage
    title="Team"
    subtitle="A compact view of operational groups and ownership areas across the platform."
    actionLabel="Add Group"
    stats={[
      <StatCard key="1" title="Groups" value="3" icon={<Users size={16} />} trend="Active ownership areas" />,
      <StatCard key="2" title="Members" value="19" icon={<Users size={16} />} trend="Across listed teams" tone="brand" />,
      <StatCard key="3" title="Coverage" value="100%" icon={<Target size={16} />} trend="Core workflows assigned" tone="success" />
    ]}
  >
    <WorkspaceTable columns={['Group', 'Ownership', 'Members']} rows={teamRows} />
  </WorkspacePage>
);
