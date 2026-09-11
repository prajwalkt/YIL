"use client";
import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Users, Star, BookOpen, LogOut, Search, Clock, CheckCircle,
  Video, MapPin, Loader, Award, UserCheck, Plus, Edit, Trash2, X,
  ChevronDown, TrendingUp, AlertCircle, UserPlus, BarChart2, ClipboardList, Upload, FilePlus, FileText
} from 'lucide-react';
import { useRouter } from 'next/navigation';

function Badge({ text, color }: { text: string; color: 'green' | 'blue' | 'orange' | 'red' | 'gray' }) {
  const c = { green: 'bg-green-100 text-green-700', blue: 'bg-blue-100 text-blue-700', orange: 'bg-orange-100 text-orange-700', red: 'bg-red-100 text-red-600', gray: 'bg-gray-100 text-gray-500' };
  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${c[color]}`}>{text}</span>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={18}/></button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ── TABS ────────────────────────────────────────────────────────────────────────

function ScheduleTab({ batches, profile, stats }: { batches: any[]; profile: any; stats?: any }) {
  return (
    <div className="space-y-6">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Students</p>
          <p className="text-3xl font-black text-[#004020]">{stats?.TotalStudents || 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Active Sessions Today</p>
          <p className="text-3xl font-black text-blue-600">{stats?.TodaySessions || 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Pending Assessments</p>
          <p className="text-3xl font-black text-orange-600">{stats?.PendingAssessments || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
        <h2 className="text-lg font-black text-gray-800 flex items-center gap-2"><Calendar size={20} className="text-[#004020]"/> Upcoming Trainings</h2>
        {batches.length > 0 ? batches.map((t: any) => (
          <div key={t.CalendarID} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-5">
            <div className="w-24 shrink-0 flex flex-col items-center justify-center bg-green-50 rounded-xl py-3 border border-green-100">
              <span className="text-xs font-bold text-green-600 uppercase tracking-wider">{new Date(t.StartDate).toLocaleString('en',{month:'short'})}</span>
              <span className="text-3xl font-black text-[#004020] leading-none my-1">{new Date(t.StartDate).getDate()}</span>
              <span className="text-xs font-bold text-green-600/70">{new Date(t.StartDate).getFullYear()}</span>
            </div>
            <div className="flex-1">
              <Badge text={t.TrainingType} color="orange"/>
              <h3 className="text-lg font-bold text-gray-800 mt-1 leading-tight">{t.Title}</h3>
              <p className="text-sm text-gray-500">{t.CourseTitle}</p>
              <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-gray-50">
                <span className="flex items-center gap-1 text-xs font-semibold text-gray-500"><Clock size={14}/>{new Date(t.StartDate).toLocaleDateString()} – {new Date(t.EndDate).toLocaleDateString()}</span>
                <span className="flex items-center gap-1 text-xs font-semibold text-gray-500"><MapPin size={14}/>{t.Location||'Online'}</span>
                <span className="flex items-center gap-1 text-xs font-semibold text-gray-500"><Users size={14}/>{t.CurrentEnrolled}/{t.MaxParticipants} enrolled</span>
              </div>
            </div>
          </div>
        )) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500 shadow-sm">No upcoming trainings scheduled.</div>
        )}
      </div>
      <div>
        <h2 className="text-lg font-black text-gray-800 flex items-center gap-2 mb-4"><UserCheck size={20} className="text-[#004020]"/>My Profile</h2>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          {[['Department', profile?.Department], ['Expertise', profile?.Expertise], ['Experience', `${profile?.ExperienceYears || 0} Years`], ['Certifications', profile?.Certifications]].map(([l,v]) => (
            <div key={l}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{l}</p>
              <p className="text-sm font-medium text-gray-700">{v || '–'}</p>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}

function StudentsTab({ token }: { token: string }) {
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<any>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [enrollForm, setEnrollForm] = useState({ studentId: '', calendarId: '' });
  const [editForm, setEditForm] = useState({ progress: '', status: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    let url = '/api/trainer/students?';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (filterBatch) url += `calendarId=${filterBatch}&`;
    if (filterStatus) url += `status=${filterStatus}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) setStudents(data.students);
    setLoading(false);
  }, [token, search, filterBatch, filterStatus]);

  const loadBatches = useCallback(async () => {
    const res = await fetch('/api/trainer/dashboard', { credentials: 'include', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) setBatches(data.upcomingSchedule || []);
  }, [token]);

  const loadUsers = useCallback(async () => {
    const res = await fetch('/api/admin/users', { credentials: 'include', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) setAllUsers(data.users?.filter((u: any) => u.Role === 'STUDENT') || []);
  }, [token]);

  useEffect(() => { load(); loadBatches(); }, [load, loadBatches]);

  const handleEnroll = async () => {
    setSaving(true); setMsg('');
    const res = await fetch('/api/trainer/students', { credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ studentId: Number(enrollForm.studentId), calendarId: Number(enrollForm.calendarId) })
    });
    const data = await res.json();
    setMsg(data.message);
    if (data.success) { setShowEnrollModal(false); load(); }
    setSaving(false);
  };

  const handleUpdate = async () => {
    if (!showEditModal) return;
    setSaving(true); setMsg('');
    const body: any = { enrollmentId: showEditModal.EnrollmentID };
    if (editForm.progress !== '') body.progress = Number(editForm.progress);
    if (editForm.status !== '') body.status = editForm.status;
    const res = await fetch('/api/trainer/students', { credentials: 'include',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    setMsg(data.message);
    if (data.success) { setShowEditModal(null); load(); }
    setSaving(false);
  };

  const handleRemove = async (enrollmentId: number) => {
    if (!confirm('Remove this student from the batch?')) return;
    await fetch(`/api/trainer/students?enrollmentId=${enrollmentId}`, { credentials: 'include',
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    });
    load();
  };

  const handleOpenAttendance = async () => {
    if (!filterBatch) { alert('Please select a batch from the filter first to mark attendance.'); return; }
    setShowAttendanceModal(true); setMsg('');
    loadAttendanceForDate(attendanceDate);
  };

  const loadAttendanceForDate = async (date: string) => {
    if (!filterBatch) return;
    setLoading(true);
    const res = await fetch(`/api/trainer/attendance?calendarId=${filterBatch}`, { credentials: 'include', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) {
      // Initialize records
      const existingForDate = data.attendance.filter((a: any) => a.SessionDate.startsWith(date));
      const initial = data.students.map((s: any) => {
        const found = existingForDate.find((a: any) => a.EnrollmentID === s.EnrollmentID);
        return { enrollmentId: s.EnrollmentID, name: `${s.FirstName} ${s.LastName}`, status: found ? found.Status : 'PRESENT' };
      });
      setAttendanceRecords(initial);
    }
    setLoading(false);
  };

  const handleSaveAttendance = async () => {
    setSaving(true); setMsg('');
    const res = await fetch('/api/trainer/attendance', { credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ calendarId: Number(filterBatch), sessionDate: attendanceDate, records: attendanceRecords })
    });
    const data = await res.json();
    setMsg(data.message);
    if (data.success) load();
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      {/* Filters bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15}/>
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} type="text" placeholder="Search students…" className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 ring-green-100 w-52"/>
          </div>
          <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 ring-green-100">
            <option value="">All Batches</option>
            {batches.map((b: any) => <option key={b.CalendarID} value={b.CalendarID}>{b.Title}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 ring-green-100">
            <option value="">All Statuses</option>
            <option value="ENROLLED">Enrolled</option>
            <option value="COMPLETED">Completed</option>
            <option value="DROPPED">Dropped</option>
          </select>
          <button onClick={load} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200">Apply</button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleOpenAttendance} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors">
            <UserCheck size={16}/> Mark Attendance
          </button>
          <button onClick={() => { loadUsers(); setShowEnrollModal(true); }} className="flex items-center gap-2 bg-[#004020] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-800 transition-colors">
            <UserPlus size={16}/> Add Student to Batch
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        {loading ? <div className="p-12 text-center"><Loader size={24} className="animate-spin mx-auto text-gray-300"/></div> : (
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Student', 'Batch', 'Organization', 'Progress', 'Status', 'Enrolled On', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3.5 text-xs font-black text-gray-400 uppercase tracking-widest">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map((s: any) => (
                <tr key={s.EnrollmentID} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-50 text-green-700 font-bold flex items-center justify-center text-xs shrink-0">
                        {s.FirstName?.[0]}{s.LastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{s.FirstName} {s.LastName}</p>
                        <p className="text-xs text-gray-400">{s.Email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-gray-700 max-w-[160px] truncate">{s.BatchTitle}</p>
                    <p className="text-xs text-gray-400">{new Date(s.StartDate).toLocaleDateString()} – {new Date(s.EndDate).toLocaleDateString()}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{s.Organization || '–'}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 w-28">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${s.EnrollmentStatus === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${s.ProgressPercent || 0}%` }}/>
                      </div>
                      <span className="text-xs font-bold text-gray-500 w-8 shrink-0">{s.ProgressPercent || 0}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge text={s.EnrollmentStatus || 'ENROLLED'} color={s.EnrollmentStatus === 'COMPLETED' ? 'green' : s.EnrollmentStatus === 'DROPPED' ? 'red' : 'blue'}/>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{new Date(s.EnrolledAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-2">
                      <button title="Assessment" onClick={() => window.open(`/trainer/assessment/${s.EnrollmentID}`, '_blank')} className="p-1.5 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"><ClipboardList size={14}/></button>
                      <button title="Feedback" onClick={() => window.open(`/trainer/feedback/${s.EnrollmentID}`, '_blank')} className="p-1.5 text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"><Star size={14}/></button>
                      <button title="Edit" onClick={() => { setEditForm({ progress: String(s.ProgressPercent||0), status: s.EnrollmentStatus||'ENROLLED' }); setShowEditModal(s); }} className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={14}/></button>
                      <button title="Remove" onClick={() => handleRemove(s.EnrollmentID)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {students.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-gray-400 text-sm">No students found. Use "Add Student to Batch" to enroll someone.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Enroll Modal */}
      {showEnrollModal && (
        <Modal title="Add Student to Batch" onClose={() => setShowEnrollModal(false)}>
          {msg && <div className="mb-4 text-sm p-3 rounded-xl bg-red-50 text-red-600">{msg}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Select Student *</label>
              <select value={enrollForm.studentId} onChange={e => setEnrollForm(f => ({ ...f, studentId: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-green-100">
                <option value="">-- Choose a student --</option>
                {allUsers.map((u: any) => <option key={u.UserID} value={u.UserID}>{u.FirstName} {u.LastName} ({u.Email})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Select Batch *</label>
              <select value={enrollForm.calendarId} onChange={e => setEnrollForm(f => ({ ...f, calendarId: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-green-100">
                <option value="">-- Choose a batch --</option>
                {batches.map((b: any) => <option key={b.CalendarID} value={b.CalendarID}>{b.Title} ({new Date(b.StartDate).toLocaleDateString()})</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleEnroll} disabled={saving || !enrollForm.studentId || !enrollForm.calendarId} className="flex-1 bg-[#004020] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-800 disabled:opacity-50 transition-colors">
                {saving ? 'Enrolling…' : 'Enroll Student'}
              </button>
              <button onClick={() => setShowEnrollModal(false)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <Modal title={`Edit: ${showEditModal.FirstName} ${showEditModal.LastName}`} onClose={() => setShowEditModal(null)}>
          {msg && <div className={`mb-4 text-sm p-3 rounded-xl ${msg.toLowerCase().includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{msg}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Progress (%)</label>
              <input type="number" min={0} max={100} value={editForm.progress} onChange={e => setEditForm(f => ({ ...f, progress: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-green-100"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-green-100">
                <option value="ENROLLED">Enrolled</option>
                <option value="COMPLETED">Completed</option>
                <option value="DROPPED">Dropped</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleUpdate} disabled={saving} className="flex-1 bg-[#004020] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-800 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button onClick={() => setShowEditModal(null)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
      {/* Attendance Modal */}
      {showAttendanceModal && (
        <Modal title="Mark Attendance" onClose={() => setShowAttendanceModal(false)}>
          {msg && <div className={`mb-4 text-sm p-3 rounded-xl ${msg.toLowerCase().includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{msg}</div>}
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
              <label className="text-sm font-bold text-gray-700">Session Date:</label>
              <input type="date" value={attendanceDate} onChange={(e) => { setAttendanceDate(e.target.value); loadAttendanceForDate(e.target.value); }} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none"/>
            </div>

            <div className="max-h-[50vh] overflow-y-auto border border-gray-100 rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 font-bold text-gray-500">Student Name</th>
                    <th className="px-4 py-2 font-bold text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendanceRecords.map((rec, i) => (
                    <tr key={rec.enrollmentId} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-semibold text-gray-800">{rec.name}</td>
                      <td className="px-4 py-2">
                        <select value={rec.status} onChange={(e) => {
                          const updated = [...attendanceRecords];
                          updated[i].status = e.target.value;
                          setAttendanceRecords(updated);
                        }} className={`border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold ${
                          rec.status === 'PRESENT' ? 'bg-green-50 text-green-700' : 
                          rec.status === 'ABSENT' ? 'bg-red-50 text-red-600' : 
                          rec.status === 'LATE' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          <option value="PRESENT">Present</option>
                          <option value="ABSENT">Absent</option>
                          <option value="LATE">Late</option>
                          <option value="HALF_DAY">Half Day</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {attendanceRecords.length === 0 && (
                    <tr><td colSpan={2} className="px-4 py-6 text-center text-gray-400">No students enrolled in this batch.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleSaveAttendance} disabled={saving || attendanceRecords.length === 0} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                {saving && <Loader size={14} className="animate-spin"/>} Save Attendance
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function UnassignedTab({ token }: { token: string }) {
  const [unassigned, setUnassigned] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState<any>(null);
  const [calendarId, setCalendarId] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/trainer/unassigned', { credentials: 'include', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) setUnassigned(data.unassigned || []);
    setLoading(false);
  }, [token]);

  const loadBatches = useCallback(async () => {
    const res = await fetch('/api/trainer/dashboard', { credentials: 'include', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) setBatches(data.upcomingSchedule || []);
  }, [token]);

  useEffect(() => { load(); loadBatches(); }, [load, loadBatches]);

  const handleAssign = async (confirmRequestedDates: boolean = false) => {
    if (!showAssignModal) return;
    if (!confirmRequestedDates && !calendarId) return;
    
    setSaving(true); setMsg('');
    const body: any = { 
      registrationId: showAssignModal.Id, 
      action: 'APPROVE',
      confirmRequestedDates 
    };
    if (calendarId && !confirmRequestedDates) {
      body.selectedSlotId = Number(calendarId);
    }

    const res = await fetch('/api/admin/approvals', { credentials: 'include',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    setMsg(data.message);
    if (data.success) { 
      setTimeout(() => { setShowAssignModal(null); load(); }, 1000);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        {loading ? <div className="p-12 text-center"><Loader size={24} className="animate-spin mx-auto text-gray-300"/></div> : (
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Student', 'Course & Mode', 'Requested Dates', 'Organization', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3.5 text-xs font-black text-gray-400 uppercase tracking-widest">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {unassigned.map((r: any) => (
                <tr key={r.Id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-semibold text-gray-800">{r.Name}</p>
                    <p className="text-xs text-gray-400">{r.Email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-gray-700">{r.Course}</p>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">{r.TrainingMode}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    {r.PreferredStartDate && r.PreferredEndDate ? (
                      <p className="text-xs font-semibold text-blue-600 bg-blue-50 py-1 px-2 rounded-lg inline-block">
                        {new Date(r.PreferredStartDate).toLocaleDateString()} to {new Date(r.PreferredEndDate).toLocaleDateString()}
                      </p>
                    ) : <span className="text-xs text-gray-400">Not requested</span>}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{r.Organization || '–'}</td>
                  <td className="px-5 py-3.5">
                    <Badge text={r.Status} color="orange"/>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => { setShowAssignModal(r); setCalendarId(''); setMsg(''); }} className="bg-[#004020] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-800 transition-colors">
                      Review / Assign
                    </button>
                  </td>
                </tr>
              ))}
              {unassigned.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-gray-400 text-sm">No pending students found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showAssignModal && (
        <Modal title={`Review Request: ${showAssignModal.Name}`} onClose={() => setShowAssignModal(null)}>
          {msg && <div className={`mb-4 text-sm p-3 rounded-xl ${msg.toLowerCase().includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{msg}</div>}
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Requested Details</h4>
              <p className="text-sm font-semibold text-gray-800 mb-1">{showAssignModal.Course}</p>
              <p className="text-xs text-gray-600 mb-3">{showAssignModal.TrainingMode}</p>
              {showAssignModal.PreferredStartDate && showAssignModal.PreferredEndDate ? (
                <div className="flex items-center gap-2 text-sm font-bold text-blue-700 bg-blue-100/50 p-2 rounded-lg">
                  <Calendar size={16}/> 
                  {new Date(showAssignModal.PreferredStartDate).toLocaleDateString()} – {new Date(showAssignModal.PreferredEndDate).toLocaleDateString()}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No specific dates requested.</p>
              )}
            </div>

            {showAssignModal.PreferredStartDate && showAssignModal.PreferredEndDate && (
              <div className="border-t border-b border-gray-100 py-4">
                <p className="text-sm text-gray-600 mb-3">You can create an official batch based exactly on the requested dates.</p>
                <button onClick={() => handleAssign(true)} disabled={saving} className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  <CheckCircle size={16}/> Confirm Requested Dates
                </button>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-600 mb-3 font-semibold">OR assign to an existing scheduled batch:</p>
              <select value={calendarId} onChange={e => setCalendarId(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-green-100">
                <option value="">-- Choose an existing batch --</option>
                {batches.filter(b => b.CourseTitle === showAssignModal.Course || !showAssignModal.Course).map((b: any) => {
                  const avail = b.MaxParticipants - (b.CurrentEnrolled || 0);
                  return (
                    <option key={b.CalendarID} value={b.CalendarID} disabled={avail <= 0}>
                      {b.Title} ({new Date(b.StartDate).toLocaleDateString()}) - {Math.max(0, avail)} seats left
                    </option>
                  );
                })}
              </select>
              <button onClick={() => handleAssign(false)} disabled={saving || !calendarId} className="w-full mt-3 bg-[#004020] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-800 disabled:opacity-50 flex items-center justify-center gap-2">
                <CheckCircle size={16}/> Assign to Selected Batch
              </button>
            </div>
            
          </div>
        </Modal>
      )}
    </div>
  );
}

function FeedbackTab({ feedbackSummary }: { feedbackSummary: any }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
      <div className="w-16 h-16 bg-orange-50 rounded-2xl mx-auto mb-4 flex items-center justify-center">
        <Star size={24} className="text-orange-400"/>
      </div>
      <h3 className="text-lg font-bold text-gray-700 mb-2">Student Feedback Summary</h3>
      <div className="flex justify-center gap-12 mt-6">
        <div>
          <p className="text-4xl font-black text-[#004020]">{feedbackSummary?.AvgTrainerScore?.toFixed(1) || '–'}</p>
          <p className="text-xs font-bold text-gray-400 uppercase mt-1">Avg. Rating</p>
        </div>
        <div>
          <p className="text-4xl font-black text-[#004020]">{feedbackSummary?.TotalFeedback || 0}</p>
          <p className="text-xs font-bold text-gray-400 uppercase mt-1">Total Reviews</p>
        </div>
      </div>
    </div>
  );
}

function ResourcesTab() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [newMat, setNewMat] = useState({ title: '', courseId: '', fileType: 'PDF' });

  const fetchData = async () => {
    const [matRes, coursesRes] = await Promise.all([
      fetch('/api/materials', { credentials: 'include' }),
      fetch('/api/admin/courses', { credentials: 'include' })
    ]);
    const matData = await matRes.json();
    const coursesData = await coursesRes.json();
    if (matData.success) setMaterials(matData.materials);
    if (coursesData.success) setCourses(coursesData.courses);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpload = async () => {
    if (!newMat.title || !newMat.courseId) return alert('Fill all fields');
    setUploading(true);
    const res = await fetch('/api/materials', { credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newMat, filePath: '/uploads/mock-' + Date.now() + '.pdf', isVisible: true })
    });
    if (res.ok) {
      setNewMat({ title: '', courseId: '', fileType: 'PDF' });
      fetchData();
    }
    setUploading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete material?')) return;
    const res = await fetch(`/api/materials?id=${id}`, { credentials: 'include', method: 'DELETE' });
    if (res.ok) fetchData();
  };

  if (loading) return <div className="p-12 text-center"><Loader size={24} className="animate-spin mx-auto text-gray-300"/></div>;

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Upload size={20}/> Upload Material</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Course</label>
            <select value={newMat.courseId} onChange={e=>setNewMat({...newMat, courseId: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100">
              <option value="">Select Course</option>
              {courses.map(c => <option key={c.CourseID} value={c.CourseID}>{c.Title}</option>)}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
            <input type="text" placeholder="e.g. Chapter 1 PDF" value={newMat.title} onChange={e=>setNewMat({...newMat, title: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100" />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
            <select value={newMat.fileType} onChange={e=>setNewMat({...newMat, fileType: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100">
              <option>PDF</option>
              <option>PPT</option>
              <option>ZIP</option>
              <option>VIDEO</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <button onClick={handleUpload} disabled={uploading} className="w-full bg-[#004098] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2">
              {uploading ? <Loader size={16} className="animate-spin"/> : <FilePlus size={16}/>} Upload
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map((r, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <BookOpen size={22} className="text-blue-600"/>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 leading-tight mb-1">{r.Title}</h4>
                <p className="text-xs font-semibold text-gray-400 uppercase">{r.FileType}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{r.UploadedByName}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
              <button onClick={() => handleDelete(r.MaterialID)} className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
        {materials.length === 0 && <div className="col-span-full p-12 text-center text-gray-500 border border-dashed rounded-2xl">No materials uploaded yet.</div>}
      </div>
    </div>
  );
}

// ── MAIN PAGE ──────────────────────────────────────────────────────────────────

export default function TrainerPortal() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('schedule');
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(async (data) => {
        if (!data.success || !data.user || !['TRAINER', 'ADMIN'].includes(data.user.role)) {
          router.push('/login?redirect=/trainer');
          return;
        }
        setUser(data.user);
        
        const res = await fetch('/api/trainer/dashboard', { credentials: 'include' });
        const d = await res.json();
        if (d.success) setData(d);
        setLoading(false);
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { credentials: 'include', method: 'POST' });
    router.push('/login');
  };

  const NAV = [
    { id: 'schedule', label: 'My Schedule', icon: <Calendar size={16}/> },
    { id: 'unassigned', label: 'Unassigned Students', icon: <UserPlus size={16}/> },
    { id: 'students', label: 'Assigned Students', icon: <Users size={16}/> },
    { id: 'feedback', label: 'Feedback', icon: <Star size={16}/> },
    { id: 'resources', label: 'Resources', icon: <BookOpen size={16}/> },
  ];

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader size={32} className="animate-spin text-green-600"/></div>;

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* HEADER */}
      <header className="bg-[#004020] text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow">
              <span className="text-[#004020] font-black text-sm">YTS</span>
            </div>
            <div>
              <h1 className="font-bold text-white leading-tight">Trainer Portal</h1>
              <p className="text-white/60 text-xs">Yokogawa Training Services</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </nav>
            <div className="w-px h-8 bg-white/20"/>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-green-200">Instructor</p>
              </div>
              <button onClick={handleLogout} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all" title="Logout"><LogOut size={18}/></button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Upcoming', value: data?.upcomingSchedule?.length || 0, icon: <Calendar size={22}/>, color: 'bg-orange-50 text-orange-600' },
            { label: 'Completed', value: data?.pastSchedule?.length || 0, icon: <CheckCircle size={22}/>, color: 'bg-blue-50 text-blue-600' },
            { label: 'Avg Rating', value: data?.feedbackSummary?.AvgTrainerScore?.toFixed(1) || '–', icon: <Star size={22}/>, color: 'bg-yellow-50 text-yellow-600' },
            { label: 'Reviews', value: data?.feedbackSummary?.TotalFeedback || 0, icon: <BarChart2 size={22}/>, color: 'bg-green-50 text-green-600' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-2xl font-black text-gray-800">{s.value}</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {activeTab === 'schedule' && <ScheduleTab batches={data?.upcomingSchedule || []} profile={data?.profile} stats={data?.stats}/>}
        {activeTab === 'unassigned' && <UnassignedTab token={token}/>}
        {activeTab === 'students' && <StudentsTab token={token}/>}
        {activeTab === 'feedback' && <FeedbackTab feedbackSummary={data?.feedbackSummary}/>}
        {activeTab === 'resources' && <ResourcesTab/>}
      </main>
    </div>
  );
}
