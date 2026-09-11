"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AutoLogout() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only apply auto-logout to protected routes
    const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
    if (publicPaths.includes(pathname)) return;

    let timeout: NodeJS.Timeout;
    const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(logout, TIMEOUT_MS);
    };

    const logout = async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (e) {
        console.error('Logout error', e);
      }
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      router.push('/login?timeout=true');
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));

    resetTimer();

    return () => {
      clearTimeout(timeout);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [pathname, router]);

  return null;
}
