"use client";
import React, { useState } from 'react';
import { CheckCircle, Loader } from 'lucide-react';

export default function VPFEAssessmentForm({ enrollment }: { enrollment: any }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleInput = (qId: string, val: string) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const submitAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/student/assessment/vpfe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          courseId: enrollment.CourseID,
          answers
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setResult(data);
      } else {
        setError(data.message || 'Error submitting assessment');
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  if (success && result) {
    return (
      <div className="text-center p-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
        <h3 className="text-2xl font-black text-gray-800 mb-2">Assessment Completed</h3>
        <div className="text-xl font-bold mb-4">
          Score: {result.score} / {result.totalMarks} ({result.percentage}%)
        </div>
        <p className={`font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
          {result.passed ? 'PASSED' : 'FAILED'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submitAssessment} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-8">
      <div className="bg-teal-50 border border-teal-100 p-4 rounded-xl mb-6">
        <h3 className="text-lg font-black text-teal-800">Assessment on Centum VP Fundamental and Engineering</h3>
        <p className="text-sm font-bold text-teal-600">Answer All the Questions. Total Marks: 50</p>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold">{error}</div>}

      <div className="space-y-6">
        <div className="space-y-4">
          <p className="font-bold text-gray-800">1) The three components of Distributed Control System are: (3)</p>
          <input type="text" placeholder="(i)" className="w-full p-2 border rounded" onChange={e => handleInput('1i', e.target.value)} required />
          <input type="text" placeholder="(ii)" className="w-full p-2 border rounded" onChange={e => handleInput('1ii', e.target.value)} required />
          <input type="text" placeholder="(iii)" className="w-full p-2 border rounded" onChange={e => handleInput('1iii', e.target.value)} required />
        </div>

        <div className="space-y-4">
          <p className="font-bold text-gray-800">2) The three types of Communication Bus in CENTUM are (3)</p>
          <input type="text" placeholder="(i)" className="w-full p-2 border rounded" onChange={e => handleInput('2i', e.target.value)} required />
          <input type="text" placeholder="(ii)" className="w-full p-2 border rounded" onChange={e => handleInput('2ii', e.target.value)} required />
          <input type="text" placeholder="(iii)" className="w-full p-2 border rounded" onChange={e => handleInput('2iii', e.target.value)} required />
        </div>

        <div className="space-y-4">
          <p className="font-bold text-gray-800">3) Total no of Trend blocks, that can be created per HIS (1)</p>
          <select className="w-full p-2 border rounded" onChange={e => handleInput('3', e.target.value)} required defaultValue="">
            <option value="" disabled>Select option</option>
            <option value="60">(i) 60</option>
            <option value="70">(ii) 70</option>
            <option value="36">(iii) 36</option>
            <option value="50">(iv) 50</option>
          </select>
        </div>

        <div className="space-y-4">
          <p className="font-bold text-gray-800">4) Types of user defined windows are (4)</p>
          <textarea className="w-full p-2 border rounded" rows={3} onChange={e => handleInput('4', e.target.value)} required></textarea>
        </div>

        <div className="space-y-4">
          <p className="font-bold text-gray-800">5) In FFCS, EC401 is used for (1)</p>
          <select className="w-full p-2 border rounded" onChange={e => handleInput('5', e.target.value)} required defaultValue="">
            <option value="" disabled>Select option</option>
            <option value="Local Node Communication">(i) Local Node Communication</option>
            <option value="Remote Node Communication">(ii) Remote Node Communication</option>
          </select>
        </div>

        <div className="space-y-4">
          <p className="font-bold text-gray-800">6) FIO stands for (1)</p>
          <input type="text" className="w-full p-2 border rounded" onChange={e => handleInput('6', e.target.value)} required />
        </div>

        <div className="space-y-4">
          <p className="font-bold text-gray-800">7) Number of Processor cards in one duplexed FCS is (1)</p>
          <select className="w-full p-2 border rounded" onChange={e => handleInput('7', e.target.value)} required defaultValue="">
            <option value="" disabled>Select option</option>
            <option value="1">(i) 1</option>
            <option value="2">(ii) 2</option>
            <option value="4">(iii) 4</option>
            <option value="8">(iv) 8</option>
          </select>
        </div>

        <div className="space-y-4">
          <p className="font-bold text-gray-800">8) Data transmission speed of Vnet/IP is (1)</p>
          <select className="w-full p-2 border rounded" onChange={e => handleInput('8', e.target.value)} required defaultValue="">
            <option value="" disabled>Select option</option>
            <option value="10Mbps">(i) 10Mbps</option>
            <option value="100Mbps">(ii) 100Mbps</option>
            <option value="1Gbps">(iii) 1Gbps</option>
            <option value="100Kbps">(iv) 100Kbps</option>
          </select>
        </div>

        <div className="space-y-4 bg-gray-50 p-4 rounded-xl">
          <p className="font-bold text-gray-800 mb-2">9) Match the Following (3)</p>
          <div className="grid grid-cols-2 gap-4 items-center">
            <div>(i) stations/ domain</div>
            <select className="p-2 border rounded" onChange={e => handleInput('9i', e.target.value)} required defaultValue="">
              <option value="" disabled>Select...</option>
              <option value="a">(a) 16</option><option value="b">(b) 64</option><option value="c">(c) 256</option>
            </select>
            <div>(ii) stations/ project</div>
            <select className="p-2 border rounded" onChange={e => handleInput('9ii', e.target.value)} required defaultValue="">
              <option value="" disabled>Select...</option>
              <option value="a">(a) 16</option><option value="b">(b) 64</option><option value="c">(c) 256</option>
            </select>
            <div>(iii) Domains/ project</div>
            <select className="p-2 border rounded" onChange={e => handleInput('9iii', e.target.value)} required defaultValue="">
              <option value="" disabled>Select...</option>
              <option value="a">(a) 16</option><option value="b">(b) 64</option><option value="c">(c) 256</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <p className="font-bold text-gray-800">10) The Maximum Number of Stations / System (1)</p>
          <select className="w-full p-2 border rounded" onChange={e => handleInput('10', e.target.value)} required defaultValue="">
            <option value="" disabled>Select option</option>
            <option value="300">(i) 300</option>
            <option value="1024">(ii) 1024</option>
            <option value="256">(iii) 256</option>
            <option value="124">(iv) 124</option>
          </select>
        </div>

        <div className="space-y-4">
          <p className="font-bold text-gray-800">11) The Different Modes of Operation of an Instrument faceplate is (3)</p>
          <input type="text" placeholder="(i)" className="w-full p-2 border rounded" onChange={e => handleInput('11i', e.target.value)} required />
          <input type="text" placeholder="(ii)" className="w-full p-2 border rounded" onChange={e => handleInput('11ii', e.target.value)} required />
          <input type="text" placeholder="(iii)" className="w-full p-2 border rounded" onChange={e => handleInput('11iii', e.target.value)} required />
        </div>

        <div className="space-y-4">
          <p className="font-bold text-gray-800">12) In Cascade Mode, which of the following is correct? (2)</p>
          <select className="w-full p-2 border rounded" onChange={e => handleInput('12', e.target.value)} required defaultValue="">
            <option value="" disabled>Select option</option>
            <option value="1">(i) Primary and Secondary Controller - Auto Mode</option>
            <option value="2">(ii) Primary Controller - Manual Mode and Secondary Controller - Auto Mode</option>
            <option value="3">(iii) Primary Controller and Secondary Controller - Cascade</option>
            <option value="4">(iv) Primary Controller - Auto Mode and Secondary Controller - Cascade Mode</option>
          </select>
        </div>

        <div className="space-y-4">
          <p className="font-bold text-gray-800">13) When PV is crosses PH limit, the alarm is (1)</p>
          <select className="w-full p-2 border rounded" onChange={e => handleInput('13', e.target.value)} required defaultValue="">
            <option value="" disabled>Select option</option>
            <option value="MHI">(i) MHI</option>
            <option value="MLO">(ii) MLO</option>
            <option value="HI">(iii) HI</option>
            <option value="HH">(iv) HH</option>
          </select>
        </div>

        <div className="space-y-4">
          <p className="font-bold text-gray-800">14) Which alarm occurs when PV crosses PL limit (1)</p>
          <select className="w-full p-2 border rounded" onChange={e => handleInput('14', e.target.value)} required defaultValue="">
            <option value="" disabled>Select option</option>
            <option value="DV+">(i) DV+</option>
            <option value="DV--">(ii) DV--</option>
            <option value="LO">(iii) LO</option>
            <option value="VEL-">(iv) VEL-</option>
          </select>
        </div>

        <div className="space-y-4">
          <p className="font-bold text-gray-800">15) Control Group is a Group of ___ or ___ faceplates. (2)</p>
          <select className="w-full p-2 border rounded" onChange={e => handleInput('15', e.target.value)} required defaultValue="">
            <option value="" disabled>Select option</option>
            <option value="8 or 16">(i) 8 or 16</option>
            <option value="4 or 8">(ii) 4 or 8</option>
            <option value="24 or 32">(iii) 24 or 32</option>
            <option value="16 or 32">(iv) 16 or 32</option>
          </select>
        </div>

        <div className="space-y-4">
          <p className="font-bold text-gray-800">16) ________ Downloading is performed during plant shut down. (1)</p>
          <input type="text" className="w-full p-2 border rounded" onChange={e => handleInput('16', e.target.value)} required />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-teal-600 text-white rounded-xl font-black text-lg shadow-lg hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading && <Loader className="animate-spin" size={20} />}
        Submit Assessment
      </button>
    </form>
  );
}
