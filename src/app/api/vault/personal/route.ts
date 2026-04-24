// src/app/api/vault/personal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const person = searchParams.get('person');

  const where: Record<string, unknown> = { userId: session.userId };
  if (person) where.personName = { contains: person, mode: 'insensitive' };

  const docs = await prisma.personalDocument.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ docs });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { personName, docType, docNumber, issuedBy, issuedDate, expiryDate, notes, fileUrl, fileName, fileType } = body;

  if (!personName || !docType) {
    return NextResponse.json({ error: 'Person name and document type required' }, { status: 400 });
  }

  const doc = await prisma.personalDocument.create({
    data: {
      personName,
      docType,
      docNumber:   docNumber   || null,
      issuedBy:    issuedBy    || null,
      issuedDate:  issuedDate  || null,
      expiryDate:  expiryDate  || null,
      notes:       notes       || null,
      fileUrl:     fileUrl     || null,
      fileName:    fileName    || null,
      fileType:    fileType    || null,
      userId: session.userId,
    },
  });

  return NextResponse.json({ doc }, { status: 201 });
}