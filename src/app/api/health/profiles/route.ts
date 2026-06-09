// src/app/api/health/profiles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profiles = await prisma.healthProfile.findMany({
    where: { userId: session.userId, isActive: true },
    orderBy: { createdAt: 'asc' },
    include: {
      _count: {
        select: {
          records: true,
          vitals: true,
          medications: { where: { isActive: true } },
          appointments: { where: { status: 'scheduled' } },
        },
      },
    },
  });

  return NextResponse.json({ profiles });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    personName, relation, dateOfBirth, gender, bloodGroup,
    allergies, chronicConditions, emergencyContact, photoUrl, notes,
  } = body;

  if (!personName) return NextResponse.json({ error: 'Person name is required' }, { status: 400 });

  const profile = await prisma.healthProfile.create({
    data: {
      personName,
      relation: relation || 'self',
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
      bloodGroup: bloodGroup || null,
      allergies: allergies || null,
      chronicConditions: chronicConditions || null,
      emergencyContact: emergencyContact || null,
      photoUrl: photoUrl || null,
      notes: notes || null,
      userId: session.userId,
    },
    include: {
      _count: {
        select: {
          records: true,
          vitals: true,
          medications: { where: { isActive: true } },
          appointments: { where: { status: 'scheduled' } },
        },
      },
    },
  });

  return NextResponse.json({ profile }, { status: 201 });
}
