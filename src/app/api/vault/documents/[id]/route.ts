// src/app/api/vault/documents/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

async function getDoc(id: string, userId: string) {
  return prisma.documentVault.findFirst({ where: { id, userId } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const existing = await getDoc(id, session.userId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const data = await req.json();
  const doc = await prisma.documentVault.update({
    where: { id },
    data: {
      name:        data.name        ?? existing.name,
      tag:         data.tag         ?? existing.tag,
      idType:      data.idType      ?? existing.idType,
      description: data.description ?? existing.description,
      fileUrl:     data.fileUrl     ?? existing.fileUrl,
      fileName:    data.fileName    ?? existing.fileName,
      fileType:    data.fileType    ?? existing.fileType,
      fileSize:    data.fileSize    ?? existing.fileSize,
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
  await prisma.documentVault.delete({ where: { id } });
  return NextResponse.json({ success: true });
}