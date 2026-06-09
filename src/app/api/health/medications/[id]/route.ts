// src/app/api/health/medications/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.medication.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const data = await req.json();
  const medication = await prisma.medication.update({
    where: { id },
    data: {
      name:          data.name          ?? existing.name,
      genericName:   data.genericName   !== undefined ? data.genericName   : existing.genericName,
      dosage:        data.dosage        !== undefined ? data.dosage        : existing.dosage,
      frequency:     data.frequency     !== undefined ? data.frequency     : existing.frequency,
      route:         data.route         !== undefined ? data.route         : existing.route,
      startDate:     data.startDate     !== undefined ? data.startDate     : existing.startDate,
      endDate:       data.endDate       !== undefined ? data.endDate       : existing.endDate,
      prescribedBy:  data.prescribedBy  !== undefined ? data.prescribedBy  : existing.prescribedBy,
      specialty:     data.specialty     !== undefined ? data.specialty     : existing.specialty,
      purpose:       data.purpose       !== undefined ? data.purpose       : existing.purpose,
      sideEffects:   data.sideEffects   !== undefined ? data.sideEffects   : existing.sideEffects,
      isActive:      data.isActive      !== undefined ? data.isActive      : existing.isActive,
      notes:         data.notes         !== undefined ? data.notes         : existing.notes,
    },
  });
  return NextResponse.json({ medication });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.medication.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.medication.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
