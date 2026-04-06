// src/app/api/contacts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tag = searchParams.get('tag');
  const q = searchParams.get('q');
  const sort = searchParams.get('sort') || 'recent';

  const where: Record<string, unknown> = { userId: session.userId };
  if (tag && tag !== 'all') where.tag = tag;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q } },
    ];
  }

  const orderBy: Record<string, string> =
    sort === 'name' ? { name: 'asc' } : { createdAt: 'desc' };

  const contacts = await prisma.contact.findMany({
    where,
    orderBy,
    include: { tasks: true },
  });

  return NextResponse.json({ contacts });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, phone, email, tag, notes } = await req.json();

  if (!name || !phone) {
    return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
  }

  const contact = await prisma.contact.create({
    data: { name, phone, email, tag: tag || 'personal', notes, userId: session.userId },
    include: { tasks: true },
  });

  return NextResponse.json({ contact }, { status: 201 });
}
