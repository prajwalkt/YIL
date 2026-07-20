// app/library/auth.ts
// JWT Authentication & RBAC utilities for YTS LMS

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { getConnection } from './db';

const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable must be set to at least 32 characters in production');
    }
    // Development fallback only — generate a warning
    console.warn('⚠️  SECURITY WARNING: JWT_SECRET not set or too short. Using development fallback. Set JWT_SECRET in .env.local for security.');
    return 'yts-lms-dev-only-secret-change-in-production-32chars';
  }
  return secret;
})();
const JWT_EXPIRES_IN = '8h';
const REFRESH_EXPIRES_IN = '7d';

export type UserRole = 'ADMIN' | 'TRAINER' | 'AFFILIATE' | 'STUDENT' | 'FINANCE' | 'TM';

export interface JWTPayload {
  userId: number;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  sessionId?: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  userId: number;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  sessionId?: string;
  country?: string;
}

// ─────────────────────────────────────────────────────────
// Token Operations
// ─────────────────────────────────────────────────────────
export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function signRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET + '_refresh', { expiresIn: REFRESH_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// Password Operations
// ─────────────────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePasswordStrength(password: string): { valid: boolean; message: string } {
  if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must contain an uppercase letter' };
  if (!/[a-z]/.test(password)) return { valid: false, message: 'Password must contain a lowercase letter' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain a number' };
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'Password must contain a special character' };
  }
  return { valid: true, message: 'Password is strong' };
}

// ─────────────────────────────────────────────────────────
// Extract user from request
// ─────────────────────────────────────────────────────────
export function getUserFromRequest(req: NextRequest): AuthUser | null {
  const authHeader = req.headers.get('Authorization');
  const cookieToken = req.cookies.get('auth_token')?.value;
  
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : cookieToken;
  
  if (!token) return null;
  
  const payload = verifyToken(token);
  if (!payload) return null;
  
  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    firstName: payload.firstName,
    lastName: payload.lastName,
    sessionId: payload.sessionId,
  };
}

// ─────────────────────────────────────────────────────────
// Role permission checks
// ─────────────────────────────────────────────────────────
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: ['*'],
  FINANCE: ['finance:*', 'reports:read', 'users:read'],
  TM: ['training:*', 'calendar:*', 'courses:read', 'reports:read'],
  TRAINER: ['trainer:*', 'courses:read', 'participants:read', 'feedback:read'],
  AFFILIATE: ['affiliate:*', 'courses:read', 'certificates:read', 'reports:read'],
  STUDENT: ['student:*', 'courses:read', 'certificates:read', 'enquiry:create'],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes('*') || perms.includes(permission) || 
    perms.some(p => p.endsWith(':*') && permission.startsWith(p.replace(':*', ':')));
}

export function requireRole(user: AuthUser | null, ...roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

// ─────────────────────────────────────────────────────────
// Brute Force Protection
// ─────────────────────────────────────────────────────────
export async function recordLoginAttempt(
  email: string, 
  success: boolean, 
  ipAddress: string, 
  userAgent: string
): Promise<void> {
  try {
    const pool = await getConnection();
    await pool.request()
      .input('Email', email)
      .input('Success', success ? 1 : 0)
      .input('IPAddress', ipAddress.substring(0, 50))
      .input('UserAgent', userAgent.substring(0, 500))
      .query(`INSERT INTO LoginAttempts (Email, Success, IPAddress, UserAgent) VALUES (@Email, @Success, @IPAddress, @UserAgent)`);
    
    if (!success) {
      // Increment failed attempt counter
      await pool.request()
        .input('Email', email)
        .query(`
          UPDATE LMS_Users 
          SET FailedLoginAttempts = FailedLoginAttempts + 1,
              LockoutUntil = CASE WHEN FailedLoginAttempts >= 4 THEN DATEADD(MINUTE, 30, GETDATE()) ELSE LockoutUntil END
          WHERE Email = @Email
        `);
    } else {
      // Reset on success
      await pool.request()
        .input('Email', email)
        .query(`UPDATE LMS_Users SET FailedLoginAttempts = 0, LockoutUntil = NULL, LastLogin = GETDATE() WHERE Email = @Email`);
    }
  } catch {}
}

export async function isAccountLocked(email: string): Promise<boolean> {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('Email', email)
      .query(`SELECT LockoutUntil, FailedLoginAttempts FROM LMS_Users WHERE Email = @Email`);
    
    if (result.recordset.length === 0) return false;
    const { LockoutUntil, FailedLoginAttempts } = result.recordset[0];
    
    if (LockoutUntil && new Date(LockoutUntil) > new Date()) return true;
    if (FailedLoginAttempts >= 5) return true;
    return false;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────
// Audit Logging
// ─────────────────────────────────────────────────────────
export async function auditLog(
  userId: number | null,
  userEmail: string,
  action: string,
  module: string,
  details: string,
  ipAddress: string,
  status: 'SUCCESS' | 'FAILURE' = 'SUCCESS'
): Promise<void> {
  try {
    const pool = await getConnection();
    await pool.request()
      .input('UserID', userId)
      .input('UserEmail', userEmail.substring(0, 255))
      .input('Action', action.substring(0, 200))
      .input('Module', module.substring(0, 100))
      .input('Details', details.substring(0, 2000))
      .input('IPAddress', ipAddress.substring(0, 50))
      .input('Status', status)
      .query(`
        INSERT INTO AuditLog (UserID, UserEmail, Action, Module, Details, IPAddress, Status)
        VALUES (@UserID, @UserEmail, @Action, @Module, @Details, @IPAddress, @Status)
      `);
  } catch {}
}

// ─────────────────────────────────────────────────────────
// Input Sanitization
// ─────────────────────────────────────────────────────────
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove JS injection
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .substring(0, 1000);
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim().replace(/[^a-z0-9@._\-+]/g, '').substring(0, 255);
}

/**
 * HTML-encode output to prevent XSS in reflected content
 */
export function htmlEncode(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Validate that a redirect URL is a safe relative path on the same origin
 * Prevents open redirect attacks
 */
export function validateRedirectUrl(url: string): string {
  if (!url) return '/';
  // Only allow relative paths starting with /
  if (!url.startsWith('/')) return '/';
  // Block protocol-relative URLs (//evil.com)
  if (url.startsWith('//')) return '/';
  // Block absolute URLs embedded as paths (/http://...)
  if (/^\/[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) return '/';
  return url;
}

// ─────────────────────────────────────────────────────────
// Response helpers
// ─────────────────────────────────────────────────────────
export function unauthorizedResponse(message = 'Unauthorized') {
  const { NextResponse } = require('next/server');
  return NextResponse.json({ success: false, message }, { status: 401 });
}

export function forbiddenResponse(message = 'Access denied') {
  const { NextResponse } = require('next/server');
  return NextResponse.json({ success: false, message }, { status: 403 });
}

export function errorResponse(message: string, status = 500) {
  const { NextResponse } = require('next/server');
  return NextResponse.json({ success: false, message }, { status });
}
