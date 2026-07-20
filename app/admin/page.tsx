"use client";
import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Users, BookOpen, Calendar, MessageSquare, ClipboardList,
  Award, Star, Bell, HelpCircle, BarChart2, DollarSign, FileText, Bot,
  LogOut, Search, Plus, Edit, Trash2, CheckCircle, XCircle, Eye, Filter,
  TrendingUp, TrendingDown, RefreshCw, Download, Upload, Send, ChevronDown,
  ChevronRight, ChevronLeft, AlertCircle, User, Shield, Settings, X,
  Loader, PieChart as PieChartIcon, Activity, Clock, Globe, Phone, Mail, Building, PlayCircle, FileVideo, FilePlus
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import BackButton from '../../components/BackButton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────
interface AuthUser { userId: number; email: string; role: string; firstName: string; lastName: string; }
interface StatCard { label: string; value: string | number; icon: React.ReactNode; color: string; trend?: string; trendUp?: boolean; }

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, roles: ['ADMIN','FINANCE','TM'] },
  { id: 'users', label: 'User Management', icon: <Users size={18} />, roles: ['ADMIN'] },
  { id: 'trainers', label: 'Trainers', icon: <User size={18} />, roles: ['ADMIN','TM'] },
  { id: 'courses', label: 'Courses', icon: <BookOpen size={18} />, roles: ['ADMIN','TM'] },
  { id: 'calendar', label: 'Training Calendar', icon: <Calendar size={18} />, roles: ['ADMIN','TM','TRAINER'] },
  { id: 'feedback', label: 'Feedback', icon: <MessageSquare size={18} />, roles: ['ADMIN','TM','TRAINER'] },
  { id: 'assessments', label: 'Assessments', icon: <ClipboardList size={18} />, roles: ['ADMIN','TM'] },
  { id: 'certificates', label: 'Certificates', icon: <Award size={18} />, roles: ['ADMIN','TM'] },
  { id: 'manuals', label: 'Manuals', icon: <BookOpen size={18} />, roles: ['ADMIN','TM'] },
  { id: 'testimonials', label: 'Testimonials', icon: <Star size={18} />, roles: ['ADMIN'] },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={18} />, roles: ['ADMIN'] },
  { id: 'enquiries', label: 'Enquiries', icon: <HelpCircle size={18} />, roles: ['ADMIN','TM'] },
  { id: 'approvals', label: 'Pending Approvals', icon: <CheckCircle size={18} />, roles: ['ADMIN','FINANCE','TM'] },
  { id: 'reports', label: 'Reports', icon: <BarChart2 size={18} />, roles: ['ADMIN','FINANCE','TM'] },
  { id: 'payments', label: 'Payments', icon: <DollarSign size={18} />, roles: ['ADMIN','FINANCE'] },
  { id: 'invoices', label: 'Invoices', icon: <FileText size={18} />, roles: ['ADMIN','FINANCE'] },
  { id: 'ai-tools', label: 'AI Tools', icon: <Bot size={18} />, roles: ['ADMIN'] },
  { id: 'elearning', label: 'E-Learning Content', icon: <PlayCircle size={18} />, roles: ['ADMIN'] },
  { id: 'settings', label: 'System Settings', icon: <Settings size={18} />, roles: ['ADMIN'] },
  { id: 'announcements', label: 'Announcements', icon: <Bell size={18} />, roles: ['ADMIN','TM'] },
];

// ─── Subcomponents ───────────────────────────────────────────────────────────

function StatCardItem({ stat }: { stat: StatCard }) {
  return (
    <div className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group`}>
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2.5 rounded-xl ${stat.color}`}>{stat.icon}</div>
        {stat.trend && (
          <span className={`text-xs font-bold flex items-center gap-0.5 px-2 py-1 rounded-full ${stat.trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
            {stat.trendUp ? <TrendingUp size={10}/> : <TrendingDown size={10}/>} {stat.trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-gray-800 mt-1">{stat.value}</p>
      <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mt-1">{stat.label}</p>
    </div>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  const colors: Record<string, string> = {
    green: 'bg-green-100 text-green-700', red: 'bg-red-100 text-red-600',
    orange: 'bg-orange-100 text-orange-600', blue: 'bg-blue-100 text-blue-700',
    gray: 'bg-gray-100 text-gray-500', purple: 'bg-purple-100 text-purple-700'
  };
  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${colors[color] || colors.gray}`}>{text}</span>;
}

function Modal({ title, onClose, children, hasUnsavedChanges = false }: { title: string; onClose: () => void; children: React.ReactNode; hasUnsavedChanges?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <BackButton onClick={onClose} label="Close" hasUnsavedChanges={hasUnsavedChanges} className="bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200" />
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ─── TAB CONTENT COMPONENTS ───────────────────────────────────────────────────

function GlobalSearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token') || '';
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) {
          setResults(data.results);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Search failed', err);
      }
      setLoading(false);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15}/>
      <input 
        id="global-search" 
        type="text" 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search anything..." 
        className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 ring-blue-100 w-56"
      />
      {isOpen && (
        <div className="absolute top-full mt-2 w-80 bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden z-50 right-0 max-h-96 overflow-y-auto">
          {loading && <div className="p-4 text-center text-xs text-gray-400">Searching...</div>}
          {!loading && results.length === 0 && <div className="p-4 text-center text-xs text-gray-400">No results found.</div>}
          {!loading && results.length > 0 && (
            <div className="py-2">
              {results.map((r, i) => (
                <div key={i} className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0" onClick={() => setIsOpen(false)}>
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-bold text-gray-800">{r.Title}</p>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{r.Type}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{r.Subtitle}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DashboardTab({ stats, recentRegs, auditLogs }: any) {
  const statCards: StatCard[] = [
    { label: 'Total Students', value: stats?.TotalStudents ?? '–', icon: <Users size={18} className="text-blue-600"/>, color: 'bg-blue-50', trend: '+12%', trendUp: true },
    { label: 'Active Courses', value: stats?.ActiveCourses ?? '–', icon: <BookOpen size={18} className="text-orange-600"/>, color: 'bg-orange-50' },
    { label: 'Total Registrations', value: stats?.TotalRegistrations ?? '–', icon: <ClipboardList size={18} className="text-green-600"/>, color: 'bg-green-50', trend: '+8%', trendUp: true },
    { label: 'Running Batches', value: stats?.RunningBatches ?? '–', icon: <Activity size={18} className="text-pink-600"/>, color: 'bg-pink-50' },
    { label: 'Completed Batches', value: stats?.CompletedBatches ?? '–', icon: <CheckCircle size={18} className="text-emerald-600"/>, color: 'bg-emerald-50' },
    { label: 'Upcoming Trainings', value: stats?.UpcomingTrainings ?? '–', icon: <Calendar size={18} className="text-indigo-600"/>, color: 'bg-indigo-50' },
    { label: 'Certificates Issued', value: stats?.CertificatesIssued ?? '–', icon: <Award size={18} className="text-purple-600"/>, color: 'bg-purple-50', trend: '+18%', trendUp: true },
    { label: 'Pending Payments', value: stats?.PendingPayments ?? '–', icon: <DollarSign size={18} className="text-red-600"/>, color: 'bg-red-50' },
    { label: 'Total Trainers', value: stats?.TotalTrainers ?? '–', icon: <User size={18} className="text-teal-600"/>, color: 'bg-teal-50' },
  ];

  const chartData = [
    { name: 'Jan', students: 400, revenue: 2400 },
    { name: 'Feb', students: 300, revenue: 1398 },
    { name: 'Mar', students: 200, revenue: 9800 },
    { name: 'Apr', students: 278, revenue: 3908 },
    { name: 'May', students: 189, revenue: 4800 },
    { name: 'Jun', students: 239, revenue: 3800 },
  ];

  const pieData = [
    { name: 'VILT', value: 400 },
    { name: 'CILT', value: 300 },
    { name: 'E-Learning', value: 300 },
  ];
  const COLORS = ['#004098', '#FF8042', '#00C49F'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => <StatCardItem key={i} stat={s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Recent Registrations</h3>
            <span className="text-xs text-gray-400">{recentRegs?.length || 0} records</span>
          </div>
          <div className="divide-y divide-gray-50">
            {(recentRegs || []).slice(0, 6).map((r: any, i: number) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                    {(r.Name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{r.Name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{r.Course || '–'}</p>
                  </div>
                </div>
                <Badge text={r.TrainingMode || 'N/A'} color="blue" />
              </div>
            ))}
            {(!recentRegs || recentRegs.length === 0) && (
              <div className="p-8 text-center text-gray-400 text-sm">No recent registrations</div>
            )}
          </div>
        </div>

        {/* Recent Audit Log */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Shield size={16} className="text-gray-400"/>Audit Log</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {(auditLogs || []).slice(0, 6).map((log: any, i: number) => (
              <div key={i} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50/50 transition-colors">
                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${log.Status === 'SUCCESS' ? 'bg-green-400' : 'bg-red-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700 truncate">{log.Action}</p>
                  <p className="text-xs text-gray-400">{log.UserEmail} · {log.Module}</p>
                </div>
                <span className="text-xs text-gray-300 shrink-0">{new Date(log.CreatedAt).toLocaleTimeString()}</span>
              </div>
            ))}
            {(!auditLogs || auditLogs.length === 0) && (
              <div className="p-8 text-center text-gray-400 text-sm">No audit logs</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', role: 'STUDENT', phone: '', organization: '', country: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const token = localStorage.getItem('auth_token') || '';
      const res = await fetch(`/api/admin/users?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } finally { setLoading(false); }
  }, [search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setMsg('');
    const token = localStorage.getItem('auth_token') || '';
    try {
      const method = editUser ? 'PUT' : 'POST';
      const body = editUser ? { ...form, userId: editUser.UserID } : form;
      const res = await fetch('/api/admin/users', { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      const data = await res.json();
      setMsg(data.message);
      if (data.success) { setShowModal(false); load(); }
    } finally { setSaving(false); }
  };

  const toggleActive = async (u: any) => {
    const token = localStorage.getItem('auth_token') || '';
    await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ userId: u.UserID, isActive: !u.IsActive, isApproved: u.IsApproved, role: u.Role, firstName: u.FirstName, lastName: u.LastName }) });
    load();
  };

  const deleteUser = async (id: number) => {
    if (!confirm('Deactivate this user?')) return;
    const token = localStorage.getItem('auth_token') || '';
    await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  const resendCredentials = async (id: number) => {
    if (!confirm('Are you sure you want to resend credentials? This will generate a new temporary password and force a password change.')) return;
    const token = localStorage.getItem('auth_token') || '';
    const res = await fetch('/api/admin/users/resend-credentials', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId: id })
    });
    const data = await res.json();
    alert(data.message);
  };

  const openCreate = () => { setEditUser(null); setForm({ email: '', firstName: '', lastName: '', role: 'STUDENT', phone: '', organization: '', country: '', password: '' }); setShowModal(true); };
  const openEdit = (u: any) => { setEditUser(u); setForm({ email: u.Email, firstName: u.FirstName, lastName: u.LastName, role: u.Role, phone: u.Phone || '', organization: u.Organization || '', country: u.Country || '', password: '' }); setShowModal(true); };

  const roleColors: Record<string, string> = { ADMIN: 'red', TRAINER: 'green', AFFILIATE: 'purple', STUDENT: 'blue', FINANCE: 'orange', TM: 'teal' };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15}/>
            <input id="user-search" type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 ring-blue-100 w-56"/>
          </div>
          <select id="role-filter" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
            <option value="">All Roles</option>
            {['ADMIN','TRAINER','AFFILIATE','STUDENT','FINANCE','TM'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <button id="create-user-btn" onClick={openCreate} className="flex items-center gap-2 bg-[#004098] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
          <Plus size={16}/> Add User
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader size={24} className="animate-spin mx-auto text-gray-300"/></div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Name','Email','Role','Organization','Status','Actions'].map(h => (
                <th key={h} className="px-5 py-3.5 text-xs font-black text-gray-400 uppercase tracking-widest">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.UserID} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                        {(u.FirstName || '?')[0]}{(u.LastName || '?')[0]}
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{u.FirstName} {u.LastName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{u.Email}</td>
                  <td className="px-5 py-3.5"><Badge text={u.Role} color={roleColors[u.Role] || 'gray'}/></td>
                  <td className="px-5 py-3.5 text-sm text-gray-400">{u.Organization || '–'}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => toggleActive(u)} className={`text-xs font-bold px-2.5 py-1 rounded-full transition-colors ${u.IsActive ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-100 text-red-500 hover:bg-red-200'}`}>
                      {u.IsActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button id={`resend-user-${u.UserID}`} onClick={() => resendCredentials(u.UserID)} className="p-1.5 hover:bg-orange-50 rounded-lg text-orange-500 transition-colors" title="Resend Credentials"><Send size={14}/></button>
                      <button id={`edit-user-${u.UserID}`} onClick={() => openEdit(u)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-colors" title="Edit"><Edit size={14}/></button>
                      <button id={`delete-user-${u.UserID}`} onClick={() => deleteUser(u.UserID)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 transition-colors" title="Delete"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">No users found</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title={editUser ? 'Edit User' : 'Create User'} onClose={() => setShowModal(false)}>
          {msg && <div className={`mb-4 text-sm p-3 rounded-xl ${msg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{msg}</div>}
          <div className="grid grid-cols-2 gap-4">
            {[['First Name','firstName','text'],['Last Name','lastName','text'],['Email','email','email'],['Phone','phone','tel'],['Organization','organization','text'],['Country','country','text']].map(([label, key, type]) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                <input id={`form-${key}`} type={type} value={(form as any)[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100" disabled={editUser && key === 'email'}/>
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Role</label>
              <select id="form-role" value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
                {['ADMIN','TRAINER','AFFILIATE','STUDENT','FINANCE','TM'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {!editUser && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
                <input id="form-password" type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100" placeholder="Min 8 chars, upper, number, special"/>
              </div>
            )}
          </div>
          <div className="mt-5 flex gap-3">
            <button id="save-user-btn" onClick={save} disabled={saving} className="flex-1 bg-[#004098] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {saving && <Loader size={14} className="animate-spin"/>} {editUser ? 'Save Changes' : 'Create User'}
            </button>
            <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CoursesTab() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCourse, setEditCourse] = useState<any>(null);
  const [form, setForm] = useState({ title:'', code:'', description:'', duration:'', feeINR:'', feeUSD:'', mode:'CILT', status:'ACTIVE', category:'', maxParticipants:'20', openDate:'', closeDate:'' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token') || '';
      const res = await fetch('/api/admin/courses', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setCourses(data.courses);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setMsg('');
    const token = localStorage.getItem('auth_token') || '';
    const method = editCourse ? 'PUT' : 'POST';
    const body = editCourse ? { ...form, courseId: editCourse.CourseID } : form;
    const res = await fetch('/api/admin/courses', { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    const data = await res.json();
    setMsg(data.message);
    if (data.success) { setShowModal(false); load(); }
    setSaving(false);
  };

  const deleteCourse = async (id: number) => {
    if (!confirm('Deactivate this course?')) return;
    const token = localStorage.getItem('auth_token') || '';
    await fetch(`/api/admin/courses?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  const openCreate = () => { setEditCourse(null); setForm({ title:'', code:'', description:'', duration:'', feeINR:'', feeUSD:'', mode:'CILT', status:'ACTIVE', category:'', maxParticipants:'20', openDate:'', closeDate:'' }); setShowModal(true); };
  const openEdit = (c: any) => { setEditCourse(c); setForm({ title: c.Title, code: c.Code||'', description: c.Description||'', duration: c.Duration||'', feeINR: String(c.FeeINR||''), feeUSD: String(c.FeeUSD||''), mode: c.Mode||'CILT', status: c.Status||'ACTIVE', category: c.Category||'', maxParticipants: String(c.MaxParticipants||20), openDate: c.OpenDate?.split('T')[0]||'', closeDate: c.CloseDate?.split('T')[0]||'' }); setShowModal(true); };

  const modeColors: Record<string, string> = { CILT:'orange', VILT:'blue', ELEARNING:'green', SITE:'purple' };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h3 className="text-sm text-gray-500">{courses.length} courses in database</h3>
        <button id="create-course-btn" onClick={openCreate} className="flex items-center gap-2 bg-[#004098] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
          <Plus size={16}/> New Course
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <div className="p-12 text-center"><Loader size={24} className="animate-spin mx-auto text-gray-300"/></div> : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Title','Code','Mode','Duration','Fee (INR)','Fee (USD)','Status','Actions'].map(h => (
                <th key={h} className="px-4 py-3.5 text-xs font-black text-gray-400 uppercase tracking-widest">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {courses.map(c => (
                <tr key={c.CourseID} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-gray-800 max-w-[180px] truncate">{c.Title}</p>
                    <p className="text-xs text-gray-400">{c.Category || '–'}</p>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500 font-mono">{c.Code||'–'}</td>
                  <td className="px-4 py-3.5"><Badge text={c.Mode||'–'} color={modeColors[c.Mode]||'gray'}/></td>
                  <td className="px-4 py-3.5 text-sm text-gray-500">{c.Duration||'–'}</td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-gray-700">₹{Number(c.FeeINR).toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-600">${c.FeeUSD}</td>
                  <td className="px-4 py-3.5"><Badge text={c.Status} color={c.Status==='ACTIVE'?'green':'gray'}/></td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-2">
                      <button id={`edit-course-${c.CourseID}`} onClick={() => openEdit(c)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-colors"><Edit size={14}/></button>
                      <button id={`delete-course-${c.CourseID}`} onClick={() => deleteCourse(c.CourseID)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 transition-colors"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {courses.length === 0 && <tr><td colSpan={8} className="p-12 text-center text-gray-400 text-sm">No courses found</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title={editCourse ? 'Edit Course' : 'New Course'} onClose={() => setShowModal(false)}>
          {msg && <div className={`mb-4 text-sm p-3 rounded-xl ${msg.includes('success')||msg.includes('updated')||msg.includes('created') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{msg}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Course Title *</label>
              <input id="course-title" type="text" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100"/>
            </div>
            {[['Code','code'],['Duration','duration'],['Category','category']].map(([l,k]) => (
              <div key={k}>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{l}</label>
                <input id={`course-${k}`} type="text" value={(form as any)[k]} onChange={e => setForm(f=>({...f,[k]:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100"/>
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Mode *</label>
              <select id="course-mode" value={form.mode} onChange={e => setForm(f=>({...f,mode:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
                {['CILT','VILT','ELEARNING','SITE'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <select id="course-status" value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
                {['ACTIVE','INACTIVE','DRAFT'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Fee (INR)</label>
              <input id="course-feeINR" type="number" value={form.feeINR} onChange={e => setForm(f=>({...f,feeINR:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Fee (USD)</label>
              <input id="course-feeUSD" type="number" value={form.feeUSD} onChange={e => setForm(f=>({...f,feeUSD:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Open Date</label>
              <input id="course-openDate" type="date" value={form.openDate} onChange={e => setForm(f=>({...f,openDate:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Close Date</label>
              <input id="course-closeDate" type="date" value={form.closeDate} onChange={e => setForm(f=>({...f,closeDate:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"/>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
              <textarea id="course-description" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100 resize-none"/>
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button id="save-course-btn" onClick={save} disabled={saving} className="flex-1 bg-[#004098] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {saving && <Loader size={14} className="animate-spin"/>} Save Course
            </button>
            <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50">Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CalendarTab() {
  const [events, setEvents] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title:'', trainingType:'CILT', startDate:'', endDate:'', trainerId:'', trainerName:'', location:'', maxParticipants:'20', notes:'' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token') || '';
      const res = await fetch('/api/admin/calendar', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setEvents(data.calendar);
      
      const resT = await fetch('/api/admin/users?role=TRAINER', { headers: { Authorization: `Bearer ${token}` } });
      const dataT = await resT.json();
      if (dataT.success) setTrainers(dataT.users);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    const token = localStorage.getItem('auth_token') || '';
    const res = await fetch('/api/admin/calendar', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
    const data = await res.json();
    if (data.success) { setShowModal(false); load(); }
    setSaving(false);
  };

  const typeColors: Record<string,string> = { CILT:'orange', VILT:'blue', ELEARNING:'green', SITE:'purple' };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{events.length} scheduled trainings</p>
        <button id="schedule-training-btn" onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-[#004098] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700">
          <Plus size={16}/> Schedule Training
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
        <h3 className="font-bold text-gray-800 mb-4">Training Kanban Board (Drag & Drop to Update Status)</h3>
        {loading ? <div className="p-12 text-center"><Loader size={24} className="animate-spin mx-auto text-gray-300"/></div> : (
          <div className="grid grid-cols-3 gap-6">
            {['OPEN', 'FULL', 'COMPLETED'].map(colStatus => (
              <div 
                key={colStatus} 
                className="bg-gray-50 rounded-xl p-4 border border-gray-100 min-h-[400px]"
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                onDrop={async (e) => {
                  e.preventDefault();
                  const eventId = e.dataTransfer.getData('eventId');
                  if (!eventId) return;
                  // Optimistic update
                  const targetEvent = events.find(ev => ev.CalendarID.toString() === eventId);
                  if (targetEvent) {
                    setEvents(events.map(ev => ev.CalendarID.toString() === eventId ? { ...ev, status_override: colStatus } : ev));
                    // Optional: hit API to update status or dates in backend
                    alert(`Moved ${targetEvent.Title} to ${colStatus}`);
                  }
                }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-black text-gray-700">{colStatus}</h4>
                  <span className="bg-white px-2 py-1 rounded-lg text-xs font-bold text-gray-500 shadow-sm">
                    {events.filter(e => (e.status_override || (new Date(e.EndDate) < new Date() ? 'COMPLETED' : (e.MaxParticipants - (e.CurrentEnrolled || 0) <= 0 ? 'FULL' : 'OPEN'))) === colStatus).length}
                  </span>
                </div>
                <div className="space-y-3">
                  {events
                    .filter(e => (e.status_override || (new Date(e.EndDate) < new Date() ? 'COMPLETED' : (e.MaxParticipants - (e.CurrentEnrolled || 0) <= 0 ? 'FULL' : 'OPEN'))) === colStatus)
                    .map(e => (
                    <div 
                      key={e.CalendarID} 
                      draggable
                      onDragStart={(evt) => {
                        evt.dataTransfer.setData('eventId', e.CalendarID.toString());
                        evt.dataTransfer.effectAllowed = 'move';
                      }}
                      className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all border-l-4 border-l-blue-500"
                    >
                      <h5 className="font-bold text-gray-800 text-sm leading-tight mb-1">{e.Title}</h5>
                      <p className="text-[10px] font-bold text-blue-500 bg-blue-50 inline-block px-2 py-0.5 rounded-full mb-2 uppercase tracking-widest">{e.TrainingType}</p>
                      <div className="flex flex-col gap-1 mt-2">
                        <span className="text-xs text-gray-500 font-medium">Starts: {new Date(e.StartDate).toLocaleDateString()}</span>
                        <span className="text-xs text-gray-500 font-medium">Ends: {new Date(e.EndDate).toLocaleDateString()}</span>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div className="bg-green-500 h-full" style={{ width: `${Math.min(100, ((e.CurrentEnrolled || 0) / e.MaxParticipants) * 100)}%` }}></div>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold text-right">{e.CurrentEnrolled || 0} / {e.MaxParticipants}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="Schedule Training" onClose={() => setShowModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Training Title *</label>
              <input id="cal-title" type="text" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
              <select id="cal-type" value={form.trainingType} onChange={e => setForm(f=>({...f,trainingType:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
                {['CILT','VILT','ELEARNING','SITE'].map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Max Participants</label>
              <input id="cal-max" type="number" value={form.maxParticipants} onChange={e => setForm(f=>({...f,maxParticipants:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date *</label>
              <input id="cal-start" type="date" value={form.startDate} onChange={e => setForm(f=>({...f,startDate:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">End Date *</label>
              <input id="cal-end" type="date" value={form.endDate} onChange={e => setForm(f=>({...f,endDate:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Instructor</label>
              <select 
                id="cal-trainer" 
                value={form.trainerId} 
                onChange={e => {
                  const t = trainers.find(x => x.UserID.toString() === e.target.value);
                  setForm(f=>({...f, trainerId: e.target.value, trainerName: t ? `${t.FirstName} ${t.LastName}` : ''}));
                }} 
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100"
              >
                <option value="">Select Instructor</option>
                {trainers.map(t => (
                  <option key={t.UserID} value={t.UserID}>{t.FirstName} {t.LastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Location</label>
              <input id="cal-location" type="text" value={form.location} onChange={e => setForm(f=>({...f,location:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100"/>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
              <textarea id="cal-notes" value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none resize-none"/>
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button id="save-calendar-btn" onClick={save} disabled={saving} className="flex-1 bg-[#004098] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {saving && <Loader size={14} className="animate-spin"/>} Schedule
            </button>
            <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50">Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CertificatesTab() {
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ studentId:'', courseId:'', participantName:'', courseName:'', trainerName:'', issueDate:new Date().toISOString().split('T')[0], validUntil:'' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('auth_token') || '';
    const res = await fetch('/api/admin/certificates', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) setCerts(data.certificates);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const issue = async () => {
    setSaving(true); setMsg('');
    const token = localStorage.getItem('auth_token') || '';
    const res = await fetch('/api/admin/certificates', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
    const data = await res.json();
    setMsg(data.message);
    if (data.success) { setShowModal(false); load(); }
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{certs.length} certificates issued</p>
        <button id="issue-cert-btn" onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-[#004098] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700">
          <Plus size={16}/> Issue Certificate
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <div className="p-12 text-center"><Loader size={24} className="animate-spin mx-auto text-gray-300"/></div> : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Certificate No','Student','Course','Trainer','Issue Date','Actions'].map(h => (
                <th key={h} className="px-5 py-3.5 text-xs font-black text-gray-400 uppercase tracking-widest">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {certs.map(c => (
                <tr key={c.CertificateID} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3.5 font-mono text-xs text-blue-600 font-bold">{c.CertificateNo}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-gray-800">{c.ParticipantName||c.StudentName}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 max-w-[180px] truncate">{c.CourseName||c.CourseTitle}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{c.TrainerName||'–'}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{c.IssueDate ? new Date(c.IssueDate).toLocaleDateString() : '–'}</td>
                  <td className="px-5 py-3.5">
                    <button id={`download-cert-${c.CertificateID}`} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold">
                      <Download size={12}/> Download
                    </button>
                  </td>
                </tr>
              ))}
              {certs.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-gray-400 text-sm">No certificates issued yet</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title="Issue Certificate" onClose={() => setShowModal(false)}>
          {msg && <div className={`mb-4 text-sm p-3 rounded-xl ${msg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{msg}</div>}
          <div className="grid grid-cols-2 gap-4">
            {[['Student ID','studentId'],['Course ID','courseId'],['Participant Name','participantName'],['Course Name','courseName'],['Trainer Name','trainerName']].map(([l,k]) => (
              <div key={k}>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{l}</label>
                <input id={`cert-${k}`} type="text" value={(form as any)[k]} onChange={e => setForm(f=>({...f,[k]:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100"/>
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Issue Date</label>
              <input id="cert-issueDate" type="date" value={form.issueDate} onChange={e => setForm(f=>({...f,issueDate:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Valid Until</label>
              <input id="cert-validUntil" type="date" value={form.validUntil} onChange={e => setForm(f=>({...f,validUntil:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"/>
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button id="issue-cert-submit" onClick={issue} disabled={saving} className="flex-1 bg-[#004098] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {saving && <Loader size={14} className="animate-spin"/>} Issue Certificate
            </button>
            <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50">Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PaymentsTab() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('auth_token') || '';
      const res = await fetch('/api/admin/payments', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setPayments(data.payments);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Payments', value: payments.length, color: 'bg-blue-50 text-blue-700' },
          { label: 'Verified', value: payments.filter(p=>p.Status==='VERIFIED').length, color: 'bg-green-50 text-green-700' },
          { label: 'Pending', value: payments.filter(p=>p.Status==='PENDING').length, color: 'bg-orange-50 text-orange-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-5 ${s.color} border border-current/10`}>
            <p className="text-3xl font-black">{s.value}</p>
            <p className="text-xs font-bold uppercase tracking-widest mt-1 opacity-70">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <div className="p-12 text-center"><Loader size={24} className="animate-spin mx-auto text-gray-300"/></div> : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Student','Course','Amount','Method','Transaction ID','Status','Date'].map(h => (
                <th key={h} className="px-4 py-3.5 text-xs font-black text-gray-400 uppercase tracking-widest">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map((p,i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3.5 text-sm font-semibold text-gray-800">{p.StudentName||'–'}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-600 max-w-[140px] truncate">{p.CourseName||'–'}</td>
                  <td className="px-4 py-3.5 text-sm font-bold text-gray-800">₹{Number(p.Amount||0).toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">{p.PaymentMethod||'–'}</td>
                  <td className="px-4 py-3.5 text-xs font-mono text-gray-400">{p.TransactionID||'–'}</td>
                  <td className="px-4 py-3.5"><Badge text={p.Status||'PENDING'} color={p.Status==='VERIFIED'?'green':p.Status==='REJECTED'?'red':'orange'}/></td>
                  <td className="px-4 py-3.5 text-xs text-gray-400">{p.CreatedAt ? new Date(p.CreatedAt).toLocaleDateString() : '–'}</td>
                </tr>
              ))}
              {payments.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-gray-400 text-sm">No payment records</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function FeedbackTab() {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('auth_token') || '';
      const res = await fetch('/api/admin/feedback', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { setFeedback(data.feedback); setAnalytics(data.analytics); }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-5">
      {analytics && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Avg Overall', value: analytics.AvgOverall?.toFixed(1) || '–', color: 'bg-blue-50 text-blue-700' },
            { label: 'Avg Content', value: analytics.AvgContent?.toFixed(1) || '–', color: 'bg-green-50 text-green-700' },
            { label: 'Avg Trainer', value: analytics.AvgTrainer?.toFixed(1) || '–', color: 'bg-purple-50 text-purple-700' },
            { label: 'Total Responses', value: analytics.TotalResponses || 0, color: 'bg-orange-50 text-orange-700' },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl p-4 ${s.color} border border-current/10`}>
              <p className="text-2xl font-black">{s.value}<span className="text-sm">{typeof s.value === 'string' && s.value !== '–' ? '/10' : ''}</span></p>
              <p className="text-xs font-bold uppercase tracking-widest mt-1 opacity-70">{s.label}</p>
            </div>
          ))}
        </div>
      )}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <div className="p-12 text-center"><Loader size={24} className="animate-spin mx-auto text-gray-300"/></div> : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Participant','Course','Trainer','Overall','Content','Trainer Score','Date'].map(h => (
                <th key={h} className="px-4 py-3.5 text-xs font-black text-gray-400 uppercase tracking-widest">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {feedback.map((f,i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3.5 text-sm font-semibold text-gray-800">{f.ParticipantName||'–'}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-600">{f.CourseName||f.CourseTitle||'–'}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-500">{f.TrainerName||'–'}</td>
                  <td className="px-4 py-3.5"><span className={`font-bold text-sm ${f.OverallScore >= 8 ? 'text-green-600' : f.OverallScore >= 6 ? 'text-orange-500' : 'text-red-500'}`}>{f.OverallScore}/10</span></td>
                  <td className="px-4 py-3.5 text-sm text-gray-500">{f.ContentScore||'–'}/10</td>
                  <td className="px-4 py-3.5 text-sm text-gray-500">{f.TrainerScore||'–'}/10</td>
                  <td className="px-4 py-3.5 text-xs text-gray-400">{f.TrainingDate ? new Date(f.TrainingDate).toLocaleDateString() : '–'}</td>
                </tr>
              ))}
              {feedback.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-gray-400 text-sm">No feedback records</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ApprovalsTab() {
  const [regs, setRegs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterCourse, setFilterCourse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const [remarksModal, setRemarksModal] = useState<any>(null);
  const [historyModal, setHistoryModal] = useState<any>(null);
  const [remarks, setRemarks] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('auth_token') || '';
    const res = await fetch('/api/admin/approvals', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) setRegs(data.registrations);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const processApproval = async (id: number, action: string) => {
    const token = localStorage.getItem('auth_token') || '';
    await fetch('/api/admin/approvals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ registrationId: id, action, remarks })
    });
    setRemarksModal(null);
    setRemarks('');
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="text-sm font-bold text-gray-700">{regs.length} total requests</h3>
        <div className="flex flex-wrap gap-3">
          <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)} className="bg-white border border-gray-200 text-sm px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500">
            <option value="">All Courses</option>
            {Array.from(new Set(regs.map(r => r.Course))).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white border border-gray-200 text-sm px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500">
            <option value="">All Statuses</option>
            {Array.from(new Set(regs.map(r => r.Status))).map(s => <option key={s as string} value={s as string}>{s as string}</option>)}
          </select>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="bg-white border border-gray-200 text-sm px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500" />
          {(filterCourse || filterStatus || filterDate) && (
            <button onClick={() => { setFilterCourse(''); setFilterStatus(''); setFilterDate(''); }} className="text-sm text-red-500 hover:text-red-700 font-bold px-2">Clear</button>
          )}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        {loading ? <div className="p-12 text-center"><Loader size={24} className="animate-spin mx-auto text-gray-300"/></div> : (
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Applicant','Course','Mode','Payment Proof','Status','Date','Actions'].map(h => (
                <th key={h} className="px-5 py-3.5 text-xs font-black text-gray-400 uppercase tracking-widest">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {regs.filter(r => {
                if (filterCourse && r.Course !== filterCourse) return false;
                if (filterStatus && r.Status !== filterStatus) return false;
                if (filterDate && new Date(r.CreatedAt).toISOString().split('T')[0] !== filterDate) return false;
                return true;
              }).map(r => (
                <tr key={r.Id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-semibold text-gray-800">{r.Name}</p>
                    <p className="text-xs text-gray-400">{r.Organization}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 max-w-[180px] truncate">{r.Course}</td>
                  <td className="px-5 py-3.5"><Badge text={r.TrainingMode||'CILT'} color="blue"/></td>
                  <td className="px-5 py-3.5">
                    {r.PaymentProofPath ? (
                      <div className="space-y-1">
                        <a href={`/api/view-file?path=${encodeURIComponent(r.PaymentProofPath)}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center w-fit gap-1">
                          <FileText size={12}/> View Proof
                        </a>
                        {r.TransactionID && (
                          <div className="text-[10px] font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded w-fit">TXN: {r.TransactionID}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No Proof</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5"><Badge text={r.Status} color={r.Status.includes('APPROVED') ? 'green' : r.Status.includes('REJECTED') ? 'red' : 'orange'}/></td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{new Date(r.CreatedAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-2">
                      <button onClick={() => setHistoryModal(r)} className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors" title="History"><Activity size={14}/></button>
                      <button onClick={() => setRemarksModal({ id: r.Id, action: 'APPROVE', title: 'Approve Registration' })} className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">Approve</button>
                      <button onClick={() => setRemarksModal({ id: r.Id, action: 'REJECT', title: 'Reject Registration' })} className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
              {regs.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-gray-400 text-sm">No pending approvals</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {remarksModal && (
        <Modal title={remarksModal.title} onClose={() => { setRemarksModal(null); setRemarks(''); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Remarks (Optional)</label>
              <textarea value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100 h-24" placeholder="Enter any comments..."></textarea>
            </div>
            <div className="flex gap-3">
              <button onClick={() => processApproval(remarksModal.id, remarksModal.action)} className={`flex-1 text-white py-2.5 rounded-xl text-sm font-bold ${remarksModal.action==='APPROVE' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                Confirm {remarksModal.action === 'APPROVE' ? 'Approval' : 'Rejection'}
              </button>
              <button onClick={() => { setRemarksModal(null); setRemarks(''); }} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {historyModal && (
        <Modal title={`Approval History - ${historyModal.Name}`} onClose={() => setHistoryModal(null)}>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-xs font-bold text-gray-400">FINANCE APPROVAL</p>
                <p className="text-sm font-semibold text-gray-800">{historyModal.FinanceApprovedBy || 'Pending / N/A'}</p>
                {historyModal.FinanceApprovedAt && <p className="text-xs text-gray-500">{new Date(historyModal.FinanceApprovedAt).toLocaleString()}</p>}
              </div>
              <div className="w-full h-px bg-gray-200"/>
              <div>
                <p className="text-xs font-bold text-gray-400">TM APPROVAL</p>
                <p className="text-sm font-semibold text-gray-800">{historyModal.TMApprovedBy || 'Pending / N/A'}</p>
                {historyModal.TMApprovedAt && <p className="text-xs text-gray-500">{new Date(historyModal.TMApprovedAt).toLocaleString()}</p>}
              </div>
              <div className="w-full h-px bg-gray-200"/>
              <div>
                <p className="text-xs font-bold text-gray-400">ADMIN APPROVAL</p>
                <p className="text-sm font-semibold text-gray-800">{historyModal.AdminApprovedBy || 'Pending / N/A'}</p>
                {historyModal.AdminApprovedAt && <p className="text-xs text-gray-500">{new Date(historyModal.AdminApprovedAt).toLocaleString()}</p>}
              </div>
              <div className="w-full h-px bg-gray-200"/>
              <div>
                <p className="text-xs font-bold text-gray-400">LATEST REMARKS</p>
                <p className="text-sm text-gray-700">{historyModal.ApprovalRemarks || 'No remarks added.'}</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ManualsTab() {
  const [manuals, setManuals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('auth_token') || '';
    try {
      const res = await fetch('/api/admin/manuals', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setManuals(data.manuals);
    } catch(e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async () => {
    if (!form.title || !file) return alert("Title and file are required");
    setSaving(true);
    const token = localStorage.getItem('auth_token') || '';
    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("file", file);

    const res = await fetch('/api/admin/manuals', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    setSaving(false);
    if(res.ok) {
      setShowModal(false);
      setForm({ title: '', description: '' });
      setFile(null);
      load();
    } else alert("Upload failed");
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader className="animate-spin text-blue-500"/></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Interactive Manuals</h2>
          <p className="text-sm text-gray-500">Manage SCORM / PDF interactive training manuals</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all">
          <Upload size={16}/> Upload Manual
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-5 py-3.5 text-xs font-black text-gray-400 uppercase tracking-widest">Title</th>
                <th className="px-5 py-3.5 text-xs font-black text-gray-400 uppercase tracking-widest">Description</th>
                <th className="px-5 py-3.5 text-xs font-black text-gray-400 uppercase tracking-widest">File Path</th>
                <th className="px-5 py-3.5 text-xs font-black text-gray-400 uppercase tracking-widest">Date Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {manuals.map(m => (
                <tr key={m.ManualID} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3.5 text-sm font-bold text-gray-800">{m.Title}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{m.Description}</td>
                  <td className="px-5 py-3.5">
                    <a href={m.FilePath} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                      <FileText size={14}/> View
                    </a>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{new Date(m.CreatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {manuals.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400 text-sm">No manuals uploaded yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">Upload Manual</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4 bg-gray-50">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Title *</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none resize-none h-20" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">File *</label>
                <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50">Cancel</button>
              <button onClick={handleUpload} disabled={saving} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationsTab() {
  const [subTab, setSubTab] = useState('broadcasts');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title:'', message:'', priority:'NORMAL', recipientRole:'ALL' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('auth_token') || '';
    const res = await fetch('/api/admin/notifications', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) setNotifications(data.notifications);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    setSaving(true);
    const token = localStorage.getItem('auth_token') || '';
    await fetch('/api/admin/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    setSaving(false);
    setShowModal(false);
    setForm({ title:'', message:'', priority:'NORMAL', recipientRole:'ALL' });
    load();
  };

  const handleDelete = async (id: number) => {
    if(!confirm('Delete this notification?')) return;
    const token = localStorage.getItem('auth_token') || '';
    await fetch(`/api/admin/notifications?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-4 border-b border-gray-200">
        <button onClick={() => setSubTab('broadcasts')} className={`pb-3 text-sm font-bold border-b-2 ${subTab === 'broadcasts' ? 'border-[#004098] text-[#004098]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>System Broadcasts</button>
        <button onClick={() => setSubTab('logs')} className={`pb-3 text-sm font-bold border-b-2 ${subTab === 'logs' ? 'border-[#004098] text-[#004098]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Notification Center</button>
      </div>

      {subTab === 'logs' ? (
        <NotificationCenterTab />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-sm text-gray-500">{notifications.length} notifications</h3>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-[#004098] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700">
              <Plus size={16}/> New Notification
            </button>
          </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        {loading ? <div className="p-12 text-center"><Loader size={24} className="animate-spin mx-auto text-gray-300"/></div> : (
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Title','Message','Recipient','Priority','Date','Actions'].map(h => (
                <th key={h} className="px-5 py-3.5 text-xs font-black text-gray-400 uppercase tracking-widest">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {notifications.map(n => (
                <tr key={n.NotificationID} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3.5 font-semibold text-gray-800 text-sm max-w-[150px] truncate">{n.Title}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 max-w-[250px] truncate">{n.Message}</td>
                  <td className="px-5 py-3.5"><Badge text={n.RecipientRole} color="blue"/></td>
                  <td className="px-5 py-3.5"><Badge text={n.Priority} color={n.Priority==='HIGH'?'red':'gray'}/></td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{new Date(n.CreatedAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => handleDelete(n.NotificationID)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                  </td>
                </tr>
              ))}
              {notifications.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-gray-400 text-sm">No notifications found</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title="Create Notification" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Title *</label>
              <input type="text" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Message *</label>
              <textarea value={form.message} onChange={e => setForm(f=>({...f,message:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100 h-24"></textarea>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Recipient Role</label>
                <select value={form.recipientRole} onChange={e => setForm(f=>({...f,recipientRole:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100">
                  <option value="ALL">All Users</option>
                  <option value="STUDENT">Students</option>
                  <option value="TRAINER">Trainers</option>
                  <option value="AFFILIATE">Affiliates</option>
                  <option value="FINANCE">Finance</option>
                  <option value="TM">Training Managers</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Priority</label>
                <select value={form.priority} onChange={e => setForm(f=>({...f,priority:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100">
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleCreate} disabled={saving || !form.title || !form.message} className="flex-1 bg-[#004098] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Creating...' : 'Create'}
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
      </>
      )}
    </div>
  );
}

// ── Finance Dashboard Tab ──
function FinanceDashboardTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const token = () => localStorage.getItem('auth_token') || '';

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/finance/dashboard', { headers: { Authorization: `Bearer ${token()}` } });
      const d = await res.json();
      if (d.success) setData(d);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-12 text-center"><Loader size={24} className="animate-spin mx-auto text-gray-300"/></div>;
  if (!data) return <div className="p-12 text-center text-gray-400">Failed to load finance data</div>;

  const s = data.stats || {};
  const fmt = (v: number) => `₹${(v || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: fmt(s.TotalRevenue), color: 'bg-green-50', icon: <DollarSign size={18} className="text-green-600"/> },
          { label: 'Monthly Revenue', value: fmt(s.MonthlyRevenue), color: 'bg-blue-50', icon: <TrendingUp size={18} className="text-blue-600"/> },
          { label: 'Pending Amount', value: fmt(s.PendingPaymentsAmount), color: 'bg-orange-50', icon: <Clock size={18} className="text-orange-600"/> },
          { label: 'Paid Invoices', value: s.PaidInvoices ?? '–', color: 'bg-emerald-50', icon: <CheckCircle size={18} className="text-emerald-600"/> },
          { label: 'Pending Payments', value: s.PendingPaymentsCount ?? '–', color: 'bg-red-50', icon: <AlertCircle size={18} className="text-red-600"/> },
          { label: 'Pending Approvals', value: s.PendingApprovals ?? '–', color: 'bg-purple-50', icon: <ClipboardList size={18} className="text-purple-600"/> },
          { label: 'Overdue Invoices', value: s.OverdueInvoices ?? '–', color: 'bg-amber-50', icon: <AlertCircle size={18} className="text-amber-600"/> },
          { label: 'Fully Approved', value: s.FullyApproved ?? '–', color: 'bg-teal-50', icon: <Award size={18} className="text-teal-600"/> },
        ].map((k, i) => (
          <div key={i} className={`rounded-2xl p-5 border border-gray-100 shadow-sm ${k.color}`}>
            <div className="flex items-center gap-2 mb-2">{k.icon}<p className="text-xs font-black text-gray-500 uppercase tracking-widest">{k.label}</p></div>
            <p className="text-2xl font-black text-gray-800">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly Trend */}
      {(data.monthlyTrend || []).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4">Monthly Revenue Trend</h3>
          <div className="flex items-end gap-3 h-32">
            {data.monthlyTrend.map((m: any, i: number) => {
              const maxRev = Math.max(...data.monthlyTrend.map((x: any) => x.Revenue || 0), 1);
              const pct = ((m.Revenue || 0) / maxRev) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-gray-400 font-bold">₹{((m.Revenue || 0) / 1000).toFixed(0)}k</span>
                  <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '80px' }}>
                    <div className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-t-lg transition-all" style={{ height: `${pct}%` }} />
                  </div>
                  <span className="text-[9px] text-gray-400 font-bold text-center truncate w-full">{m.Month}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Payments Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Recent Payments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Student','Course','Amount','Method','Status','Date','Proof'].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-black text-gray-400 uppercase tracking-widest">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data.recentPayments || []).map((p: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-800">{p.StudentName || p.Name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[160px] truncate">{p.CourseName}</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-800">{p.Amount ? `₹${p.Amount.toLocaleString()}` : '–'}</td>
                  <td className="px-4 py-3"><Badge text={p.PaymentMethod || 'N/A'} color="blue"/></td>
                  <td className="px-4 py-3"><Badge text={p.Status} color={p.Status === 'VERIFIED' ? 'green' : p.Status === 'REJECTED' ? 'red' : 'orange'}/></td>
                  <td className="px-4 py-3 text-xs text-gray-400">{p.CreatedAt ? new Date(p.CreatedAt).toLocaleDateString() : '–'}</td>
                  <td className="px-4 py-3">
                    {p.PaymentProofPath
                      ? <a href={`/api/view-file?path=${encodeURIComponent(p.PaymentProofPath)}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:text-blue-800"><FileText size={12}/> View</a>
                      : <span className="text-xs text-gray-300">–</span>}
                  </td>
                </tr>
              ))}
              {(data.recentPayments || []).length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-400 text-sm">No payment records found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Reports Tab ──
function ReportsTab() {
  const [filters, setFilters] = useState({ userType: '', course: '', trainingMode: '', status: '', year: '', month: '' });
  const [reportData, setReportData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const token = () => localStorage.getItem('auth_token') || '';

  useEffect(() => {
    fetch('/api/admin/courses', { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(d => { if (d.success) setCourses(d.courses || []); });
  }, []);

  const runReport = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const res = await fetch(`/api/admin/reports?${params}`, { headers: { Authorization: `Bearer ${token()}` } });
    const d = await res.json();
    if (d.success) { setReportData(d.recentRegistrations || []); setStats(d.stats); }
    setLoading(false);
  };

  const downloadCSV = () => {
    if (reportData.length === 0) return;
    const headers = ['Name','Email','Course','TrainingMode','SponsoredBy','Status','CreatedAt'];
    const rows = reportData.map((r: any) => headers.map(h => JSON.stringify(r[h] || '')).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `yts_report_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Filter size={16}/>Report Filters</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">User Type</label>
            <select value={filters.userType} onChange={e => setFilters(f => ({...f, userType: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100">
              <option value="">All</option><option value="STUDENT">Student</option><option value="AFFILIATE">Customer/Affiliate</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Course</label>
            <select value={filters.course} onChange={e => setFilters(f => ({...f, course: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100">
              <option value="">All Courses</option>
              {courses.map((c: any) => <option key={c.CourseID} value={c.Title}>{c.Title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Training Mode</label>
            <select value={filters.trainingMode} onChange={e => setFilters(f => ({...f, trainingMode: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100">
              <option value="">All Modes</option>
              {['Classroom Training','Online Training','Site Training','E-Learning (Self-Paced)'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Status</label>
            <select value={filters.status} onChange={e => setFilters(f => ({...f, status: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100">
              <option value="">All Statuses</option>
              {['PENDING','FINANCE_APPROVED','TM_APPROVED','APPROVED','REJECTED','WAITING_PAYMENT'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Year</label>
            <select value={filters.year} onChange={e => setFilters(f => ({...f, year: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100">
              <option value="">All Years</option>
              {[2024,2025,2026].map(y => <option key={y} value={String(y)}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Month</label>
            <select value={filters.month} onChange={e => setFilters(f => ({...f, month: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100">
              <option value="">All Months</option>
              {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m,i) => <option key={i+1} value={String(i+1)}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={runReport} disabled={loading} className="bg-[#004098] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2 transition-colors">
            {loading ? <Loader size={14} className="animate-spin"/> : <BarChart2 size={14}/>} Generate Report
          </button>
          {reportData.length > 0 && (
            <button onClick={downloadCSV} className="border border-gray-200 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 flex items-center gap-2 transition-colors">
              <Download size={14}/> Download CSV
            </button>
          )}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Registrations', value: stats.TotalRegistrations ?? '–' },
            { label: 'Total Students', value: stats.TotalStudents ?? '–' },
            { label: 'Certificates Issued', value: stats.CertificatesIssued ?? '–' },
            { label: 'Upcoming Trainings', value: stats.UpcomingTrainings ?? '–' },
          ].map((k, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{k.label}</p>
              <p className="text-3xl font-black text-gray-800 mt-1">{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {reportData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Report Results</h3>
            <span className="text-xs text-gray-400">{reportData.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Name','Email','Course','Mode','Sponsor','Status','Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-black text-gray-400 uppercase tracking-widest">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reportData.map((r: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{r.Name}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.Email}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-[180px] truncate">{r.Course}</td>
                    <td className="px-4 py-3"><Badge text={r.TrainingMode || 'N/A'} color="blue"/></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.SponsoredBy}</td>
                    <td className="px-4 py-3"><Badge text={r.Status} color={r.Status === 'APPROVED' ? 'green' : r.Status?.includes('REJECTED') ? 'red' : 'orange'}/></td>
                    <td className="px-4 py-3 text-xs text-gray-400">{r.CreatedAt ? new Date(r.CreatedAt).toLocaleDateString() : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function PlaceholderTab({ label }: { label: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
      <div className="w-16 h-16 bg-blue-50 rounded-2xl mx-auto mb-4 flex items-center justify-center">
        <Settings size={24} className="text-blue-400"/>
      </div>
      <h3 className="text-lg font-bold text-gray-700 mb-2">{label}</h3>
      <p className="text-gray-400 text-sm">Module ready — Connect your data source to activate.</p>
    </div>
  );
}

function ELearningTab() {
  const [content, setContent] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ courseId: '', title: '', contentType: 'VIDEO', description: '', sortOrder: '0' });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const [filterCourse, setFilterCourse] = useState('');

  const token = () => localStorage.getItem('auth_token') || '';

  const load = useCallback(async () => {
    setLoading(true);
    const [contentRes, coursesRes] = await Promise.all([
      fetch('/api/admin/elearning', { headers: { Authorization: `Bearer ${token()}` } }),
      fetch('/api/admin/courses', { headers: { Authorization: `Bearer ${token()}` } }),
    ]);
    const contentData = await contentRes.json();
    const coursesData = await coursesRes.json();
    if (contentData.success) setContent(contentData.content || []);
    if (coursesData.success) setCourses(coursesData.courses || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.courseId || !form.title) { setMsg('Course and Title are required'); return; }
    setUploading(true); setMsg('');

    try {
      let filePath = editItem?.FilePath || '';

      // Upload file if provided
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('courseId', form.courseId);
        fd.append('contentType', form.contentType);
        const upRes = await fetch('/api/admin/elearning/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token()}` },
          body: fd,
        });
        const upData = await upRes.json();
        if (!upData.success) { setMsg(upData.message); setUploading(false); return; }
        filePath = upData.filePath;
      }

      if (!filePath && !editItem) { setMsg('Please upload a file'); setUploading(false); return; }

      const method = editItem ? 'PUT' : 'POST';
      const body: any = { ...form, courseId: Number(form.courseId), sortOrder: Number(form.sortOrder), filePath };
      if (editItem) body.contentId = editItem.ContentID;

      const res = await fetch('/api/admin/elearning', {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setMsg(data.message);
      if (data.success) { setShowModal(false); setEditItem(null); load(); }
    } catch { setMsg('Operation failed'); }
    setUploading(false);
  };

  const handleDelete = async (contentId: number) => {
    if (!confirm('Delete this content? This cannot be undone.')) return;
    await fetch(`/api/admin/elearning?contentId=${contentId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token()}` },
    });
    load();
  };

  const openAdd = () => {
    setForm({ courseId: '', title: '', contentType: 'VIDEO', description: '', sortOrder: '0' });
    setFile(null); setEditItem(null); setMsg(''); setShowModal(true);
  };

  const openEdit = (item: any) => {
    setForm({ courseId: String(item.CourseID), title: item.Title, contentType: item.ContentType, description: item.Description || '', sortOrder: String(item.SortOrder) });
    setFile(null); setEditItem(item); setMsg(''); setShowModal(true);
  };

  const filteredContent = filterCourse ? content.filter(c => String(c.CourseID) === filterCourse) : content;

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3 items-center">
          <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100">
            <option value="">All Courses</option>
            {courses.map((c: any) => <option key={c.CourseID} value={c.CourseID}>{c.Title}</option>)}
          </select>
          <span className="text-sm text-gray-500">{filteredContent.length} items</span>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[#004098] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-800 transition-colors">
          <FilePlus size={16}/> Upload Content
        </button>
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        {loading ? <div className="p-12 text-center"><Loader size={24} className="animate-spin mx-auto text-gray-300"/></div> : (
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Type', 'Title', 'Course', 'Duration', 'Required', 'Order', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3.5 text-xs font-black text-gray-400 uppercase tracking-widest">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredContent.map((item: any) => (
                <tr key={item.ContentID} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${item.ContentType === 'VIDEO' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                      {item.ContentType === 'VIDEO' ? <FileVideo size={10}/> : <FileText size={10}/>} {item.ContentType}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-semibold text-gray-800">{item.Title}</p>
                    <p className="text-xs text-gray-400 truncate max-w-[200px]">{item.FilePath}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{item.CourseTitle}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{item.DurationSec > 0 ? `${Math.floor(item.DurationSec/60)}m ${item.DurationSec%60}s` : '–'}</td>
                  <td className="px-5 py-3.5">{item.IsRequired ? <CheckCircle size={16} className="text-green-500"/> : <XCircle size={16} className="text-gray-300"/>}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{item.SortOrder}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-2">
                      <a href={item.FilePath} target="_blank" rel="noreferrer" className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Eye size={14}/></a>
                      <button onClick={() => openEdit(item)} className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors"><Edit size={14}/></button>
                      <button onClick={() => handleDelete(item.ContentID)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredContent.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-gray-400 text-sm">No e-learning content uploaded yet. Click "Upload Content" to add videos or PDFs.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Upload / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">{editItem ? 'Edit Content' : 'Upload E-Learning Content'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={18}/></button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
              {msg && <div className={`text-sm p-3 rounded-xl ${msg.toLowerCase().includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{msg}</div>}

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Course *</label>
                <select value={form.courseId} onChange={e => setForm(f => ({...f, courseId: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100">
                  <option value="">-- Select Course --</option>
                  {courses.map((c: any) => <option key={c.CourseID} value={c.CourseID}>{c.Title}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100" placeholder="e.g. VP Operation Training Video 1"/>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Content Type *</label>
                <select value={form.contentType} onChange={e => setForm(f => ({...f, contentType: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100">
                  <option value="VIDEO">Video (MP4, WebM, MOV)</option>
                  <option value="PDF">PDF Document</option>
                  <option value="DOCUMENT">Document (Word, PPT, Excel)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">{editItem ? 'Replace File (optional)' : 'Upload File *'}</label>
                <input type="file" onChange={e => setFile(e.target.files?.[0] || null)}
                  accept={form.contentType === 'VIDEO' ? '.mp4,.webm,.mov,.avi,.mkv' : '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx'}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"/>
                {editItem && <p className="text-xs text-gray-400 mt-1">Current: {editItem.FilePath}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100" placeholder="Optional description"/>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Sort Order</label>
                <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({...f, sortOrder: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100" min="0"/>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={uploading} className="flex-1 bg-[#004098] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                  {uploading && <Loader size={14} className="animate-spin"/>} {uploading ? 'Uploading...' : editItem ? 'Save Changes' : 'Upload & Save'}
                </button>
                <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationCenterTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  
  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('auth_token') || '';
      const res = await fetch('/api/admin/notifications/logs', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setLogs(data.logs);
      setLoading(false);
    })();
  }, []);

  const filteredLogs = logs.filter(log => {
    const searchString = `${log.FirstName} ${log.LastName} ${log.Email} ${log.Phone} ${log.MessageContent}`.toLowerCase();
    const matchSearch = searchTerm ? searchString.includes(searchTerm.toLowerCase()) : true;
    const matchType = filterType ? log.Type === filterType : true;
    const matchStatus = filterStatus ? log.Status === filterStatus : true;
    const matchChannel = filterChannel ? log.Channel === filterChannel : true;
    return matchSearch && matchType && matchStatus && matchChannel;
  });

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !selectedLog) return;
    printWindow.document.write(`
      <html><head><title>Print Notification</title></head>
      <body style="font-family: sans-serif; padding: 20px;">
        <h2>Notification Log</h2>
        <p><strong>To:</strong> ${selectedLog.FirstName} ${selectedLog.LastName} (${selectedLog.Email} / ${selectedLog.Phone || 'N/A'})</p>
        <p><strong>Channel:</strong> ${selectedLog.Channel}</p>
        <p><strong>Type:</strong> ${selectedLog.Type}</p>
        <p><strong>Status:</strong> ${selectedLog.Status}</p>
        <p><strong>Date:</strong> ${new Date(selectedLog.CreatedAt).toLocaleString()}</p>
        <hr/>
        <div style="white-space: pre-wrap; margin-top: 20px;">${selectedLog.Channel === 'EMAIL' ? selectedLog.MessageContent : selectedLog.MessageContent}</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleCopy = () => {
    if (selectedLog && selectedLog.MessageContent) {
      navigator.clipboard.writeText(selectedLog.MessageContent);
      alert('Message copied to clipboard');
    }
  };

  return (
    <div className="space-y-5">
      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <input type="text" placeholder="Search name, email, phone, content..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100"/>
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100">
          <option value="">All Types</option>
          <option value="ACCOUNT_ACTIVATION">Account Activation</option>
          <option value="PASSWORD_RESET">Password Reset</option>
        </select>
        <select value={filterChannel} onChange={e => setFilterChannel(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100">
          <option value="">All Channels</option>
          <option value="EMAIL">Email</option>
          <option value="WHATSAPP">WhatsApp</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100">
          <option value="">All Statuses</option>
          <option value="SENT">Sent</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader size={24} className="animate-spin mx-auto text-gray-300"/></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Date','Recipient','Role','Channel','Type','Status','Details'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-xs font-black text-gray-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLogs.map(log => (
                  <tr key={log.LogID} onClick={() => setSelectedLog(log)} className="hover:bg-gray-50/50 transition-colors cursor-pointer">
                    <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">{new Date(log.CreatedAt).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-800">
                      {log.FirstName ? `${log.FirstName} ${log.LastName}` : 'Unknown'}
                      <p className="text-xs text-gray-400 font-normal">{log.Email}</p>
                      {log.Phone && <p className="text-xs text-gray-400 font-normal">{log.Phone}</p>}
                    </td>
                    <td className="px-5 py-3.5"><Badge text={log.Role || 'N/A'} color="gray"/></td>
                    <td className="px-5 py-3.5 text-xs font-bold text-gray-700">{log.Channel}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-600">{log.Type}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${log.Status === 'SENT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {log.Status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 max-w-[200px] truncate">
                      {log.ErrorMessage ? log.ErrorMessage : log.MessageContent ? log.MessageContent.replace(/<[^>]*>?/gm, '').substring(0, 50) + '...' : '-'}
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">No notifications match your filters</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {selectedLog && (
        <Modal title="Notification Preview" onClose={() => setSelectedLog(null)}>
          <div className="space-y-4">
            <div className="flex gap-4 mb-4">
              <button onClick={handleCopy} className="text-sm text-blue-600 font-semibold hover:underline">Copy Message</button>
              <button onClick={handlePrint} className="text-sm text-blue-600 font-semibold hover:underline">Print / Export PDF</button>
            </div>
            
            {selectedLog.Channel === 'WHATSAPP' ? (
              <div className="bg-[#efeae2] p-4 rounded-xl max-h-[400px] overflow-y-auto flex flex-col">
                <div className="bg-[#dcf8c6] p-3 rounded-lg shadow-sm text-sm text-gray-800 whitespace-pre-wrap w-fit max-w-[90%]">
                  {selectedLog.MessageContent || 'No content recorded'}
                  <div className="text-[10px] text-gray-400 text-right mt-1">{new Date(selectedLog.CreatedAt).toLocaleTimeString()}</div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 p-4 rounded-xl max-h-[400px] overflow-y-auto">
                {selectedLog.MessageContent ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedLog.MessageContent }} />
                ) : (
                  <p className="text-sm text-gray-500">No content recorded</p>
                )}
              </div>
            )}
            
            {selectedLog.ErrorMessage && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl">
                <strong>Error: </strong> {selectedLog.ErrorMessage}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}


function SettingsTab() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('auth_token') || '';
      const res = await fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        const obj: any = {};
        data.settings.forEach((s: any) => obj[s.SettingKey] = s.SettingValue);
        setSettings(obj);
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true); setMsg('');
    const token = localStorage.getItem('auth_token') || '';
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ settings })
    });
    const data = await res.json();
    setMsg(data.message);
    setSaving(false);
  };

  if (loading) return <div className="p-12 text-center"><Loader size={24} className="animate-spin mx-auto text-gray-300"/></div>;

  return (
    <div className="max-w-3xl">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">Global System Settings</h3>
        {msg && <div className={`mb-6 p-4 rounded-xl text-sm font-semibold ${msg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{msg}</div>}
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Minimum Attendance (%)</label>
            <p className="text-xs text-gray-400 mb-2">Required attendance percentage to be eligible for a certificate.</p>
            <input type="number" value={settings.MinAttendance || ''} onChange={e => setSettings({...settings, MinAttendance: e.target.value})} className="w-full max-w-xs border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Passing Marks (%)</label>
            <p className="text-xs text-gray-400 mb-2">Required assessment score to be eligible for a certificate.</p>
            <input type="number" value={settings.PassMarks || ''} onChange={e => setSettings({...settings, PassMarks: e.target.value})} className="w-full max-w-xs border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Default Batch Capacity</label>
            <p className="text-xs text-gray-400 mb-2">Default maximum number of participants for a new training batch.</p>
            <input type="number" value={settings.DefaultBatchCapacity || ''} onChange={e => setSettings({...settings, DefaultBatchCapacity: e.target.value})} className="w-full max-w-xs border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp API URL</label>
            <p className="text-xs text-gray-400 mb-2">Provider endpoint for sending messages.</p>
            <input type="text" value={settings.WhatsAppApiUrl || ''} onChange={e => setSettings({...settings, WhatsAppApiUrl: e.target.value})} className="w-full max-w-md border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp API Key</label>
            <input type="password" value={settings.WhatsAppApiKey || ''} onChange={e => setSettings({...settings, WhatsAppApiKey: e.target.value})} className="w-full max-w-md border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp Sender Number</label>
            <input type="text" value={settings.WhatsAppSender || ''} onChange={e => setSettings({...settings, WhatsAppSender: e.target.value})} className="w-full max-w-xs border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp Template ID</label>
            <input type="text" value={settings.WhatsAppTemplateId || ''} onChange={e => setSettings({...settings, WhatsAppTemplateId: e.target.value})} className="w-full max-w-xs border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100" />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <button onClick={handleSave} disabled={saving} className="bg-[#004098] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2 transition-colors">
            {saving && <Loader size={14} className="animate-spin"/>} Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

function AnnouncementsTab() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('ALL');

  const fetchAnnouncements = async () => {
    const token = localStorage.getItem('auth_token') || '';
    const res = await fetch('/api/admin/announcements', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) setAnnouncements(data.announcements);
    setLoading(false);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handlePost = async () => {
    if (!title || !body) return alert('Fill title and body');
    const token = localStorage.getItem('auth_token') || '';
    const res = await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, body, targetAudience: target })
    });
    if (res.ok) {
      setTitle(''); setBody(''); setTarget('ALL');
      fetchAnnouncements();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this announcement?')) return;
    const token = localStorage.getItem('auth_token') || '';
    const res = await fetch(`/api/admin/announcements?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) fetchAnnouncements();
  };

  if (loading) return <div className="p-12 text-center"><Loader size={24} className="animate-spin mx-auto text-gray-300"/></div>;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Publish Announcement</h3>
        <div className="space-y-4">
          <input type="text" placeholder="Announcement Title" value={title} onChange={e=>setTitle(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100" />
          <textarea placeholder="Announcement Body" value={body} onChange={e=>setBody(e.target.value)} rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100" />
          <div className="flex items-center gap-4">
            <select value={target} onChange={e=>setTarget(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none">
              <option value="ALL">All Users</option>
              <option value="STUDENT">Students</option>
              <option value="TRAINER">Trainers</option>
              <option value="AFFILIATE">Affiliates</option>
              <option value="TM">Training Managers</option>
            </select>
            <button onClick={handlePost} className="bg-[#004098] text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700">
              <Send size={16}/> Broadcast
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Title</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Audience</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Author</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Date</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {announcements.map((a, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                <td className="p-4 text-sm font-semibold text-gray-800">{a.Title}</td>
                <td className="p-4"><Badge text={a.TargetAudience} color="blue" /></td>
                <td className="p-4 text-sm text-gray-600">{a.CreatorName}</td>
                <td className="p-4 text-sm text-gray-500">{new Date(a.CreatedAt).toLocaleDateString()}</td>
                <td className="p-4 text-right">
                  <button onClick={() => handleDelete(a.AnnouncementID)} className="text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
            {announcements.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">No announcements found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── MAIN ADMIN PAGE ──────────────────────────────────────────────────────────

export default function AdminPortal() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [dashboardData, setDashboardData] = useState<any>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/login?redirect=/admin'); return; }
    const u = JSON.parse(stored) as AuthUser;
    if (!['ADMIN','FINANCE','TM','TRAINER'].includes(u.role)) { router.push('/login'); return; }
    setUser(u);
    // Finance and TM land directly on Approvals tab (their primary function)
    if (u.role === 'FINANCE' || u.role === 'TM') setActiveTab('approvals');
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (!user) return;
    // Dashboard stats are only meaningful for ADMIN
    if (user.role !== 'ADMIN') return;
    (async () => {
      const token = localStorage.getItem('auth_token') || '';
      const res = await fetch('/api/admin/reports', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setDashboardData(data);
    })();
  }, [user]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const visibleNav = user ? NAV_ITEMS.filter(n => n.roles.includes(user.role)) : [];

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader size={32} className="animate-spin text-blue-500"/>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab stats={dashboardData.stats} recentRegs={dashboardData.recentRegistrations} auditLogs={dashboardData.auditLogs}/>;
      case 'users': return <UsersTab/>;
      case 'courses': return <CoursesTab/>;
      case 'calendar': return <CalendarTab/>;
      case 'certificates': return <CertificatesTab/>;
      case 'feedback': return <FeedbackTab/>;
      case 'payments': return <FinanceDashboardTab/>;
      case 'invoices': return <FinanceDashboardTab/>;
      case 'approvals': return <ApprovalsTab/>;
      case 'notifications': return <NotificationsTab/>;
      case 'manuals': return <ManualsTab/>;
      case 'elearning': return <ELearningTab/>;
      case 'reports': return <ReportsTab/>;
      case 'settings': return <SettingsTab/>;
      case 'announcements': return <AnnouncementsTab/>;
      default: return <PlaceholderTab label={NAV_ITEMS.find(n=>n.id===activeTab)?.label || activeTab}/>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* SIDEBAR */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-[#001a40] text-white flex flex-col transition-all duration-300 shrink-0 shadow-2xl`}>
        {/* Logo */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-white font-black text-xs">YTS</span>
            </div>
            {!sidebarCollapsed && (
              <div>
                <p className="font-black text-white text-sm leading-tight">YTS Admin</p>
                <p className="text-white/40 text-[10px]">Management Portal</p>
              </div>
            )}
            <button id="sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="ml-auto text-white/30 hover:text-white/80 transition-colors">
              {sidebarCollapsed ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {visibleNav.map(item => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              title={sidebarCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === item.id 
                  ? 'bg-white/10 text-white border-r-2 border-orange-400' 
                  : 'text-white/50 hover:text-white/90 hover:bg-white/5'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User & Logout */}
        <div className="p-4 border-t border-white/10">
          {!sidebarCollapsed && user && (
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <span className="text-orange-400 font-bold text-xs">{user.firstName[0]}{user.lastName[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">{user.firstName} {user.lastName}</p>
                <p className="text-white/40 text-[10px]">{user.role}</p>
              </div>
            </div>
          )}
          <button id="logout-btn" onClick={handleLogout} title="Logout" className="w-full flex items-center gap-3 px-2 py-2 text-white/40 hover:text-white/80 rounded-xl hover:bg-white/5 transition-all text-sm">
            <LogOut size={16} className="shrink-0"/>
            {!sidebarCollapsed && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-black text-gray-800">
              {NAV_ITEMS.find(n => n.id === activeTab)?.label || 'Dashboard'}
            </h2>
            <p className="text-xs text-gray-400">Yokogawa Training Services · {user?.role}</p>
          </div>
          <div className="flex items-center gap-3">
            <GlobalSearchComponent />
            <button id="refresh-btn" onClick={() => window.location.reload()} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-700 transition-colors">
              <RefreshCw size={16}/>
            </button>
            <div className="w-9 h-9 bg-gradient-to-br from-[#004098] to-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xs shadow">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}