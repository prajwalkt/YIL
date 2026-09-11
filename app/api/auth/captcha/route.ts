import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

function generateRandomText(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous I, O, 1, 0
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateSvg(text: string) {
  const noiseLines = Array.from({ length: 3 }).map(() => {
    const x1 = Math.random() * 30;
    const y1 = Math.random() * 50;
    const x2 = 120 + Math.random() * 30;
    const y2 = Math.random() * 50;
    const cx = 75 + (Math.random() * 40 - 20);
    const cy = 25 + (Math.random() * 40 - 20);
    return `<path d="M${x1},${y1} Q${cx},${cy} ${x2},${y2}" stroke="#9ca3af" stroke-width="2" fill="none" opacity="0.6" />`;
  }).join('');

  const noiseDots = Array.from({ length: 30 }).map(() => {
    const cx = Math.random() * 150;
    const cy = Math.random() * 50;
    const r = Math.random() * 1.5 + 0.5;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#6b7280" opacity="0.5" />`;
  }).join('');

  // Slightly rotate characters for more captcha-like feel
  const characters = text.split('').map((char, i) => {
    const angle = Math.random() * 30 - 15;
    const x = 20 + i * 20;
    return `<text x="${x}" y="32" font-family="monospace" font-size="28" font-weight="bold" fill="#1f2937" transform="rotate(${angle}, ${x}, 32)">${char}</text>`;
  }).join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="150" height="50" viewBox="0 0 150 50">
      <rect width="100%" height="100%" fill="#f9fafb" rx="8" />
      ${noiseLines}
      ${noiseDots}
      ${characters}
    </svg>
  `;
}

export async function GET() {
  const text = generateRandomText(6);
  const svg = generateSvg(text);
  
  // JWT Secret from env, with fallback for safety (though route.ts uses fallback too)
  const JWT_SECRET = process.env.JWT_SECRET || 'yts-lms-dev-only-secret-change-in-production-32chars';
  
  // Create a token containing the answer, valid for 5 minutes
  const token = jwt.sign({ captcha: text.toLowerCase() }, JWT_SECRET, { expiresIn: '5m' });
  
  const response = NextResponse.json({ 
    success: true, 
    image: `data:image/svg+xml;base64,${Buffer.from(svg.trim()).toString('base64')}` 
  });

  response.cookies.set('captcha_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 300, // 5 minutes
    path: '/',
  });

  return response;
}
