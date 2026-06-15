"use client";
import React, { useState, useEffect } from 'react';
import { 
  LogOut, ChevronDown, MapPin, Users, 
  CheckCircle2, Mail, Microscope, Monitor, Laptop, Wifi, BookOpen, Video, MonitorPlay, Lock, ArrowRight, Clock, Radio, ScreenShare, HelpCircle, Phone, Printer,
  Settings, Database, ShieldCheck, Activity, KeyRound, X, Upload, FileText, AlertCircle, Search, ExternalLink, LayoutDashboard, Bell
} from 'lucide-react';

// --- Interfaces ---
interface Course {
  id: number;
  name: string;
  code: string;
  days: string;
  agendaPath?: string; // Enhanced to support unique local pdf paths
}

interface GalleryImage {
  src: string;
  title: string;
}

export default function YTSProject() {
  // --- AUTH & SYNC STATE ---
  const [showAdmin, setShowAdmin] = useState<boolean>(false);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [loginError, setLoginError] = useState<boolean>(false);
  const [totalRegistrations, setTotalRegistrations] = useState<number>(0);

  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState<string>("Introduction");
  const [adminTab, setAdminTab] = useState<string>("Overview");
  const [isHoveringCourses, setIsHoveringCourses] = useState<boolean>(false);

  // --- REGISTRATION & COUNTRY LOGIC ---
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isFormSubmitted, setIsFormSubmitted] = useState<boolean>(false);
  const [currentFormUrl, setCurrentFormUrl] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("India");
  const [paymentStep, setPaymentStep] = useState<"choice" | "phonepe" | "upload">("choice");

  // --- CONFIGURATION ---
  const ADMIN_PASSWORD = "4xg8i3h0rf265";
  const INITIAL_REGISTRATION_URL = "https://forms.gle/qU6ahK1KYA9GVr1E8";
  const PDF_UPLOAD_FORM_URL = "https://docs.google.com/forms/d/1MERTzKD9jY0DXhmGxoJiRq12u3ujfXLbXQu7tRUfjIo/viewform?embedded=true";
  const getDriveImageUrl = (id: string): string => `https://drive.google.com/thumbnail?authuser=0&sz=w1600&id=${id}`;

  // Static Local PDF Calendar Links inside the public folder root
  const VILT_CALENDAR_PATH = "/vilt-calendar.pdf";
  const CLASSROOM_CALENDAR_PATH = "/classroom-calendar.pdf";

  const countries = [
    "India", "Japan", "Singapore", "Malaysia", "Thailand", "Vietnam", 
    "Indonesia", "Philippines", "Australia", "New Zealand", "Others"
  ];

  // --- PRIVATE KEYBOARD SHORTCUT (Ctrl + Shift + L) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Triggers the hidden admin window when pressing Ctrl + Shift + L
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setIsLoginOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- GOOGLE SHEETS SYNC HOOK ---
  useEffect(() => {
    if (showAdmin) {
      const fetchCount = async () => {
        try {
          const res = await fetch('/api/registrations');
          const data = await res.json();
          if (data.count !== undefined) {
            setTotalRegistrations(data.count);
          }
        } catch (err) {
          console.error("Excel Sync failed:", err);
        }
      };
      fetchCount();
    }
  }, [showAdmin]);

  // --- HANDLERS ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setShowAdmin(true);
      setIsLoginOpen(false);
      setLoginError(false);
      setPasswordInput("");
    } else {
      setLoginError(true);
      setPasswordInput("");
    }
  };

  const startRegistration = () => {
    setIsFormSubmitted(false);
    setPaymentStep("choice");
    setCurrentFormUrl(INITIAL_REGISTRATION_URL);
    setIsRegistering(true);
  };

  const handleFormLoad = (e: any) => {
    try {
      const iframe = e.target;
      if (iframe.contentWindow.location.href.includes('formResponse')) {
         setTimeout(() => {
            setIsFormSubmitted(true);
            if (selectedCountry === "India") {
              setCurrentFormUrl(""); 
            } else {
              setPaymentStep("upload");
              setCurrentFormUrl(PDF_UPLOAD_FORM_URL);
            }
         }, 1500);
      }
    } catch (err) {
      // Cross-origin fallback safety
    }
  };

  const galleryImages: GalleryImage[] = [
    { src: "/images/blr-training/2.jpeg", title: "Instructional Class" },
    { src: "/images/blr-training/3.jpeg", title: "Main Classroom" },
    { src: "/images/blr-training/4.jpg", title: "Reception Area" },
    { src: "/images/blr-training/5.jpg", title: "Process Training Lab" },
    { src: "/images/blr-training/7.jpeg", title: "Workstations" },
    { src: "/images/blr-training/8.jpeg", title: "DCS Engineering Panel" }
  ];

  // Configured to point directly to clean lowercase path items inside public/agendas/
  const baseCourses: Course[] = [
    { id: 1, name: "CENTUM VP DCS Operation", code: "VPOP", days: "3", agendaPath: "/agendas/vpop.pdf" },
    { id: 2, name: "CENTUM VP DCS Fundamentals", code: "VPFD", days: "5", agendaPath: "/agendas/FIPC.pdf" },
    { id: 3, name: "CENTUM VP DCS Engineering", code: "VPEG", days: "5", agendaPath: "/agendas/vpeg.pdf" },
    { id: 4, name: "CENTUM VP DCS Fundamentals & Engineering", code: "VPFE", days: "5", agendaPath: "/agendas/vpfe.pdf" },
    { id: 5, name: "CENTUM VP DCS Engineering & Maintenance", code: "VPEM", days: "10", agendaPath: "/agendas/vpem.pdf" },
    { id: 6, name: "CENTUM VP DCS Maintenance", code: "VPMN", days: "3", agendaPath: "/agendas/vpmn.pdf" },
    { id: 7, name: "CENTUM VP DCS Advanced Engineering", code: "VPAE", days: "5", agendaPath: "/agendas/vpae.pdf" },
    { id: 8, name: "CENTUM VP DCS Batch Engineering", code: "VBEG", days: "5", agendaPath: "/agendas/vbeg.pdf" },
    { id: 9, name: "CENTUM VP DCS AD Suite Engineering", code: "VPAD", days: "5", agendaPath: "/agendas/vpad.pdf" },
    { id: 10, name: "Consolidated Alarm Management System", code: "CAMS", days: "2", agendaPath: "/agendas/cams.pdf" },
    { id: 11, name: "SEBOL Programming", code: "SEBL", days: "3", agendaPath: "/agendas/sebl.pdf" },
    { id: 12, name: "STARDOM NCS with FAST/TOOLS SCADA", code: "STFT", days: "5", agendaPath: "/agendas/stft.pdf" },
    { id: 13, name: "STARDOM NCS with CI Server", code: "STCI", days: "5", agendaPath: "/agendas/stci.pdf" },
    { id: 14, name: "STARDOM NCS Engineering", code: "STEG", days: "5", agendaPath: "/agendas/steg.pdf" },
    { id: 15, name: "FAST/TOOLS SCADA Operations", code: "FTOP", days: "2", agendaPath: "/agendas/ftop.pdf" },
    { id: 16, name: "FAST/TOOLS SCADA Engineering", code: "FTEG", days: "5", agendaPath: "/agendas/fteg.pdf" },
    { id: 17, name: "CI Server Operations", code: "CIOP", days: "2", agendaPath: "/agendas/ciop.pdf" },
    { id: 18, name: "CI Server Engineering", code: "CIEG", days: "5", agendaPath: "/agendas/cieg.pdf" },
    { id: 19, name: "Field Bus basics & Engineering", code: "FFEG", days: "3", agendaPath: "/agendas/ffeg.pdf" },
    { id: 20, name: "Field Bus Engineering & PRM", code: "FPRM", days: "5", agendaPath: "/agendas/fprm.pdf" },
    { id: 21, name: "PROFIBUS Basics and Engineering", code: "PBUS", days: "2", agendaPath: "/agendas/pbus.pdf" },
    { id: 22, name: "Industrial Communication Protocols", code: "INCP", days: "3", agendaPath: "/agendas/incp.pdf" },
    { id: 24, name: "Field Instruments for Process Control", code: "FIPC", days: "5", agendaPath: "/agendas/fipc.pdf" },
    { id: 25, name: "Asset Management Software- PRM", code: "PRMB", days: "3", agendaPath: "/agendas/prmb.pdf" },
    { id: 26, name: "Cyber Security for Industrial Control System", code: "CSIC", days: "3", agendaPath: "/agendas/csic.pdf" },
    { id: 27, name: "PROSAFE RS Operations", code: "RSOP", days: "2", agendaPath: "/rsop.pdf" },
    { id: 28, name: "PROSAFE-RS Engineering with FAST/TOOLS SCADA", code: "RSFT", days: "5", agendaPath: "/agendas/rsft.pdf" },
    { id: 29, name: "PROSAFE-RS Engineering with CI Server", code: "RSCI", days: "5", agendaPath: "/agendas/rsci.pdf" },
    { id: 30, name: "PROSAFE RS Engineering", code: "PPRS", days: "5", agendaPath: "/agendas/pprs.pdf" },
    { id: 31, name: "PROSAFE-RS Advanced Engineering", code: "RSAE", days: "5", agendaPath: "/agendas/rsae.pdf" },
    { id: 32, name: "PROSAFE-RS with ADsuite Engineering", code: "RSAD", days: "2", agendaPath: "/agendas/rsad.pdf" },
    { id: 34, name: "Functional Safety for End Users", code: "FSUS", days: "2", agendaPath: "/agendas/fsus.pdf" },
  ];

  const onlineCourses = baseCourses.filter(c => !["FIPC", "ISAB", "TFSE", "FSUS"].includes(c.code));
  const isTrainingActive = ["Offline Training", "Online Training", "E-learning Course"].includes(activeTab);

  if (showAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 font-sans text-zinc-300 flex animate-in fade-in duration-500">
        <aside className="w-64 bg-zinc-900 border-r border-zinc-800 p-6 flex flex-col fixed h-full">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="bg-amber-500 p-2 rounded-lg"><ShieldCheck size={24} className="text-zinc-950" /></div>
            <span className="font-black tracking-tighter text-white text-xl uppercase">Staff<span className="text-amber-500">Core</span></span>
          </div>
          <nav className="flex-1 space-y-2">
            {["Overview", "Payments", "Courses", "Users", "Settings"].map((t) => (
              <button key={t} onClick={() => setAdminTab(t)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${adminTab === t ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "text-zinc-500 hover:bg-zinc-800"}`}>
                {t === "Overview" && <Activity size={18} />} 
                {t === "Payments" && <Printer size={18} />} 
                {t === "Courses" && <Database size={18} />} 
                {t === "Users" && <Users size={18} />} 
                {t === "Settings" && <Settings size={18} />} 
                {t}
              </button>
            ))}
          </nav>
          <button onClick={() => setShowAdmin(false)} className="flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-amber-500 transition-colors text-sm font-bold mt-auto border-t border-zinc-800 pt-6">
            <LogOut size={18} /> Exit Portal
          </button>
        </aside>

        <main className="flex-1 ml-64 p-10">
          <header className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">{adminTab}</h1>
              <p className="text-zinc-500 text-sm mt-1 font-bold uppercase tracking-widest text-[10px]">Real-time Systems: Active</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-full px-4 flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">System Operational</span>
            </div>
          </header>

          {adminTab === "Overview" && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-4xl group transition-all">
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Total Registrations</p>
                  <h2 className="text-4xl font-black text-white mt-1">{totalRegistrations}</h2>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-4xl"><p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Live Courses</p><h2 className="text-4xl font-black text-white mt-1">32</h2></div>
                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-4xl"><p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Server Load</p><h2 className="text-4xl font-black text-white mt-1">12%</h2></div>
              </div>
            </div>
          )}

          {adminTab === "Payments" && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
               <div className="bg-zinc-900 border border-zinc-800 rounded-4xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-800/50 text-zinc-500 text-[10px] uppercase font-black tracking-widest">
                      <tr><th className="px-8 py-5">Participant</th><th className="px-8 py-5">Code</th><th className="px-8 py-5">Status</th><th className="px-8 py-5 text-right">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      <tr className="hover:bg-white/2 transition-colors">
                        <td className="px-8 py-5 font-bold">Prajwal KT</td>
                        <td className="px-8 py-5 text-amber-500 font-mono">VPEG</td>
                        <td className="px-8 py-5"><span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase">Verified</span></td>
                        <td className="px-8 py-5 text-right"><button className="bg-amber-500 text-zinc-950 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">View PDF</button></td>
                      </tr>
                    </tbody>
                  </table>
               </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 relative">
      
      {/* REGISTRATION & UPLOAD MODAL */}
      {isRegistering && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-[#004098]/90 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-4xl h-[85vh] rounded-4xl overflow-hidden shadow-2xl relative flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#004098]">
                    {!isFormSubmitted ? "Step 1: Course Registration" : "Step 2: Payment Confirmation"}
                  </h2>
                </div>
                {!isFormSubmitted && (
                  <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Region:</span>
                    <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className="bg-transparent text-sm font-bold text-[#004098] outline-none">
                      {countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <button onClick={() => { setIsRegistering(false); setIsFormSubmitted(false); }} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"><X size={24} /></button>
            </div>

            <div className="flex-1 bg-slate-50">
              {currentFormUrl !== "" ? (
                <div className="relative h-full">
                  <iframe src={currentFormUrl} className="w-full h-full" onLoad={handleFormLoad}>Loading…</iframe>
                  {!isFormSubmitted && (
                    <button 
                      onClick={() => {
                        setIsFormSubmitted(true);
                        if(selectedCountry === "India") setCurrentFormUrl("");
                        else setCurrentFormUrl(PDF_UPLOAD_FORM_URL);
                      }}
                      className="absolute bottom-4 right-4 bg-orange-500 text-white text-[10px] font-black px-4 py-2 rounded-lg uppercase tracking-widest shadow-lg hover:bg-orange-600 transition-colors"
                    >
                      Form Submitted? Click Next
                    </button>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-10 animate-in zoom-in-95 duration-300">
                  {paymentStep === "choice" && (
                    <div className="text-center space-y-8 max-w-md">
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black text-[#004098] uppercase tracking-tight">Select Payment Method</h3>
                        <p className="text-slate-500 text-sm">Please choose how you would like to complete your registration fee.</p>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <button onClick={() => setPaymentStep("phonepe")} className="group bg-white border-2 border-slate-200 hover:border-purple-500 p-6 rounded-3xl flex items-center gap-4 transition-all hover:shadow-xl">
                          <div className="bg-purple-100 text-purple-600 p-4 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors"><Radio size={24}/></div>
                          <div className="text-left"><p className="font-black text-slate-800 uppercase text-xs tracking-widest">Option 1</p><p className="font-bold text-[#004098]">PhonePe / UPI QR</p></div>
                        </button>
                        <button onClick={() => { setPaymentStep("upload"); setCurrentFormUrl(PDF_UPLOAD_FORM_URL); }} className="group bg-white border-2 border-slate-200 hover:border-orange-500 p-6 rounded-3xl flex items-center gap-4 transition-all hover:shadow-xl">
                          <div className="bg-orange-100 text-orange-600 p-4 rounded-2xl group-hover:bg-orange-600 group-hover:text-white transition-colors"><Upload size={24}/></div>
                          <div className="text-left"><p className="font-black text-slate-800 uppercase text-xs tracking-widest">Option 2</p><p className="font-bold text-[#004098]">Direct PDF Upload</p></div>
                        </button>
                      </div>
                    </div>
                  )}

                  {paymentStep === "phonepe" && (
                    <div className="text-center animate-in fade-in slide-in-from-bottom-4">
                      <div className="bg-white p-8 rounded-4xl shadow-2xl border border-slate-100 max-w-xs mx-auto">
                        <p className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] mb-4 text-center">Scan to Pay</p>
                        <img src={getDriveImageUrl("YOUR_QR_IMAGE_ID")} alt="PhonePe QR" className="w-full aspect-square object-contain mb-4 rounded-xl" />
                        <p className="text-xs font-bold text-slate-400">Scan using any UPI App</p>
                      </div>
                      <button onClick={() => { setPaymentStep("upload"); setCurrentFormUrl(PDF_UPLOAD_FORM_URL); }} className="mt-8 text-sm font-black text-[#004098] hover:text-orange-500 flex items-center gap-2 mx-auto uppercase tracking-widest">I've paid, take me to Upload <ArrowRight size={16}/></button>
                      <button onClick={() => setPaymentStep("choice")} className="mt-4 text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest">Go Back</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRIVATE STAFF AUTHENTICATION MODAL */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-md shadow-2xl relative">
            <button onClick={() => {setIsLoginOpen(false); setLoginError(false);}} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20} /></button>
            <div className="bg-amber-500 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <KeyRound className="text-zinc-950" size={24} />
            </div>
            <h2 className="text-2xl font-black text-white text-center mb-2 tracking-tight">Staff Authentication</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input 
                type="password" 
                placeholder="••••••••" 
                autoFocus
                className={`w-full bg-zinc-800 border ${loginError ? 'border-red-500' : 'border-zinc-700'} rounded-2xl py-4 px-6 text-white text-center text-xl tracking-widest focus:outline-none focus:border-amber-500 transition-all`}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />
              {loginError && <p className="text-red-500 text-xs text-center font-bold uppercase tracking-widest animate-bounce">Access Denied</p>}
              <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs">Authorize Access</button>

              {/* SECURE APP-ROUTER HANDSHAKE REDIRECT LINK */}
              <div className="pt-4 text-center border-t border-zinc-800/50 mt-4">
                <a 
                  href="/staff-login"
                  className="text-[10px] font-black text-zinc-600 hover:text-amber-500 uppercase tracking-widest transition-colors block py-1"
                >
                  Go to Django Server Portal →
                </a>
              </div>
            </form>
          </div>
        </div>
      )}

      <header className="w-full h-32 relative flex items-center justify-end px-10 text-white overflow-hidden shadow-lg"
        style={{ backgroundImage: `url('${getDriveImageUrl("1-bOd5_sYhjMP5_BsZNDQHkFbxcmXHsOK")}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-[#004098]/10"></div>
      </header>

      <nav className="bg-slate-100 border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center h-16 overflow-x-auto lg:overflow-visible">
          <button onClick={() => setActiveTab("Introduction")} className={`h-full px-6 text-sm font-bold transition-all border-b-4 flex items-center whitespace-nowrap ${activeTab === "Introduction" ? "border-orange-500 bg-white text-[#004098]" : "border-transparent text-slate-500 hover:text-[#004098]"}`}>Introduction</button>
          
          <div className="relative h-full" onMouseEnter={() => setIsHoveringCourses(true)} onMouseLeave={() => setIsHoveringCourses(false)}>
            <button className={`h-full px-6 text-sm font-bold transition-all border-b-4 flex items-center gap-2 whitespace-nowrap ${isTrainingActive ? "border-orange-500 bg-white text-[#004098]" : "border-transparent text-slate-500 hover:text-[#004098]"}`}>Training Courses <ChevronDown size={14} /></button>
            {isHoveringCourses && (
              <div className="absolute top-full left-0 w-64 bg-white shadow-xl border border-slate-100 py-2 z-50 rounded-b-xl">
                {["Offline Training", "Online Training", "E-learning Course"].map((option) => (
                  <button key={option} onClick={() => { setActiveTab(option); setIsHoveringCourses(false); }} className="w-full text-left px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#004098] flex items-center gap-3">
                    {option === "Offline Training" && <BookOpen size={16} />} 
                    {option === "Online Training" && <Video size={16} />} 
                    {option === "E-learning Course" && <MonitorPlay size={16} />} 
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => setActiveTab("Bangalore Training Centre")} className={`h-full px-6 text-sm font-bold transition-all border-b-4 flex items-center whitespace-nowrap ${activeTab === "Bangalore Training Centre" ? "border-orange-500 bg-white text-[#004098]" : "border-transparent text-slate-500 hover:text-[#004098]"}`}>Bangalore Training Centre</button>
          
          <button onClick={() => setActiveTab("Training Calendar")} className={`h-full px-6 text-sm font-bold transition-all border-b-4 flex items-center whitespace-nowrap ${activeTab === "Training Calendar" ? "border-orange-500 bg-white text-[#004098]" : "border-transparent text-slate-500 hover:text-[#004098]"}`}>Training Calendar</button>
          
          <button onClick={() => setActiveTab("Contact Us")} className={`h-full px-6 text-sm font-bold transition-all border-b-4 flex items-center whitespace-nowrap ${activeTab === "Contact Us" ? "border-orange-500 bg-white text-[#004098]" : "border-transparent text-slate-500 hover:text-[#004098]"}`}>Contact Us</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8 lg:p-12">
        {activeTab === "Introduction" && (
          <div className="animate-in fade-in space-y-12 text-slate-700">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold text-[#004098]">Technical Training School</h1>
              <div className="text-lg max-w-5xl leading-relaxed space-y-6">
                <p>The Technical School offers a wide range of training courses covering <strong>Plant instruments, Communication protocols, Cyber Security, Distributed Control System, PLC, NCS etc.</strong> with complete hands-on practise.</p>
                <p>We provide customized training for you based on your requirement.</p>
                <p>The Training delivery is incorporated using latest methodologies. Making use of <strong>RDP protocol, Cloud</strong> and other enabling technologies.</p>
                <p>Training can be conducted in classroom, Customer site, Affiliate office and online.</p>
                <p>The <strong>Virtual Instructor Led Training program (online)</strong> launched in 2020 has been successful in delivering training across the globe with complete Hands-on Experience.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-[#004098] flex items-center gap-2 mb-4"><Video size={20} className="text-orange-500"/> Virtual Instructor Led Training (VILT)</h3>
                <div className="space-y-4 text-sm text-slate-600">
                  <p>Virtual Instructor Led Training delivery will be in the virtual classroom with expert instructions, demonstrations and practice sessions.</p>
                  <ul className="space-y-2">
                    {["Participants would attend live instructor lectures and demonstrations on MS-Teams", "Participants will have hands on practice sessions by remote access to Training PC’s loaded with relevant software", "Trainers would present their desktop on MS Teams and adopt step by step approach"].map((li, i) => (
                      <li key={i} className="flex gap-2"><CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-1"/> {li}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100 shadow-sm">
                <h3 className="text-xl font-bold text-[#004098] flex items-center gap-2 mb-4"><ScreenShare size={20} className="text-blue-500"/> RDP & Remote Support</h3>
                <div className="space-y-4 text-sm text-slate-600">
                  <p>The trainees will access the trainee PC’s using <strong>Remote Desktop Protocol (RDP)</strong> to practice what is being taught by the trainers.</p>
                  <p>In case of any problem faced by the trainees, trainers would remotely login to the trainee’s system and help them to rectify the problem.</p>
                </div>
              </div>
            </div>

            <div className="bg-[#004098] text-white p-10 rounded-3xl shadow-lg relative overflow-hidden">
              <h4 className="text-orange-400 font-bold text-xs uppercase tracking-widest mb-6">What do Participant need to have?</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex items-center gap-4"><Laptop size={24} className="opacity-50"/><span className="text-sm font-medium">Laptop/PC with additional monitor, if possible</span></div>
                <div className="flex items-center gap-4"><Wifi size={24} className="opacity-50"/><span className="text-sm font-medium">A good internet connection to access Virtual System.</span></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Offline Training" && (
          <div className="animate-in fade-in space-y-8">
            <h2 className="text-3xl font-light text-[#004098]">Offline Training Programs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {baseCourses.map((course) => (
                <div key={course.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col group hover:shadow-lg transition-all">
                  <div className="bg-[#004098] p-6 text-white flex-1">
                    <div className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">CODE: {course.code}</div>
                    <h3 className="text-lg font-bold leading-tight">{course.name}</h3>
                  </div>
                  <div className="p-5 bg-slate-50/50 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-500 font-bold mb-1"><Clock size={16}/> {course.days} Days</div>
                    
                    <a 
                      href={course.agendaPath || "#"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`w-full relative group overflow-hidden rounded-2xl py-2.5 text-xs font-black uppercase tracking-widest text-center transition-all duration-300 border flex items-center justify-center gap-2
                        ${course.agendaPath 
                          ? "bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 hover:opacity-95 text-white border-slate-800 shadow-xs hover:scale-[1.01] active:scale-99" 
                          : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                        }`}
                      onClick={(e) => !course.agendaPath && e.preventDefault()}
                    >
                      {course.agendaPath && (
                        <span className="absolute inset-0 w-full h-full bg-linear-to-r from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      )}
                      <FileText size={14} className={course.agendaPath ? "text-orange-400 group-hover:rotate-12 transition-transform" : ""} />
                      <span>{course.agendaPath ? "View Course Agenda" : "Agenda Coming Soon"}</span>
                    </a>

                    <button onClick={startRegistration} className="w-full bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white font-black py-3 rounded-2xl flex items-center justify-center gap-2 transition-all text-sm">Register Now <ArrowRight size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Online Training" && (
          <div className="animate-in fade-in space-y-8 max-w-5xl mx-auto">
            <h2 className="text-3xl font-light text-[#004098]">Online VILT Programs</h2>
            <div className="space-y-4">
              {onlineCourses.map((course) => (
                <div key={course.id} className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 hover:border-blue-300 hover:shadow-xl transition-all group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                  <div className="w-full md:w-24 h-16 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black shrink-0">{course.code}</div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{course.name}</h3>
                    <span className="flex items-center gap-1 text-sm text-slate-400 mt-2"><Clock size={14}/> {course.days} Days</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
                    <a 
                      href={course.agendaPath || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-center transition-all flex items-center justify-center gap-2 border
                        ${course.agendaPath 
                          ? "bg-slate-900 text-white hover:bg-slate-800 hover:scale-102 active:scale-98 shadow-sm" 
                          : "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                        }`}
                      onClick={(e) => !course.agendaPath && e.preventDefault()}
                    >
                      <FileText size={14} className={course.agendaPath ? "text-orange-400" : ""} />
                      <span>Agenda</span>
                    </a>

                    <button onClick={startRegistration} className="w-full sm:w-auto bg-orange-500 text-white hover:bg-blue-600 font-bold px-8 py-3 rounded-xl flex items-center gap-2 transition-all">Register Now <ArrowRight size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Bangalore Training Centre" && (
          <div className="animate-in fade-in space-y-12">
            <div className="flex justify-between items-start">
              <h1 className="text-4xl font-light text-[#004098]">Bangalore Training Centre</h1>
              <div className="bg-[#004098] text-white px-6 py-4 rounded-2xl flex items-center gap-4 shadow-lg">
                <MapPin className="text-orange-400" />
                <div className="text-xs uppercase font-black tracking-widest leading-tight">Electronic City<br/>Phase 1, Bangalore</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {galleryImages.map((img, idx) => (
                <div key={idx} className={`relative group overflow-hidden rounded-2xl border bg-slate-100 ${idx === 0 ? "md:col-span-2 md:row-span-2 min-h-100" : "h-64"}`}>
                  <img src={img.src} alt={img.title} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-black/80 to-transparent z-10"><p className="text-white font-bold text-sm uppercase tracking-wider">{img.title}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Training Calendar" && (
          <div className="animate-in fade-in space-y-12 max-w-5xl mx-auto">
            <div className="text-center space-y-3">
              <h1 className="text-4xl font-bold text-[#004098]">Yokogawa Training Calendar</h1>
              <p className="text-slate-500 max-w-xl mx-auto text-sm">
                Select your preferred learning delivery format to view or download the upcoming technical schedule.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col justify-between hover:shadow-lg transition-all duration-300">
                <div>
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 text-[#004098] flex items-center justify-center mb-6">
                    <Laptop size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-3">VILT & Online Training</h2>
                  <p className="text-sm text-slate-500 leading-relaxed mb-8">
                    Access live, interactive, instructor-led virtual training sessions right from your location. Explore schedules for remote DCS configurations, automation simulators, and online learning modules.
                  </p>
                </div>
                <a 
                  href={VILT_CALENDAR_PATH} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full bg-[#004098] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-sm hover:bg-blue-700 transition-colors"
                >
                  <span>View VILT Calendar</span>
                  <ExternalLink size={16} />
                </a>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col justify-between hover:shadow-lg transition-all duration-300">
                <div>
                  <div className="h-12 w-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mb-6">
                    <Monitor size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-3">Classroom Training</h2>
                  <p className="text-sm text-slate-500 leading-relaxed mb-8">
                    Join us at our physical training facilities for immersive, hands-on labs with functional hardware workstations, process instrument loops, and live control panel infrastructure.
                  </p>
                </div>
                <a 
                  href={CLASSROOM_CALENDAR_PATH} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full bg-white border-2 border-orange-500 text-orange-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-sm hover:bg-orange-500 hover:text-white transition-all"
                >
                  <span>View Classroom Calendar</span>
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Contact Us" && (
          <div className="animate-in fade-in space-y-10 max-w-6xl mx-auto">
            <div className="bg-slate-50 rounded-3xl overflow-hidden border border-slate-200 shadow-sm flex flex-col md:flex-row min-h-100">
              <div className="md:w-5/12 relative bg-slate-200">
                <img src={getDriveImageUrl("1kObpKgixyg2wHwlygdJeGoMaBnSyPBGr")} alt="Office" className="w-full h-full object-cover" />
              </div>
              <div className="md:w-7/12 p-8 md:p-12 flex flex-col justify-center space-y-6">
                <h2 className="text-3xl font-bold text-[#004098]">Get in Touch</h2>
                <p className="text-slate-600 text-sm leading-relaxed">For custom bulk training inquiries, institutional scheduling, or physical lab visits, connect directly with our coordination office.</p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-slate-700 font-semibold"><Mail size={20} className="text-[#004098]"/> Prajwal.Tagadinamani@Yokogawa.com</div>
                  <div className="flex items-center gap-4 text-slate-700 font-semibold"><Phone size={20} className="text-[#004098]"/> +91 70225 85130</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}