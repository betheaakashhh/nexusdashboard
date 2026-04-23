// src/app/api/document-vault/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';




export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tag = searchParams.get('tag');
  const q = searchParams.get('q');

  const where: Record<string, unknown> = { userId: session.userId };
  if (tag) where.tag = tag;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { tag: { contains: q, mode: 'insensitive' } },
      { idType: { contains: q, mode: 'insensitive' } },
    ];
  }

  const items = await prisma.documentVaultItem.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, tag: true, idType: true,
      fileName: true, fileType: true, fileSize: true,
      notes: true, createdAt: true, updatedAt: true, userId: true,
      // fileData excluded from list — fetched individually
    },
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, tag, idType, fileData, fileType, fileName, fileSize, notes } = body;

  if (!name || !fileData || !fileType || !fileName) {
    return NextResponse.json({ error: 'Name and file are required' }, { status: 400 });
  }

  const item = await prisma.documentVaultItem.create({
    data: {
      name, fileData, fileType, fileName,
      tag: tag || null,
      idType: idType || null,
      fileSize: fileSize || null,
      notes: notes || null,
      userId: session.userId,
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}