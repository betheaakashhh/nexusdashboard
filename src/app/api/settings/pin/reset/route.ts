// src/app/api/settings/pin/reset/route.ts
// POST — reset vault PIN by verifying account password (for "forgot PIN" flow)
// Body: { accountPassword: string, newPin: string }

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, comparePassword, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const PIN_SENTINEL = '__vault_pin__';

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { accountPassword, newPin } = await req.json();

  if (!accountPassword || !newPin) {
    return NextResponse.json({ error: 'Account password and new PIN required' }, { status: 400 });
  }
  if (newPin.length < 4 || !/^\d+$/.test(newPin)) {
    return NextResponse.json({ error: 'PIN must be at least 4 digits' }, { status: 400 });
  }

  // Verify account password
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const valid = await comparePassword(accountPassword, user.password);
  if (!valid) {
    return NextResponse.json({ error: 'Account password is incorrect' }, { status: 400 });
  }

  // Upsert the PIN entry
  const hashed = await hashPassword(newPin);
  const existing = await prisma.vaultEntry.findFirst({
    where: { userId: session.userId, name: PIN_SENTINEL },
  });

  if (existing) {
    await prisma.vaultEntry.update({
      where: { id: existing.id },
      data: { password: hashed },
    });
  } else {
    await prisma.vaultEntry.create({
      data: {
        name: PIN_SENTINEL,
        password: hashed,
        userId: session.userId,
      },
    });
  }

  return NextResponse.json({ success: true });
}