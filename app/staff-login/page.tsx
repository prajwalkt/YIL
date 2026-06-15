"use client";

import { useEffect } from "react";

export default function StaffLoginPage() {
  useEffect(() => {
    // Redirects directly to your local Django app dashboard endpoint
    window.location.href = "http://127.0.0.1:8000/en/dashboard/";
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center font-sans">
      <div className="space-y-4 text-center">
        <div className="w-3 h-3 bg-amber-500 rounded-full animate-ping mx-auto" />
        <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">
          Establishing Secure Handshake...
        </p>
        <p className="text-zinc-400 text-sm">Redirecting to Django Dashboard</p>
      </div>
    </div>
  );
}