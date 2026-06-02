// src/app/api/tasks/clear/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function DELETE(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { count } = await prisma.task.deleteMany({
    where: { userId: session.userId },
  });

  return NextResponse.json({ success: true, deleted: count });
}
