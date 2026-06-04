// src/lib/auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = 'nexus_token';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  sessionId?: string; // Optional sessionId for session management
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function getSessionFromRequest(req: NextRequest): JWTPayload | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    forwarded ||
    'Unknown IP'
  );
}

export function getRequestLocation(req: NextRequest): string {
  const city = req.headers.get('x-vercel-ip-city') || req.headers.get('cf-ipcity');
  const region = req.headers.get('x-vercel-ip-country-region') || req.headers.get('cf-region');
  const country = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry');
  return [city, region, country].filter(Boolean).join(', ') || 'Location unavailable';
}

export function parseUserAgent(userAgent = ''): { browser: string; os: string; device: string } {
  const ua = userAgent.toLowerCase();

  const browser = ua.includes('edg/') ? 'Microsoft Edge'
    : ua.includes('chrome/') || ua.includes('crios/') ? 'Chrome'
    : ua.includes('firefox/') || ua.includes('fxios/') ? 'Firefox'
    : ua.includes('safari/') ? 'Safari'
    : ua.includes('opera/') || ua.includes('opr/') ? 'Opera'
    : 'Unknown browser';

  const os = ua.includes('windows') ? 'Windows'
    : ua.includes('mac os') || ua.includes('macintosh') ? 'macOS'
    : ua.includes('iphone') || ua.includes('ipad') ? 'iOS'
    : ua.includes('android') ? 'Android'
    : ua.includes('linux') ? 'Linux'
    : 'Unknown OS';

  const device = ua.includes('ipad') || ua.includes('tablet') ? 'Tablet'
    : ua.includes('mobile') || ua.includes('iphone') || ua.includes('android') ? 'Mobile'
    : 'Desktop';

  return { browser, os, device };
}

export function setCookieHeader(token: string): string {
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  const isProduction = process.env.NODE_ENV === 'production';

  // In development: NO Secure flag (HTTP localhost doesn't support it)
  // In production:  Add Secure flag (HTTPS only)
  const secure = isProduction ? '; Secure' : '';

  return [
    `${COOKIE_NAME}=${token}`,
    'HttpOnly',
    'Path=/',
    `Max-Age=${maxAge}`,
    'SameSite=Lax',
    secure,
  ]
    .filter(Boolean)
    .join('; ');
}

export function clearCookieHeader(): string {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
}