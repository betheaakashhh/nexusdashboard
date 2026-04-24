// src/app/api/vault/personal/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

async function getDoc(id: string, userId: string) {
  return prisma.personalDocument.findFirst({ where: { id, userId } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const existing = await getDoc(id, session.userId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const data = await req.json();
  const doc = await prisma.personalDocument.update({
    where: { id },
    data: {
      personName: data.personName ?? existing.personName,
      docType:    data.docType    ?? existing.docType,
      docNumber:  data.docNumber  ?? existing.docNumber,
      issuedBy:   data.issuedBy   ?? existing.issuedBy,
      issuedDate: data.issuedDate ?? existing.issuedDate,
      expiryDate: data.expiryDate ?? existing.expiryDate,
      notes:      data.notes      ?? existing.notes,
      fileUrl:    data.fileUrl    ?? existing.fileUrl,
      fileName:   data.fileName   ?? existing.fileName,
      fileType:   data.fileType   ?? existing.fileType,
    },
  });
  return NextResponse.json({ doc });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const existing = await getDoc(id, session.userId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.personalDocument.delete({ where: { id } });
  return NextResponse.json({ success: true });
}