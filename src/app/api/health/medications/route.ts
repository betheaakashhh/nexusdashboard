// src/app/api/health/medications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get('profileId');
  const activeOnly = searchParams.get('active') === 'true';

  const where: Record<string, unknown> = { userId: session.userId };
  if (profileId) where.profileId = profileId;
  if (activeOnly) where.isActive = true;

  const medications = await prisma.medication.findMany({
    where,
    orderBy: [{ isActive: 'desc' }, { startDate: 'desc' }],
    include: {
      profile: { select: { id: true, personName: true } },
    },
  });

  return NextResponse.json({ medications });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    profileId, name, genericName, dosage, frequency, route,
    startDate, endDate, prescribedBy, specialty, purpose,
    sideEffects, isActive, notes,
  } = body;

  if (!profileId || !name) {
    return NextResponse.json({ error: 'profileId and name are required' }, { status: 400 });
  }

  const profile = await prisma.healthProfile.findFirst({ where: { id: profileId, userId: session.userId } });
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const medication = await prisma.medication.create({
    data: {
      profileId,
      name,
      genericName:   genericName   || null,
      dosage:        dosage        || null,
      frequency:     frequency     || null,
      route:         route         || null,
      startDate:     startDate     || null,
      endDate:       endDate       || null,
      prescribedBy:  prescribedBy  || null,
      specialty:     specialty     || null,
      purpose:       purpose       || null,
      sideEffects:   sideEffects   || null,
      isActive:      isActive      ?? true,
      notes:         notes         || null,
      userId: session.userId,
    },
    include: {
      profile: { select: { id: true, personName: true } },
    },
  });

  return NextResponse.json({ medication }, { status: 201 });
}
