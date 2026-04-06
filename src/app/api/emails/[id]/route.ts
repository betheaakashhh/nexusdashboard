// src/app/api/emails/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

async function getEmail(id: string, userId: string) {
  return prisma.email.findFirst({ where: { id, userId } });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const email = await getEmail(id, session.userId);
  if (!email) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ email });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const existing = await getEmail(id, session.userId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = await req.json();
  const email = await prisma.email.update({
    where: { id },
    data: {
      unread:  data.unread  !== undefined ? data.unread  : existing.unread,
      starred: data.starred !== undefined ? data.starred : existing.starred,
      tab:     data.tab     !== undefined ? data.tab     : existing.tab,
      subject: data.subject ?? existing.subject,
      body:    data.body    ?? existing.body,
    },
  });
  return NextResponse.json({ email });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const existing = await getEmail(id, session.userId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.email.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
