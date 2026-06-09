// src/app/api/health/profiles/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

async function getProfile(id: string, userId: string) {
  return prisma.healthProfile.findFirst({ where: { id, userId } });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const profile = await getProfile(id, session.userId);
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ profile });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const existing = await getProfile(id, session.userId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = await req.json();
  const profile = await prisma.healthProfile.update({
    where: { id },
    data: {
      personName:           data.personName           ?? existing.personName,
      relation:             data.relation             ?? existing.relation,
      dateOfBirth:          data.dateOfBirth          !== undefined ? data.dateOfBirth          : existing.dateOfBirth,
      gender:               data.gender               !== undefined ? data.gender               : existing.gender,
      bloodGroup:           data.bloodGroup            !== undefined ? data.bloodGroup           : existing.bloodGroup,
      allergies:            data.allergies             !== undefined ? data.allergies            : existing.allergies,
      chronicConditions:    data.chronicConditions     !== undefined ? data.chronicConditions    : existing.chronicConditions,
      emergencyContact:     data.emergencyContact      !== undefined ? data.emergencyContact     : existing.emergencyContact,
      photoUrl:             data.photoUrl              !== undefined ? data.photoUrl             : existing.photoUrl,
      notes:                data.notes                !== undefined ? data.notes                : existing.notes,
      isActive:             data.isActive              !== undefined ? data.isActive             : existing.isActive,
    },
  });
  return NextResponse.json({ profile });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const existing = await getProfile(id, session.userId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.healthProfile.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
