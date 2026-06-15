"use client";
import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, BookOpen, Settings, 
  Bell, Search, LogOut, TrendingUp, Calendar, FileText, ExternalLink, CheckCircle
} from 'lucide-react';

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const stats = [
    { label: "Total Students", value: "1,284", icon: <Users className="text-blue-500" />, growth: "+12%" },
    { label: "Active Courses", value: "32", icon: <BookOpen className="text-orange-500" />, growth: "Stable" },
    { label: "New Inquiries", value: "48", icon: <Bell className="text-emerald-500" />, growth: "+5%" },
    { label: "Certificates Issued", value: "956", icon: <FileText className="text-purple-500" />, growth: "+18%" },
  ];

  // Placeholder data - in production, this would come from your Google Sheet/API
  const registrations = [
    { id: "4020", name: "Prajwal KT", course: "CENTUM VP DCS Fundamentals", status: "Verified", pdfUrl: "#" },
    { id: "4021", name: "Amit Kumar", course: "STARDOM NCS Engineering", status: "Pending", pdfUrl: "#" },
    { id: "4022", name: "Suresh Raina", course: "ProSafe RS Operations", status: "Verified", pdfUrl: "#" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#004098] text-white flex flex-col p-6 shrink-0">
        <div className="mb-10"><h1 className="text-2xl font-black italic tracking-tighter">YTS ADMIN</h1></div>
        
        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm transition-all border ${activeTab === 'dashboard' ? 'bg-white/10 border-white/10' : 'hover:bg-white/5 border-transparent text-white/70'}`}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('payments')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm transition-all border ${activeTab === 'payments' ? 'bg-white/10 border-white/10' : 'hover:bg-white/5 border-transparent text-white/70'}`}
          >
            <FileText size={18} /> Payment PDFs
          </button>
          <button className="w-full flex items-center gap-3 hover:bg-white/5 p-3 rounded-xl font-medium text-sm text-white/70 transition-all">
            <Users size={18} /> Manage Students
          </button>
          <button className="w-full flex items-center gap-3 hover:bg-white/5 p-3 rounded-xl font-medium text-sm text-white/70 transition-all">
            <BookOpen size={18} /> Course Curriculum
          </button>
        </nav>

        <a href="/" className="mt-auto flex items-center gap-3 text-white/50 hover:text-white p-3 text-sm font-bold transition-all">
          <LogOut size={18} /> Exit Portal
        </a>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {activeTab === 'dashboard' ? 'Admin Overview' : 'Payment Verifications'}
            </h2>
            <p className="text-slate-500 text-sm">Welcome back, Administrator.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={16} />
              <input type="text" placeholder="Search registrations..." className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 ring-blue-500/20" />
            </div>
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center font-bold text-white shadow-lg">AD</div>
          </div>
        </header>

        {activeTab === 'dashboard' ? (
          <>
            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-slate-50 rounded-2xl">{stat.icon}</div>
                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-widest">{stat.growth}</span>
                  </div>
                  <h4 className="text-slate-500 text-xs font-bold uppercase tracking-widest">{stat.label}</h4>
                  <p className="text-2xl font-black text-slate-800 mt-1">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* QUICK VIEW TABLE */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Course Registrations</h3>
              <div className="space-y-4">
                {registrations.map((reg, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full border-2 border-white flex items-center justify-center text-[#004098] font-bold text-xs">
                        {reg.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{reg.name}</p>
                        <p className="text-xs text-slate-500">{reg.course}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab('payments')}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Verify Payment
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* PAYMENTS LIST VIEW */
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-400">Student / Enrollment</th>
                  <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-400">Course</th>
                  <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrations.map((reg, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6">
                      <div className="font-bold text-slate-800">{reg.name}</div>
                      <div className="text-xs text-slate-400">ID: #{reg.id}</div>
                    </td>
                    <td className="p-6 text-sm text-slate-600 font-medium">{reg.course}</td>
                    <td className="p-6">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        reg.status === 'Verified' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                        {reg.status === 'Verified' && <CheckCircle size={10} />}
                        {reg.status}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <a 
                        href={reg.pdfUrl} 
                        target="_blank" 
                        className="inline-flex items-center gap-2 bg-[#004098] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all"
                      >
                        <ExternalLink size={14} /> View PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}