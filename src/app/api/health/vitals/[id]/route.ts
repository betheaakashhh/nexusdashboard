// src/app/api/health/vitals/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.vitalRecord.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const data = await req.json();
  const vital = await prisma.vitalRecord.update({
    where: { id },
    data: {
      date:            data.date            ?? existing.date,
      time:            data.time            !== undefined ? data.time            : existing.time,
      systolic:        data.systolic        !== undefined ? data.systolic        : existing.systolic,
      diastolic:       data.diastolic       !== undefined ? data.diastolic       : existing.diastolic,
      heartRate:       data.heartRate       !== undefined ? data.heartRate       : existing.heartRate,
      weight:          data.weight          !== undefined ? data.weight          : existing.weight,
      height:          data.height          !== undefined ? data.height          : existing.height,
      temperature:     data.temperature     !== undefined ? data.temperature     : existing.temperature,
      bloodSugar:      data.bloodSugar      !== undefined ? data.bloodSugar      : existing.bloodSugar,
      bloodSugarType:  data.bloodSugarType  !== undefined ? data.bloodSugarType  : existing.bloodSugarType,
      spo2:            data.spo2            !== undefined ? data.spo2            : existing.spo2,
      bmi:             data.bmi             !== undefined ? data.bmi             : existing.bmi,
      respiratoryRate: data.respiratoryRate !== undefined ? data.respiratoryRate : existing.respiratoryRate,
      notes:           data.notes           !== undefined ? data.notes           : existing.notes,
    },
  });
  return NextResponse.json({ vital });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.vitalRecord.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.vitalRecord.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
