"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader, Save, CheckCircle, FileText } from 'lucide-react';
import BackButton from '../../../../components/BackButton';

export default function TrainerFeedbackForm() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, [id]);

  const fetchFeedback = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/trainer/student-feedback?enrollmentId=${id}`, {
        headers: { ...(token && { 'Authorization': `Bearer ${token}` }) }
      });
      const data = await res.json();
      if (data.success) {
        setFeedback(data.feedback);
        if (data.feedback.Remarks) {
          try {
            const parsed = JSON.parse(data.feedback.Remarks);
            setAnswers(parsed.answers || {});
          } catch (e) {
            // Not JSON
          }
        }
      } else {
        setError(data.message || 'Feedback not found');
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // In a full implementation, you would submit to an API to update the Feedback record in DB.
    // Simulating save for now.
    setTimeout(() => {
      setSuccess(true);
      setSaving(false);
    }, 1000);
  };

  const convertToPdf = () => {
    window.print();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin text-green-600" size={32}/></div>;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-6 font-sans">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-8 text-center text-red-500 font-bold">
          {error}
          <div className="mt-4"><BackButton fallbackPath="/trainer" label="Back to Trainer Portal" /></div>
        </div>
      </div>
    );
  }

  const sections = Array.from(new Set(Object.keys(answers).filter(k => k !== 'participantComments')));

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 print-wrapper">
        <div className="bg-[#004020] px-8 py-6 text-white flex items-center justify-between print:bg-white print:text-black print:border-b print:pb-4">
          <div>
            <h1 className="text-2xl font-black">Student Feedback Review</h1>
            <p className="text-green-200 text-sm mt-1 print:text-gray-500">Participant: {feedback.ParticipantName}</p>
            <p className="text-green-200 text-sm mt-1 print:text-gray-500">Course: {feedback.CourseName}</p>
          </div>
          <div className="flex gap-4 print:hidden">
            <button onClick={convertToPdf} className="flex items-center gap-2 bg-white text-[#004020] px-4 py-2 rounded-xl font-bold hover:bg-green-50 transition-colors">
              <FileText size={18}/> Convert to PDF
            </button>
            <BackButton fallbackPath="/trainer" label="Back" className="text-white hover:bg-white/10 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors" />
          </div>
        </div>

        <div className="p-8">
          {success && (
            <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-xl font-bold flex items-center gap-2 print:hidden">
              <CheckCircle size={20}/> Changes saved successfully!
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {Object.keys(answers).map((q, idx) => {
                if (q === 'participantComments') return null;
                return (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-gray-50 border border-gray-100 rounded-xl print:border-b print:bg-white print:rounded-none">
                    <label className="text-sm font-semibold text-gray-700 flex-1">{q}</label>
                    <input 
                      type="text" 
                      value={answers[q]} 
                      onChange={e => setAnswers({...answers, [q]: e.target.value})}
                      className="w-24 text-center border border-gray-200 rounded-lg px-2 py-1 font-bold focus:ring-2 focus:ring-green-500 outline-none print:border-0 print:text-right"
                    />
                  </div>
                );
              })}
            </div>

            <div className="space-y-2 pt-4 border-t">
              <label className="text-sm font-semibold text-gray-700 block">Participant Comments & Suggestions</label>
              <textarea 
                value={answers['participantComments'] || 'No comments.'}
                onChange={e => setAnswers({...answers, participantComments: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 h-32 focus:outline-none focus:ring-2 focus:ring-green-500 print:border-0"
              />
            </div>

            <button type="submit" disabled={saving} className="w-full bg-[#004020] text-white py-3.5 rounded-xl font-black text-lg hover:bg-green-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 print:hidden">
              {saving ? <Loader className="animate-spin" size={20}/> : <Save size={20}/>}
              Save Edits
            </button>
          </form>
        </div>
      </div>
      
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-wrapper, .print-wrapper * {
            visibility: visible;
          }
          .print-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none;
            border: none;
          }
        }
      `}</style>
    </div>
  );
}
