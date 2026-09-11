"use client";
import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PasswordPolicy from '../components/PasswordPolicy';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (!data.success) router.push('/login');
      })
      .catch(() => router.push('/login'));
  }, [router]);

  // Validation
  const isValidPassword = (p: string) => {
    return p.length >= 8 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.'); return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.'); return;
    }
    if (!isValidPassword(newPassword)) {
      setError('Password does not meet all policy requirements.'); return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', { 
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        setSuccess('Password changed successfully! Redirecting to your dashboard...');
        setTimeout(() => {
          window.location.href = data.redirectTo || '/';
        }, 1500);
      } else {
        setError(data.message || 'Failed to change password.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001a4d] via-[#003080] to-[#004098] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl shadow-2xl mb-4">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Set New Password</h1>
          <p className="text-blue-200 mt-2 text-sm">For your security, please create a new password before continuing.</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          {/* Security notice */}
          <div className="mb-6 flex items-start gap-3 bg-orange-500/20 border border-orange-400/30 text-orange-200 rounded-2xl px-4 py-3 text-sm">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>You are using a temporary password. You must create a new password to access the platform.</span>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-3 bg-red-500/20 border border-red-400/30 text-red-200 rounded-2xl px-4 py-3 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-5 flex items-center gap-3 bg-green-500/20 border border-green-400/30 text-green-200 rounded-2xl px-4 py-3 text-sm">
              <CheckCircle size={16} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Current (Temp) Password */}
            <div>
              <label className="block text-white/80 text-sm font-semibold mb-2">Temporary Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter your temporary password"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-2xl pl-12 pr-12 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                  required disabled={loading}
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors">
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-white/80 text-sm font-semibold mb-2">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Create a strong new password"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-2xl pl-12 pr-12 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                  required disabled={loading}
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors">
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <PasswordPolicy password={newPassword} dark={true} />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-white/80 text-sm font-semibold mb-2">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className={`w-full bg-white/10 border text-white placeholder-white/30 rounded-2xl pl-12 pr-12 py-3.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                    confirmPassword && confirmPassword !== newPassword ? 'border-red-400/50 focus:ring-red-400/30' : 'border-white/20 focus:ring-white/30'
                  }`}
                  required disabled={loading}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors">
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-red-300 text-xs mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25"
            >
              {loading ? <><Loader size={18} className="animate-spin" /> Changing Password...</> :
               success ? <><CheckCircle size={18} /> Password Changed!</> : 'Set New Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
