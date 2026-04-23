// src/app/api/education/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

async function getCert(id: string, userId: string) {
  return prisma.educationCert.findFirst({ where: { id, userId } });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const cert = await getCert(id, session.userId);
  if (!cert) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ cert });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const existing = await getCert(id, session.userId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = await req.json();
  const cert = await prisma.educationCert.update({
    where: { id },
    data: {
      ownerName: data.ownerName ?? existing.ownerName,
      examName: data.examName ?? existing.examName,
      institution: data.institution !== undefined ? data.institution : existing.institution,
      year: data.year !== undefined ? data.year : existing.year,
      grade: data.grade !== undefined ? data.grade : existing.grade,
      rollNumber: data.rollNumber !== undefined ? data.rollNumber : existing.rollNumber,
      fileData: data.fileData !== undefined ? data.fileData : existing.fileData,
      fileType: data.fileType !== undefined ? data.fileType : existing.fileType,
      fileName: data.fileName !== undefined ? data.fileName : existing.fileName,
      notes: data.notes !== undefined ? data.notes : existing.notes,
    },
  });
  return NextResponse.json({ cert });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const existing = await getCert(id, session.userId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.educationCert.delete({ where: { id } });
  return NextResponse.json({ success: true });
}