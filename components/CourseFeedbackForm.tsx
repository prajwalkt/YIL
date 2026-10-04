"use client";
import React, { useState } from 'react';
import { CheckCircle, Loader } from 'lucide-react';

export default function CourseFeedbackForm({ enrollment }: { enrollment: any }) {
  const isOffline = enrollment.Mode === 'Offline Training' || enrollment.Mode === 'Offline' || enrollment.Mode === 'CILT';
  
  // Format 1: Online + Site + E-learning
  // Format 2: Offline
  
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const questions = [
    { section: 'Training Course', q: 'Objectives of the training were clearly defined' },
    { section: 'Training Course', q: 'Training content was relevant to the course' },
    { section: 'Training Course', q: 'Training materials were helpful and easy to follow' },
    { section: 'Trainer', q: 'Trainer was technically competant' },
    { section: 'Trainer', q: 'Trainer presentation was effective' },
    { section: 'Trainer', q: 'Trainer communication was effective' },
    { section: 'Trainer', q: 'Trainer handled queries very well' },
    { section: 'Training Facilities', q: 'Training PC provided was functional' },
    { section: 'Training Facilities', q: 'Training hardware was functional' },
  ];

  if (isOffline) {
    questions.push(
      { section: 'Administration Facilities', q: 'Training centre ambience' },
      { section: 'Administration Facilities', q: 'Quality and hygiene of food' }
    );
  }

  const yesNoQuestions = isOffline ? [
    { section: 'VR Demonstration', q: 'Whether the VR demonstration was useful' },
    { section: 'General', q: 'Would you like to receive training promotional emails from Yokogawa India Pvt Ltd' }
  ] : [];

  const handleRating = (q: string, val: number) => {
    setAnswers(prev => ({ ...prev, [q]: val }));
  };

  const handleYesNo = (q: string, val: string) => {
    setAnswers(prev => ({ ...prev, [q]: val }));
  };

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Validation
    for (const q of questions) {
      if (!answers[q.q]) {
        setError('Please answer all rating questions.');
        setLoading(false);
        return;
      }
    }
    for (const q of yesNoQuestions) {
      if (!answers[q.q]) {
        setError('Please answer all Yes/No questions.');
        setLoading(false);
        return;
      }
    }

    // Calculate averages for the backend
    const getAvg = (section: string) => {
      const sectionQs = questions.filter(x => x.section === section);
      const sum = sectionQs.reduce((acc, curr) => acc + (answers[curr.q] || 0), 0);
      return Math.round(sum / sectionQs.length) || 0;
    };

    const contentScore = getAvg('Training Course');
    const trainerScore = getAvg('Trainer');
    const facilityScore = getAvg('Training Facilities');
    
    const allScores = questions.map(q => answers[q.q]).filter(x => x !== undefined);
    const overallScore = Math.round(allScores.reduce((a,b)=>a+b,0) / allScores.length) || 0;

    const payload = {
      courseId: enrollment.CourseID,
      courseName: enrollment.CourseTitle,
      trainerId: enrollment.TrainerID,
      trainerName: enrollment.TrainerName,
      overallScore,
      contentScore,
      trainerScore,
      facilityScore,
      remarks: JSON.stringify({
        format: isOffline ? 'Offline' : 'Online',
        answers: answers,
        participantComments: answers['participantComments'] || ''
      }),
      trainingDate: enrollment.StartDate
    };

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/student/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || 'Error submitting feedback');
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="text-center p-12 bg-white rounded-2xl border border-gray-100">
        <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
        <h3 className="text-2xl font-black text-gray-800 mb-2">Thank you!</h3>
        <p className="text-gray-500">Your feedback has been submitted successfully.</p>
      </div>
    );
  }

  const sections = Array.from(new Set(questions.map(q => q.section)));

  return (
    <form onSubmit={submitFeedback} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-8">
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
        <p className="text-sm font-bold text-blue-800 mb-2">Ratings Guide:</p>
        <p className="text-xs text-blue-600">5 = Excellent (81%-100%), 4 = Good (71%-80%), 3 = Average (61%-70%), 2 = Satisfactory (51%-60%), 1 = Needs Improvement (0%-50%)</p>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold">{error}</div>}

      {sections.map(sec => (
        <div key={sec} className="space-y-4">
          <h3 className="font-black text-gray-800 text-lg border-b pb-2">{sec}</h3>
          {questions.filter(q => q.section === sec).map((q, idx) => (
            <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <span className="text-sm font-semibold text-gray-700 flex-1">{q.q}</span>
              <div className="flex gap-2 shrink-0">
                {[1, 2, 3, 4, 5].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleRating(q.q, val)}
                    className={`w-10 h-10 rounded-full font-bold text-sm transition-all ${
                      answers[q.q] === val 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}

      {yesNoQuestions.length > 0 && (
        <div className="space-y-4">
          {Array.from(new Set(yesNoQuestions.map(q => q.section))).map(sec => (
            <div key={sec} className="space-y-4">
              <h3 className="font-black text-gray-800 text-lg border-b pb-2">{sec}</h3>
              {yesNoQuestions.filter(q => q.section === sec).map((q, idx) => (
                <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <span className="text-sm font-semibold text-gray-700 flex-1">{q.q}</span>
                  <div className="flex gap-2 shrink-0">
                    {['YES', 'NO'].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleYesNo(q.q, val)}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                          answers[q.q] === val 
                            ? (val === 'YES' ? 'bg-green-600 text-white shadow-md' : 'bg-red-600 text-white shadow-md')
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-black text-gray-800 text-lg border-b pb-2">Participant Comments / Suggestions</h3>
        <textarea
          value={answers['participantComments'] || ''}
          onChange={e => setAnswers(prev => ({ ...prev, participantComments: e.target.value }))}
          className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-100"
          placeholder="Any other comments or suggestions?"
        ></textarea>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-lg shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading && <Loader className="animate-spin" size={20} />}
        Submit Feedback
      </button>
    </form>
  );
}
