"use client";

import { useEffect, useState, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  BookOpen,
  MessageSquare,
  ChevronDown,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Users,
  XCircle,
} from "lucide-react";

interface Props {
  selectedCountry?: string;
  selectedCourse?: string;
  selectedMode?: string;
  selectedBatchId?: number;
  onSuccess?: () => void;
}

export default function RegistrationForm({
  selectedCountry = "India",
  selectedCourse,
  selectedMode,
  selectedBatchId,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
    country: selectedCountry,
    graduationYear: "",
    course: selectedCourse || "",
    trainingMode: selectedMode || "Online / VILT Training",
    sponsor: "Self",
    instructions: "",
    preferredStartDate: "",
    preferredEndDate: "",
    selectedBatchId: selectedBatchId || null,
  });
  const [emailExists, setEmailExists] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);

  // Sync when props change (e.g. user clicks register from a different course card)
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      country: selectedCountry,
      course: selectedCourse || prev.course,
      trainingMode: selectedMode || prev.trainingMode,
      selectedBatchId: selectedBatchId || prev.selectedBatchId,
    }));
  }, [selectedCountry, selectedCourse, selectedMode, selectedBatchId]);

  // Fetch available batches and courses
  useEffect(() => {
    const fetchData = async () => {
      setCalendarLoading(true);
      setCoursesLoading(true);
      try {
        const [calRes, courseRes] = await Promise.all([
          fetch('/api/calendar'),
          fetch('/api/register')
        ]);
        
        const calData = await calRes.json();
        if (calData.success) {
          setBatches(calData.calendar || []);
        }

        const courseData = await courseRes.json();
        if (courseData.success) {
          setCourses(courseData.courses || []);
        }
      } catch (e) {
        console.error("Failed to load data", e);
      }
      setCalendarLoading(false);
      setCoursesLoading(false);
    };
    fetchData();
  }, []);

  const countries = [
    "India",
    "Japan",
    "Singapore",
    "Malaysia",
    "Thailand",
    "Vietnam",
    "Indonesia",
    "Philippines",
    "Australia",
    "New Zealand",
    "Others",
  ];



  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // Check if email already has an LMS account (non-blocking UX hint)
  const handleEmailBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const email = e.target.value.trim().toLowerCase();
    if (!email || !email.includes('@')) return;
    setEmailChecking(true);
    try {
      const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setEmailExists(data.exists === true);
    } catch { /* silently ignore */ }
    setEmailChecking(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          data.append(key, value.toString());
        }
      });
      if (form.selectedBatchId) {
        data.set("SelectedSlotID", form.selectedBatchId.toString());
      }

      const response = await fetch("/api/register", {
        method: "POST",
        body: data,
      });

      const result = await response.json();
      if (result.success) {
        localStorage.setItem(
          "registrationData",
          JSON.stringify({
            name: form.name,
            email: form.email,
            phone: form.phone,
            country: form.country,
            course: form.course,
            trainingMode: form.trainingMode,
            registrationId: result.registrationId,
          })
        );
        window.location.href = "/payment";
      } else {
        alert("Registration Failed: " + result.message);
      }
    } catch (error) {
      console.error(error);
      alert("Server Error");
    } finally {
      setLoading(false);
    }
  };

  const trainingModes = [
    { value: "Offline / Classroom Training", icon: "🏫", desc: "In-person at YTS facility", selectedCls: "border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200", hoverCls: "hover:border-blue-300 hover:shadow-sm" },
    { value: "Online / VILT Training", icon: "💻", desc: "Live virtual instructor-led", selectedCls: "border-green-500 bg-green-50 shadow-md ring-2 ring-green-200", hoverCls: "hover:border-green-300 hover:shadow-sm" },
    { value: "Site Training", icon: "🏭", desc: "Training at your site", selectedCls: "border-orange-500 bg-orange-50 shadow-md ring-2 ring-orange-200", hoverCls: "hover:border-orange-300 hover:shadow-sm" },
    { value: "E-Learning (Self-Paced)", icon: "📱", desc: "On-demand, learn anytime", selectedCls: "border-purple-500 bg-purple-50 shadow-md ring-2 ring-purple-200", hoverCls: "hover:border-purple-300 hover:shadow-sm" },
  ];

  return (
    <div className="w-full h-full overflow-y-auto bg-[#F0EBF8] py-10 px-5">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-md border-t-4 border-[#673AB7] overflow-hidden">
          <div className="px-10 py-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl md:text-4xl font-bold text-slate-900">
                  Yokogawa Training Services
                </h1>
                <p className="text-slate-500 mt-3 text-lg">
                  Course Registration Form
                </p>
              </div>
              <div className="w-16 h-16 rounded-full bg-[#673AB7] text-white flex items-center justify-center text-3xl font-bold">
                Y
              </div>
            </div>

            {/* Pre-filled banner */}
            {(selectedCourse || selectedMode) && (
              <div className="mt-6 bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
                <span className="text-xl">✅</span>
                <div>
                  <p className="font-bold text-purple-800 text-sm">Course & Mode Pre-Selected</p>
                  <p className="text-purple-600 text-xs mt-0.5">
                    {selectedCourse && <span className="font-semibold">Course: {selectedCourse}</span>}
                    {selectedCourse && selectedMode && " · "}
                    {selectedMode && <span className="font-semibold">Mode: {selectedMode}</span>}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 h-2 rounded-full bg-slate-200">
              <div className="w-1/2 h-full rounded-full bg-[#673AB7]" />
            </div>
            <p className="text-sm text-slate-500 mt-4">Step 1 of 2</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-8">

          {/* Personal Information */}
          <div className="bg-white rounded-2xl shadow-md p-8">
            <h2 className="text-2xl font-bold mb-8 text-slate-800">Personal Information</h2>

            <div className="mb-8">
              <label className="text-sm font-semibold text-slate-500">Full Name *</label>
              <div className="mt-2 relative">
                <User size={20} className="absolute left-4 top-4 text-slate-400" />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                  className="w-full pl-12 pr-5 py-4 rounded-xl border border-slate-300 focus:border-[#673AB7] focus:ring-4 focus:ring-purple-200 outline-none transition"
                />
              </div>
            </div>

            <div className="mb-8">
              <label className="text-sm font-semibold text-slate-500">Email Address *</label>
              <div className="mt-2 relative">
                <Mail size={20} className="absolute left-4 top-4 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleEmailBlur}
                  required
                  placeholder="your.email@company.com"
                  className={`w-full pl-12 pr-5 py-4 rounded-xl border outline-none transition ${
                    emailExists ? 'border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100' : 'border-slate-300 focus:border-[#673AB7] focus:ring-4 focus:ring-purple-200'
                  }`}
                />
              </div>
              {emailChecking && (
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> Checking…
                </p>
              )}
              {emailExists && !emailChecking && (
                <div className="mt-2 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
                  <span className="text-lg shrink-0">ℹ️</span>
                  <div>
                    <p className="text-blue-800 font-semibold text-sm">We found an existing account with this email.</p>
                    <p className="text-blue-600 text-xs mt-0.5">You may continue — a new registration will be created while your existing account and history remain intact.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-8">
              <label className="text-sm font-semibold text-slate-500">Phone Number *</label>
              <div className="mt-2 relative">
                <Phone size={20} className="absolute left-4 top-4 text-slate-400" />
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  placeholder="+91 9999999999"
                  className="w-full pl-12 pr-5 py-4 rounded-xl border border-slate-300 focus:border-[#673AB7] focus:ring-4 focus:ring-purple-200 outline-none transition"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm font-semibold text-slate-500">Organization</label>
              <div className="mt-2 relative">
                <Building2 size={20} className="absolute left-4 top-4 text-slate-400" />
                <input
                  type="text"
                  name="organization"
                  value={form.organization}
                  onChange={handleChange}
                  placeholder="Your company or organization"
                  className="w-full pl-12 pr-5 py-4 rounded-xl border border-slate-300 focus:border-[#673AB7] focus:ring-4 focus:ring-purple-200 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Training Information */}
          <div className="bg-white rounded-2xl shadow-md p-8">
            <h2 className="text-2xl font-bold mb-8 text-slate-800">Training Information</h2>

            <div className="mb-8">
              <label className="text-sm font-semibold text-slate-500">Graduation Year</label>
              <div className="relative mt-2">
                <GraduationCap size={20} className="absolute left-4 top-4 text-slate-400" />
                <input
                  type="text"
                  name="graduationYear"
                  value={form.graduationYear}
                  onChange={handleChange}
                  placeholder="e.g. 2024"
                  className="w-full pl-12 pr-5 py-4 rounded-xl border border-slate-300 focus:border-[#673AB7] focus:ring-4 focus:ring-purple-200 outline-none"
                />
              </div>
            </div>

            <div className="mb-8">
              <label className="text-sm font-semibold text-slate-500">Course *</label>
              <div className="relative mt-2">
                <BookOpen size={20} className="absolute left-4 top-4 text-slate-400" />
                <select
                  name="course"
                  value={form.course}
                  onChange={handleChange}
                  required
                  disabled={!!selectedCourse}
                  className={`w-full pl-12 pr-10 py-4 rounded-xl border border-slate-300 appearance-none focus:border-[#673AB7] focus:ring-4 focus:ring-purple-200 outline-none ${selectedCourse ? 'bg-purple-50 text-purple-800 border-purple-300 cursor-not-allowed font-semibold' : ''}`}
                >
                  <option value="">Select Course</option>
                  {courses.map((courseObj) => (
                    <option key={courseObj.id} value={courseObj.name}>{courseObj.name}</option>
                  ))}
                </select>
                <ChevronDown size={18} className="absolute right-4 top-5 text-slate-400" />
              </div>
              {selectedCourse && (
                <p className="text-xs text-purple-600 mt-1.5 font-semibold flex items-center gap-1">🔒 Pre-selected from course catalog</p>
              )}
            </div>

            <div className="mb-8">
              <label className="text-sm font-semibold text-slate-500">Training Mode *</label>
              {selectedMode && (
                <p className="text-xs text-purple-600 mt-1 mb-3 font-semibold flex items-center gap-1">🔒 Pre-selected — to change, go back and choose a different training type</p>
              )}
              <div className="grid grid-cols-2 gap-4 mt-4">
                {trainingModes.map((mode) => {
                  const isSelected = form.trainingMode === mode.value;
                  const isLocked = !!selectedMode;
                  return (
                    <label
                      key={mode.value}
                      className={`flex flex-col items-center justify-center text-center gap-2 p-5 rounded-2xl border-2 transition-all transform ${
                        isSelected
                          ? mode.selectedCls + " scale-[1.02]"
                          : isLocked
                          ? "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
                          : "border-slate-200 bg-white cursor-pointer " + mode.hoverCls
                      }`}
                    >
                      <input
                        type="radio"
                        name="trainingMode"
                        value={mode.value}
                        checked={isSelected}
                        onChange={handleChange}
                        disabled={isLocked && !isSelected}
                        className="sr-only"
                      />
                      <div className={`text-4xl ${isSelected ? '' : 'grayscale opacity-80'}`}>
                        {mode.icon}
                      </div>
                      <div>
                        <div className={`font-bold text-sm ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                          {mode.value}
                        </div>
                        <p className={`text-xs mt-1 ${isSelected ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                          {mode.desc}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>

              {form.trainingMode === "E-Learning (Self-Paced)" && (
                <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="font-bold text-blue-800 text-sm">Instant Access After Approval</p>
                      <p className="text-blue-600 text-xs mt-1">
                        Once your registration is approved, you will receive an email with your login credentials.
                        Your course videos and materials will be available immediately in the Student Portal.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {/* Dynamic Calendar Selection block restored */}
              {true && (
                <div className="mt-8 bg-white rounded-2xl p-6 border-2 border-[#673AB7]/20 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <CalendarDays size={18} className="text-[#673AB7]" />
                    Select Training Schedule
                  </h3>
                  
                  {calendarLoading ? (
                    <div className="text-sm text-slate-500">Loading available schedules...</div>
                  ) : (
                    <div>
                      <select
                        name="selectedBatchId"
                        value={form.selectedBatchId || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm({ ...form, selectedBatchId: val ? parseInt(val) : null, preferredStartDate: "", preferredEndDate: "" });
                        }}
                        disabled={!form.course}
                        className={`w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#673AB7] focus:ring-4 focus:ring-purple-200 outline-none transition bg-white ${!form.course ? 'opacity-75 cursor-not-allowed bg-slate-50' : ''}`}
                      >
                        {!form.course ? (
                          <option value="">Please select a Course first to view available schedules...</option>
                        ) : (
                          <>
                            <option value="">-- I want to request custom dates --</option>
                            {batches.filter(b => (b.Title === form.course || b.Title.startsWith(form.course) || b.Title.includes(form.course)) && new Date(b.StartDate) >= new Date()).map(b => (
                              <option key={b.CalendarID} value={b.CalendarID} disabled={b.CurrentEnrolled >= b.MaxParticipants}>
                                {new Date(b.StartDate).toLocaleDateString()} to {new Date(b.EndDate).toLocaleDateString()} - {b.Location || 'TBD'} {b.CurrentEnrolled >= b.MaxParticipants ? '(Full)' : `(${b.MaxParticipants - b.CurrentEnrolled} seats left)`}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Preferred Dates — shown if no batch selected */}
              {!form.selectedBatchId && (
                <div className="mt-8 bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <CalendarDays size={18} className="text-slate-400" />
                    Requested Dates (Required)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">From Date</label>
                      <input
                        type="date"
                        id="preferredStartDate"
                        name="preferredStartDate"
                        value={form.preferredStartDate || ''}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="mt-2 w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#673AB7] focus:ring-4 focus:ring-purple-200 outline-none transition bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">To Date</label>
                      <input
                        type="date"
                        id="preferredEndDate"
                        name="preferredEndDate"
                        value={form.preferredEndDate || ''}
                        onChange={handleChange}
                        min={form.preferredStartDate || new Date().toISOString().split('T')[0]}
                        className="mt-2 w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#673AB7] focus:ring-4 focus:ring-purple-200 outline-none transition bg-white"
                        required
                      />
                    </div>
                  </div>
                  {form.preferredStartDate && form.preferredEndDate && form.preferredStartDate > form.preferredEndDate && (
                    <p className="text-red-500 text-xs mt-2 font-semibold">From Date cannot be after To Date.</p>
                  )}
                </div>
              )}
            </div>

            <div className="mb-8">
              <label className="text-sm font-semibold text-slate-500">Organized By</label>
              <div className="flex gap-8 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sponsor"
                    value="Self"
                    checked={form.sponsor === "Self"}
                    onChange={handleChange}
                    className="accent-[#673AB7]"
                  />
                  <span className="font-semibold text-slate-700">Self</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sponsor"
                    value="Organization"
                    checked={form.sponsor === "Organization"}
                    onChange={handleChange}
                    className="accent-[#673AB7]"
                  />
                  <span className="font-semibold text-slate-700">Organization</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-500">Special Instructions</label>
              <div className="relative mt-2">
                <MessageSquare size={20} className="absolute left-4 top-4 text-slate-400" />
                <textarea
                  rows={4}
                  name="instructions"
                  value={form.instructions}
                  onChange={handleChange}
                  placeholder="Any special requirements or notes..."
                  className="w-full pl-12 pr-5 py-4 rounded-xl border border-slate-300 resize-none focus:border-[#673AB7] focus:ring-4 focus:ring-purple-200 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center bg-white rounded-2xl shadow-md p-8">
            <p className="text-sm text-slate-500">* Required fields. No fees collected at this stage.</p>
            <button
              type="submit"
              disabled={Boolean(
                loading ||
                (!form.selectedBatchId && (!form.preferredStartDate || !form.preferredEndDate)) ||
                (form.preferredStartDate && form.preferredEndDate && form.preferredStartDate > form.preferredEndDate)
              )}
              className="bg-[#673AB7] hover:bg-[#5E35B1] text-white px-10 py-4 rounded-xl font-bold text-lg shadow-lg transition-all hover:scale-105 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? "Submitting..." : "Continue"}
              {!loading && <ArrowRight size={20} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}