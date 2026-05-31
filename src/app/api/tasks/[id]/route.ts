// src/app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.task.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = await req.json();

  const task = await prisma.task.update({
    where: { id },
    data: {
      title:     data.title     ?? existing.title,
      priority:  data.priority  ?? existing.priority,
      due:       data.due       !== undefined ? data.due       : existing.due,
      dueTime:   data.dueTime   !== undefined ? data.dueTime   : existing.dueTime,
      done:      data.done      !== undefined ? data.done      : existing.done,
      notified:  data.notified  !== undefined ? data.notified  : existing.notified,
      contactId: data.contactId !== undefined ? data.contactId : existing.contactId,
    },
    include: { contact: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ task });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.task.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ success: true });
}