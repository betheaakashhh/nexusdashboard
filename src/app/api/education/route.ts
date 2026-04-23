// src/app/api/education/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ownerName = searchParams.get('ownerName');

  const where: Record<string, unknown> = { userId: session.userId };
  if (ownerName) where.ownerName = ownerName;

  const certs = await prisma.educationCert.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    // Don't return heavy base64 data in list view
    select: {
      id: true, ownerName: true, examName: true, institution: true,
      year: true, grade: true, rollNumber: true, notes: true,
      fileName: true, fileType: true, createdAt: true, updatedAt: true, userId: true,
      // fileData intentionally excluded from list — fetch individually
    },
  });

  return NextResponse.json({ certs });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { ownerName, examName, institution, year, grade, rollNumber, fileData, fileType, fileName, notes } = body;

  if (!ownerName || !examName) {
    return NextResponse.json({ error: 'Owner name and exam name required' }, { status: 400 });
  }

  const cert = await prisma.educationCert.create({
    data: {
      ownerName, examName,
      institution: institution || null,
      year: year || null,
      grade: grade || null,
      rollNumber: rollNumber || null,
      fileData: fileData || null,
      fileType: fileType || null,
      fileName: fileName || null,
      notes: notes || null,
      userId: session.userId,
    },
  });

  return NextResponse.json({ cert }, { status: 201 });
}