// src/app/api/document-vault/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

async function getItem(id: string, userId: string) {
  return prisma.documentVaultItem.findFirst({ where: { id, userId } });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const item = await getItem(id, session.userId);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const existing = await getItem(id, session.userId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = await req.json();
  const item = await prisma.documentVaultItem.update({
    where: { id },
    data: {
      name: data.name ?? existing.name,
      tag: data.tag !== undefined ? data.tag : existing.tag,
      idType: data.idType !== undefined ? data.idType : existing.idType,
      notes: data.notes !== undefined ? data.notes : existing.notes,
      fileData: data.fileData !== undefined ? data.fileData : existing.fileData,
      fileType: data.fileType !== undefined ? data.fileType : existing.fileType,
      fileName: data.fileName !== undefined ? data.fileName : existing.fileName,
      fileSize: data.fileSize !== undefined ? data.fileSize : existing.fileSize,
    },
  });
  return NextResponse.json({ item });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const existing = await getItem(id, session.userId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.documentVaultItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}