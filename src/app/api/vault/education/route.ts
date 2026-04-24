// src/app/api/vault/education/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const personName = searchParams.get('person');

  const where: Record<string, unknown> = { userId: session.userId };
  if (personName) where.personName = { contains: personName, mode: 'insensitive' };

  const records = await prisma.educationRecord.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ records });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { personName, level, institution, board, year, percentage, rollNumber, notes, fileUrl, fileName, fileType } = body;

  if (!personName || !level) {
    return NextResponse.json({ error: 'Person name and education level required' }, { status: 400 });
  }

  const record = await prisma.educationRecord.create({
    data: {
      personName,
      level,
      institution:  institution  || null,
      board:        board        || null,
      year:         year         || null,
      percentage:   percentage   || null,
      rollNumber:   rollNumber   || null,
      notes:        notes        || null,
      fileUrl:      fileUrl      || null,
      fileName:     fileName     || null,
      fileType:     fileType     || null,
      userId: session.userId,
    },
  });

  return NextResponse.json({ record }, { status: 201 });
}