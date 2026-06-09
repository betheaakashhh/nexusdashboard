// src/app/api/health/appointments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.healthAppointment.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const data = await req.json();
  const appointment = await prisma.healthAppointment.update({
    where: { id },
    data: {
      title:        data.title        ?? existing.title,
      doctor:       data.doctor        !== undefined ? data.doctor       : existing.doctor,
      specialty:    data.specialty     !== undefined ? data.specialty    : existing.specialty,
      hospital:     data.hospital      !== undefined ? data.hospital     : existing.hospital,
      date:         data.date         ?? existing.date,
      time:         data.time          !== undefined ? data.time         : existing.time,
      status:       data.status       ?? existing.status,
      reason:       data.reason        !== undefined ? data.reason       : existing.reason,
      outcome:      data.outcome       !== undefined ? data.outcome      : existing.outcome,
      followUpDate: data.followUpDate  !== undefined ? data.followUpDate : existing.followUpDate,
      notes:        data.notes         !== undefined ? data.notes        : existing.notes,
    },
    include: {
      profile: { select: { id: true, personName: true } },
    },
  });
  return NextResponse.json({ appointment });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.healthAppointment.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.healthAppointment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
