"use client";
import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { 
  Menu, X, BookOpen, Clock, Users, ArrowRight, CheckCircle2, 
  MapPin, Phone, Mail, FileText, ChevronRight, PlayCircle, Star, 
  Award, Globe2, Building2, MonitorPlay, Video, Calendar, Plus, 
  Search, ExternalLink, Laptop, Filter, Radio, Upload, LogOut, ChevronDown, Microscope, Monitor, Wifi, MonitorPlay as LucideMonitorPlay, Lock, Database, ShieldCheck, Activity, KeyRound, Settings, Printer, Loader, PieChart, Globe, Building, FileVideo, FilePlus, ScreenShare
} from 'lucide-react';
import RegistrationForm from "../components/RegistrationForm";
import BackButton from "../components/BackButton";
import PasswordPolicy from "./components/PasswordPolicy";
import DynamicCalendar from "../components/DynamicCalendar";

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
  const [policyAccepted, setPolicyAccepted] = useState<boolean>(false);
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
  const [selectedCourseForReg, setSelectedCourseForReg] = useState<string>("");
  const [selectedModeForReg, setSelectedModeForReg] = useState<string>("");

  // --- CONFIGURATION ---
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_FRONTEND_ADMIN_PASSWORD || "fallback";
  const INITIAL_REGISTRATION_URL = "https://forms.gle/qU6ahK1KYA9GVr1E8";
  const PDF_UPLOAD_FORM_URL = "https://docs.google.com/forms/d/1MERTzKD9jY0DXhmGxoJiRq12u3ujfXLbXQu7tRUfjIo/viewform?embedded=true";
  const getDriveImageUrl = (id: string): string => `https://lh3.googleusercontent.com/d/${id}=w1600`;

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
          const res = await fetch('/api/registrations_count', { credentials: 'include' });
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

  const startRegistration = (courseName?: string, mode?: string) => {
    setIsFormSubmitted(false);
    setPaymentStep("choice");
    setCurrentFormUrl(INITIAL_REGISTRATION_URL);
    setSelectedCourseForReg(courseName || "");
    // Map public tab names to registration form mode values
    const modeMap: Record<string, string> = {
      "E-learning Course": "E-Learning (Self-Paced)",
      "Offline Training": "Classroom Training",
      "Online Training": "Online Training",
      "Site Training": "Site Training",
    };
    setSelectedModeForReg(modeMap[mode || ""] || mode || "");
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

  // Configured to load dynamically from the database
  const [baseCourses, setBaseCourses] = useState<Course[]>([]);

  useEffect(() => {
    fetch('/api/register', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.courses)) {
          setBaseCourses(d.courses);
        }
      })
      .catch(err => console.error("Failed to load courses:", err));
  }, []);

  const onlineCourses = baseCourses.filter(c => !["FIPC", "ISAB", "TFSE", "FSUS"].includes(c.code));
  const isTrainingActive = ["Offline Training", "Online Training", "E-learning Course", "Site Training"].includes(activeTab);

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
              <BackButton 
                onClick={() => {
                  const hasData = localStorage.getItem("registrationData");
                  if (!isFormSubmitted && hasData) {
                     if(!window.confirm("You have unsaved changes. Are you sure you want to go back?")) return;
                  }
                  setIsRegistering(false); 
                  setIsFormSubmitted(false); 
                }} 
                className="bg-white px-3 py-1.5 rounded-xl border border-slate-200" 
                label="Close" 
              />
            </div>

            <div className="flex-1 bg-slate-50 overflow-y-auto">
              <RegistrationForm
                selectedCountry={selectedCountry}
                selectedCourse={selectedCourseForReg}
                selectedMode={selectedModeForReg}
              />
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
              
              <div className="flex flex-col gap-2 mt-4 text-left">
                <PasswordPolicy dark={true} />
                <label className="flex items-start gap-2 cursor-pointer mt-2 group">
                  <div className="relative flex items-center justify-center mt-0.5">
                    <input
                      type="checkbox"
                      checked={policyAccepted}
                      onChange={(e) => setPolicyAccepted(e.target.checked)}
                      className="appearance-none w-4 h-4 rounded border border-zinc-600 bg-zinc-800 checked:bg-amber-500 checked:border-amber-500 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                      required
                    />
                    <CheckCircle2 size={12} className={`absolute text-zinc-900 pointer-events-none transition-opacity ${policyAccepted ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                  <span className="text-zinc-400 text-[10px] font-medium group-hover:text-zinc-200 transition-colors uppercase tracking-widest">
                    I acknowledge the password policy
                  </span>
                </label>
              </div>

              <button type="submit" disabled={!policyAccepted} className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed">Authorize Access</button>

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

        <header className="w-full h-32 relative flex items-center justify-end px-10 text-white overflow-hidden shadow-lg">
          <img src={getDriveImageUrl("1-bOd5_sYhjMP5_BsZNDQHkFbxcmXHsOK")} alt="Header Background" referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover -z-10" />
          <div className="absolute inset-0 bg-[#004098]/10"></div>
        </header>

      <nav className="bg-slate-100 border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center h-16 overflow-x-auto lg:overflow-visible no-scrollbar">
          <button onClick={() => setActiveTab("Introduction")} className={`h-full px-6 text-sm font-bold transition-all border-b-4 flex items-center whitespace-nowrap ${activeTab === "Introduction" ? "border-orange-500 bg-white text-[#004098]" : "border-transparent text-slate-500 hover:text-[#004098]"}`}>Introduction</button>
          
          <div className="relative h-full" onMouseEnter={() => setIsHoveringCourses(true)} onMouseLeave={() => setIsHoveringCourses(false)}>
            <button className={`h-full px-6 text-sm font-bold transition-all border-b-4 flex items-center gap-2 whitespace-nowrap ${isTrainingActive ? "border-orange-500 bg-white text-[#004098]" : "border-transparent text-slate-500 hover:text-[#004098]"}`}>Training Courses <ChevronDown size={14} /></button>
            {isHoveringCourses && (
              <div className="absolute top-full left-0 w-64 bg-white shadow-xl border border-slate-100 py-2 z-50 rounded-b-xl">
                {["Offline Training", "Online Training", "Site Training", "E-learning Course"].map((option) => (
                  <button key={option} onClick={() => { setActiveTab(option); setIsHoveringCourses(false); }} className="w-full text-left px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#004098] flex items-center gap-3">
                    {option === "Offline Training" && <BookOpen size={16} />} 
                    {option === "Online Training" && <Video size={16} />} 
                    {option === "Site Training" && <Building2 size={16} />} 
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

      <main className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
        {activeTab === "Introduction" && (
          <div className="animate-in fade-in space-y-12 text-slate-700">
            <div className="space-y-6">
              <h1 className="text-3xl md:text-4xl font-bold text-[#004098]">Technical Training School</h1>
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
            <h2 className="text-2xl md:text-3xl font-light text-[#004098]">Offline Training Programs</h2>
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

                    <button onClick={() => startRegistration(course.name, activeTab)} className="w-full bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white font-black py-3 rounded-2xl flex items-center justify-center gap-2 transition-all text-sm">Register Now <ArrowRight size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Online Training" && (
          <div className="animate-in fade-in space-y-8 max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-light text-[#004098]">Online VILT Programs</h2>
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

                    <button onClick={() => startRegistration(course.name, activeTab)} className="w-full sm:w-auto bg-orange-500 text-white hover:bg-blue-600 font-bold px-8 py-3 rounded-xl flex items-center gap-2 transition-all">Register Now <ArrowRight size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === "E-learning Course" && (
          <div className="animate-in fade-in space-y-8 max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-light text-[#004098]">E-Learning Courses</h2>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-6 shadow-sm mb-6 flex items-start gap-4">
              <div className="bg-white p-3 rounded-xl shadow-sm text-blue-600 shrink-0">
                <MonitorPlay size={24} />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 mb-2">Self-paced Learning Platform</h3>
                <p className="text-blue-800 text-sm leading-relaxed mb-4">Master Yokogawa systems at your own pace. Each module includes comprehensive video tutorials, interactive simulators, and knowledge check assessments.</p>
                <div className="flex flex-wrap gap-3">
                  <span className="text-xs font-bold text-blue-700 bg-blue-100/50 px-3 py-1.5 rounded-lg flex items-center gap-1.5"><PlayCircle size={14}/> Video Modules</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100/50 px-3 py-1.5 rounded-lg flex items-center gap-1.5"><CheckCircle2 size={14}/> Auto-graded Assessments</span>
                  <span className="text-xs font-bold text-purple-700 bg-purple-100/50 px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Award size={14}/> Digital Certificate</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {baseCourses.map((course) => (
                <div key={`el-${course.id}`} className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col hover:border-blue-400 hover:shadow-xl transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-sm">{course.code}</div>
                    <div className="bg-slate-100 rounded-full px-3 py-1 text-xs font-bold text-slate-500 flex items-center gap-1.5"><Clock size={12}/> 90 Days Access</div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight group-hover:text-blue-600 transition-colors">{course.name}</h3>
                  <div className="mt-auto pt-6 space-y-3">
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="w-[15%] h-full bg-blue-200 group-hover:bg-blue-500 transition-colors duration-1000"></div>
                    </div>
                    <div className="flex text-[10px] text-slate-400 font-bold tracking-widest uppercase justify-between">
                      <span>Track Progress</span>
                      <span>100% Completion Required</span>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <a 
                        href={course.agendaPath || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-center transition-all flex items-center justify-center gap-1.5 border
                          ${course.agendaPath 
                            ? "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:shadow-sm" 
                            : "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                          }`}
                        onClick={(e) => !course.agendaPath && e.preventDefault()}
                      >
                        <FileText size={14} className={course.agendaPath ? "text-indigo-500" : ""} />
                        <span>Agenda</span>
                      </a>
                      <button onClick={() => startRegistration(course.name, activeTab)} className="flex-1 bg-indigo-600 text-white hover:bg-blue-700 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all text-sm">Enroll <ArrowRight size={14}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Site Training" && (
          <div className="animate-in fade-in space-y-8 max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-light text-[#004098]">Site Training Programs</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="md:col-span-2 bg-[#004098] p-8 rounded-3xl text-white shadow-lg flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/30 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                <h3 className="text-2xl font-bold mb-4">Training at Your Facility</h3>
                <p className="text-blue-100 leading-relaxed max-w-lg mb-6">Minimize travel time and expenses. Our expert Yokogawa trainers will travel to your plant or corporate office to deliver customized, hands-on sessions utilizing your own systems or our portable training rigs.</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-medium">
                  <li className="flex items-center gap-2 text-blue-50"><CheckCircle2 size={16} className="text-orange-400"/> Customized Curriculum</li>
                  <li className="flex items-center gap-2 text-blue-50"><CheckCircle2 size={16} className="text-orange-400"/> Portable Simulators</li>
                  <li className="flex items-center gap-2 text-blue-50"><CheckCircle2 size={16} className="text-orange-400"/> Flexible Scheduling</li>
                  <li className="flex items-center gap-2 text-blue-50"><CheckCircle2 size={16} className="text-orange-400"/> Maximize Team Participation</li>
                </ul>
              </div>
              <div className="bg-slate-100 rounded-3xl border border-slate-200 overflow-hidden relative min-h-[250px]">
                <img src="/placeholder.svg?height=400&width=600" alt="Site Training" className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex items-end p-6">
                  <div className="text-white">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mb-3">
                      <Building2 size={20} />
                    </div>
                    <p className="font-bold">Corporate & Plant Sites</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {baseCourses.map((course) => (
                <div key={`site-${course.id}`} className="bg-white border-2 border-slate-100 rounded-3xl p-5 flex flex-col sm:flex-row items-center gap-5 hover:border-orange-200 hover:shadow-lg transition-all group">
                  <div className="w-20 h-20 bg-orange-50 rounded-2xl flex flex-col items-center justify-center text-orange-600 shrink-0">
                    <span className="text-xs font-bold opacity-60">CODE</span>
                    <span className="font-black text-lg">{course.code}</span>
                  </div>
                  <div className="flex-1 text-center sm:text-left w-full">
                    <h3 className="text-lg font-bold text-slate-800 mb-1 leading-tight">{course.name}</h3>
                    <p className="text-sm text-slate-500 font-medium mb-3 flex items-center justify-center sm:justify-start gap-1.5"><Clock size={14}/> {course.days} Days Base Duration</p>
                    
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                      <a 
                        href={course.agendaPath || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex-1 py-2 rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 border
                          ${course.agendaPath 
                            ? "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300" 
                            : "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                          }`}
                        onClick={(e) => !course.agendaPath && e.preventDefault()}
                      >
                        <FileText size={14} className={course.agendaPath ? "text-slate-400" : ""} />
                        <span>Base Agenda</span>
                      </a>
                      <button onClick={() => startRegistration(course.name, activeTab)} className="flex-1 bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-500 hover:text-white font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs">Request Site <ArrowRight size={14}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {activeTab === "Bangalore Training Centre" && (
          <div className="animate-in fade-in space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <h1 className="text-3xl md:text-4xl font-light text-[#004098]">Bangalore Training Centre</h1>
              <div className="bg-[#004098] text-white px-6 py-4 rounded-2xl flex items-center gap-4 shadow-lg w-full md:w-auto">
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
          <div className="animate-in fade-in space-y-12 max-w-6xl mx-auto">
            <div className="text-center space-y-3">
              <h1 className="text-3xl md:text-4xl font-bold text-[#004098]">Yokogawa Training Calendar</h1>
              <p className="text-slate-500 max-w-xl mx-auto text-sm">
                Explore the upcoming technical schedule for all our training programs globally.
              </p>
            </div>
            <DynamicCalendar />
          </div>
        )}

        {activeTab === "Contact Us" && (
          <div className="animate-in fade-in space-y-10 max-w-6xl mx-auto">
            <div className="bg-slate-50 rounded-3xl overflow-hidden border border-slate-200 shadow-sm flex flex-col md:flex-row min-h-[400px]">
                <div className="md:w-5/12 relative bg-slate-200 h-64 md:h-auto">
                  <img src={getDriveImageUrl("1kObpKgixyg2wHwlygdJeGoMaBnSyPBGr")} alt="Office" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>
              <div className="md:w-7/12 p-8 md:p-12 flex flex-col justify-center space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold text-[#004098]">Get in Touch</h2>
                <p className="text-slate-600 text-sm leading-relaxed">For custom bulk training inquiries, institutional scheduling, or physical lab visits, connect directly with our coordination office.</p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-slate-700 font-semibold"><Mail size={20} className="text-[#004098]"/> YIL-YTS@yokogawa.com</div>
                  <div className="flex items-center gap-4 text-slate-700 font-semibold"><Phone size={20} className="text-[#004098]"/> +91-80-41586000</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}