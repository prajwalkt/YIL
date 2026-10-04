"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Loader, Activity, MessageSquare, ClipboardList, BookOpen, Tv } from 'lucide-react';
import BackButton from '../../../../components/BackButton';
import VPFEAssessmentForm from '../../../../components/VPFEAssessmentForm';
import CourseFeedbackForm from '../../../../components/CourseFeedbackForm';
import PracticeSessionView from '../../../../components/PracticeSessionView';

export default function CourseDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [userRole, setUserRole] = useState('');
  
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [marked, setMarked] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [msg, setMsg] = useState('');
  
  const [activeTab, setActiveTab] = useState<string>('overview');

  useEffect(() => {
    fetchData();
    // fetch internet time
    fetch('https://worldtimeapi.org/api/timezone/Etc/UTC')
      .then(r => r.json())
      .then(d => {
        setCurrentTime(new Date(d.utc_datetime));
      })
      .catch(e => {
        setCurrentTime(new Date());
      });
  }, [id]);

  const fetchData = async () => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        setUserRole(JSON.parse(stored).role);
      }
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/student/dashboard', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success && data.enrollments) {
        const found = data.enrollments.find((e: any) => e.EnrollmentID.toString() === id);
        setEnrollment(found);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentTime && marked === null) {
      const hours = currentTime.getUTCHours();
      const minutes = currentTime.getUTCMinutes();
      if (hours === 23 && minutes >= 59) {
        setMarked('ABSENT');
        setMsg('Automatically marked as absent at end of day.');
      }
    }
  }, [currentTime, marked]);

  const markAttendance = async (status: 'PRESENT' | 'ABSENT') => {
    setAttendanceLoading(true);
    setMsg('');
    try {
      // In a real app, send to API. For now, simulate.
      setMarked(status);
      setMsg(`Successfully marked attendance as ${status}`);
    } catch (e: any) {
      setMsg(e.message || 'Failed to mark attendance');
    }
    setAttendanceLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader size={32} className="animate-spin text-blue-600"/>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <BackButton />
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-red-500 font-bold">
            Enrollment not found or access denied.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <BackButton onClick={() => router.push('/student')} />
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md uppercase">{enrollment.Mode}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${
                  enrollment.Status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}>{enrollment.Status}</span>
              </div>
              <h1 className="text-3xl font-black text-gray-800">{enrollment.CourseTitle}</h1>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <button onClick={() => setActiveTab('overview')} className={`p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2 transition-colors ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
              <Activity size={24}/> Overview
            </button>
            <button onClick={() => setActiveTab('feedback')} className={`p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2 transition-colors ${activeTab === 'feedback' ? 'bg-purple-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
              <MessageSquare size={24}/> Feedback
            </button>
            
            <a href={`/student/manual/${enrollment.EnrollmentID}?url=${encodeURIComponent(enrollment.ManualURL || '/manual/scormcontent/index.html')}`} target="_blank" rel="noopener noreferrer" className="p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
              <BookOpen size={24}/> Material
            </a>

            {/* Render conditionally based on course data, e.g. VPFE assessment */}
            {userRole === 'STUDENT' && (
              <button onClick={() => setActiveTab('assessment')} className={`p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2 transition-colors ${activeTab === 'assessment' ? 'bg-teal-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                <ClipboardList size={24}/> Assessment
              </button>
            )}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-blue-800 flex items-center gap-2"><Activity size={20}/> Daily Attendance</h2>
                  {currentTime && (
                    <span className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-white px-3 py-1.5 rounded-lg">
                      <Clock size={14}/> {currentTime.toLocaleTimeString()} (UTC)
                    </span>
                  )}
                </div>
                <p className="text-sm text-blue-600">Please mark your attendance for today's session. If no attendance is marked by 11:59 PM, it will default to Absent.</p>
                
                {msg && (
                  <div className={`p-4 rounded-xl text-sm font-bold ${marked === 'PRESENT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {msg}
                  </div>
                )}

                <div className="flex gap-4">
                  <button 
                    onClick={() => markAttendance('PRESENT')}
                    disabled={attendanceLoading || marked !== null}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-500/30 hover:bg-green-700 disabled:opacity-50 transition-all"
                  >
                    {attendanceLoading ? <Loader className="animate-spin" size={20}/> : <CheckCircle size={20}/>}
                    Mark Present
                  </button>
                  <button 
                    onClick={() => markAttendance('ABSENT')}
                    disabled={attendanceLoading || marked !== null}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-500/30 hover:bg-red-700 disabled:opacity-50 transition-all"
                  >
                    {attendanceLoading ? <Loader className="animate-spin" size={20}/> : <XCircle size={20}/>}
                    Mark Absent
                  </button>
                </div>
              </div>

              {enrollment.TemplateID && (
                <div className="mt-8 border-t border-gray-100 pt-8">
                  <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2"><Tv size={24}/> Practice Environment</h2>
                  <p className="text-sm text-gray-500 mb-6">Launch a dedicated virtual machine for your practical exercises.</p>
                  <button onClick={() => setActiveTab('practice')} className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center gap-2">
                    <Tv size={18}/> Open Practice Session
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'feedback' && (
            <div>
              <h2 className="text-2xl font-black text-gray-800 mb-4">Course Feedback</h2>
              <CourseFeedbackForm enrollment={enrollment} />
            </div>
          )}
          
          {activeTab === 'assessment' && (
            <div>
              {enrollment.CourseTitle?.toUpperCase().includes('VPFE') || enrollment.CourseCode?.toUpperCase().includes('VPFE') ? (
                <VPFEAssessmentForm enrollment={enrollment} />
              ) : (
                <div className="bg-gray-100 p-8 rounded-2xl text-center text-gray-500 font-bold border border-gray-200">
                  No assessment available for this course.
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'practice' && (
            <div>
              <h2 className="text-2xl font-black text-gray-800 mb-4">Practice Session</h2>
              <PracticeSessionView courseId={enrollment.CourseID} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
