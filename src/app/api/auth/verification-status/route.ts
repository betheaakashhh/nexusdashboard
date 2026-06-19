// src/app/api/auth/verification-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get('email') || '').trim().toLowerCase();
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { emailVerifiedAt: true },
  });

  // Returns false for a non-existent email too, so this doesn't add a new
  // enumeration vector beyond what /api/auth/register already exposes.
  return NextResponse.json({ verified: !!user?.emailVerifiedAt });
}