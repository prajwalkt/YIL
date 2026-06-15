'use client';

import React from 'react';
import { Laptop, Presentation, ExternalLink } from 'lucide-react'; // Lucide icons mix well with shadcn/ui styles

export default function TrainingCalendarPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 flex flex-col justify-center items-center p-6 antialiased">
      <div className="w-full max-w-4xl text-center">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold text-[#005A9C] tracking-tight mb-3">
            Yokogawa <span className="text-sky-500">Training Calendar</span>
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto text-base">
            Select your preferred learning delivery format to view or download the upcoming technical schedule.
          </p>
        </div>

        {/* Options Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          
          {/* Card 1: VILT / Online Training */}
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div>
              <div className="h-12 w-12 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-6">
                <Laptop className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-3">VILT & Online Training</h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-8">
                Access live, interactive, instructor-led virtual training sessions right from your location. Explore schedules for remote DCS configurations, automation simulators, and online learning modules.
              </p>
            </div>
            {/* Opens the uploaded VILT PDF directly in a new tab */}
            <a 
              href="/vilt-calendar.pdf" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#005A9C] text-white font-semibold py-3.5 px-5 rounded-lg text-sm hover:bg-sky-600 transition-colors duration-200"
            >
              <span>View VILT Calendar</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          {/* Card 2: Classroom Training */}
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div>
              <div className="h-12 w-12 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-6">
                <Presentation className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-3">Classroom Training</h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-8">
                Join us at our physical training facilities for immersive, hands-on labs with functional hardware workstations, process instrument loops, and live control panel infrastructure.
              </p>
            </div>
            {/* Opens the uploaded Classroom PDF directly in a new tab */}
            <a 
              href="/classroom-calendar.pdf" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#005A9C] text-white font-semibold py-3.5 px-5 rounded-lg text-sm hover:bg-sky-600 transition-colors duration-200"
            >
              <span>View Classroom Calendar</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}