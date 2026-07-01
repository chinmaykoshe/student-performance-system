import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../context/AuthContext';
import Header from '../components/Header';
import { Badge, EmptyState, IconButton, Modal, PageShell, PrimaryButton, SearchField, SecondaryButton, StatCard, TableCard, Toolbar } from '../components/AdminUI';
import { BookOpen, ChevronLeft, ChevronRight, Mail, Plus, Save, Search, ShieldCheck, UserCheck, Users, X } from 'lucide-react';

const AdminFaculty = () => {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'faculty',
    department: 'Computer Applications (MCA)'
  });

  const fetchFaculties = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/faculty');
      if (res.data?.success) setFaculties(res.data.data || []);
    } catch (err) {
      console.error('Error fetching faculty profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFaculties(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return faculties.filter((f) => f.name?.toLowerCase().includes(q) || f.email?.toLowerCase().includes(q) || f.department?.toLowerCase().includes(q));
  }, [faculties, search]);

  const pageSize = 8;
  const pageCount = Math.ceil(filtered.length / pageSize) || 1;
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const departments = new Set(faculties.map((f) => f.department)).size;

  const getInitials = (name) => {
    if (!name) return 'FC';
    const parts = name.split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.post('/auth/register', formData);
      if (res.data?.success) {
        await fetchFaculties();
        setModalOpen(false);
      }
    } catch (err) {
      alert('Error creating faculty user: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (id) => {
    if (window.confirm("Are you sure you want to revoke this faculty member's access?")) {
      try {
        const res = await api.delete(`/auth/faculty/${id}`);
        if (res.data?.success) {
          fetchFaculties();
        }
      } catch (err) {
        alert('Error revoking faculty access: ' + (err.response?.data?.error || err.message));
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 text-slate-900">
      <Header title="Faculty" />
      <PageShell>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard title="Active Faculty" value={faculties.length} icon={<UserCheck size={16} />} trend="Accounts with portal access" />
          <StatCard title="Departments" value={departments || 0} icon={<BookOpen size={16} />} trend="Academic ownership coverage" tone="brand" />
        </div>

        <Toolbar>
          <SearchField value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} icon={<Search size={18} />} placeholder="Search faculty by name, email, or department" />
          <PrimaryButton onClick={() => setModalOpen(true)}><Plus size={17} /> Register Faculty</PrimaryButton>
        </Toolbar>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-3">
            <TableCard>
              {loading ? (
                <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-14 rounded-2xl bg-slate-100 animate-pulse" />)}</div>
              ) : visible.length === 0 ? (
                <EmptyState icon={<Users size={22} />} title="No faculty members found" description="Add a faculty account or refine your search." action={<PrimaryButton onClick={() => setModalOpen(true)}><Plus size={16} /> Register Faculty</PrimaryButton>} />
              ) : (
                <table>
                <thead>
                  <tr>
                    <th className="px-6 pt-5">Faculty Member</th>
                    <th className="px-6 pt-5">Department</th>
                    <th className="px-6 pt-5">Contact</th>
                    <th className="px-6 pt-5">Access</th>
                    <th className="px-6 pt-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((fac) => (
                    <tr key={fac._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">{getInitials(fac.name)}</div>
                          <div>
                            <p className="font-semibold text-slate-900">{fac.name}</p>
                            <p className="text-xs font-medium text-slate-500">FAC-{fac._id?.toString().slice(-4).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 font-medium">{fac.department}</td>
                      <td className="px-6"><span className="inline-flex items-center gap-2 text-sm text-slate-600"><Mail size={14} />{fac.email}</span></td>
                      <td className="px-6"><Badge tone="success"><UserCheck size={12} /> Active</Badge></td>
                      <td className="px-6 text-right">
                        <IconButton title="Revoke access" onClick={() => handleRevoke(fac._id)}>
                          <X size={15} />
                        </IconButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              )}
            </TableCard>
          </div>

          <div className="glass-card xl:col-span-1 space-y-5">
            <h2 className="text-base font-semibold text-slate-900">Faculty Coverage</h2>
            {['Computer Applications (MCA)', 'Computer Science (MSc)', 'Information Technology (MSc)'].map((dept) => {
              const count = faculties.filter((f) => f.department === dept).length;
              return (
                <div key={dept} className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-800">{dept}</p>
                    <Badge tone={count ? 'brand' : 'neutral'}>{count}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1">
          <span className="text-xs font-semibold text-slate-500">Showing {visible.length} of {filtered.length} faculty members</span>
          <div className="flex items-center gap-2">
            <IconButton disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></IconButton>
            <span className="text-xs font-semibold text-slate-600">Page {page} of {pageCount}</span>
            <IconButton disabled={page >= pageCount} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></IconButton>
          </div>
        </div>
      </PageShell>

      {modalOpen && (
        <Modal title="Register Faculty Account" width="max-w-xl" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              ['name', 'Full Name', 'text'],
              ['email', 'Email Address', 'email'],
              ['password', 'Portal Password', 'password']
            ].map(([name, label, type]) => (
              <label key={name} className="space-y-2 text-xs font-semibold text-slate-500">
                <span>{label}</span>
                <input type={type} name={name} value={formData[name]} onChange={(e) => setFormData((prev) => ({ ...prev, [name]: e.target.value }))} className="glass-input w-full" required />
              </label>
            ))}
            <label className="space-y-2 text-xs font-semibold text-slate-500">
              <span>Assigned Department</span>
              <select name="department" value={formData.department} onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))} className="glass-input w-full bg-white">
                <option value="Computer Applications (MCA)">Computer Applications (MCA)</option>
                <option value="Computer Science (MSc)">Computer Science (MSc)</option>
                <option value="Information Technology (MSc)">Information Technology (MSc)</option>
              </select>
            </label>
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <SecondaryButton type="button" onClick={() => setModalOpen(false)}>Cancel</SecondaryButton>
              <PrimaryButton type="submit" disabled={saving}><Save size={16} /> {saving ? 'Creating...' : 'Create Account'}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminFaculty;
