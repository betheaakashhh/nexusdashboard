// src/app/api/auth/setup/route.ts
// ONE-TIME route to create the admin account.
// After setup, set SETUP_SECRET to something random and never share it.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { secret, email, password, name } = await req.json();

    // Protect with a secret env var
    if (secret !== process.env.SETUP_SECRET) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.user.count();
    if (existing > 0) {
      return NextResponse.json({ error: 'Admin already exists. Delete the user first.' }, { status: 400 });
    }

    if (!email || !password || password.length < 8) {
      return NextResponse.json({ error: 'Email and password (min 8 chars) required' }, { status: 400 });
    }

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, password: hashed, name: name || 'Admin', role: 'admin' },
    });

    return NextResponse.json({
      message: 'Admin created successfully. You can now log in.',
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
