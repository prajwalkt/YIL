"use client";
import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Download, BookOpen } from 'lucide-react';
import BackButton from '../../../../components/BackButton';

export default function CourseMaterialPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const manualUrl = searchParams.get('url') || '/manual/scormcontent/index.html';

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-xl font-black text-[#004098] flex items-center gap-2">
            <BookOpen size={24}/> Course Material
          </h1>
        </div>
        <div>
          <a 
            href="/api/view-file?path=VPFE_Manual.pdf" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#004098] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-500/30"
          >
            <Download size={18}/> Download as PDF
          </a>
        </div>
      </div>
      
      <div className="flex-1 w-full bg-gray-100">
        <iframe 
          src={manualUrl}
          className="w-full h-full border-0"
          title="Course Material"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
}
