"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '../../components/BackButton';
import ModernCalendar, { Batch } from '../../components/ModernCalendar';
import { Presentation, MonitorPlay } from 'lucide-react';

export default function TrainingCalendarPage() {
  const [activeTab, setActiveTab] = useState<'CLASSROOM' | 'ONLINE'>('CLASSROOM');
  const router = useRouter();

  const handleSelectBatch = (batch: Batch) => {
    router.push(`/register?batchId=${batch.CalendarID}&course=${encodeURIComponent(batch.Title)}&mode=${encodeURIComponent(batch.TrainingType)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 p-6 antialiased pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <BackButton fallbackPath="/" label="Back to Home" />
        </div>

        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-[#005A9C] tracking-tight mb-4">
            Training <span className="text-sky-500">Calendar</span>
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">
            Explore our upcoming training schedules. Choose between in-person Classroom Training or interactive Online Sessions.
          </p>
        </div>

        {/* Calendar Tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-white rounded-2xl shadow-sm p-2 border border-slate-200">
            <button
              onClick={() => setActiveTab('CLASSROOM')}
              className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all duration-300 ${
                activeTab === 'CLASSROOM'
                  ? 'bg-[#005A9C] text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Presentation size={20} />
              Classroom Training Calendar
            </button>
            <button
              onClick={() => setActiveTab('ONLINE')}
              className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all duration-300 ${
                activeTab === 'ONLINE'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <MonitorPlay size={20} />
              Online Training Calendar
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="mb-8 border-b border-slate-100 pb-4">
            <h2 className="text-2xl font-black text-slate-800">
              {activeTab === 'CLASSROOM' ? 'Classroom & Site Training Batches' : 'Online & VILT Training Sessions'}
            </h2>
          </div>
          
          <ModernCalendar 
            mode={activeTab} 
            selectionMode={true} 
            onSelectBatch={handleSelectBatch} 
          />
        </div>
      </div>
    </div>
  );
}