// src/app/api/vault/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const q = searchParams.get('q');

  const where: Record<string, unknown> = { userId: session.userId };
  if (category && category !== 'all') where.category = category;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { userId_field: { contains: q, mode: 'insensitive' } },
    ];
  }

  const entries = await prisma.vaultEntry.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, userId_field, password, registrationNumber, link, category, notes } = body;

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const entry = await prisma.vaultEntry.create({
    data: {
      name,
      userId_field: userId_field || null,
      password: password || null,
      registrationNumber: registrationNumber || null,
      link: link || null,
      category: category || 'general',
      notes: notes || null,
      userId: session.userId,
    },
  });

  return NextResponse.json({ entry }, { status: 201 });
}