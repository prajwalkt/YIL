"use client";
import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
    const token = localStorage.getItem('auth_token');
    if (!token) { router.push('/login'); }
  }, [router]);

  // Password strength checker
  const getStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) score++;
    return score;
  };

  const strengthLabels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const strengthColors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];
  const strength = getStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.'); return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.'); return;
    }
    if (strength < 4) {
      setError('Password is too weak. Use uppercase, lowercase, numbers and special characters.'); return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token') || '';
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess('Password changed successfully! Redirecting to your dashboard...');
        // Update stored token
        localStorage.setItem('auth_token', data.token);
        setTimeout(() => router.push(data.redirectTo || '/'), 1500);
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
              {/* Strength meter */}
              {newPassword.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="flex-1 h-1.5 rounded-full transition-all" style={{ backgroundColor: i <= strength ? strengthColors[strength] : 'rgba(255,255,255,0.15)' }} />
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: strengthColors[strength] }}>{strengthLabels[strength]}</p>
                </div>
              )}
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

            {/* Password rules */}
            <div className="bg-white/5 rounded-xl p-3 space-y-1">
              {[
                { label: 'At least 8 characters', valid: newPassword.length >= 8 },
                { label: 'Uppercase letter (A-Z)', valid: /[A-Z]/.test(newPassword) },
                { label: 'Lowercase letter (a-z)', valid: /[a-z]/.test(newPassword) },
                { label: 'Number (0-9)', valid: /[0-9]/.test(newPassword) },
                { label: 'Special character (!@#$...)', valid: /[!@#$%^&*]/.test(newPassword) },
              ].map(rule => (
                <div key={rule.label} className={`flex items-center gap-2 text-xs transition-colors ${rule.valid ? 'text-green-300' : 'text-white/40'}`}>
                  <CheckCircle size={12} className={rule.valid ? 'text-green-400' : 'text-white/20'} />
                  {rule.label}
                </div>
              ))}
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
