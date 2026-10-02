"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Loader, Activity } from 'lucide-react';
import BackButton from '../../../../components/BackButton';

export default function CourseDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [marked, setMarked] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    // Fetch time from worldtimeapi or similar to get "internet time"
    fetch('https://worldtimeapi.org/api/timezone/Etc/UTC')
      .then(r => r.json())
      .then(d => {
        setCurrentTime(new Date(d.utc_datetime));
        setLoading(false);
      })
      .catch(e => {
        setCurrentTime(new Date()); // fallback
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (currentTime) {
      // Check if it's past 11:59 PM (just simulating end of day check)
      const hours = currentTime.getUTCHours();
      const minutes = currentTime.getUTCMinutes();
      if (hours === 23 && minutes >= 59 && !marked) {
        setMarked('ABSENT');
        setMsg('Automatically marked as absent at end of day.');
      }
    }
  }, [currentTime, marked]);

  const markAttendance = async (status: 'PRESENT' | 'ABSENT') => {
    setAttendanceLoading(true);
    setMsg('');
    try {
      // Typically, you would make an API call to mark attendance
      // await fetch('/api/student/attendance', { method: 'POST', body: JSON.stringify({ enrollmentId: id, status }) });
      setMarked(status);
      setMsg(`Successfully marked attendance as ${status}`);
    } catch (e: any) {
      setMsg(e.message || 'Failed to mark attendance');
    }
    setAttendanceLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <BackButton />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-black text-gray-800">Course Session (Enrollment: {id})</h1>
            {currentTime && (
              <span className="flex items-center gap-2 text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                <Clock size={16}/> {currentTime.toLocaleTimeString()} (UTC)
              </span>
            )}
          </div>
          
          <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl space-y-4">
            <h2 className="text-lg font-bold text-blue-800 flex items-center gap-2"><Activity size={20}/> Daily Attendance</h2>
            <p className="text-sm text-blue-600">Please mark your attendance for today's session. If no attendance is marked by 11:59 PM, it will default to Absent.</p>
            
            {msg && (
              <div className={`p-4 rounded-xl text-sm font-bold ${marked === 'PRESENT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {msg}
              </div>
            )}

            <div className="flex gap-4">
              <button 
                onClick={() => markAttendance('PRESENT')}
                disabled={loading || attendanceLoading || marked !== null}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-500/30 hover:bg-green-700 disabled:opacity-50 transition-all"
              >
                {attendanceLoading ? <Loader className="animate-spin" size={20}/> : <CheckCircle size={20}/>}
                Mark Present
              </button>
              <button 
                onClick={() => markAttendance('ABSENT')}
                disabled={loading || attendanceLoading || marked !== null}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-500/30 hover:bg-red-700 disabled:opacity-50 transition-all"
              >
                {attendanceLoading ? <Loader className="animate-spin" size={20}/> : <XCircle size={20}/>}
                Mark Absent
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
