"use client";

import { useState, useEffect } from "react";
import { BookOpen, FileText, Lock, Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import BackButton from "../../components/BackButton";

export default function ManualsPage() {
  const [manuals, setManuals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token') || '';
    fetch('/api/manuals', { credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setManuals(data.manuals);
          setIsAuthenticated(data.isAuthenticated || false);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#F0EBF8] py-10 px-5">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <BackButton fallbackPath="/elearning" label="Back" />
          <h1 className="text-3xl font-bold text-[#673AB7]">Interactive Manuals</h1>
        </div>

        {!isAuthenticated && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <Lock size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 text-sm">Login required to access course manuals</p>
              <p className="text-amber-600 text-xs mt-1">
                Manuals are available for your enrolled courses after login.{' '}
                <button
                  onClick={() => router.push('/login')}
                  className="underline font-bold hover:text-amber-800"
                >
                  Log in here →
                </button>
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin text-[#673AB7] w-10 h-10" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {manuals.map(m => (
              <div key={m.ManualID} className="bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-slate-200">
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-6">
                  <BookOpen size={32} className="text-purple-700" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">{m.Title}</h3>
                {m.CourseName && <p className="text-xs font-bold text-purple-600 uppercase tracking-widest mt-2">{m.CourseName}</p>}
                <p className="text-slate-500 mt-4 leading-relaxed line-clamp-3">{m.Description}</p>
                <a
                  href={m.FilePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center justify-center w-full bg-[#673AB7] hover:bg-purple-800 text-white py-3 rounded-xl font-bold gap-2 transition-colors"
                >
                  <FileText size={18} /> Open Manual
                </a>
              </div>
            ))}
            {manuals.length === 0 && (
              <div className="col-span-full p-12 text-center bg-white rounded-3xl shadow">
                <Lock size={40} className="text-slate-300 mx-auto mb-4" />
                <p className="text-slate-700 font-bold">
                  {isAuthenticated
                    ? "No manuals available for your enrolled courses."
                    : "Please log in to access course manuals."}
                </p>
                {!isAuthenticated && (
                  <button
                    onClick={() => router.push('/login')}
                    className="mt-4 bg-[#673AB7] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-purple-800 transition-colors"
                  >
                    Go to Login
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
