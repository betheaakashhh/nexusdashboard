// src/app/api/vault/education/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

async function getRec(id: string, userId: string) {
  return prisma.educationRecord.findFirst({ where: { id, userId } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const existing = await getRec(id, session.userId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const data = await req.json();
  const record = await prisma.educationRecord.update({
    where: { id },
    data: {
      personName:  data.personName  ?? existing.personName,
      level:       data.level       ?? existing.level,
      institution: data.institution ?? existing.institution,
      board:       data.board       ?? existing.board,
      year:        data.year        ?? existing.year,
      percentage:  data.percentage  ?? existing.percentage,
      rollNumber:  data.rollNumber  ?? existing.rollNumber,
      notes:       data.notes       ?? existing.notes,
      fileUrl:     data.fileUrl     ?? existing.fileUrl,
      fileName:    data.fileName    ?? existing.fileName,
      fileType:    data.fileType    ?? existing.fileType,
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
  await prisma.educationRecord.delete({ where: { id } });
  return NextResponse.json({ success: true });
}