"use client";
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader, Users, MapPin, Clock } from 'lucide-react';

interface Batch {
  CalendarID: number;
  Title: string;
  TrainingType: string;
  StartDate: string;
  EndDate: string;
  MaxParticipants: number;
  CurrentEnrolled: number;
  ColorStatus: string;
  Location?: string;
  TrainerName?: string;
}

export default function DynamicCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const res = await fetch('/api/calendar', { cache: 'no-store', credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setBatches(data.calendar);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchCalendar();
  }, []);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  // Create calendar grid ignoring weekends
  const renderCalendarDays = () => {
    const days = [];
    // Offset for Monday start (0 = Mon, 4 = Fri)
    let startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    if (startOffset > 4) startOffset = 0; // if it starts on weekend, just start on Monday

    for (let i = 0; i < startOffset; i++) {
      days.push(<div key={`empty-${i}`} className="p-4 border border-gray-100 bg-gray-50/50"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
      const dayOfWeek = date.getDay();
      
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      
      // Find batches that overlap with this date
      const daysBatches = batches.filter(b => {
        const bStart = b.StartDate.split('T')[0];
        const bEnd = b.EndDate.split('T')[0];
        return dateStr >= bStart && dateStr <= bEnd;
      });

      days.push(
        <div 
          key={d} 
          className="min-h-[120px] p-2 border border-gray-100 flex flex-col transition-colors hover:bg-gray-50 bg-white relative group"
        >
          <div className="font-bold text-sm mb-2 text-gray-500">{d}</div>
          <div className="flex-1 space-y-1 overflow-y-auto">
            {daysBatches.slice(0, 3).map(b => {
              const isClassroom = b.TrainingType && (b.TrainingType.toUpperCase().includes('CLASSROOM') || b.TrainingType === 'CILT');
              const colorClass = isClassroom ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-blue-100 text-blue-700 border-blue-200';
              return (
                <div key={b.CalendarID} className={`text-[10px] font-bold px-1.5 py-1 rounded border truncate ${colorClass}`}>
                  {b.Title}
                </div>
              );
            })}
            {daysBatches.length > 3 && (
              <div className="text-[10px] text-gray-500 font-bold px-1">+{daysBatches.length - 3} more</div>
            )}
          </div>

          {/* Hover Tooltip */}
          {daysBatches.length > 0 && (
            <div className="absolute top-0 left-full ml-2 z-50 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all transform translate-x-[-10px] group-hover:translate-x-0 hidden md:block">
              <h4 className="text-sm font-black text-gray-800 mb-3 border-b border-gray-100 pb-2">Trainings on {date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</h4>
              <div className="space-y-4">
                {daysBatches.map(b => (
                  <div key={b.CalendarID} className="flex flex-col gap-1">
                    <p className="text-sm font-bold text-gray-800 leading-tight">{b.Title}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${(b.TrainingType && (b.TrainingType.toUpperCase().includes('CLASSROOM') || b.TrainingType === 'CILT')) ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                        {b.TrainingType || 'Unknown'}
                      </span>
                      <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                        <Users size={12}/> {Math.max(0, b.MaxParticipants - (b.CurrentEnrolled || 0))} seats
                      </span>
                    </div>
                    {b.Location && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={12}/> {b.Location}</p>
                    )}
                    <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1"><Clock size={10}/> {new Date(b.StartDate).toLocaleDateString()} to {new Date(b.EndDate).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    return days;
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  if (loading) return <div className="flex items-center justify-center h-64"><Loader className="animate-spin text-blue-600" size={32}/></div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-gray-800">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"><ChevronLeft size={20}/></button>
          <button onClick={nextMonth} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"><ChevronRight size={20}/></button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-0 rounded-xl overflow-visible border border-gray-200">
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
          <div key={day} className="bg-gray-50 p-3 text-center text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-200">
            {day}
          </div>
        ))}
        {renderCalendarDays()}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap gap-6 items-center justify-center text-sm font-semibold text-gray-600">
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-orange-100 border border-orange-200"></div> Classroom / Site Training</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-100 border border-blue-200"></div> Online / VILT Training</div>
      </div>
    </div>
  );
}
