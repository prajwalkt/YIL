"use client";
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Award, FileText, LogOut, Search, 
  MapPin, Loader, TrendingUp, PlayCircle, Clock, CheckCircle,
  MessageSquare, Star, Tv, User as UserIcon, Building2, Briefcase, ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AffiliatePortal() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/login'); return; }
    const u = JSON.parse(stored);
    if (u.role !== 'AFFILIATE' && u.role !== 'ADMIN') { router.push('/login'); return; }
    setUser(u);
    fetchData();
  }, [router]);

  const fetchData = async () => {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

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

  if (loading) return (
    <div className="min-h-screen bg-[#FDF8FF] flex items-center justify-center">
      <Loader size={32} className="animate-spin text-fuchsia-600"/>
    </div>
  );

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: <Briefcase size={20}/> },
    { id: 'catalog', label: 'Course Catalog', icon: <Search size={20}/> },
    { id: 'certificates', label: 'Certifications', icon: <Award size={20}/> },
    { id: 'feedback', label: 'Feedback', icon: <MessageSquare size={20}/> },
    { id: 'profile', label: 'My Organization', icon: <Building2 size={20}/> },
  ];

  return (
    <div className="flex h-screen bg-[#FAFAFA] font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-gradient-to-b from-fuchsia-900 to-purple-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-8 pb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-pink-400 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/30">
            <span className="font-black text-white text-lg">Y</span>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wide text-white">Yokogawa</h1>
            <p className="text-pink-200 text-xs font-semibold uppercase tracking-widest">Affiliate Network</p>
          </div>
        </div>

        <div className="px-8 py-4 mb-4">
          <p className="text-sm font-bold text-white truncate">{user?.firstName} {user?.lastName}</p>
          <p className="text-xs text-fuchsia-300 truncate">{user?.organization}</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === item.id 
                  ? 'bg-white/15 text-white shadow-inner border border-white/10' 
                  : 'text-fuchsia-200 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.icon} {item.label}
              {activeTab === item.id && <ChevronRight size={16} className="ml-auto opacity-50"/>}
            </button>
          ))}
        </nav>

        <div className="p-6">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white rounded-xl text-sm font-bold transition-colors">
            <LogOut size={16}/> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-gray-50/50">
        <div className="p-10 max-w-6xl mx-auto space-y-8">
          
          <header className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-black text-gray-800">
                {navItems.find(n => n.id === activeTab)?.label}
              </h2>
              <p className="text-gray-500 font-medium mt-1">Manage your affiliate training and certifications.</p>
            </div>
            <div className="hidden md:flex gap-4">
               <div className="bg-white px-5 py-2.5 rounded-xl border border-gray-200 shadow-sm flex flex-col items-end justify-center">
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Enrollments</p>
                 <p className="text-lg font-black text-fuchsia-700 leading-none">{data?.enrollments?.filter((e:any) => e.Status !== 'COMPLETED').length || 0}</p>
               </div>
               <div className="bg-white px-5 py-2.5 rounded-xl border border-gray-200 shadow-sm flex flex-col items-end justify-center">
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Certifications</p>
                 <p className="text-lg font-black text-fuchsia-700 leading-none">{data?.certificates?.length || 0}</p>
               </div>
            </div>
          </header>

          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 border-b border-gray-200 pb-3">
                <PlayCircle className="text-fuchsia-600"/> Current Training
              </h3>
              {data?.enrollments?.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {data.enrollments.map((e: any) => (
                    <div key={e.EnrollmentID} className="bg-white rounded-3xl border border-purple-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all flex flex-col relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-fuchsia-50 to-pink-50 rounded-bl-full -z-10"></div>
                      
                      <div className="flex justify-between items-start mb-4">
                        <span className={`inline-block px-3 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider ${
                          e.Status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                          e.Status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'bg-fuchsia-100 text-fuchsia-700'
                        }`}>{e.Status}</span>
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">{e.Mode}</span>
                      </div>
                      
                      <h4 className="text-xl font-bold text-gray-800 mb-2 leading-tight">{e.CourseTitle}</h4>
                      
                      {e.DateApprovalStatus === 'PENDING' ? (
                        <p className="text-sm text-orange-500 mb-6 flex items-center gap-2 font-bold">
                          <Clock size={16} className="text-orange-400"/> 
                          Requested: {new Date(e.OriginalStartDate).toLocaleDateString()} - {new Date(e.OriginalEndDate).toLocaleDateString()} (Pending)
                        </p>
                      ) : e.FinalStartDate ? (
                        <p className="text-sm text-green-600 mb-6 flex items-center gap-2 font-bold">
                          <Clock size={16} className="text-green-500"/> 
                          {new Date(e.FinalStartDate).toLocaleDateString()} - {new Date(e.FinalEndDate).toLocaleDateString()} (Approved)
                        </p>
                      ) : e.DateApprovalStatus === 'REJECTED' ? (
                        <p className="text-sm text-red-500 mb-6 flex items-center gap-2 font-bold">
                          <Clock size={16} className="text-red-400"/> Requested Dates Rejected
                        </p>
                      ) : e.StartDate ? (
                        <p className="text-sm text-gray-600 mb-6 flex items-center gap-2">
                          <Clock size={16} className="text-fuchsia-400"/> 
                          {new Date(e.StartDate).toLocaleDateString()} - {new Date(e.EndDate).toLocaleDateString()}
                        </p>
                      ) : null}

                      <div className="mt-auto pt-5 border-t border-gray-100">
                        <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                          <span>Progress</span>
                          <span className="text-fuchsia-600">{e.ComputedProgress ?? e.ProgressPercent ?? (e.Status === 'COMPLETED' ? 100 : 0)}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full transition-all ${e.Status === 'COMPLETED' ? 'bg-green-500' : 'bg-gradient-to-r from-fuchsia-500 to-pink-500'}`} style={{ width: `${e.ComputedProgress ?? e.ProgressPercent ?? (e.Status === 'COMPLETED' ? 100 : 0)}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
                  <div className="w-16 h-16 bg-fuchsia-50 text-fuchsia-600 rounded-2xl mx-auto flex items-center justify-center mb-4 transform rotate-3">
                    <BookOpen size={24}/>
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 mb-2">No Active Enrollments</h4>
                  <p className="text-gray-500 mb-6">Explore the catalog to find affiliate training programs.</p>
                  <button onClick={() => setActiveTab('catalog')} className="px-6 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl font-bold shadow-lg shadow-fuchsia-500/30 transition-colors">
                    View Catalog
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CATALOG TAB */}
          {activeTab === 'catalog' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {data?.catalog?.map((c: any, i: number) => (
                  <div key={i} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col group">
                    <div className="flex justify-between items-start mb-4">
                      <span className="inline-block px-2.5 py-1 text-[10px] font-bold uppercase rounded-full bg-purple-100 text-purple-700 tracking-wider">
                        {c.Mode}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2 leading-tight group-hover:text-fuchsia-600 transition-colors">{c.Title}</h3>
                    <p className="text-sm text-gray-500 mb-6 line-clamp-3 leading-relaxed flex-1">{c.Description}</p>
                    
                    <button onClick={() => enrollCourse(c.CourseID)} className="w-full py-3 bg-fuchsia-50 text-fuchsia-700 rounded-xl text-sm font-bold hover:bg-fuchsia-600 hover:text-white transition-colors">
                      Request Enrollment
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CERTIFICATES TAB */}
          {activeTab === 'certificates' && (
            <div className="space-y-6">
              {data?.certificates?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.certificates.map((cert: any, i: number) => (
                    <div key={i} className="bg-gradient-to-br from-purple-900 to-fuchsia-900 rounded-3xl p-1 relative overflow-hidden shadow-xl group">
                      <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                         <Award size={100} className="text-white"/>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md rounded-[22px] p-6 h-full flex flex-col text-white">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                          <Award size={24}/>
                        </div>
                        <h3 className="font-bold text-lg mb-1 leading-tight">{cert.CourseName}</h3>
                        <p className="text-xs font-mono text-fuchsia-200 font-bold mb-6">{cert.CertificateNo}</p>
                        <div className="text-xs text-white/70 space-y-1 mt-auto">
                          <p>Issued: {new Date(cert.IssueDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-16 text-center text-gray-500 bg-white rounded-3xl border border-gray-100 shadow-sm">
                   <Award size={48} className="mx-auto text-gray-300 mb-4"/>
                   <p className="font-semibold text-lg">No certifications earned yet.</p>
                </div>
              )}
            </div>
          )}

          {/* FEEDBACK TAB */}
          {activeTab === 'feedback' && (
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center">
              <MessageSquare size={48} className="mx-auto text-fuchsia-300 mb-4"/>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Feedback Portal</h3>
              <p className="text-gray-500 mb-6">Affiliate feedback module is currently integrated directly with completed sessions.</p>
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
              <div className="p-10 bg-gradient-to-br from-fuchsia-50 to-pink-50 md:w-1/3 border-r border-fuchsia-100 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-white shadow-xl shadow-fuchsia-200/50 rounded-full flex items-center justify-center text-fuchsia-600 font-black text-3xl mb-4">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <h3 className="font-black text-xl text-gray-800 mb-1">{user?.firstName} {user?.lastName}</h3>
                <p className="text-sm font-semibold text-fuchsia-600 mb-3">{user?.email}</p>
                <div className="bg-purple-900 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md">AFFILIATE</div>
              </div>
              
              <div className="p-10 md:w-2/3">
                <h4 className="font-bold text-gray-800 border-b border-gray-100 pb-4 mb-6">Affiliate Organization Details</h4>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Organization</p>
                    <p className="font-semibold text-gray-800">{user?.organization || 'Independent Affiliate'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Role Level</p>
                    <p className="font-semibold text-gray-800">Affiliate Partner</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Network Joined</p>
                    <p className="font-semibold text-gray-800">2023</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
