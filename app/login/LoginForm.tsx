"use client";
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import PasswordPolicy from '../components/PasswordPolicy';

export default function LoginForm({ nonce }: { nonce: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Local CAPTCHA State
  const [captchaText, setCaptchaText] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(true);

  const [success, setSuccess] = useState('');
  const [attempts, setAttempts] = useState(0);

  const loadCaptcha = async () => {
    setCaptchaLoading(true);
    setCaptchaText('');
    try {
      const res = await fetch('/api/auth/captcha');
      const data = await res.json();
      if (data.success && data.image) {
        setCaptchaImage(data.image);
      } else {
        setError('Failed to load CAPTCHA image.');
      }
    } catch (e) {
      setError('Network error loading CAPTCHA.');
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    document.getElementById('email-input')?.focus();
    loadCaptcha();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    if (!captchaText) {
      setError('Please enter the CAPTCHA text.');
      return;
    }

    if (attempts >= 5) {
      setError('Too many failed attempts. Please wait before trying again.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', { 
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, captchaText }),
      });

      const data = await res.json();

      if (data.success) {
        // Session is securely stored in HttpOnly cookie by the server
        setSuccess('Login successful! Redirecting...');
        
        // Store user in localStorage for client-side components like LearnerPortal
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        // Validate redirect to prevent open redirect attacks
        const safeRedirect = (() => {
          if (!redirect) return data.redirectTo || '/';
          // Only allow relative paths
          if (!redirect.startsWith('/') || redirect.startsWith('//')) return data.redirectTo || '/';
          return redirect;
        })();

        setTimeout(() => {
          if (data.requiresPasswordChange) {
            window.location.href = '/change-password';
          } else {
            window.location.href = safeRedirect;
          }
        }, 800);
      } else {
        setAttempts(a => a + 1);
        setError(data.message || 'Login failed. Please check your credentials.');
        setPassword('');
        loadCaptcha(); // Reload CAPTCHA on failure
      }
    } catch {
      setError('Network error. Please try again.');
      loadCaptcha(); // Reload CAPTCHA on error
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
              <span className="text-[#004098] font-black text-xl">YTS</span>
            </div>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Welcome Back</h1>
          <p className="text-blue-200 mt-2 text-sm">Yokogawa Training Services LMS</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          
          {error && (
            <div className="mb-5 flex items-center gap-3 bg-red-500/20 border border-red-400/30 text-red-200 rounded-2xl px-4 py-3 text-sm" role="alert">
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

          {attempts >= 3 && (
            <div className="mb-5 flex items-center gap-3 bg-orange-500/20 border border-orange-400/30 text-orange-200 rounded-2xl px-4 py-3 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              <span>Warning: {5 - attempts} attempt(s) remaining before lockout.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} id="login-form" noValidate>
            {/* Email */}
            <div className="mb-5">
              <label htmlFor="email-input" className="block text-white/80 text-sm font-semibold mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoComplete="username"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                  required
                  disabled={loading}
                  maxLength={255}
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-6">
              <label htmlFor="password-input" className="block text-white/80 text-sm font-semibold mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-2xl pl-12 pr-12 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                  required
                  disabled={loading}
                  maxLength={200}
                />
                <button
                  type="button"
                  id="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Local CAPTCHA */}
            <div className="mb-6 flex flex-col gap-3">
              <label htmlFor="captcha-input" className="block text-white/80 text-sm font-semibold">
                Security Verification
              </label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    id="captcha-input"
                    type="text"
                    value={captchaText}
                    onChange={e => setCaptchaText(e.target.value)}
                    placeholder="Enter code"
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                    required
                    disabled={loading || captchaLoading}
                    maxLength={10}
                    autoComplete="off"
                  />
                </div>
                <div className="shrink-0 flex items-center justify-center bg-white rounded-xl overflow-hidden min-w-[150px] min-h-[50px] border border-white/20">
                  {captchaLoading ? (
                     <Loader size={24} className="text-gray-400 animate-spin" />
                  ) : captchaImage ? (
                     <img src={captchaImage} alt="CAPTCHA" className="block w-full h-full object-cover" />
                  ) : (
                     <span className="text-red-500 text-xs">Error</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <button 
                  type="button" 
                  onClick={loadCaptcha} 
                  disabled={captchaLoading}
                  className="text-xs text-blue-300 hover:text-white transition-colors"
                >
                  Load new code
                </button>
              </div>
            </div>

            {/* Password Policy Accept */}
            <div className="mb-6 flex flex-col gap-2">
              <PasswordPolicy dark={true} />
              <label className="flex items-start gap-2 cursor-pointer mt-2 group">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    checked={policyAccepted}
                    onChange={(e) => setPolicyAccepted(e.target.checked)}
                    className="appearance-none w-4 h-4 rounded border border-white/40 bg-white/10 checked:bg-orange-500 checked:border-orange-500 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    required
                  />
                  <svg className={`absolute w-3 h-3 text-white pointer-events-none transition-opacity ${policyAccepted ? 'opacity-100' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-white/80 text-xs font-medium group-hover:text-white transition-colors">
                  I have read and accept the password policy requirements for LMS access.
                </span>
              </label>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading || !!success || !policyAccepted}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25"
            >
              {loading ? (
                <><Loader size={18} className="animate-spin" /> Authenticating...</>
              ) : success ? (
                <><CheckCircle size={18} /> Redirecting...</>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs">OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-blue-300 hover:text-white text-sm transition-colors">
              ← Back to YTS Website
            </Link>
          </div>
        </div>

        {/* Role indicator */}
        <div className="mt-6 grid grid-cols-4 gap-2">
          {[
            { role: 'Admin', color: 'bg-red-500/20 border-red-400/30 text-red-300' },
            { role: 'Trainer', color: 'bg-green-500/20 border-green-400/30 text-green-300' },
            { role: 'Affiliate', color: 'bg-purple-500/20 border-purple-400/30 text-purple-300' },
            { role: 'Student', color: 'bg-blue-500/20 border-blue-400/30 text-blue-300' },
          ].map(item => (
            <div key={item.role} className={`border rounded-xl py-2 text-center text-xs font-semibold ${item.color}`}>
              {item.role}
            </div>
          ))}
        </div>
        <p className="text-center text-white/30 text-xs mt-3">All roles use this unified login portal</p>

        {/* Security badges */}
        <div className="flex items-center justify-center gap-4 mt-6 text-white/20 text-xs">
          <span className="flex items-center gap-1"><Lock size={10} /> JWT Secured</span>
          <span>·</span>
          <span>256-bit Encrypted</span>
          <span>·</span>
          <span>OWASP Compliant</span>
        </div>
      </div>
    </div>
  );
}

