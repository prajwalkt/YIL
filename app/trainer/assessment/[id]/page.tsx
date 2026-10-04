"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader, Save, ArrowLeft, CheckCircle } from 'lucide-react';
import BackButton from '../../../../components/BackButton';

export default function AssessmentForm() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [student, setStudent] = useState<any>(null);
  
  const [marks, setMarks] = useState<Record<string, number>>({
    'Q1: Three components of DCS': 0,
    'Q2: Three types of Comm Bus': 0,
    'Q3: Total no of Trend blocks': 0,
    'Q4: Types of user defined windows': 0,
    'Q5: EC401 in FFCS is used for': 0,
    'Q6: FIO stands for': 0,
    'Q7: Number of Processor cards': 0,
    'Q8: Data transmission speed of Vnet/IP': 0,
    'Q9: Match the Following (Stations/Domains)': 0,
    'Q10: Max Number of Stations / System': 0,
    'Q11: Modes of Operation of Instrument faceplate': 0,
    'Q12: Cascade Mode correct statement': 0,
    'Q13: PV crosses PH limit alarm': 0,
    'Q14: PV crosses PL limit alarm': 0,
    'Q15: Control Group faceplates': 0,
    'Q16: Downloading during plant shut down': 0
  });

  const maxMarks: Record<string, number> = {
    'Q1: Three components of DCS': 3,
    'Q2: Three types of Comm Bus': 3,
    'Q3: Total no of Trend blocks': 1,
    'Q4: Types of user defined windows': 4,
    'Q5: EC401 in FFCS is used for': 1,
    'Q6: FIO stands for': 1,
    'Q7: Number of Processor cards': 1,
    'Q8: Data transmission speed of Vnet/IP': 1,
    'Q9: Match the Following (Stations/Domains)': 3,
    'Q10: Max Number of Stations / System': 1,
    'Q11: Modes of Operation of Instrument faceplate': 3,
    'Q12: Cascade Mode correct statement': 2,
    'Q13: PV crosses PH limit alarm': 1,
    'Q14: PV crosses PL limit alarm': 1,
    'Q15: Control Group faceplates': 2,
    'Q16: Downloading during plant shut down': 1
  };
  const [remarks, setRemarks] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');

  useEffect(() => {
    // In a real app, you'd fetch the student details from the EnrollmentID `id`
    // For this implementation, we just simulate fetching the enrollment details.
    setStudent({ name: 'Loaded Student' });
    setLoading(false);
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('auth_token') || '';
    
    const res = await fetch('/api/trainer/assessment', { credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ enrollmentId: id, marks, remarks, status: 'COMPLETED' })
    });
    
    const data = await res.json();
    setSaving(false);
    
    if (data.success) {
      setPdfUrl(data.pdfUrl);
    } else {
      alert(data.message);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin text-green-600" size={32}/></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-[#004020] px-8 py-6 text-white flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Student Assessment</h1>
            <p className="text-green-200 text-sm mt-1">Enrollment ID: {id}</p>
          </div>
          <BackButton fallbackPath="/trainer" label="Back" className="text-white hover:bg-white/10 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors" />
        </div>

        <div className="p-8">
          {pdfUrl ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={40} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Assessment Generated Successfully</h2>
              <p className="text-gray-500 max-w-sm mx-auto">The PDF report has been generated and securely saved to the database.</p>
              <div className="pt-6">
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="bg-[#004020] text-white px-8 py-3 rounded-xl font-bold hover:bg-green-800 transition-colors inline-block">
                  View PDF Report
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                <h3 className="font-bold text-gray-800 border-b border-gray-200 pb-2">Marks (out of 10)</h3>
                {Object.keys(marks).map(q => (
                  <div key={q} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <label className="text-sm font-semibold text-gray-700 flex-1">{q} <span className="text-gray-400 font-normal">(Max: {maxMarks[q]})</span></label>
                    <input 
                      type="number" 
                      min="0" max={maxMarks[q]} 
                      value={marks[q] || ''} 
                      onChange={e => setMarks({...marks, [q]: Number(e.target.value)})}
                      className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">Overall Remarks</label>
                <textarea 
                  value={remarks} 
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 h-32 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Provide your professional feedback..."
                  required
                />
              </div>

              <button type="submit" disabled={saving} className="w-full bg-[#004020] text-white py-3.5 rounded-xl font-black text-lg hover:bg-green-800 transition-colors flex items-center justify-center gap-2">
                {saving ? <Loader className="animate-spin" size={20}/> : <Save size={20}/>}
                {saving ? 'Generating PDF...' : 'Submit Assessment & Generate PDF'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
