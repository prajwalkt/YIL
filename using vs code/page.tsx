"use client";
import React, { useState } from 'react';
import { 
  LogOut, ChevronDown, MapPin, Users, 
  CheckCircle2, Mail, Microscope, Monitor, Laptop, Wifi, BookOpen, Video, MonitorPlay, Lock, ArrowRight, Clock, Radio, ScreenShare, HelpCircle, Phone, Printer
} from 'lucide-react';

// --- Interfaces ---
interface Course {
  id: number;
  name: string;
  code: string;
  days: string;
}

interface GalleryImage {
  id: string;
  title: string;
}

export default function YTSDashboard() {
  const [activeTab, setActiveTab] = useState<string>("Introduction");
  const [isHoveringCourses, setIsHoveringCourses] = useState<boolean>(false);

  const getDriveImageUrl = (id: string): string => `https://drive.google.com/thumbnail?authuser=0&sz=w1600&id=${id}`;

  const galleryImages: GalleryImage[] = [
    { id: "1LsjqVluVIvya2WjYLyy2Necu-lK3c3dR", title: "Instructional Class" },
    { id: "1DgxinRnet7ZBwuA0Zqs1OWnMHKYYIJAO", title: "Main Classroom" },
    { id: "1nWtVBo3iOt-6x8RSrV9NOEjfnbYE6LRP", title: "Reception Area" },
    { id: "1C1d5wsOenmCfgZasmmFjAjZb2Uv1CNQf", title: "Process Training Lab" },
    { id: "1U7gf5xaDjeq_BXdrjsUAZakib4Nt9JFa", title: "Workstations" },
    { id: "1i6LSjUn01Qcw2KH2IbOzKB4bLWJmzL-2", title: "DCS Engineering Panel" }
  ];

  const baseCourses: Course[] = [
    { id: 1, name: "CENTUM VP DCS Operation", code: "VPOP", days: "3" },
    { id: 2, name: "CENTUM VP DCS Fundamentals", code: "VPFD", days: "5" },
    { id: 3, name: "CENTUM VP DCS Engineering", code: "VPEG", days: "5" },
    { id: 4, name: "CENTUM VP DCS Fundamentals & Engineering", code: "VPFE", days: "5" },
    { id: 5, name: "CENTUM VP DCS Engineering & Maintenance", code: "VPEM", days: "10" },
    { id: 6, name: "CENTUM VP DCS Maintenance", code: "VPMN", days: "3" },
    { id: 7, name: "CENTUM VP DCS Advanced Engineering", code: "VPAE", days: "5" },
    { id: 8, name: "CENTUM VP DCS Batch Engineering", code: "VBEG", days: "5" },
    { id: 9, name: "CENTUM VP DCS AD Suite Engineering", code: "VPAD", days: "5" },
    { id: 10, name: "Consolidated Alarm Management System", code: "CAMS", days: "2" },
    { id: 11, name: "SEBOL Programming", code: "SEBL", days: "3" },
    { id: 12, name: "STARDOM NCS with FAST/TOOLS SCADA", code: "STFT", days: "5" },
    { id: 13, name: "STARDOM NCS with CI Server", code: "STCI", days: "5" },
    { id: 14, name: "STARDOM NCS Engineering", code: "STEG", days: "5" },
    { id: 15, name: "FAST/TOOLS SCADA Operations", code: "FTOP", days: "2" },
    { id: 16, name: "FAST/TOOLS SCADA Engineering", code: "FTEG", days: "5" },
    { id: 17, name: "CI Server Operations", code: "CIOP", days: "2" },
    { id: 18, name: "CI Server Engineering", code: "CIEG", days: "5" },
    { id: 19, name: "Field Bus basics & Engineering", code: "FFEG", days: "3" },
    { id: 20, name: "Field Bus Engineering & PRM", code: "FPRM", days: "5" },
    { id: 21, name: "PROFIBUS Basics and Engineering", code: "PBUS", days: "2" },
    { id: 22, name: "Industrial Communication Protocols", code: "INCP", days: "3" },
    { id: 24, name: "Field Instruments for Process Control", code: "FIPC", days: "5" },
    { id: 25, name: "Asset Management Software- PRM", code: "PRMB", days: "3" },
    { id: 26, name: "Cyber Security for Industrial Control System", code: "CSIC", days: "3" },
    { id: 27, name: "PROSAFE RS Operations", code: "RSOP", days: "2" },
    { id: 28, name: "PROSAFE-RS Engineering with FAST/TOOLS SCADA", code: "RSFT", days: "5" },
    { id: 29, name: "PROSAFE-RS Engineering with CI Server", code: "RSCI", days: "5" },
    { id: 30, name: "PROSAFE RS Engineering", code: "PPRS", days: "5" },
    { id: 31, name: "PROSAFE-RS Advanced Engineering", code: "RSAE", days: "5" },
    { id: 32, name: "PROSAFE-RS with ADsuite Engineering", code: "RSAD", days: "2" },
    { id: 34, name: "Functional Safety for End Users", code: "FSUS", days: "2" },
  ];

  const onlineCourses = baseCourses.filter(c => !["FIPC", "ISAB", "TFSE", "FSUS"].includes(c.code));
  const isTrainingActive = ["Offline Training", "Online Training", "E-learning Course"].includes(activeTab);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="w-full h-32 relative flex items-center justify-between px-10 text-white overflow-hidden shadow-lg"
        style={{ backgroundImage: `url('${getDriveImageUrl("1_Ps2Y0F3dT96sfZGvOW27Fkk1-QNl8RN")}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-[#004098]/30"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black tracking-tighter uppercase">Technical Training School</h2>
          <p className="text-xs font-bold text-white/80 tracking-[0.3em] mt-1 uppercase">Co-innovating tomorrow™</p>
        </div>
        <div className="relative z-10 flex items-center gap-6">
          <span className="text-sm font-bold uppercase tracking-widest opacity-90 hidden md:block">User Portal</span>
          <button className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 transition-all"><LogOut size={24} /></button>
        </div>
      </header>

      <nav className="bg-slate-100 border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center h-16">
          <button onClick={() => setActiveTab("Introduction")} className={`h-full px-6 text-sm font-bold transition-all border-b-4 flex items-center ${activeTab === "Introduction" ? "border-orange-500 bg-white text-[#004098]" : "border-transparent text-slate-500 hover:text-[#004098]"}`}>Introduction</button>
          <div className="relative h-full" onMouseEnter={() => setIsHoveringCourses(true)} onMouseLeave={() => setIsHoveringCourses(false)}>
            <button className={`h-full px-6 text-sm font-bold transition-all border-b-4 flex items-center gap-2 ${isTrainingActive ? "border-orange-500 bg-white text-[#004098]" : "border-transparent text-slate-500 hover:text-[#004098]"}`}>Training Courses <ChevronDown size={14} /></button>
            {isHoveringCourses && (
              <div className="absolute top-full left-0 w-64 bg-white shadow-xl border border-slate-100 py-2 z-50 rounded-b-xl">
                {["Offline Training", "Online Training", "E-learning Course"].map((option) => (
                  <button key={option} onClick={() => { setActiveTab(option); setIsHoveringCourses(false); }} className="w-full text-left px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#004098] flex items-center gap-3">
                    {option === "Offline Training" && <BookOpen size={16} />} {option === "Online Training" && <Video size={16} />} {option === "E-learning Course" && <MonitorPlay size={16} />} {option}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setActiveTab("Bangalore Training Centre")} className={`h-full px-6 text-sm font-bold transition-all border-b-4 flex items-center ${activeTab === "Bangalore Training Centre" ? "border-orange-500 bg-white text-[#004098]" : "border-transparent text-slate-500 hover:text-[#004098]"}`}>Bangalore Training Centre</button>
          <button onClick={() => setActiveTab("Contact Us")} className={`h-full px-6 text-sm font-bold transition-all border-b-4 flex items-center ${activeTab === "Contact Us" ? "border-orange-500 bg-white text-[#004098]" : "border-transparent text-slate-500 hover:text-[#004098]"}`}>Contact Us</button>
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
                  <ul className="space-y-2">{["Participants would attend live instructor lectures and demonstrations on MS-Teams", "Participants will have hands on practice sessions by remote access to Training PC’s loaded with relevant software", "Trainers would present their desktop on MS Teams and adopt step by step approach"].map((li, i) => <li key={i} className="flex gap-2"><CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-1"/> {li}</li>)}</ul>
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
                  <div className="bg-[#004098] p-6 text-white flex-1"><div className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">CODE: {course.code}</div><h3 className="text-lg font-bold leading-tight">{course.name}</h3></div>
                  <div className="p-5 bg-slate-50/50 flex flex-col gap-4"><div className="flex items-center gap-2 text-sm text-slate-500 font-bold"><Clock size={16}/> {course.days} Days</div><button className="w-full bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white font-black py-3 rounded-2xl flex items-center justify-center gap-2 transition-all">Register <ArrowRight size={16} /></button></div>
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
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                  <div className="w-full md:w-24 h-16 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black shrink-0">{course.code}</div>
                  <div className="flex-1 text-center md:text-left"><h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{course.name}</h3><span className="flex items-center gap-1 text-sm text-slate-400 mt-2"><Clock size={14}/> {course.days} Days</span></div>
                  <button className="w-full md:w-auto bg-slate-900 text-white hover:bg-blue-600 font-bold px-8 py-3 rounded-xl flex items-center gap-2 transition-all">Register <ArrowRight size={18}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Bangalore Training Centre" && (
          <div className="animate-in fade-in space-y-12">
            <div className="flex justify-between items-start"><h1 className="text-4xl font-light text-[#004098]">Bangalore Training Centre</h1><div className="bg-[#004098] text-white px-6 py-4 rounded-2xl flex items-center gap-4"><MapPin className="text-orange-400" /><div className="text-xs uppercase font-black tracking-widest leading-tight">Electronic City<br/>Phase 1, Bangalore</div></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {galleryImages.map((img, idx) => (
                <div key={idx} className={`relative group overflow-hidden rounded-2xl border bg-slate-100 ${idx === 0 ? "md:col-span-2 md:row-span-2 min-h-100" : "h-64"}`}>
                  <img src={getDriveImageUrl(img.id)} alt={img.title} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-black/80 to-transparent z-10"><p className="text-white font-bold text-sm uppercase tracking-wider">{img.title}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Contact Us" && (
          <div className="animate-in fade-in space-y-10 max-w-6xl mx-auto">
            <div className="bg-slate-50 rounded-3xl overflow-hidden border border-slate-200 shadow-sm flex flex-col md:flex-row min-h-100">
              <div className="md:w-5/12 relative bg-slate-200"><img src={getDriveImageUrl("1kObpKgixyg2wHwlygdJeGoMaBnSyPBGr")} alt="Office" referrerPolicy="no-referrer" className="w-full h-full object-cover" /></div>
              <div className="md:w-7/12 p-10 bg-white flex flex-col justify-center"><h3 className="text-2xl font-bold text-[#004098] mb-6">Regional Support Office</h3><div className="space-y-6"><p className="font-bold text-slate-800">Technical Training Division</p><p className="text-slate-600">Plot No.96, Electronic City Complex, Hosur Road, Bangalore - 560 100, India</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm"><div className="flex items-center gap-3 text-[#004098] font-medium"><Phone size={18} className="text-orange-500"/> (91)-80-4158-6000</div><div className="flex items-center gap-3 text-[#004098] font-medium"><Mail size={18} className="text-orange-500"/> training-support@portal.com</div></div></div></div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}