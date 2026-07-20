"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader, Save, ArrowLeft, CheckCircle, Star } from 'lucide-react';
import BackButton from '../../../../components/BackButton';

export default function FeedbackForm() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [student, setStudent] = useState<any>(null);
  
  const [ratings, setRatings] = useState<Record<string, number>>({
    'Course Content': 0,
    'Trainer Delivery': 0,
    'Materials & Facilities': 0,
    'Overall Experience': 0
  });
  const [comments, setComments] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');

  useEffect(() => {
    setStudent({ name: 'Loaded Student' });
    setLoading(false);
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('auth_token') || '';
    
    const res = await fetch('/api/trainer/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ enrollmentId: id, ratings, comments, status: 'COMPLETED' })
    });
    
    const data = await res.json();
    setSaving(false);
    
    if (data.success) {
      setPdfUrl(data.pdfUrl);
    } else {
      alert(data.message);
    }
  };

  const setRating = (q: string, val: number) => {
    setRatings({ ...ratings, [q]: val });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin text-green-600" size={32}/></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-[#004020] px-8 py-6 text-white flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Course Feedback</h1>
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
              <h2 className="text-2xl font-bold text-gray-800">Feedback Submitted Successfully</h2>
              <p className="text-gray-500 max-w-sm mx-auto">The PDF feedback report has been generated and securely saved.</p>
              <div className="pt-6">
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="bg-[#004020] text-white px-8 py-3 rounded-xl font-bold hover:bg-green-800 transition-colors inline-block">
                  View Feedback PDF
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-6">
                <h3 className="font-bold text-gray-800 border-b border-gray-200 pb-2">Ratings (1-5 Stars)</h3>
                {Object.keys(ratings).map(q => (
                  <div key={q} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-sm font-semibold text-gray-700">{q}</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button 
                          key={star} type="button" onClick={() => setRating(q, star)}
                          className={`p-1 transition-colors ${ratings[q] >= star ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'}`}
                        >
                          <Star size={24} fill={ratings[q] >= star ? 'currentColor' : 'none'}/>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">Comments & Suggestions</label>
                <textarea 
                  value={comments} 
                  onChange={e => setComments(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 h-32 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Share your thoughts on how we can improve..."
                  required
                />
              </div>

              <button type="submit" disabled={saving || Object.values(ratings).includes(0)} className="w-full bg-[#004020] text-white py-3.5 rounded-xl font-black text-lg hover:bg-green-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader className="animate-spin" size={20}/> : <Save size={20}/>}
                {saving ? 'Generating PDF...' : 'Submit Feedback & Generate PDF'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
