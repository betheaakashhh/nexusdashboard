// src/app/api/personal-docs/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

async function getDoc(id: string, userId: string) {
  return prisma.personalDoc.findFirst({ where: { id, userId } });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const doc = await getDoc(id, session.userId);
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ doc });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const existing = await getDoc(id, session.userId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = await req.json();
  const doc = await prisma.personalDoc.update({
    where: { id },
    data: {
      ownerName: data.ownerName ?? existing.ownerName,
      docType: data.docType ?? existing.docType,
      customLabel: data.customLabel !== undefined ? data.customLabel : existing.customLabel,
      docNumber: data.docNumber !== undefined ? data.docNumber : existing.docNumber,
      fileData: data.fileData !== undefined ? data.fileData : existing.fileData,
      fileType: data.fileType !== undefined ? data.fileType : existing.fileType,
      fileName: data.fileName !== undefined ? data.fileName : existing.fileName,
      notes: data.notes !== undefined ? data.notes : existing.notes,
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
  await prisma.personalDoc.delete({ where: { id } });
  return NextResponse.json({ success: true });
}