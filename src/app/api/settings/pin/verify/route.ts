// src/app/api/settings/pin/verify/route.ts
// POST — verify PIN for vault unlock
// Body: { pin: string }

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, comparePassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const PIN_SENTINEL = '__vault_pin__';

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { pin } = await req.json();
  if (!pin) return NextResponse.json({ error: 'PIN required' }, { status: 400 });

  const entry = await prisma.vaultEntry.findFirst({
    where: { userId: session.userId, name: PIN_SENTINEL },
  });

  if (!entry) {
    // No PIN set — access granted
    return NextResponse.json({ valid: true, noPin: true });
  }

  const valid = await comparePassword(pin, entry.password);
  return NextResponse.json({ valid });
}