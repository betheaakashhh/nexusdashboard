// src/app/api/settings/pin/route.ts
// Vault PIN stored as bcrypt hash in a special VaultEntry row (name = '__vault_pin__')
// This avoids needing a schema migration.

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, hashPassword, comparePassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const PIN_SENTINEL = '__vault_pin__';

async function getPinEntry(userId: string) {
  return prisma.vaultEntry.findFirst({
    where: { userId, name: PIN_SENTINEL },
  });
}

/** GET /api/settings/pin — returns whether a PIN is set */
export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const entry = await getPinEntry(session.userId);
  return NextResponse.json({ hasPin: !!entry });
}

/** POST /api/settings/pin — set or change PIN
 *  Body: { pin: string, currentPin?: string }
 *  If a PIN already exists, currentPin is required.
 */
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { pin, currentPin } = await req.json();

  if (!pin || pin.length < 4) {
    return NextResponse.json({ error: 'PIN must be at least 4 digits' }, { status: 400 });
  }
  if (!/^\d+$/.test(pin)) {
    return NextResponse.json({ error: 'PIN must contain only digits' }, { status: 400 });
  }

  const existing = await getPinEntry(session.userId);

  // If PIN already set, verify the current PIN first
  if (existing) {
    if (!currentPin) {
      return NextResponse.json({ error: 'Current PIN required to change PIN' }, { status: 400 });
    }
    const valid = await comparePassword(currentPin, existing.password);
    if (!valid) {
      return NextResponse.json({ error: 'Current PIN is incorrect' }, { status: 400 });
    }
  }

  const hashed = await hashPassword(pin);

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

/** DELETE /api/settings/pin — remove PIN
 *  Body: { currentPin: string }
 */
export async function DELETE(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { currentPin } = await req.json();
  if (!currentPin) {
    return NextResponse.json({ error: 'Current PIN required' }, { status: 400 });
  }

  const existing = await getPinEntry(session.userId);
  if (!existing) {
    return NextResponse.json({ error: 'No PIN set' }, { status: 404 });
  }

  const valid = await comparePassword(currentPin, existing.password);
  if (!valid) {
    return NextResponse.json({ error: 'PIN is incorrect' }, { status: 400 });
  }

  await prisma.vaultEntry.delete({ where: { id: existing.id } });
  return NextResponse.json({ success: true });
}

/** PATCH /api/settings/pin/verify — verify PIN without changing it
 *  Body: { pin: string }
 */