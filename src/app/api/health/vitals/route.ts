// src/app/api/health/vitals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get('profileId');
  const from = searchParams.get('from');
  const to   = searchParams.get('to');
  const limit = parseInt(searchParams.get('limit') || '50');

  const where: Record<string, unknown> = { userId: session.userId };
  if (profileId) where.profileId = profileId;
  if (from || to) {
    const dateFilter: Record<string, string> = {};
    if (from) dateFilter.gte = from;
    if (to)   dateFilter.lte = to;
    where.date = dateFilter;
  }

  const vitals = await prisma.vitalRecord.findMany({
    where,
    orderBy: { date: 'desc' },
    take: limit,
  });

  return NextResponse.json({ vitals });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    profileId, date, time,
    systolic, diastolic, heartRate, weight, height,
    temperature, bloodSugar, bloodSugarType, spo2, bmi, respiratoryRate, notes,
  } = body;

  if (!profileId || !date) {
    return NextResponse.json({ error: 'profileId and date are required' }, { status: 400 });
  }

  const profile = await prisma.healthProfile.findFirst({ where: { id: profileId, userId: session.userId } });
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  // Auto-calculate BMI if weight and height provided but no BMI
  let calculatedBmi = bmi;
  if (!calculatedBmi && weight && height) {
    const hm = height / 100;
    calculatedBmi = Math.round((weight / (hm * hm)) * 10) / 10;
  }

  const vital = await prisma.vitalRecord.create({
    data: {
      profileId,
      date,
      time: time || null,
      systolic:       systolic       ?? null,
      diastolic:      diastolic      ?? null,
      heartRate:      heartRate      ?? null,
      weight:         weight         ?? null,
      height:         height         ?? null,
      temperature:    temperature    ?? null,
      bloodSugar:     bloodSugar     ?? null,
      bloodSugarType: bloodSugarType || 'fasting',
      spo2:           spo2           ?? null,
      bmi:            calculatedBmi  ?? null,
      respiratoryRate: respiratoryRate ?? null,
      notes: notes || null,
      userId: session.userId,
    },
  });

  return NextResponse.json({ vital }, { status: 201 });
}
