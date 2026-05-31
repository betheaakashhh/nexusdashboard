// src/app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const contactId = searchParams.get('contactId');
  const q = searchParams.get('q');

  const where: Record<string, unknown> = { userId: session.userId };
  if (contactId) where.contactId = contactId;
  if (q) where.title = { contains: q, mode: 'insensitive' };

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { contact: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, priority, due, dueTime, contactId } = await req.json();

  if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 });

  // Verify contactId belongs to user
  if (contactId) {
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, userId: session.userId },
    });
    if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  }

  const task = await prisma.task.create({
    data: {
      title,
      priority: priority || 'med',
      due: due || null,
      dueTime: dueTime || null,
      contactId: contactId || null,
      userId: session.userId,
    },
    include: { contact: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ task }, { status: 201 });
}