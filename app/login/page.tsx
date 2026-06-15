"use client";
import React, { useState } from 'react';
import { Lock, Mail, User, ShieldCheck, ArrowRight } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const masterEmail = "Prajwal.Tagadinamani@yokogawa.com";
    const masterPass = "yts2026";

    if (isLogin) {
      const savedUserStr = typeof window !== 'undefined' ? localStorage.getItem(email) : null;
      const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
      
      if ((email === masterEmail && password === masterPass) || 
          (savedUser && savedUser.password === password)) {
        document.cookie = "isLoggedIn=true; path=/; max-age=604800"; // Valid for 7 days
        window.location.href = "/"; 
      } else {
        alert("Access Denied. Please check your corporate credentials.");
      }
    } else {
      localStorage.setItem(email, JSON.stringify({ name, password }));
      alert("Engineer Profile Created! You can now log in.");
      setIsLogin(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#004098] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-8 border-orange-500">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#004098] flex items-center justify-center gap-2">
            <ShieldCheck className="text-orange-500" /> YOKOGAWA
          </h1>
          <p className="text-slate-500 text-xs uppercase font-bold mt-2 tracking-widest">
            {isLogin ? "Technical School Login" : "Engineer Registration"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input type="text" required placeholder="Full Name" onChange={(e) => setName(e.target.value)} 
              className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
          )}
          <input type="email" required placeholder="Corporate Email" onChange={(e) => setEmail(e.target.value)} 
            className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
          <input type="password" required placeholder="Password" onChange={(e) => setPassword(e.target.value)} 
            className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
          
          <button type="submit" className="w-full bg-[#004098] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-800 transition-colors">
            {isLogin ? "AUTHORIZE ACCESS" : "REGISTER AS STUDENT"} <ArrowRight size={18}/>
          </button>
        </form>

        <div className="mt-8 pt-4 border-t text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-blue-600 font-bold hover:underline">
            {isLogin ? "New user? Create an account" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}