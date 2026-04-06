// src/app/api/contacts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

async function getContact(id: string, userId: string) {
  return prisma.contact.findFirst({ where: { id, userId }, include: { tasks: true } });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const contact = await getContact(id, session.userId);
  if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ contact });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const existing = await getContact(id, session.userId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = await req.json();
  const contact = await prisma.contact.update({
    where: { id },
    data: {
      name: data.name ?? existing.name,
      phone: data.phone ?? existing.phone,
      email: data.email ?? existing.email,
      tag: data.tag ?? existing.tag,
      notes: data.notes ?? existing.notes,
    },
    include: { tasks: true },
  });

  return NextResponse.json({ contact });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const existing = await getContact(id, session.userId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.contact.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
