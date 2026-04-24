// src/app/api/vault/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tag = searchParams.get('tag');
  const q   = searchParams.get('q');

  const where: Record<string, unknown> = { userId: session.userId };
  if (tag) where.tag = { contains: tag, mode: 'insensitive' };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { tag:  { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }

  const docs = await prisma.documentVault.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ docs });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, tag, idType, description, fileUrl, fileName, fileType, fileSize } = body;

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const doc = await prisma.documentVault.create({
    data: {
      name,
      tag:         tag         || null,
      idType:      idType      || null,
      description: description || null,
      fileUrl:     fileUrl     || null,
      fileName:    fileName    || null,
      fileType:    fileType    || null,
      fileSize:    fileSize    || null,
      userId: session.userId,
    },
  });

  return NextResponse.json({ doc }, { status: 201 });
}