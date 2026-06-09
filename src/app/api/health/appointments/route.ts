// src/app/api/health/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get('profileId');
  const status    = searchParams.get('status');
  const upcoming  = searchParams.get('upcoming') === 'true';
  const from      = searchParams.get('from');
  const to        = searchParams.get('to');

  const where: Record<string, unknown> = { userId: session.userId };
  if (profileId) where.profileId = profileId;
  if (status && status !== 'all') where.status = status;
  if (upcoming) where.date = { gte: new Date().toISOString().split('T')[0] };
  if (from || to) {
    const dateFilter: Record<string, string> = {};
    if (from) dateFilter.gte = from;
    if (to)   dateFilter.lte = to;
    where.date = dateFilter;
  }

  const appointments = await prisma.healthAppointment.findMany({
    where,
    orderBy: { date: 'asc' },
    include: {
      profile: { select: { id: true, personName: true } },
    },
  });

  return NextResponse.json({ appointments });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    profileId, title, doctor, specialty, hospital,
    date, time, status, reason, outcome, followUpDate, notes,
  } = body;

  if (!profileId || !title || !date) {
    return NextResponse.json({ error: 'profileId, title, and date are required' }, { status: 400 });
  }

  const profile = await prisma.healthProfile.findFirst({ where: { id: profileId, userId: session.userId } });
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const appointment = await prisma.healthAppointment.create({
    data: {
      profileId,
      title,
      doctor:      doctor      || null,
      specialty:   specialty   || null,
      hospital:    hospital    || null,
      date,
      time:        time        || null,
      status:      status      || 'scheduled',
      reason:      reason      || null,
      outcome:     outcome     || null,
      followUpDate: followUpDate || null,
      notes:       notes       || null,
      userId: session.userId,
    },
    include: {
      profile: { select: { id: true, personName: true } },
    },
  });

  return NextResponse.json({ appointment }, { status: 201 });
}
