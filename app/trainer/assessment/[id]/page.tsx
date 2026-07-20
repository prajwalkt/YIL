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
    'Theoretical Knowledge': 0,
    'Practical Application': 0,
    'Problem Solving': 0,
    'Safety Awareness': 0
  });
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
    
    const res = await fetch('/api/trainer/assessment', {
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
                  <div key={q} className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-700">{q}</label>
                    <input 
                      type="number" 
                      min="0" max="10" 
                      value={marks[q]} 
                      onChange={e => setMarks({...marks, [q]: Number(e.target.value)})}
                      className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-green-500"
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
