// src/app/api/settings/route.ts
// Settings are now stored in the database (UserSettings model).
// The cookie fallback is removed — all reads/writes go to Postgres.

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

/** Convert a DB UserSettings row → AppSettings shape */
function rowToSettings(row: Record<string, unknown>): AppSettings {
  const safeJsonArray = (val: unknown, fallback: unknown[] = []): unknown[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try { const p = JSON.parse(val); return Array.isArray(p) ? p : fallback; }
      catch { return fallback; }
    }
    return fallback;
  };

  return {
    theme: (row.theme as AppSettings['theme']) ?? DEFAULT_SETTINGS.theme,
    accentColor: (row.accentColor as string) ?? DEFAULT_SETTINGS.accentColor,
    compactMode: Boolean(row.compactMode ?? DEFAULT_SETTINGS.compactMode),
    defaultLanding: (row.defaultLanding as AppSettings['defaultLanding']) ?? DEFAULT_SETTINGS.defaultLanding,
    defaultView: (row.defaultView as AppSettings['defaultView']) ?? DEFAULT_SETTINGS.defaultView,
    sessionTimeout: (Number(row.sessionTimeout ?? 0)) as AppSettings['sessionTimeout'],
    defaultSenderName: (row.defaultSenderName as string) ?? '',
    defaultFromEmail: (row.defaultFromEmail as string) ?? '',
    emailSignature: (row.emailSignature as string) ?? '',
    bccSelf: Boolean(row.bccSelf ?? false),
    quickRecipients: safeJsonArray(row.quickRecipients, []) as string[],
    defaultContactSort: (row.defaultContactSort as AppSettings['defaultContactSort']) ?? DEFAULT_SETTINGS.defaultContactSort,
    contactSearchFields: safeJsonArray(row.contactSearchFields, DEFAULT_SETTINGS.contactSearchFields) as AppSettings['contactSearchFields'],
    importDuplicateHandling: (row.importDuplicateHandling as AppSettings['importDuplicateHandling']) ?? DEFAULT_SETTINGS.importDuplicateHandling,
  };
}

/** GET /api/settings — returns current user's settings from DB */
export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    let row = await prisma.userSettings.findUnique({ where: { userId: session.userId } });

    // Auto-create default settings row on first access
    if (!row) {
      row = await prisma.userSettings.create({
        data: {
          userId: session.userId,
          quickRecipients: JSON.stringify([]),
          contactSearchFields: JSON.stringify(DEFAULT_SETTINGS.contactSearchFields),
        },
      });
    }

    const settings = rowToSettings(row as unknown as Record<string, unknown>);
    return NextResponse.json({ settings });
  } catch (err) {
    console.error('GET /api/settings error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** PATCH /api/settings — partial update */
export async function PATCH(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const patch = await req.json();

    // Serialize array fields to JSON strings for storage
    const dbPatch: Record<string, unknown> = { ...patch };
    if (Array.isArray(patch.quickRecipients)) {
      dbPatch.quickRecipients = JSON.stringify(patch.quickRecipients);
    }
    if (Array.isArray(patch.contactSearchFields)) {
      dbPatch.contactSearchFields = JSON.stringify(patch.contactSearchFields);
    }

    const row = await prisma.userSettings.upsert({
      where: { userId: session.userId },
      update: dbPatch,
      create: {
        userId: session.userId,
        quickRecipients: JSON.stringify([]),
        contactSearchFields: JSON.stringify(DEFAULT_SETTINGS.contactSearchFields),
        ...dbPatch,
      },
    });

    const settings = rowToSettings(row as unknown as Record<string, unknown>);
    return NextResponse.json({ settings });
  } catch (err) {
    console.error('PATCH /api/settings error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}