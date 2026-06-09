// src/app/api/health/records/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get('profileId');
  const type = searchParams.get('type');
  const q = searchParams.get('q');
  const from = searchParams.get('from'); // YYYY-MM-DD
  const to = searchParams.get('to');     // YYYY-MM-DD

  const where: Record<string, unknown> = { userId: session.userId };
  if (profileId) where.profileId = profileId;
  if (type && type !== 'all') where.type = type;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { doctor: { contains: q, mode: 'insensitive' } },
      { hospital: { contains: q, mode: 'insensitive' } },
      { diagnosis: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (from || to) {
    const dateFilter: Record<string, string> = {};
    if (from) dateFilter.gte = from;
    if (to) dateFilter.lte = to;
    where.date = dateFilter;
  }

  const records = await prisma.healthRecord.findMany({
    where,
    orderBy: { date: 'desc' },
    include: {
      profile: { select: { id: true, personName: true, bloodGroup: true } },
    },
  });

  return NextResponse.json({ records });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    profileId, type, title, date, doctor, hospital,
    diagnosis, notes, labResults, fileUrl, fileName, fileType,
  } = body;

  if (!profileId || !type || !title || !date) {
    return NextResponse.json({ error: 'profileId, type, title, and date are required' }, { status: 400 });
  }

  // Verify profile belongs to user
  const profile = await prisma.healthProfile.findFirst({ where: { id: profileId, userId: session.userId } });
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const record = await prisma.healthRecord.create({
    data: {
      profileId,
      type,
      title,
      date,
      doctor: doctor || null,
      hospital: hospital || null,
      diagnosis: diagnosis || null,
      notes: notes || null,
      labResults: labResults ? JSON.stringify(labResults) : null,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      fileType: fileType || null,
      userId: session.userId,
    },
    include: {
      profile: { select: { id: true, personName: true, bloodGroup: true } },
    },
  });

  return NextResponse.json({ record }, { status: 201 });
}
