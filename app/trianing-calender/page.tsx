"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, MapPin, Clock, Loader, RefreshCw, CheckCircle, Circle, AlertCircle, Info } from 'lucide-react';
import BackButton from '../../components/BackButton';

// ── Color config for calendar status ──
const COLOR_CONFIG: Record<string, { bg: string; border: string; badge: string; dot: string; label: string; desc: string }> = {
  COMPLETED: {
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    badge: 'bg-gray-200 text-gray-600',
    dot: 'bg-gray-400',
    label: 'Completed',
    desc: 'Training has concluded',
  },
  CONFIRMED: {
    bg: 'bg-green-50',
    border: 'border-green-400',
    badge: 'bg-green-100 text-green-700',
    dot: 'bg-green-500',
    label: 'Confirmed',
    desc: 'Schedule confirmed by Training Manager',
  },
  PAYMENT_PENDING: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-400',
    badge: 'bg-yellow-100 text-yellow-700',
    dot: 'bg-yellow-500',
    label: 'Registration Open',
    desc: 'Registration complete · Payment pending',
  },
  APPROVAL_ONGOING: {
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
    label: 'Approval in Progress',
    desc: 'Registration & payment complete · Under review',
  },
  OPEN: {
    bg: 'bg-white',
    border: 'border-slate-200',
    badge: 'bg-slate-100 text-slate-600',
    dot: 'bg-slate-400',
    label: 'Open',
    desc: 'Available for registration',
  },
};

export default function TrainingCalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchCalendar = useCallback(async () => {
    try {
      const res = await fetch('/api/calendar');
      const data = await res.json();
      if (data.success) {
        setEvents(data.calendar);
        setLastUpdated(new Date());
      }
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchCalendar, 30000);
    return () => clearInterval(interval);
  }, [fetchCalendar]);

  // Refresh on window focus
  useEffect(() => {
    window.addEventListener('focus', fetchCalendar);
    return () => window.removeEventListener('focus', fetchCalendar);
  }, [fetchCalendar]);

  const filteredEvents = events.filter(e => {
    if (filter === 'ALL') return true;
    if (filter === 'VILT') return e.TrainingType === 'VILT' || e.TrainingType === 'Online Training' || e.TrainingType === 'ELEARNING';
    if (filter === 'OFFLINE') return e.TrainingType === 'Offline Training' || e.TrainingType === 'OFFLINE' || e.TrainingType === 'CILT';
    if (filter === 'SITE') return e.TrainingType === 'Site Training' || e.TrainingType === 'SITE';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 p-6 antialiased">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <BackButton fallbackPath="/" label="Back to Home" />
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-[#005A9C] tracking-tight mb-3">
            Interactive <span className="text-sky-500">Training Calendar</span>
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto text-base">
            Explore upcoming schedules for all training programs. Color codes indicate slot availability and status.
          </p>
          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-slate-400">
            <RefreshCw size={12} />
            <span>Last updated: {lastUpdated.toLocaleTimeString()} · Auto-refreshes every 30s</span>
            <button onClick={fetchCalendar} className="text-blue-500 hover:text-blue-700 font-bold underline">Refresh now</button>
          </div>
        </div>

        {/* Color Legend */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-8 shadow-sm">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Info size={14}/>Schedule Status Legend</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(COLOR_CONFIG).map(([key, cfg]) => (
              <div key={key} className={`flex items-start gap-2 p-3 rounded-xl border ${cfg.border} ${cfg.bg}`}>
                <div className={`w-3 h-3 rounded-full shrink-0 mt-0.5 ${cfg.dot}`} />
                <div>
                  <p className="text-xs font-bold text-slate-700">{cfg.label}</p>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{cfg.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          {[
            { key: 'ALL', label: 'All Programs' },
            { key: 'VILT', label: 'Online / VILT' },
            { key: 'OFFLINE', label: 'Classroom / Offline' },
            { key: 'SITE', label: 'Site Training' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                filter === f.key
                  ? 'bg-[#005A9C] text-white border-[#005A9C] shadow-md shadow-blue-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader className="animate-spin text-[#005A9C] w-10 h-10" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-semibold">No training sessions scheduled for this filter.</p>
            <p className="text-slate-400 text-sm mt-1">Check back soon or contact us for custom scheduling.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map(event => {
              const colorStatus = event.ColorStatus || 'OPEN';
              const cfg = COLOR_CONFIG[colorStatus] || COLOR_CONFIG.OPEN;
              const isCompleted = colorStatus === 'COMPLETED';

              return (
                <div
                  key={event.CalendarID}
                  className={`rounded-2xl border-2 p-6 transition-all ${cfg.bg} ${cfg.border} ${isCompleted ? 'opacity-70' : 'hover:shadow-lg'}`}
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-5">
                    {/* Status dot + date */}
                    <div className="flex flex-col items-center gap-2 shrink-0 min-w-[80px]">
                      <div className={`w-4 h-4 rounded-full ${cfg.dot} shadow-md`} />
                      <div className="text-center">
                        <p className="text-lg font-black text-slate-800">
                          {new Date(event.StartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(event.StartDate).getFullYear()}
                        </p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="hidden md:block w-px bg-slate-200 self-stretch" />

                    {/* Event details */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-slate-800">{event.Title}</h3>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-500">
                          {event.TrainingType}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} className="text-slate-400" />
                          {new Date(event.StartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {' → '}
                          {new Date(event.EndDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        {event.TrainerName && (
                          <span className="flex items-center gap-1.5">
                            <CheckCircle size={14} className="text-slate-400" />
                            {event.TrainerName}
                          </span>
                        )}
                        {event.Location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-slate-400" />
                            {event.Location}
                          </span>
                        )}
                      </div>

                      {event.MaxParticipants && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span>Capacity</span>
                            <span>{event.CurrentEnrolled || 0}/{event.MaxParticipants} enrolled</span>
                          </div>
                          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                (event.CurrentEnrolled || 0) >= event.MaxParticipants ? 'bg-red-500' : cfg.dot.replace('bg-', 'bg-')
                              }`}
                              style={{ width: `${Math.min(100, ((event.CurrentEnrolled || 0) / event.MaxParticipants) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}