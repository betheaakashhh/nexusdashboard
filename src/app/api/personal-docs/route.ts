// src/app/api/personal-docs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ownerName = searchParams.get('ownerName');
  const docType = searchParams.get('docType');

  const where: Record<string, unknown> = { userId: session.userId };
  if (ownerName) where.ownerName = ownerName;
  if (docType) where.docType = docType;

  const docs = await prisma.personalDoc.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, ownerName: true, docType: true, customLabel: true,
      docNumber: true, notes: true, fileName: true, fileType: true,
      createdAt: true, updatedAt: true, userId: true,
    },
  });

  return NextResponse.json({ docs });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { ownerName, docType, customLabel, docNumber, fileData, fileType, fileName, notes } = body;

  if (!ownerName || !docType) {
    return NextResponse.json({ error: 'Owner name and document type required' }, { status: 400 });
  }

  const doc = await prisma.personalDoc.create({
    data: {
      ownerName, docType,
      customLabel: customLabel || null,
      docNumber: docNumber || null,
      fileData: fileData || null,
      fileType: fileType || null,
      fileName: fileName || null,
      notes: notes || null,
      userId: session.userId,
    },
  });

  return NextResponse.json({ doc }, { status: 201 });
}