"use client";
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Award, FileText, DollarSign, LogOut, Search, 
  MapPin, Loader, TrendingUp, PlayCircle, Clock, CheckCircle,
  MessageSquare, Star, ClipboardList, Tv, ChevronRight, FileVideo, BarChart2,
  X, Calendar, Video, User as UserIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import BackButton from './BackButton';

function PracticeSessionView({ courseId }: { courseId: number }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [courseId]);

  useEffect(() => {
    if (!session || session.status !== 'ACTIVE') return;
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(session.expiresAt).getTime();
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft('Expired');
        setSession(null);
        clearInterval(interval);
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${h}h ${m}m ${s}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const fetchSession = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/student/practice-session?courseId=${courseId}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setSession(data.session);
      } else {
        setError(data.message || 'Failed to fetch session');
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const startSession = async () => {
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch('/api/student/practice-session', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.session);
      } else {
        setError(data.message);
      }
    } catch (e: any) {
      setError(e.message);
    }
    setActionLoading(false);
  };

  if (loading) return <div className="p-12 text-center text-gray-500"><Loader size={24} className="animate-spin mx-auto"/>Loading practice environment...</div>;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-200">{error}</div>}
      
      {!session ? (
        <div className="text-center py-12">
          <Tv size={48} className="mx-auto text-blue-200 mb-4"/>
          <h3 className="text-xl font-black text-gray-800 mb-2">Ready to start?</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">Click below to allocate a virtual machine and start your practice session. You will have a limited time to complete your tasks.</p>
          <button 
            onClick={startSession} 
            disabled={actionLoading}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center gap-2 mx-auto disabled:opacity-50"
          >
            {actionLoading ? <Loader size={18} className="animate-spin"/> : <PlayCircle size={18}/>}
            Start Environment
          </button>
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap justify-between items-center mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active VM</p>
              <p className="font-mono font-bold text-blue-800">{session.vmName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Time Remaining</p>
              <p className="text-xl font-black text-orange-500 tabular-nums">{timeLeft}</p>
            </div>
          </div>
          
          <div className="aspect-video bg-black rounded-xl overflow-hidden relative shadow-inner flex items-center justify-center">
            {/* Mock Remote Access Viewer */}
            <div className="text-center text-white/50">
              <Tv size={48} className="mx-auto mb-4 opacity-50"/>
              <p className="font-mono text-sm">[Remote Session Connected]</p>
              <p className="text-xs mt-2 text-white/30">Streaming from {session.vmName}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LearnerPortal({ userRole = 'STUDENT' }: { userRole?: 'STUDENT' | 'AFFILIATE' }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('learning');
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Ongoing Course Modal state
  const [ongoingCourse, setOngoingCourse] = useState<any>(null);
  const [activeCertificate, setActiveCertificate] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [activePracticeCourse, setActivePracticeCourse] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/login'); return; }
    const u = JSON.parse(stored);
    // Allow both STUDENT and AFFILIATE
    if (!['STUDENT', 'AFFILIATE', 'ADMIN'].includes(u.role)) { router.push('/login'); return; }
    setUser(u);
    fetchData();
  }, [router]);

  const fetchData = async () => {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Both roles can use the student dashboard endpoint now
    const res = await fetch('/api/student/dashboard', { headers });
    const result = await res.json();
    if (result.success) setData(result);
    setLoading(false);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const enrollCourse = async (courseId: number) => {
    alert('Enrollment request submitted to Approval System.');
  };

  const handleResumeCourse = (enrollment: any) => {
    if (enrollment.Mode === 'E-Learning (Self-Paced)' || enrollment.Mode === 'E-Learning') {
      setActiveTab('elearning');
    } else {
      setOngoingCourse(enrollment);
    }
  };

  const openPracticeSession = (enrollment: any) => {
    setActivePracticeCourse(enrollment);
    setActiveTab('practice-session');
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader size={32} className="animate-spin text-blue-600"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* HEADER */}
      <header className="bg-gradient-to-r from-blue-900 to-[#004098] text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-blue-900 font-black text-sm">YTS</span>
            </div>
            <div>
              <h1 className="font-bold leading-tight text-white">{userRole === 'AFFILIATE' ? 'Affiliate Portal' : 'Student Portal'}</h1>
              <p className="text-white/60 text-xs hidden sm:block">My Learning Hub</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-blue-200">{user?.organization || userRole}</p>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
                <LogOut size={16}/> <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile-friendly scrollable tabs below main header on all screens, or just responsive */}
        <div className="max-w-7xl mx-auto px-6 border-t border-white/10">
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
            {[
              { id: 'learning', label: 'My Learning', icon: <PlayCircle size={16}/> },
              { id: 'elearning', label: 'E-Learning', icon: <Tv size={16}/> },
              { id: 'assessments', label: 'Assessments', icon: <ClipboardList size={16}/> },
              { id: 'feedback', label: 'Feedback', icon: <MessageSquare size={16}/> },
              { id: 'certificates', label: 'Certificates', icon: <Award size={16}/> },
              { id: 'invoices', label: 'Billing', icon: <DollarSign size={16}/> },
              { id: 'materials', label: 'Materials', icon: <BookOpen size={16}/> },
              { id: 'inbox', label: 'Inbox', icon: <MessageSquare size={16}/> },
              { id: 'profile', label: 'Profile', icon: <UserIcon size={16}/> },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white/90'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* STATS STRIP */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <PlayCircle size={24}/>
            </div>
            <div>
              <p className="text-2xl font-black text-gray-800">{data?.enrollments?.filter((e:any) => e.Status !== 'COMPLETED').length || 0}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Active Courses</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
              <CheckCircle size={24}/>
            </div>
            <div>
              <p className="text-2xl font-black text-gray-800">{data?.enrollments?.filter((e:any) => e.Status === 'COMPLETED').length || 0}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Completed</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Award size={24}/>
            </div>
            <div>
              <p className="text-2xl font-black text-gray-800">{data?.certificates?.length || 0}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Certificates</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-center">
             <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Next Class</span>
             </div>
             {data?.enrollments?.filter((e:any) => e.Status !== 'COMPLETED' && e.StartDate)?.[0] ? (
               <p className="text-sm font-bold text-blue-600 truncate">{new Date(data.enrollments.filter((e:any) => e.Status !== 'COMPLETED' && e.StartDate)[0].StartDate).toLocaleDateString()}</p>
             ) : (
               <p className="text-sm font-bold text-gray-400">No upcoming classes</p>
             )}
          </div>
        </div>

        {/* TAB CONTENT */}
        
        {/* LEARNING TAB */}
        {activeTab === 'learning' && (
          <div className="space-y-6">
            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
              <PlayCircle size={20} className="text-blue-600"/> My Enrollments
            </h2>
            {data?.enrollments?.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data.enrollments.map((e: any) => (
                  <div key={e.EnrollmentID} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase rounded-full ${
                        e.Status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                        e.Status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      }`}>{e.Status}</span>
                      <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">{e.Mode}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{e.CourseTitle}</h3>
                    {e.DateApprovalStatus === 'PENDING' ? (
                      <p className="text-sm text-orange-500 mb-3 flex items-center gap-2 font-bold">
                        <Clock size={14} className="text-orange-400"/> Requested: {new Date(e.OriginalStartDate).toLocaleDateString()} - {new Date(e.OriginalEndDate).toLocaleDateString()} (Pending)
                      </p>
                    ) : e.FinalStartDate ? (
                      <p className="text-sm text-green-600 mb-3 flex items-center gap-2 font-bold">
                        <Clock size={14} className="text-green-500"/> {new Date(e.FinalStartDate).toLocaleDateString()} - {new Date(e.FinalEndDate).toLocaleDateString()} (Approved)
                      </p>
                    ) : e.DateApprovalStatus === 'REJECTED' ? (
                      <p className="text-sm text-red-500 mb-3 flex items-center gap-2 font-bold">
                        <Clock size={14} className="text-red-400"/> Requested Dates Rejected
                      </p>
                    ) : e.StartDate ? (
                      <p className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                        <Clock size={14} className="text-gray-400"/> {new Date(e.StartDate).toLocaleDateString()} - {new Date(e.EndDate).toLocaleDateString()}
                      </p>
                    ) : null}
                    {/* Access period and expiry */}
                    {e.AccessEndDate && (
                      <div className={`mb-3 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                        e.AccessExpired
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-green-50 text-green-700 border border-green-200'
                      }`}>
                        <Clock size={12}/>
                        {e.AccessExpired
                          ? `⚠ Course Access Expired (${new Date(e.AccessEndDate).toLocaleDateString()})`
                          : `Access until ${new Date(e.AccessEndDate).toLocaleDateString()} · ${e.DurationDays || '?'} days`
                        }
                      </div>
                    )}

                    {e.TrainerName && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <UserIcon size={10}/> Trainer: {e.TrainerName}
                        </p>
                      )}
                      {e.Location && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPin size={10}/> {e.Location}
                        </p>
                      )}
                      <div className="mt-auto pt-4">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                              <span>Progress</span>
                              <span>{e.ComputedProgress ?? e.ProgressPercent ?? (e.Status === 'COMPLETED' ? 100 : 0)}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full transition-all ${e.Status === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${e.ComputedProgress ?? e.ProgressPercent ?? (e.Status === 'COMPLETED' ? 100 : 0)}%` }}></div>
                            </div>
                            {!e.IsELearning && e.AccessStartDate && (
                              <p className="text-[9px] text-gray-400 mt-0.5">Auto-calculated from training dates</p>
                            )}
                          </div>
                          <div>
                            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                              <span>Attendance</span>
                              <span>{Math.round(e.AttendancePercentage || 0)}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full ${Math.round(e.AttendancePercentage||0) >= 75 ? 'bg-green-500' : 'bg-orange-400'}`} style={{ width: `${Math.round(e.AttendancePercentage || 0)}%` }}></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mb-4">
                          {userRole === 'STUDENT' && e.AccessExpired && (
                            <button onClick={() => setActiveTab('assessments')} className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 hover:bg-blue-100 transition-colors"><ClipboardList size={10}/> Attend Quiz</button>
                          )}
                          {e.AccessExpired && (
                            <button onClick={() => setActiveTab('feedback')} className="flex items-center gap-1 text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-100 hover:bg-purple-100 transition-colors"><MessageSquare size={10}/> Give Feedback</button>
                          )}
                        </div>
                        
                        <div className="flex gap-3">
                          {e.Status === 'COMPLETED' ? (
                            <button className="flex-1 py-2.5 bg-green-50 text-green-700 rounded-xl text-sm font-bold border border-green-200 hover:bg-green-100 transition-colors flex items-center justify-center gap-2">
                              <Award size={16}/> View Certificate
                            </button>
                          ) : !e.AccessStarted ? (
                            <div className="flex-1 py-2.5 bg-gray-100 text-gray-500 rounded-xl text-sm font-bold border border-gray-200 flex items-center justify-center gap-2 cursor-not-allowed">
                              🔒 Course Not Yet Started
                            </div>
                          ) : e.AccessExpired ? (
                            <div className="flex-1 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-200 flex items-center justify-center gap-2 cursor-not-allowed">
                              🔒 Course Access Expired
                            </div>
                          ) : (
                            <>
                              <button 
                                onClick={() => handleResumeCourse(e)}
                                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                              >
                                <PlayCircle size={16}/> {e.Mode === 'E-Learning (Self-Paced)' || e.Mode === 'E-Learning' || e.IsELearning ? 'Open E-Learning' : 'View Schedule'}
                              </button>
                              {e.TemplateID && (
                                <button 
                                  onClick={() => openPracticeSession(e)}
                                  className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30"
                                >
                                  <Tv size={16}/> Practice Session
                                </button>
                              )}
                            </>
                          )}
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full mx-auto flex items-center justify-center mb-4">
                  <BookOpen size={24}/>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">You aren't enrolled in any courses yet.</h3>
                <p className="text-gray-500 mb-6">Browse our catalog to find the perfect training for you.</p>
                <button onClick={() => setActiveTab('catalog')} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30">
                  Browse Catalog
                </button>
              </div>
            )}
          </div>
        )}

        {/* PRACTICE SESSION TAB */}
        {activeTab === 'practice-session' && activePracticeCourse && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveTab('learning')} className="p-2 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100">
                  <X size={16}/>
                </button>
                <h2 className="font-black text-gray-800">Practice Session: {activePracticeCourse.CourseTitle}</h2>
              </div>
            </div>
            
            <PracticeSessionView courseId={activePracticeCourse.CourseID} />
          </div>
        )}

        {/* CATALOG TAB */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <h2 className="font-black text-gray-800">Course Catalog</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15}/>
                <input type="text" placeholder="Search courses..." className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 ring-blue-100 w-64"/>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.catalog?.map((c: any, i: number) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col h-full group">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase rounded-full ${
                      c.Mode === 'CILT' ? 'bg-orange-100 text-orange-700' :
                      c.Mode === 'VILT' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>{c.Mode}</span>
                    <span className="text-lg font-black text-gray-800 group-hover:text-blue-600 transition-colors">${c.FeeUSD}</span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg mb-2 flex-1">{c.Title}</h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{c.Description}</p>
                  
                  <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 mb-6 bg-gray-50 p-3 rounded-xl">
                    <span className="flex items-center gap-1.5"><BookOpen size={14} className="text-blue-400"/> {c.Code}</span>
                    <span className="w-px h-4 bg-gray-200"></span>
                    <span className="flex items-center gap-1.5"><TrendingUp size={14} className="text-orange-400"/> {c.Duration}</span>
                  </div>
                  
                  <button onClick={() => enrollCourse(c.CourseID)} className="w-full py-3 bg-white text-blue-600 border border-blue-200 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors">
                    Request Enrollment
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CERTIFICATES TAB */}
        {activeTab === 'certificates' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {activeCertificate ? (
              <div className="p-8">
                <div className="mb-6">
                  <BackButton onClick={() => setActiveCertificate(null)} label="Back to Certificates" />
                </div>
                <div className="border border-gray-200 rounded-3xl p-10 bg-gradient-to-br from-white to-gray-50 max-w-3xl mx-auto shadow-xl text-center">
                   <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-full mx-auto flex items-center justify-center mb-6">
                     <Award size={40} />
                   </div>
                   <h1 className="text-4xl font-black text-[#004098] mb-4">Certificate of Completion</h1>
                   <p className="text-gray-500 mb-8 text-lg">This is to certify that</p>
                   <p className="text-3xl font-bold text-gray-800 border-b-2 border-gray-200 inline-block px-10 pb-2 mb-8">{user?.firstName} {user?.lastName}</p>
                   <p className="text-gray-500 mb-4 text-lg">has successfully completed the course</p>
                   <h2 className="text-2xl font-black text-blue-800 mb-10">{activeCertificate.CourseName}</h2>
                   
                   <div className="grid grid-cols-2 gap-8 text-left mt-10">
                     <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                       <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Issue Date</p>
                       <p className="font-semibold text-gray-800">{new Date(activeCertificate.IssueDate).toLocaleDateString()}</p>
                     </div>
                     <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                       <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Certificate ID</p>
                       <p className="font-mono font-bold text-blue-600">{activeCertificate.CertificateNo}</p>
                     </div>
                   </div>
                   
                   <button className="mt-10 bg-[#004098] text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-800 transition-colors shadow-lg">Download Official PDF</button>
                </div>
              </div>
            ) : (
              <>
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-800">My Certificates</h2>
              <p className="text-sm text-gray-500">Download and verify your earned credentials.</p>
            </div>
            {data?.certificates?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {data.certificates.map((cert: any, i: number) => (
                  <div key={i} className="border border-gray-200 rounded-2xl p-5 hover:border-blue-300 transition-colors bg-gradient-to-br from-white to-gray-50">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                      <Award size={24}/>
                    </div>
                    <h3 className="font-bold text-gray-800 mb-1 leading-tight">{cert.CourseName}</h3>
                    <p className="text-xs font-mono text-blue-600 font-bold mb-4">{cert.CertificateNo}</p>
                    <div className="text-xs text-gray-500 space-y-1 mb-5">
                      <p>Issued: {new Date(cert.IssueDate).toLocaleDateString()}</p>
                      <p>Instructor: {cert.TrainerName}</p>
                    </div>
                    <button onClick={() => setActiveCertificate(cert)} className="w-full py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors">
                      View Certificate Details
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-400 text-sm">You haven't earned any certificates yet. Complete a course to earn one.</div>
            )}
            </>
            )}
          </div>
        )}

        {/* INVOICES TAB */}
        {activeTab === 'invoices' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-black text-gray-400 uppercase tracking-widest">Invoice No</th>
                  <th className="px-5 py-3.5 text-xs font-black text-gray-400 uppercase tracking-widest">Course</th>
                  <th className="px-5 py-3.5 text-xs font-black text-gray-400 uppercase tracking-widest">Amount</th>
                  <th className="px-5 py-3.5 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-5 py-3.5 text-xs font-black text-gray-400 uppercase tracking-widest">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.invoices?.map((inv: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-mono text-sm text-blue-600 font-bold">{inv.InvoiceNo}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-800">{inv.CourseName}</td>
                    <td className="px-5 py-3.5 text-sm font-bold text-gray-700">{inv.Currency} {inv.Amount}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        inv.Status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {inv.Status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{new Date(inv.IssuedDate).toLocaleDateString()}</td>
                  </tr>
                ))}
                {data?.invoices?.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400 text-sm">No billing records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-gray-800">My Profile</h2>
            
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
              <div className="p-8 bg-gray-50 md:w-1/3 border-r border-gray-100 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-3xl mb-4 relative overflow-hidden shadow-inner">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <h3 className="font-bold text-lg text-gray-800">{user?.firstName} {user?.lastName}</h3>
                <p className="text-sm font-semibold text-gray-500 mb-2">{user?.email}</p>
                <div className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">{userRole}</div>
              </div>
              
              <div className="p-8 md:w-2/3">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-bold text-gray-800 border-b-2 border-orange-500 pb-1 inline-block">Contact & Details</h4>
                  <button onClick={() => setIsEditingProfile(!isEditingProfile)} className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                    {isEditingProfile ? 'Cancel Edit' : 'Edit Details'}
                  </button>
                </div>
                
                {isEditingProfile ? (
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsEditingProfile(false); }}>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs font-bold text-gray-500 uppercase">First Name</label><input type="text" defaultValue={user?.firstName} className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none" /></div>
                      <div><label className="text-xs font-bold text-gray-500 uppercase">Last Name</label><input type="text" defaultValue={user?.lastName} className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none" /></div>
                    </div>
                    <div><label className="text-xs font-bold text-gray-500 uppercase">Organization</label><input type="text" defaultValue={user?.organization} className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none" /></div>
                    <div><label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label><input type="text" placeholder="+1 234 567 8900" className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none" /></div>
                    <button type="submit" className="bg-[#004098] text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-800 mt-4 shadow-md">Save Changes</button>
                  </form>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    <div><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Organization</p><p className="font-semibold text-gray-800">{user?.organization || 'Independent Learner'}</p></div>
                    <div><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Phone</p><p className="font-semibold text-gray-800">+1 234 567 8900</p></div>
                    <div><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Joined Date</p><p className="font-semibold text-gray-800">Oct 12, 2023</p></div>
                    <div><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Timezone</p><p className="font-semibold text-gray-800">GMT+8 (Singapore)</p></div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Clock size={18} className="text-orange-500"/> Learning History</h4>
                <div className="space-y-4">
                  {data?.enrollments?.filter((e:any) => e.Status === 'COMPLETED').map((e:any, i:number) => (
                    <div key={i} className="flex justify-between items-center pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                      <div>
                        <p className="font-bold text-sm text-gray-800">{e.CourseTitle}</p>
                        <p className="text-xs text-gray-500">Completed on {new Date().toLocaleDateString()}</p>
                      </div>
                      <CheckCircle size={16} className="text-green-500"/>
                    </div>
                  ))}
                  {(!data?.enrollments || data.enrollments.filter((e:any) => e.Status === 'COMPLETED').length === 0) && (
                    <p className="text-sm text-gray-500 italic">No completed courses yet.</p>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Award size={18} className="text-yellow-500"/> My Certificates</h4>
                <div className="space-y-4">
                  {data?.certificates?.slice(0,3).map((c:any, i:number) => (
                    <div key={i} className="flex justify-between items-center pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                      <div>
                        <p className="font-bold text-sm text-gray-800">{c.CourseName}</p>
                        <p className="text-xs text-gray-500">ID: {c.CertificateNo}</p>
                      </div>
                      <button onClick={() => setActiveTab('certificates')} className="text-blue-600 font-bold text-xs hover:underline">View</button>
                    </div>
                  ))}
                  {(!data?.certificates || data.certificates.length === 0) && (
                    <p className="text-sm text-gray-500 italic">No certificates earned yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* E-LEARNING TAB */}
        {activeTab === 'elearning' && <ELearningViewer setActiveTab={setActiveTab} />}

        {/* ASSESSMENTS TAB */}
        {activeTab === 'assessments' && <AssessmentsTab />}

        {/* MATERIALS TAB */}
        {activeTab === 'materials' && <StudentMaterialsTab />}

        {/* INBOX TAB */}
        {activeTab === 'inbox' && <StudentInboxTab />}

        {/* FEEDBACK TAB */}
        {activeTab === 'feedback' && <FeedbackTab />}

      </main>

      {/* ONGOING COURSE MODAL */}
      {ongoingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 to-[#004098] p-6 text-white relative">
              <BackButton onClick={() => setOngoingCourse(null)} label="Close" className="absolute top-4 right-4 text-white hover:text-gray-200 hover:bg-white/10 px-3 py-1.5 rounded-xl transition-colors" />
              <div className="flex gap-2 mb-3 mt-4">
                <span className="bg-blue-500/30 text-blue-100 text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">{ongoingCourse.Mode}</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                  ongoingCourse.Status === 'PENDING' ? 'bg-orange-500/30 text-orange-100' : 'bg-green-500/30 text-green-100'
                }`}>{ongoingCourse.Status}</span>
              </div>
              <h2 className="text-2xl font-black mb-1">{ongoingCourse.CourseTitle}</h2>
              <p className="text-blue-200 text-sm">{ongoingCourse.CourseCode || 'Yokogawa Certified Training'}</p>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Calendar size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Schedule</span>
                  </div>
                  {ongoingCourse.StartDate ? (
                    <div className="font-semibold text-gray-800">
                      {new Date(ongoingCourse.StartDate).toLocaleDateString()} - <br/>
                      {new Date(ongoingCourse.EndDate).toLocaleDateString()}
                    </div>
                  ) : (
                    <div className="font-semibold text-gray-800">To be announced</div>
                  )}
                </div>
                
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <MapPin size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {ongoingCourse.Mode === 'Online Training' ? 'Meeting Link' : 'Location'}
                    </span>
                  </div>
                  <div className="font-semibold text-gray-800 break-words">
                    {ongoingCourse.Location ? (
                      ongoingCourse.Mode === 'Online Training' && ongoingCourse.Location.startsWith('http') ? (
                        <a href={ongoingCourse.Location} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Join Meeting</a>
                      ) : (
                        ongoingCourse.Location
                      )
                    ) : 'Pending Trainer Assignment'}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Award size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Trainer</span>
                  </div>
                  <div className="font-semibold text-gray-800">
                    {ongoingCourse.TrainerName || 'Not Assigned Yet'}
                  </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  <span>Course Progress</span>
                  <span className="text-blue-600">{ongoingCourse.ProgressPercent || (ongoingCourse.Status === 'COMPLETED' ? 100 : 0)}%</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${ongoingCourse.Status === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${ongoingCourse.ProgressPercent || (ongoingCourse.Status === 'COMPLETED' ? 100 : 0)}%` }}></div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ELearningViewer({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const [courses, setCourses] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeContent, setActiveContent] = React.useState<any>(null);
  const [activeCourse, setActiveCourse] = React.useState<any>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    (async () => {
      const token = localStorage.getItem('auth_token') || '';
      try {
        const res = await fetch('/api/student/elearning', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) setCourses(data.courses || []);
      } catch { /* silently fail if tables not yet created */ }
      setLoading(false);
    })();
  }, []);

  const saveProgress = async (contentId: number, watchedSecs: number, totalSecs: number, completed: boolean, lastPos: number) => {
    const token = localStorage.getItem('auth_token') || '';
    await fetch('/api/student/elearning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ contentId, watchedSeconds: Math.round(watchedSecs), totalSeconds: Math.round(totalSecs), isCompleted: completed, lastPosition: Math.round(lastPos) }),
    });
  };

  const activeContentRef = React.useRef<any>(null);
  React.useEffect(() => {
    activeContentRef.current = activeContent;
  }, [activeContent]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const scormAPI = {
        LMSInitialize: function(param: string) { return "true"; },
        LMSFinish: function(param: string) { return "true"; },
        LMSGetValue: function(element: string) {
          if (element === "cmi.core.student_id") return "student";
          if (element === "cmi.core.student_name") return "Student";
          if (element === "cmi.core.lesson_status") return activeContentRef.current?.IsCompleted ? "passed" : "incomplete";
          return "";
        },
        LMSSetValue: function(element: string, value: string) {
          if (element === "cmi.core.lesson_status") {
            if (value === "passed" || value === "completed") {
              if (activeContentRef.current) {
                saveProgress(activeContentRef.current.ContentID, 100, 100, true, 0);
                setCourses(prev => prev.map(c => ({
                  ...c,
                  content: c.content.map((ct: any) => ct.ContentID === activeContentRef.current.ContentID ? {...ct, IsCompleted: 1} : ct)
                })));
              }
            }
          }
          return "true";
        },
        LMSCommit: function(param: string) { return "true"; },
        LMSGetLastError: function() { return "0"; },
        LMSGetErrorString: function(errorCode: string) { return ""; },
        LMSGetDiagnostic: function(errorCode: string) { return ""; }
      };

      (window as any).API = scormAPI;
    }
  }, []);

  const handleTimeUpdate = (item: any) => {
    const v = videoRef.current;
    if (!v) return;
    const pct = v.duration > 0 ? (v.currentTime / v.duration) * 100 : 0;
    if (pct >= 90) saveProgress(item.ContentID, v.currentTime, v.duration, true, v.currentTime);
  };

  const handleVideoEnded = (item: any) => {
    const v = videoRef.current;
    if (!v) return;
    saveProgress(item.ContentID, v.duration, v.duration, true, 0);
    // Update local state
    setCourses(prev => prev.map(c => ({
      ...c,
      content: c.content.map((ct: any) => ct.ContentID === item.ContentID ? {...ct, IsCompleted: 1} : ct)
    })));
  };

  const openPdf = (course: any, item: any) => {
    setActiveCourse(course);
    setActiveContent(item);
    // Automatically mark PDF as read after 3 seconds
    setTimeout(() => {
      saveProgress(item.ContentID, 100, 100, true, 0);
      setCourses(prev => prev.map(c => ({
        ...c,
        content: c.content.map((ct: any) => ct.ContentID === item.ContentID ? {...ct, IsCompleted: 1} : ct)
      })));
    }, 3000);
  };

  if (loading) return <div className="p-12 text-center"><Loader size={24} className="animate-spin mx-auto text-gray-300"/></div>;

  if (courses.length === 0) return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
      <div className="w-16 h-16 bg-blue-50 rounded-2xl mx-auto mb-4 flex items-center justify-center"><Tv size={24} className="text-blue-400"/></div>
      <h3 className="text-lg font-bold text-gray-700 mb-2">No E-Learning Courses</h3>
      <p className="text-gray-400 text-sm">You don't have any E-Learning courses yet. Register for an E-Learning course to get started.</p>
    </div>
  );

  // Content Viewer (Video or PDF)
  if (activeContent && activeCourse) return (
    <div className="space-y-4">
      {/* Navigation row — Back to course list + Back to Dashboard */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <BackButton onClick={() => setActiveContent(null)} label={`← Back to ${activeCourse.CourseTitle}`} className="bg-white px-4 py-2 rounded-xl shadow-sm w-fit" />
        {setActiveTab && (
          <button
            onClick={() => setActiveTab('learning')}
            className="flex items-center gap-2 bg-[#004098] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-800 transition-colors shadow-sm"
          >
            🏠 Back to Dashboard
          </button>
        )}
      </div>
      
      <div className="bg-black rounded-2xl overflow-hidden shadow-2xl relative select-none group">
        {activeContent.ContentType === 'VIDEO' ? (
          <>
            <video
              ref={videoRef}
              key={activeContent.ContentID}
              src={`/api/stream/video?file=${encodeURIComponent(activeContent.FilePath)}`}
              controls
              controlsList="nodownload nofullscreen noremoteplayback"
              onContextMenu={(e) => e.preventDefault()}
              onTimeUpdate={() => handleTimeUpdate(activeContent)}
              onEnded={() => handleVideoEnded(activeContent)}
              onLoadedMetadata={() => {
                if (videoRef.current && activeContent.LastPosition > 0) {
                  videoRef.current.currentTime = activeContent.LastPosition;
                }
              }}
              autoPlay
              disablePictureInPicture
              className="w-full max-h-[75vh] bg-black pointer-events-auto"
              style={{ outline: 'none', userSelect: 'none' }}
            />
            {/* Watermark Overlay */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-[0.05] z-50 mix-blend-overlay">
               {Array.from({ length: 5 }).map((_, i) => (
                 <div key={i} className="flex gap-16 -rotate-45 my-8 transform scale-150">
                    <span className="text-white font-black text-2xl tracking-widest uppercase">
                      CONFIDENTIAL - DO NOT DISTRIBUTE
                    </span>
                 </div>
               ))}
            </div>
            {/* User Identifier Watermark */}
            <div className="absolute top-4 right-4 pointer-events-none opacity-20 z-50 text-white font-mono text-xs select-none bg-black/30 px-2 py-1 rounded">
               User Email · {new Date().toISOString().split('T')[0]}
            </div>
          </>
        ) : activeContent.ContentType === 'SCORM' ? (
          <div className="w-full h-[75vh] bg-white relative">
            <iframe src={activeContent.FilePath || "/manual/scormcontent/index.html"} className="w-full h-full border-0" title={activeContent.Title}></iframe>
          </div>
        ) : (
          <div className="w-full h-[75vh] bg-gray-100 relative">
             <iframe src={activeContent.FilePath} className="w-full h-full border-0" title={activeContent.Title}></iframe>
             <div className="absolute bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2 animate-bounce">
                <CheckCircle size={18}/> PDF Marked as Read
             </div>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{activeContent.Title}</h3>
        {activeContent.Description && <p className="text-sm text-gray-500 leading-relaxed mb-4">{activeContent.Description}</p>}
        {activeContent.IsCompleted ? (
          <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-xs font-bold"><CheckCircle size={14}/> Completed</span>
        ) : (
          <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full text-xs font-bold">In Progress</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {courses.map((course: any) => (
        <div key={course.EnrollmentID} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Course Header */}
          <div className="bg-gradient-to-r from-blue-900 to-[#004098] p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-white font-black text-xl mb-1">{course.CourseTitle}</h3>
                <p className="text-white/70 text-sm">{course.CourseCode} · {course.Duration}</p>
              </div>
              <div className="text-right shrink-0 bg-white/10 p-3 rounded-2xl">
                <p className="text-white font-black text-3xl leading-none">{course.contentProgress}%</p>
                <p className="text-white/60 text-xs font-bold uppercase tracking-wider mt-1">Complete</p>
              </div>
            </div>
            <div className="mt-5">
              <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-green-400 rounded-full transition-all duration-1000" style={{ width: `${course.contentProgress}%` }}/>
              </div>
              <p className="text-white/70 text-xs mt-2 font-medium">{course.completedContent} of {course.totalContent} items completed</p>
            </div>
          </div>

          {/* Content List */}
          <div className="divide-y divide-gray-50 p-2">
            {course.content.map((item: any) => (
              <div key={item.ContentID} className="px-4 py-4 flex items-center gap-4 hover:bg-gray-50/80 rounded-xl transition-colors group">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${ item.IsCompleted ? 'bg-green-100 border border-green-200' : 'bg-blue-50 border border-blue-100'}`}>
                  {item.ContentType === 'VIDEO' || item.ContentType === 'SYNTHESIA'
                    ? <Video size={20} className={item.IsCompleted ? 'text-green-600' : 'text-blue-600'}/>
                    : <FileText size={20} className={item.IsCompleted ? 'text-green-600' : 'text-orange-500'}/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 group-hover:text-blue-700 transition-colors">{item.Title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.ContentType} {item.DurationSec > 0 ? `· ${Math.floor(item.DurationSec/60)}m ${item.DurationSec%60}s` : ''}
                    {item.LastPosition > 0 && !item.IsCompleted && ` · Paused at ${Math.floor(item.LastPosition/60)}m`}
                  </p>
                </div>
                {item.IsCompleted && <CheckCircle size={20} className="text-green-500 shrink-0"/>}
                {item.ContentType === 'VIDEO' ? (
                  <button onClick={() => { setActiveCourse(course); setActiveContent(item); }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-md shadow-blue-500/20">
                    <PlayCircle size={16}/> {item.IsCompleted ? 'Replay' : item.LastPosition > 0 ? 'Resume' : 'Play'}
                  </button>
                ) : item.ContentType === 'SCORM' ? (
                  <button onClick={() => { setActiveCourse(course); setActiveContent(item); }}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-md shadow-purple-500/20">
                    <PlayCircle size={16}/> Open SCORM
                  </button>
                ) : item.ContentType === 'SYNTHESIA' ? (
                  <button onClick={() => window.open(item.FilePath, '_blank')}
                    className="flex items-center gap-2 bg-[#004098] hover:bg-blue-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-md shadow-blue-500/20">
                    <PlayCircle size={16}/> Play Video
                  </button>
                ) : (
                  <button onClick={() => openPdf(course, item)}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-md shadow-orange-500/20">
                    <FileText size={16}/> Read PDF
                  </button>
                )}
              </div>
            ))}
            {course.content.length === 0 && (
              <div className="px-5 py-12 text-center text-gray-400 text-sm">No content has been added for this course yet.</div>
            )}
          </div>

          {course.contentProgress >= 100 && (
            <div className="m-4 px-6 py-5 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle size={24}/>
              </div>
              <div>
                <p className="text-base font-black text-green-800">Course Completed! 🎉</p>
                <p className="text-sm text-green-600 mt-0.5">You may now request your certificate from the Certificates tab.</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── ASSESSMENTS TAB ──
function AssessmentsTab() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAssessment, setActiveAssessment] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [quizLoading, setQuizLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const token = () => localStorage.getItem('auth_token') || '';

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/student/assessment', { headers: { Authorization: `Bearer ${token()}` } });
      const d = await res.json();
      if (d.success) setAssessments(d.assessments);
      setLoading(false);
    })();
  }, []);

  const startAssessment = async (assessment: any) => {
    setQuizLoading(true); setResult(null); setAnswers({});
    const res = await fetch('/api/student/assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ action: 'GET_QUESTIONS', assessmentId: assessment.AssessmentID }),
    });
    const d = await res.json();
    if (d.success) { setQuestions(d.questions); setActiveAssessment(assessment); }
    else alert(d.message);
    setQuizLoading(false);
  };

  const submitAssessment = async () => {
    if (!activeAssessment) return;
    setQuizLoading(true);
    const res = await fetch('/api/student/assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ action: 'SUBMIT', assessmentId: activeAssessment.AssessmentID, answers }),
    });
    const d = await res.json();
    setResult(d);
    setQuizLoading(false);
  };

  if (loading) return <div className="p-12 text-center"><Loader size={24} className="animate-spin mx-auto text-gray-300"/></div>;

  if (activeAssessment && !result) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-xl font-black text-gray-800 mb-1">{activeAssessment.Title}</h2>
          <p className="text-sm text-gray-500">{activeAssessment.CourseTitle} · {activeAssessment.TotalMarks} marks · Pass: {activeAssessment.PassMarks}</p>
        </div>
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={q.QuestionID} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <p className="font-bold text-gray-800 mb-4">Q{i + 1}. {q.QuestionText}</p>
              <div className="space-y-2">
                {['A', 'B', 'C', 'D'].map(opt => {
                  const text = q[`Option${opt}`];
                  if (!text) return null;
                  const selected = answers[q.QuestionID] === opt;
                  return (
                    <label key={opt} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}>
                      <input type="radio" name={`q-${q.QuestionID}`} value={opt} checked={selected} onChange={() => setAnswers(prev => ({ ...prev, [q.QuestionID]: opt }))} className="accent-blue-600"/>
                      <span className={`font-semibold text-sm ${selected ? 'text-blue-800' : 'text-gray-700'}`}>{opt}. {text}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4">
          <button onClick={submitAssessment} disabled={quizLoading} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {quizLoading ? <Loader size={16} className="animate-spin"/> : <CheckCircle size={16}/>} Submit Assessment
          </button>
          <button onClick={() => setActiveAssessment(null)} className="border border-gray-200 px-6 py-3 rounded-xl font-bold hover:bg-gray-50">Cancel</button>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
        <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6 ${result.passed ? 'bg-green-100' : 'bg-red-100'}`}>
          {result.passed ? <CheckCircle size={40} className="text-green-600"/> : <X size={40} className="text-red-500"/>}
        </div>
        <h2 className="text-2xl font-black text-gray-800 mb-2">{result.passed ? 'Congratulations! 🎉' : 'Keep Trying!'}</h2>
        <p className="text-gray-500 mb-6">{result.message}</p>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4"><p className="text-2xl font-black text-gray-800">{result.score}</p><p className="text-xs text-gray-400 font-bold uppercase">Score</p></div>
          <div className="bg-gray-50 rounded-xl p-4"><p className="text-2xl font-black text-gray-800">{result.percentage}%</p><p className="text-xs text-gray-400 font-bold uppercase">Percentage</p></div>
          <div className={`rounded-xl p-4 ${result.passed ? 'bg-green-50' : 'bg-red-50'}`}><p className={`text-xl font-black ${result.passed ? 'text-green-700' : 'text-red-600'}`}>{result.passed ? 'PASS' : 'FAIL'}</p><p className="text-xs text-gray-400 font-bold uppercase">Result</p></div>
        </div>
        <div className="flex gap-4 justify-center">
          {result.pdfUrl && (
            <button onClick={() => window.open(result.pdfUrl, '_blank')} className="bg-orange-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-600 flex items-center gap-2">
              <FileText size={18}/> View Certificate / Report
            </button>
          )}
          <button onClick={() => { setActiveAssessment(null); setResult(null); }} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700">Back to Assessments</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-black text-gray-800 flex items-center gap-2"><ClipboardList size={20} className="text-blue-600"/> My Assessments</h2>
      {assessments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <ClipboardList size={40} className="text-gray-300 mx-auto mb-4"/>
          <p className="text-gray-500 font-semibold">No assessments assigned yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {assessments.map((a: any) => (
            <div key={a.AssessmentID} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">{a.Title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{a.CourseTitle}</p>
                </div>
                {a.ResultID ? (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${a.Passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{a.Passed ? 'Passed' : 'Failed'}</span>
                ) : (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-600">Pending</span>
                )}
              </div>
              <div className="flex gap-3 text-xs text-gray-500 mb-4">
                <span>{a.TotalMarks} marks</span><span>·</span><span>Pass: {a.PassMarks}</span><span>·</span><span>{a.QuestionCount}Q</span><span>·</span><span>{a.DurationMinutes}min</span>
              </div>
              {a.ResultID ? (
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-sm font-bold text-gray-700">Score: {a.Score}/{a.TotalMarks} ({Math.round(a.Percentage)}%)</p>
                  <p className="text-xs text-gray-400 mt-0.5">Attempted on {new Date(a.AttemptedAt).toLocaleDateString()}</p>
                </div>
              ) : (
                <button onClick={() => startAssessment(a)} disabled={quizLoading} className="mt-auto w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  {quizLoading ? <Loader size={14} className="animate-spin"/> : <PlayCircle size={14}/>} Start Assessment
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── FEEDBACK TAB ──
function FeedbackTab() {
  const [pending, setPending] = useState<any[]>([]);
  const [submitted, setSubmitted] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFeedback, setActiveFeedback] = useState<any>(null);
  const [form, setForm] = useState({ overallScore: 0, contentScore: 0, trainerScore: 0, facilityScore: 0, remarks: '' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const token = () => localStorage.getItem('auth_token') || '';

  const load = async () => {
    const res = await fetch('/api/student/feedback', { headers: { Authorization: `Bearer ${token()}` } });
    const d = await res.json();
    if (d.success) { setPending(d.pending || []); setSubmitted(d.submitted || []); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submitFeedback = async () => {
    if (!activeFeedback || form.overallScore === 0) { setMsg('Please rate at least Overall score'); return; }
    setSubmitting(true); setMsg('');
    const res = await fetch('/api/student/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({
        courseId: activeFeedback.CourseID,
        courseName: activeFeedback.CourseTitle,
        trainerId: activeFeedback.TrainerID,
        trainerName: activeFeedback.TrainerName,
        overallScore: form.overallScore,
        contentScore: form.contentScore || form.overallScore,
        trainerScore: form.trainerScore || form.overallScore,
        facilityScore: form.facilityScore || form.overallScore,
        remarks: form.remarks,
        trainingDate: activeFeedback.StartDate,
      }),
    });
    const d = await res.json();
    setMsg(d.message);
    if (d.success) { 
      if (d.pdfUrl) {
        window.open(d.pdfUrl, '_blank');
      }
      setActiveFeedback(null); 
      load(); 
    }
    setSubmitting(false);
  };

  const StarRating = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div className="mb-4">
      <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
      <div className="flex gap-2 flex-wrap">
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)} className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${n <= value ? 'bg-yellow-400 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-yellow-100'}`}>{n}</button>
        ))}
      </div>
    </div>
  );

  if (loading) return <div className="p-12 text-center"><Loader size={24} className="animate-spin mx-auto text-gray-300"/></div>;

  if (activeFeedback) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-4">
        <h2 className="text-xl font-black text-gray-800 mb-1">Course Feedback</h2>
        <p className="text-sm text-gray-500">{activeFeedback.CourseTitle}</p>
        {msg && <div className={`text-sm p-3 rounded-xl ${msg.includes('success') || msg.includes('Thank') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{msg}</div>}
        <StarRating label="Overall Experience (1-10) *" value={form.overallScore} onChange={v => setForm(f => ({...f, overallScore: v}))}/>
        <StarRating label="Course Content Quality" value={form.contentScore} onChange={v => setForm(f => ({...f, contentScore: v}))}/>
        {activeFeedback.TrainerName && <StarRating label="Trainer Effectiveness" value={form.trainerScore} onChange={v => setForm(f => ({...f, trainerScore: v}))}/>}
        <StarRating label="Facility / Platform Quality" value={form.facilityScore} onChange={v => setForm(f => ({...f, facilityScore: v}))}/>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Additional Comments</label>
          <textarea rows={4} value={form.remarks} onChange={e => setForm(f => ({...f, remarks: e.target.value}))} placeholder="Share your experience, suggestions..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 ring-blue-100 resize-none"/>
        </div>
        <div className="flex gap-3">
          <button onClick={submitFeedback} disabled={submitting || form.overallScore === 0} className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <Loader size={14} className="animate-spin"/> : <Star size={14}/>} Submit Feedback
          </button>
          <button onClick={() => setActiveFeedback(null)} className="flex-1 border border-gray-200 py-3 rounded-xl font-bold hover:bg-gray-50">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-black text-gray-800 flex items-center gap-2"><MessageSquare size={20} className="text-purple-600"/> Course Feedback</h2>
      {pending.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Awaiting Your Feedback</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pending.map((p: any) => (
              <div key={p.EnrollmentID} className="bg-white rounded-2xl p-6 border-2 border-purple-100 shadow-sm flex flex-col">
                <h4 className="font-bold text-gray-800 mb-1">{p.CourseTitle}</h4>
                {p.TrainerName && <p className="text-xs text-gray-400 mb-3">Trainer: {p.TrainerName}</p>}
                <button onClick={() => { setActiveFeedback(p); setForm({ overallScore: 0, contentScore: 0, trainerScore: 0, facilityScore: 0, remarks: '' }); }} className="mt-auto w-full bg-purple-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                  <Star size={14}/> Give Feedback
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {submitted.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Feedback Submitted</h3>
          <div className="space-y-2">
            {submitted.map((s: any) => (
              <div key={s.EnrollmentID} className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex items-center gap-3">
                <CheckCircle size={18} className="text-green-500 shrink-0"/>
                <p className="text-sm font-semibold text-gray-700">{s.CourseTitle}</p>
                <span className="ml-auto text-xs text-gray-400">Submitted ✓</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {pending.length === 0 && submitted.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <MessageSquare size={40} className="text-gray-300 mx-auto mb-4"/>
          <p className="text-gray-500 font-semibold">No courses available for feedback yet.</p>
        </div>
      )}
    </div>
  );
}
// --- MATERIALS TAB ----------------------------------------------------------
function StudentMaterialsTab() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('auth_token') || '';
      const res = await fetch('/api/materials', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setMaterials(data.materials);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-12 text-center"><Loader size={24} className="animate-spin mx-auto text-gray-300"/></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-lg font-black text-gray-800 flex items-center gap-2"><BookOpen size={20} className="text-[#004098]"/> Course Materials</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map((m, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <FileText size={22} className="text-blue-600"/>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 leading-tight mb-1">{m.Title}</h4>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{m.FileType}</span>
                <p className="text-xs text-gray-500 mt-2">By: {m.UploadedByName}</p>
              </div>
            </div>
          </div>
        ))}
        {materials.length === 0 && <div className="col-span-full p-12 text-center text-gray-500 border border-dashed rounded-2xl bg-white">No materials available for your courses.</div>}
      </div>
    </div>
  );
}

// --- INBOX TAB --------------------------------------------------------------
function StudentInboxTab() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [compose, setCompose] = useState(false);
  const [newMsg, setNewMsg] = useState({ receiverId: '1', subject: '', body: '' });

  const fetchMessages = async () => {
    const token = localStorage.getItem('auth_token') || '';
    const res = await fetch('/api/messages?type=inbox', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) setMessages(data.messages);
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, []);

  const handleSend = async () => {
    if (!newMsg.subject || !newMsg.body) return alert('Fill subject and body');
    const token = localStorage.getItem('auth_token') || '';
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newMsg)
    });
    if (res.ok) {
      setCompose(false);
      setNewMsg({ receiverId: '1', subject: '', body: '' });
      alert('Message sent successfully!');
    }
  };

  const markRead = async (id: number) => {
    const token = localStorage.getItem('auth_token') || '';
    await fetch('/api/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ messageId: id })
    });
    fetchMessages();
  };

  if (loading) return <div className="p-12 text-center"><Loader size={24} className="animate-spin mx-auto text-gray-300"/></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black text-gray-800 flex items-center gap-2"><MessageSquare size={20} className="text-[#004098]"/> Messages</h2>
        <button onClick={() => setCompose(!compose)} className="bg-[#004098] text-white px-4 py-2 rounded-xl text-sm font-bold shadow hover:bg-blue-700 transition-colors">
          {compose ? 'Cancel' : 'New Message'}
        </button>
      </div>

      {compose && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Compose Message</h3>
          <div className="space-y-4">
            <input type="text" placeholder="Subject" value={newMsg.subject} onChange={e=>setNewMsg({...newMsg, subject: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100" />
            <textarea placeholder="Type your message to Admin/Support..." value={newMsg.body} onChange={e=>setNewMsg({...newMsg, body: e.target.value})} rows={4} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-100" />
            <button onClick={handleSend} className="bg-[#004098] text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-blue-700">Send Message</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`bg-white rounded-2xl border ${m.IsRead ? 'border-gray-100' : 'border-blue-200 ring-2 ring-blue-50'} p-5 shadow-sm transition-all cursor-pointer`} onClick={() => !m.IsRead && markRead(m.MessageID)}>
            <div className="flex justify-between items-start mb-2">
              <h4 className={`text-md ${m.IsRead ? 'font-semibold text-gray-800' : 'font-black text-blue-900'}`}>{m.Subject}</h4>
              <span className="text-xs text-gray-400">{new Date(m.CreatedAt).toLocaleString()}</span>
            </div>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{m.Body}</p>
            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-600">{m.SenderName[0]}</div>
              <span className="text-xs font-semibold text-gray-500">From: {m.SenderName} ({m.SenderRole})</span>
            </div>
          </div>
        ))}
        {messages.length === 0 && <div className="p-12 text-center text-gray-500 border border-dashed rounded-2xl bg-white">Your inbox is empty.</div>}
      </div>
    </div>
  );
}
