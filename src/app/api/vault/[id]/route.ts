// src/app/api/vault/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

async function getEntry(id: string, userId: string) {
  return prisma.vaultEntry.findFirst({ where: { id, userId } });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const entry = await getEntry(id, session.userId);
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ entry });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const existing = await getEntry(id, session.userId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = await req.json();
  const entry = await prisma.vaultEntry.update({
    where: { id },
    data: {
      name: data.name ?? existing.name,
      userId_field: data.userId_field !== undefined ? data.userId_field : existing.userId_field,
      password: data.password !== undefined ? data.password : existing.password,
      registrationNumber: data.registrationNumber !== undefined ? data.registrationNumber : existing.registrationNumber,
      link: data.link !== undefined ? data.link : existing.link,
      category: data.category ?? existing.category,
      notes: data.notes !== undefined ? data.notes : existing.notes,
    },
  });
  return NextResponse.json({ entry });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const existing = await getEntry(id, session.userId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.vaultEntry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}