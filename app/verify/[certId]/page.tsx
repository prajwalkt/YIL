'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, XCircle, Search, Award, MapPin, Calendar, User, Loader } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function CertificateVerification() {
  const { certId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!certId) return;
    fetch(`/api/certificates/verify?certNo=${certId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(d => {
        if (d.success) setData(d.certificate);
        else setError(d.message || 'Invalid Certificate');
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to reach verification server');
        setLoading(false);
      });
  }, [certId]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="bg-[#004098] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <Award size={48} className="text-white mx-auto mb-4 relative z-10" />
          <h1 className="text-3xl font-black text-white relative z-10 tracking-tight">Yokogawa Training Services</h1>
          <p className="text-blue-100 font-medium mt-2 relative z-10">Official Certificate Verification Portal</p>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12">
          {loading ? (
            <div className="text-center py-12">
              <Loader size={32} className="animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-500 font-semibold">Verifying secure record...</p>
            </div>
          ) : error || !data ? (
            <div className="text-center py-8">
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle size={48} className="text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h2>
              <p className="text-gray-500 bg-red-50 py-2 px-4 rounded-xl inline-block font-medium">Error: {error}</p>
              <div className="mt-8 border-t border-gray-100 pt-8 text-sm text-gray-400">
                Ensure the certificate number in the URL matches the printed document exactly.
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <ShieldCheck size={40} className="text-green-500" />
                </div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Valid Certificate</h2>
                <p className="text-gray-500 font-medium">This record is authentic and exists in the YTS database.</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-white p-2 rounded-lg shadow-sm"><User size={18} className="text-blue-500" /></div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Participant Name</p>
                    <p className="font-bold text-gray-800 text-lg">{data.ParticipantName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-white p-2 rounded-lg shadow-sm"><Award size={18} className="text-blue-500" /></div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Course Title</p>
                    <p className="font-bold text-gray-800 text-lg">{data.CourseName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="bg-white p-1.5 rounded-md shadow-sm"><Calendar size={14} className="text-gray-500" /></div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Issue Date</p>
                      <p className="font-semibold text-gray-800 text-sm">{new Date(data.IssueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-white p-1.5 rounded-md shadow-sm"><MapPin size={14} className="text-gray-500" /></div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Training Mode</p>
                      <p className="font-semibold text-gray-800 text-sm">{data.Mode || 'VILT / CILT'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 mt-4 col-span-2">
                    <div className="bg-white p-1.5 rounded-md shadow-sm"><User size={14} className="text-gray-500" /></div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Organization</p>
                      <p className="font-semibold text-gray-800 text-sm">{data.Organization || 'Individual'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100/50 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Certificate No.</p>
                  <p className="font-mono font-bold text-blue-900">{data.CertificateNo}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Trainer</p>
                  <p className="font-bold text-blue-900">{data.TrainerName || 'YTS Master Trainer'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 py-4 px-8 border-t border-gray-100 text-center">
          <p className="text-xs font-semibold text-gray-400">© {new Date().getFullYear()} Yokogawa Training Services. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
