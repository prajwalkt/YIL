"use client";
import React, { useState, useEffect } from 'react';
import { Tv, PlayCircle, Loader } from 'lucide-react';

export default function PracticeSessionView({ courseId }: { courseId: number }) {
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
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/student/practice-session?courseId=${courseId}`, { 
        headers: { ...(token && { 'Authorization': `Bearer ${token}` }) } 
      });
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
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/student/practice-session', { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }) 
        },
        body: JSON.stringify({ courseId }),
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
