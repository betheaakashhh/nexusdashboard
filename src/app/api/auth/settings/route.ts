// src/app/api/settings/route.ts
// Stores UI settings in an HttpOnly cookie (not localStorage)
// Sensitive data (PIN) is handled separately via /api/settings/pin

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

const SETTINGS_COOKIE = 'nexus_settings';
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
  compactMode: boolean;
  defaultLanding: 'contacts' | 'tasks' | 'email' | 'private';
  defaultView: 'cards' | 'table';
  sessionTimeout: 0 | 5 | 15 | 30 | 60;
  defaultSenderName: string;
  defaultFromEmail: string;
  emailSignature: string;
  bccSelf: boolean;
  quickRecipients: string[];
  defaultContactSort: 'name' | 'recent' | 'added';
  contactSearchFields: ('name' | 'phone' | 'email' | 'tags' | 'notes')[];
  importDuplicateHandling: 'skip' | 'overwrite' | 'merge';
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  accentColor: '#c9a96e',
  compactMode: false,
  defaultLanding: 'contacts',
  defaultView: 'cards',
  sessionTimeout: 0,
  defaultSenderName: '',
  defaultFromEmail: '',
  emailSignature: '',
  bccSelf: false,
  quickRecipients: [],
  defaultContactSort: 'recent',
  contactSearchFields: ['name', 'phone', 'email'],
  importDuplicateHandling: 'skip',
};

export function parseSettingsCookie(req: NextRequest): AppSettings {
  try {
    const raw = req.cookies.get(SETTINGS_COOKIE)?.value;
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(decodeURIComponent(raw)) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const settings = parseSettingsCookie(req);
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const current = parseSettingsCookie(req);
  const patch = await req.json();
  const next: AppSettings = { ...current, ...patch };

  const response = NextResponse.json({ settings: next });
  response.headers.set(
    'Set-Cookie',
    `${SETTINGS_COOKIE}=${encodeURIComponent(JSON.stringify(next))}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax`
  );
  return response;
}