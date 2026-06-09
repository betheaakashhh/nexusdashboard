// src/app/api/health/records/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

async function getRec(id: string, userId: string) {
  return prisma.healthRecord.findFirst({ where: { id, userId } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const existing = await getRec(id, session.userId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = await req.json();
  const record = await prisma.healthRecord.update({
    where: { id },
    data: {
      type:       data.type       ?? existing.type,
      title:      data.title      ?? existing.title,
      date:       data.date       ?? existing.date,
      doctor:     data.doctor     !== undefined ? data.doctor     : existing.doctor,
      hospital:   data.hospital   !== undefined ? data.hospital   : existing.hospital,
      diagnosis:  data.diagnosis  !== undefined ? data.diagnosis  : existing.diagnosis,
      notes:      data.notes      !== undefined ? data.notes      : existing.notes,
      labResults: data.labResults !== undefined ? JSON.stringify(data.labResults) : existing.labResults,
      fileUrl:    data.fileUrl    !== undefined ? data.fileUrl    : existing.fileUrl,
      fileName:   data.fileName   !== undefined ? data.fileName   : existing.fileName,
      fileType:   data.fileType   !== undefined ? data.fileType   : existing.fileType,
    },
    include: {
      profile: { select: { id: true, personName: true } },
    },
  });

  return NextResponse.json({ record });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const existing = await getRec(id, session.userId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.healthRecord.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
